import { homeContent } from "@/content/en";

/** Cloudflare's published always-pass test keys (not secrets). */
export const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";
export const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";

/** Environment variables (process.env, or a plain object in tests). */
export type EnvVars = Record<string, string | undefined>;

export type ContactEnv = {
  production: boolean;
  /** No network: local Turnstile check, sending is logged instead. */
  dryRun: boolean;
  resendApiKey: string | undefined;
  toEmail: string;
  turnstileSecret: string | undefined;
};

/**
 * Resolves contact settings. In production every key is required and
 * CONTACT_DRY_RUN is ignored; elsewhere missing keys fall back to test keys
 * and a missing Resend key means dry run.
 */
export function contactEnv(env: EnvVars = process.env): ContactEnv {
  const production = env.VERCEL_ENV === "production";
  if (production) {
    return {
      production,
      dryRun: false,
      resendApiKey: env.RESEND_API_KEY || undefined,
      toEmail: env.CONTACT_TO_EMAIL || homeContent.contact.email,
      turnstileSecret: env.TURNSTILE_SECRET_KEY || undefined,
    };
  }
  return {
    production,
    dryRun: env.CONTACT_DRY_RUN === "1" || !env.RESEND_API_KEY,
    resendApiKey: env.RESEND_API_KEY || undefined,
    toEmail: env.CONTACT_TO_EMAIL || homeContent.contact.email,
    turnstileSecret: env.TURNSTILE_SECRET_KEY || TURNSTILE_TEST_SECRET,
  };
}

/** Public Turnstile site key for the widget (server-rendered into the page). */
export function turnstileSiteKey(env: EnvVars = process.env): string {
  return env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || TURNSTILE_TEST_SITE_KEY;
}
