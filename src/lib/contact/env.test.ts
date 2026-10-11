import { describe, expect, it } from "vitest";
import { homeContent } from "@/content/en";
import {
  contactEnv,
  TURNSTILE_TEST_SECRET,
  TURNSTILE_TEST_SITE_KEY,
  turnstileSiteKey,
} from "./env";

describe("contactEnv", () => {
  it("uses real keys and ignores dry run in production", () => {
    expect(
      contactEnv({
        VERCEL_ENV: "production",
        CONTACT_DRY_RUN: "1",
        RESEND_API_KEY: "re_x",
        CONTACT_TO_EMAIL: "me@example.com",
        TURNSTILE_SECRET_KEY: "sec",
      }),
    ).toEqual({
      production: true,
      dryRun: false,
      resendApiKey: "re_x",
      toEmail: "me@example.com",
      turnstileSecret: "sec",
    });
  });

  it("never falls back to test keys in production", () => {
    const env = contactEnv({ VERCEL_ENV: "production" });
    expect(env.turnstileSecret).toBeUndefined();
    expect(env.resendApiKey).toBeUndefined();
    expect(env.dryRun).toBe(false);
  });

  it("defaults to test keys and dry run elsewhere", () => {
    expect(contactEnv({})).toEqual({
      production: false,
      dryRun: true,
      resendApiKey: undefined,
      toEmail: homeContent.contact.email,
      turnstileSecret: TURNSTILE_TEST_SECRET,
    });
  });

  it("honours CONTACT_DRY_RUN outside production even with a key", () => {
    const env = contactEnv({
      VERCEL_ENV: "preview",
      RESEND_API_KEY: "re_x",
      CONTACT_DRY_RUN: "1",
    });
    expect(env.dryRun).toBe(true);
  });
});

describe("turnstileSiteKey", () => {
  it("uses the configured key, else the test key", () => {
    expect(
      turnstileSiteKey({
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site",
      }),
    ).toBe("site");
    expect(turnstileSiteKey({})).toBe(TURNSTILE_TEST_SITE_KEY);
  });
});
