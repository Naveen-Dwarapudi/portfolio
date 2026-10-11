import type { ContactEnv } from "./env";
import { parseContact } from "./schema";
import { type ContactValues } from "./rules";
import { sendEmail } from "./send-email";
import { verifyTurnstile } from "./turnstile";
import { HONEYPOT_FIELD, TURNSTILE_FIELD, type ContactState } from "./types";

export type ContactDeps = {
  env: ContactEnv;
  ip: string;
  limiter: {
    hit(key: string): { ok: boolean };
    /** Gives a slot back (server-side failures shouldn't lock people out). */
    refund?(key: string): void;
  };
  fetch?: typeof fetch;
  log?: (level: "info" | "warn", outcome: string) => void;
};

const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};

/**
 * The contact pipeline (spec §3.1), free of Next APIs so it is unit-testable:
 * honeypot → validate → rate limit → Turnstile → send.
 */
export async function handleContact(
  form: FormData,
  deps: ContactDeps,
): Promise<ContactState> {
  const log = deps.log ?? (() => {});
  const { env } = deps;

  if (field(form, HONEYPOT_FIELD)) {
    log("info", "honeypot");
    return { status: "success" };
  }

  const values: ContactValues = {
    name: field(form, "name"),
    email: field(form, "email"),
    message: field(form, "message"),
  };
  const parsed = parseContact(values);
  if (!parsed.ok) {
    log("info", "invalid");
    return { status: "error", fieldErrors: parsed.fieldErrors, values };
  }

  if (!deps.limiter.hit(deps.ip).ok) {
    log("warn", "rate-limited");
    return { status: "error", formError: "tooMany", values };
  }

  if (!env.dryRun && env.turnstileSecret === undefined) {
    // An owner mistake, not a bot: say so in the logs, and don't charge the
    // visitor a slot for it.
    log("warn", "misconfigured: TURNSTILE_SECRET_KEY");
    deps.limiter.refund?.(deps.ip);
    return { status: "error", formError: "verification", values };
  }
  const token = field(form, TURNSTILE_FIELD);
  const human = env.dryRun
    ? token !== "" && token !== "fail"
    : await verifyTurnstile(token, deps.ip, env.turnstileSecret!, deps.fetch);
  if (!human) {
    log("warn", "verification-failed");
    return { status: "error", formError: "verification", values };
  }

  if (env.dryRun) {
    log("info", "dry-run: email not sent");
    return { status: "success" };
  }
  if (env.resendApiKey === undefined) {
    log("warn", "misconfigured: RESEND_API_KEY");
    deps.limiter.refund?.(deps.ip);
    return { status: "error", formError: "sendFailed", values };
  }
  const sent = await sendEmail(
    parsed.data,
    { apiKey: env.resendApiKey, to: env.toEmail },
    deps.fetch,
  );
  if (!sent) {
    log("warn", "send-failed");
    // Our fault, not the visitor's: give the slot back.
    deps.limiter.refund?.(deps.ip);
    return { status: "error", formError: "sendFailed", values };
  }
  log("info", "sent");
  return { status: "success" };
}
