/**
 * Same-origin check for the contact endpoint (the CSRF guard Server Actions
 * would otherwise provide): the Origin header's host must match the host the
 * request was sent to. Requests without an Origin are refused.
 */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
