import { contactEnv } from "@/lib/contact/env";
import { handleContact } from "@/lib/contact/handle";
import { isSameOrigin } from "@/lib/contact/origin";
import { clientIp, contactLimiter } from "@/lib/contact/rate-limit";
import type { ContactState } from "@/lib/contact/types";

/** Generous for 3 short fields plus a token; anything bigger isn't a message. */
const MAX_BODY_BYTES = 32 * 1024;

const reply = (state: ContactState, status = 200) =>
  Response.json(state, { status });

/**
 * Contact endpoint. A Route Handler rather than a Server Action: calling a
 * Server Action from the browser pulls ~10 KB of client runtime into every
 * page (spec deviation, see the phase 7 plan).
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request.headers)) {
    return reply({ status: "error", formError: "sendFailed" }, 403);
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return reply({ status: "error", formError: "sendFailed" }, 413);
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply({ status: "error", formError: "sendFailed" }, 400);
  }
  const state = await handleContact(form, {
    env: contactEnv(),
    ip: clientIp(request.headers),
    limiter: contactLimiter,
    log: (level, outcome) => console[level](`contact: ${outcome}`),
  });
  return reply(state);
}
