import type { ContactInput } from "./schema";

const RESEND = "https://api.resend.com/emails";
/** Resend's shared sender; works without a custom domain (to your own inbox). */
export const FROM = "Portfolio contact <onboarding@resend.dev>";

/** Single line, so a name can't inject email headers or odd subjects. */
export function oneLine(text: string): string {
  return text.replace(/[\r\n]+/g, " ").trim();
}

export function emailPayload(input: ContactInput, to: string) {
  return {
    from: FROM,
    to: [to],
    reply_to: input.email,
    subject: `Portfolio: message from ${oneLine(input.name)}`,
    text: `${input.message}\n\n— ${oneLine(input.name)} <${input.email}>`,
  };
}

/** Sends through Resend's REST API. False on any failure (logged by caller). */
export async function sendEmail(
  input: ContactInput,
  { apiKey, to }: { apiKey: string; to: string },
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  try {
    const res = await fetchImpl(RESEND, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload(input, to)),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
