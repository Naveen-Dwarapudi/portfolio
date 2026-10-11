import { describe, expect, it, vi } from "vitest";
import type { ContactEnv } from "./env";
import { handleContact, type ContactDeps } from "./handle";
import { HONEYPOT_FIELD, TURNSTILE_FIELD } from "./types";

const live: ContactEnv = {
  production: true,
  dryRun: false,
  resendApiKey: "re_key",
  toEmail: "me@example.com",
  turnstileSecret: "sec",
};

function form(overrides: Record<string, string> = {}) {
  const f = new FormData();
  const values = {
    name: "Ada",
    email: "ada@example.com",
    message: "Hello there, nice site!",
    [TURNSTILE_FIELD]: "tok",
    ...overrides,
  };
  for (const [k, v] of Object.entries(values)) f.set(k, v);
  return f;
}

/** fetch that answers Turnstile and Resend separately. */
function network({ human = true, sent = true } = {}) {
  return vi.fn(async (url: string | URL | Request) =>
    String(url).includes("siteverify")
      ? ({ ok: true, json: async () => ({ success: human }) } as Response)
      : ({ ok: sent } as Response),
  );
}

function deps(over: Partial<ContactDeps> = {}): ContactDeps {
  return {
    env: live,
    ip: "203.0.113.7",
    limiter: { hit: () => ({ ok: true }) },
    fetch: network(),
    ...over,
  };
}

describe("handleContact", () => {
  it("sends and succeeds on the happy path", async () => {
    const fetchMock = network();
    expect(await handleContact(form(), deps({ fetch: fetchMock }))).toEqual({
      status: "success",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("fakes success for a filled honeypot and sends nothing", async () => {
    const fetchMock = network();
    expect(
      await handleContact(
        form({ [HONEYPOT_FIELD]: "http://spam" }),
        deps({ fetch: fetchMock }),
      ),
    ).toEqual({ status: "success" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns field errors and the values, without counting or sending", async () => {
    const hit = vi.fn(() => ({ ok: true }));
    const fetchMock = network();
    const result = await handleContact(
      form({ email: "nope", message: "hi" }),
      deps({ limiter: { hit }, fetch: fetchMock }),
    );
    expect(result).toEqual({
      status: "error",
      fieldErrors: { email: "emailInvalid", message: "messageTooShort" },
      values: { name: "Ada", email: "nope", message: "hi" },
    });
    expect(hit).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stops when rate limited", async () => {
    const result = await handleContact(
      form(),
      deps({ limiter: { hit: () => ({ ok: false }) } }),
    );
    expect(result).toMatchObject({ status: "error", formError: "tooMany" });
  });

  it("stops when Turnstile says no", async () => {
    const result = await handleContact(
      form(),
      deps({ fetch: network({ human: false }) }),
    );
    expect(result).toMatchObject({
      status: "error",
      formError: "verification",
    });
  });

  it("fails closed with no Turnstile secret", async () => {
    const result = await handleContact(
      form(),
      deps({ env: { ...live, turnstileSecret: undefined } }),
    );
    expect(result).toMatchObject({ formError: "verification" });
  });

  it("reports a failed send", async () => {
    const result = await handleContact(
      form(),
      deps({ fetch: network({ sent: false }) }),
    );
    expect(result).toMatchObject({ status: "error", formError: "sendFailed" });
  });

  it("reports a missing Resend key as a failed send", async () => {
    const result = await handleContact(
      form(),
      deps({ env: { ...live, resendApiKey: undefined } }),
    );
    expect(result).toMatchObject({ formError: "sendFailed" });
  });

  describe("dry run", () => {
    const dry = { ...live, production: false, dryRun: true };

    it("succeeds without any network", async () => {
      const fetchMock = network();
      expect(
        await handleContact(form(), deps({ env: dry, fetch: fetchMock })),
      ).toEqual({ status: "success" });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([[""], ["fail"]])("rejects the token %j", async (token) => {
      const result = await handleContact(
        form({ [TURNSTILE_FIELD]: token }),
        deps({ env: dry }),
      );
      expect(result).toMatchObject({ formError: "verification" });
    });
  });

  it("logs outcomes without message content", async () => {
    const log = vi.fn();
    await handleContact(form(), deps({ log }));
    expect(log).toHaveBeenCalledWith("info", "sent");
    expect(JSON.stringify(log.mock.calls)).not.toContain("Hello there");
  });

  it("refunds the rate-limit slot when sending fails (our fault)", async () => {
    const refund = vi.fn();
    await handleContact(
      form(),
      deps({
        fetch: network({ sent: false }),
        limiter: { hit: () => ({ ok: true }), refund },
      }),
    );
    expect(refund).toHaveBeenCalledWith("203.0.113.7");
  });

  it("doesn't refund a failed human check", async () => {
    const refund = vi.fn();
    await handleContact(
      form(),
      deps({
        fetch: network({ human: false }),
        limiter: { hit: () => ({ ok: true }), refund },
      }),
    );
    expect(refund).not.toHaveBeenCalled();
  });

  it.each([
    ["TURNSTILE_SECRET_KEY", { turnstileSecret: undefined }, "verification"],
    ["RESEND_API_KEY", { resendApiKey: undefined }, "sendFailed"],
  ] as const)(
    "logs a missing %s as misconfiguration",
    async (name, env, formError) => {
      const log = vi.fn();
      const result = await handleContact(
        form(),
        deps({ env: { ...live, ...env }, log }),
      );
      expect(result).toMatchObject({ formError });
      expect(log).toHaveBeenCalledWith("warn", `misconfigured: ${name}`);
    },
  );
});
