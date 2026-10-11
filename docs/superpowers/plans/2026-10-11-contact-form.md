# Contact Form (Phase 7) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Name / Email / Message form in the Contact section. It emails the owner through Resend and is protected by a honeypot, Cloudflare Turnstile (loaded on first focus) and a per-IP rate limit, with page-load budgets unchanged.

**Architecture:**
- **Server pipeline.** A pure pipeline, `handleContact(form, deps)` in `src/lib/contact/`, runs honeypot → Zod → rate limit → Turnstile → Resend `fetch`.
- **Endpoint.** It is exposed through a **Route Handler** (`POST /api/contact`) with a same-origin check.
- **Client.** The `ContactForm` client component validates with a hand-written validator, posts with `fetch`, and loads Turnstile on the first focus inside the form.
- **Tests.** A dry-run mode, ignored in production, makes the tests network-free.

**Tech Stack:** Next.js 16.4 (Route Handlers, Cache Components), React 19.3, Zod 4.6.5 (server only), Vitest + RTL, Playwright + axe, calibrated LHCI. No Resend SDK and no react-hook-form.

**Spec:** `docs/superpowers/specs/2026-10-11-contact-form-design.md`

**Prototype evidence:** every file below was built and verified in a throwaway worktree before the plan was written.
- **Unit tests:** 286/286.
- **E2E:** 96/96, run twice with the contact spec stable.
- **Calibrated LHCI, home page:** best LCP **2329 ms**, against `main` measured the same day at 2403 ms. Script **144,026 B**, up 2,188 B from 141,838 (budget 153,600). CLS 0.0003.
- **Calibrated LHCI, case study:** 2169–2174 ms. Accessibility 1.0.
- **Turnstile:** no `challenges.cloudflare.com` request at page load.
- **Visual check:** screenshots in both themes (at rest and with errors) and the 390 px success panel.

## Global Constraints

- **No new client dependencies.** `zod` is added for server use only.
- **Budgets never raised.** `/` script ≤ 153,600 B, LCP ≤ 2500 ms (best of 3), CLS < 0.02. Turnstile is never requested at page load.
- **Copy:** all user-visible text lives in `homeContent.contact.form` (typed).
- **Accessibility:** WCAG 2.1 AA in both themes, with visible labels. Errors are linked with `aria-describedby` and `aria-invalid`, focus moves to the first invalid field, and alerts use `role="alert"`.
- **Secrets:** they live only in env vars. `CONTACT_DRY_RUN` is ignored when `VERCEL_ENV=production`.
- **Confidentiality guard passes.** Tokens only, never raw hex.
- **No commits during execution.** The owner reviews and commits (skill `suggest-commit`), with no AI attribution lines.
- Branch: `feat/contact`.

## Deviations from the spec (found while prototyping)

1. **A Route Handler instead of a Server Action.**
   - **Problem:** calling a Server Action from a client component pulled Next's action runtime (`callServer`/`encodeReply`, **9.8 KB gzipped**) into every page view. The home page's best LCP rose from 2403 to 2482 ms, a 13 ms margin against the 2500 ms limit.
   - **Change:** `POST /api/contact` with a client `fetch` drops that runtime. The best LCP measured 2329 ms.
   - **Consequence:** the endpoint does its own **same-origin check** (`isSameOrigin`, the CSRF guard Server Actions had built in) and caps the body at 32 KB.
   - **Matcher:** `src/proxy.ts`'s matcher now excludes `api/` (pinned in `proxy.test.ts`).
2. **Lazy-loading the form was tried and rejected.** Deferring the form chunk until idle or near the viewport gained nothing (best 2486 ms) while adding a placeholder swap. The real cost was the action runtime (deviation 1).
3. **Form-error copy ends with a colon** ("…or email me directly:"), because the alert follows it with the `mailto:` link.
4. **Config input type.** `contactEnv`/`turnstileSiteKey` take `EnvVars = Record<string, string | undefined>` (assignable from `process.env`), so tests pass plain objects.
5. **Unique test IPs.** E2E gives every test a unique `x-forwarded-for` (`crypto.randomUUID()`). With the counter-based version, parallel workers collided and shared a rate-limit bucket.

## Review Focus

1. **Turnstile script blocked** (ad blocker, offline). Submit waits `TOKEN_WAIT_MS` (8 s), then shows the verification alert with the email link. The loader resets, so a later focus retries. Reviewer: confirm there's no stuck pending state.
2. **Double submit.** A second click while sending must not post twice: `onSubmit` returns early while `pending`, and the button is `aria-disabled`. Reviewer check.
3. **Trusting `x-forwarded-for`.** On Vercel the platform sets it, so clients can't choose their bucket. Elsewhere it is client-controlled, which is acceptable for a best-effort limit. Reviewer: confirm nothing else relies on it.
4. **Token expiry.** If a visitor idles past the token's lifetime, `expired-callback` clears it and the next submit waits for a fresh one (the managed widget refreshes on its own). Reviewer check.
5. **Production misconfiguration.** A missing key gives `sendFailed` or `verification` plus a `contact: …` log line, never a silent success. Pinned by the `env` and `handle` unit tests.

---

### Task 1: Field rules and the server schema

**Files:**
- Create: `src/lib/contact/rules.ts`, `src/lib/contact/types.ts`, `src/lib/contact/schema.ts`, `src/lib/contact/rules.test.ts`
- Modify: `package.json` / `package-lock.json` (via npm)

**Interfaces:**
- **Produces** (`rules.ts`):
  - `LIMITS`, `ContactField`, `CONTACT_FIELDS`
  - `FieldErrorKey`, `FieldErrors`, `ContactValues`
  - `validateContact(values) → FieldErrors`
- **Produces** (`types.ts`): `FormErrorKey`, `ContactState`, and the field-name constants `HONEYPOT_FIELD = "website"` and `TURNSTILE_FIELD = "cf-turnstile-response"`.
- **Produces** (`schema.ts`):
  - `contactSchema`, `ContactInput`
  - `parseContact(values) → { ok: true; data } | { ok: false; fieldErrors }`

- [ ] **Step 1: Install Zod (server use only)**

```bash
npm install zod@4.6.5
```

- [ ] **Step 2: Write the failing test `src/lib/contact/rules.test.ts`.** It covers the boundaries plus parity between the browser and server rules.

```ts
import { describe, expect, it } from "vitest";
import { LIMITS, validateContact, type ContactValues } from "./rules";
import { parseContact } from "./schema";

const ok: ContactValues = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "Hello there, nice portfolio!",
};
const x = (n: number) => "x".repeat(n);

// Each case: input overrides → expected error per field (undefined = valid).
const cases: [
  string,
  Partial<ContactValues>,
  Partial<Record<string, string>>,
][] = [
  ["valid", {}, {}],
  ["empty name", { name: "" }, { name: "nameRequired" }],
  ["whitespace name", { name: "   " }, { name: "nameRequired" }],
  ["1-char name", { name: "A" }, {}],
  ["100-char name", { name: x(LIMITS.nameMax) }, {}],
  ["101-char name", { name: x(LIMITS.nameMax + 1) }, { name: "nameTooLong" }],
  ["empty email", { email: "" }, { email: "emailInvalid" }],
  ["no @", { email: "ada.example.com" }, { email: "emailInvalid" }],
  ["no domain dot", { email: "ada@example" }, { email: "emailInvalid" }],
  ["space in email", { email: "ada @example.com" }, { email: "emailInvalid" }],
  ["padded email", { email: "  ada@example.com  " }, {}],
  [
    "too-long email",
    { email: `${x(250)}@example.com` },
    { email: "emailInvalid" },
  ],
  ["9-char message", { message: x(9) }, { message: "messageTooShort" }],
  ["10-char message", { message: x(10) }, {}],
  [
    "padded short message",
    { message: `   ${x(9)}   ` },
    { message: "messageTooShort" },
  ],
  ["2000-char message", { message: x(LIMITS.messageMax) }, {}],
  [
    "2001-char message",
    { message: x(LIMITS.messageMax + 1) },
    { message: "messageTooLong" },
  ],
  [
    "everything wrong",
    { name: "", email: "nope", message: "hi" },
    { name: "nameRequired", email: "emailInvalid", message: "messageTooShort" },
  ],
];

describe("validateContact (browser)", () => {
  it.each(cases)("%s", (_, overrides, expected) => {
    expect(validateContact({ ...ok, ...overrides })).toEqual(expected);
  });
});

describe("parseContact (server, Zod) agrees with validateContact", () => {
  it.each(cases)("%s", (_, overrides, expected) => {
    const result = parseContact({ ...ok, ...overrides });
    if (Object.keys(expected).length === 0) {
      expect(result.ok).toBe(true);
    } else {
      expect(result).toEqual({ ok: false, fieldErrors: expected });
    }
  });

  it("returns trimmed data", () => {
    const result = parseContact({
      name: "  Ada  ",
      email: " ada@example.com ",
      message: "  Hello there!  ",
    });
    expect(result).toEqual({
      ok: true,
      data: { name: "Ada", email: "ada@example.com", message: "Hello there!" },
    });
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/lib/contact/rules.test.ts`
Expected: FAIL with `Failed to resolve import "./rules"`.

- [ ] **Step 4: Implement**

`src/lib/contact/rules.ts`:

```ts
/**
 * Contact form rules, shared by the browser (instant feedback) and the server
 * schema (authoritative; src/lib/contact/schema.ts). Plain code, no Zod, so it
 * costs almost nothing in the client bundle.
 */

export const LIMITS = {
  nameMax: 100,
  emailMax: 254,
  messageMin: 10,
  messageMax: 2000,
} as const;

export type ContactField = "name" | "email" | "message";

export const CONTACT_FIELDS: readonly ContactField[] = [
  "name",
  "email",
  "message",
];

export type FieldErrorKey =
  | "nameRequired"
  | "nameTooLong"
  | "emailInvalid"
  | "messageTooShort"
  | "messageTooLong";

export type FieldErrors = Partial<Record<ContactField, FieldErrorKey>>;

export type ContactValues = Record<ContactField, string>;

/** One @, no spaces, a dot in the domain; the server re-checks with Zod. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContact(values: ContactValues): FieldErrors {
  const name = values.name.trim();
  const email = values.email.trim();
  const message = values.message.trim();
  const errors: FieldErrors = {};
  if (!name) errors.name = "nameRequired";
  else if (name.length > LIMITS.nameMax) errors.name = "nameTooLong";
  if (!EMAIL.test(email) || email.length > LIMITS.emailMax)
    errors.email = "emailInvalid";
  if (message.length < LIMITS.messageMin) errors.message = "messageTooShort";
  else if (message.length > LIMITS.messageMax)
    errors.message = "messageTooLong";
  return errors;
}
```

`src/lib/contact/types.ts`:

```ts
import type { ContactValues, FieldErrors } from "./rules";

export type FormErrorKey = "tooMany" | "verification" | "sendFailed";

/** What the contact endpoint returns to the form. */
export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      fieldErrors?: FieldErrors;
      formError?: FormErrorKey;
      values?: ContactValues;
    };

/** Field name of the honeypot input; humans never see or fill it. */
export const HONEYPOT_FIELD = "website";

/** Field name Turnstile writes its token into. */
export const TURNSTILE_FIELD = "cf-turnstile-response";
```

`src/lib/contact/schema.ts`:

```ts
import { z } from "zod";
import {
  CONTACT_FIELDS,
  LIMITS,
  type ContactValues,
  type FieldErrors,
} from "./rules";

/** Server-side source of truth; mirrors validateContact() (parity-tested). */
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "nameRequired")
    .max(LIMITS.nameMax, "nameTooLong"),
  email: z
    .string()
    .trim()
    .max(LIMITS.emailMax, "emailInvalid")
    .pipe(z.email("emailInvalid")),
  message: z
    .string()
    .trim()
    .min(LIMITS.messageMin, "messageTooShort")
    .max(LIMITS.messageMax, "messageTooLong"),
});

export type ContactInput = z.infer<typeof contactSchema>;

export function parseContact(
  values: ContactValues,
): { ok: true; data: ContactInput } | { ok: false; fieldErrors: FieldErrors } {
  const result = contactSchema.safeParse(values);
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (
      typeof field === "string" &&
      (CONTACT_FIELDS as readonly string[]).includes(field) &&
      !fieldErrors[field as keyof FieldErrors]
    ) {
      fieldErrors[field as keyof FieldErrors] =
        issue.message as FieldErrors[keyof FieldErrors];
    }
  }
  return { ok: false, fieldErrors };
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `npx vitest run src/lib/contact/rules.test.ts`
Expected: PASS, 37 tests.

- [ ] **Step 6: Checkpoint (no commit)**

---

### Task 2: Server pipeline (rate limit, config, Turnstile, Resend, origin)

**Files:**
- Create: `src/lib/contact/rate-limit.ts`, `src/lib/contact/env.ts`, `src/lib/contact/turnstile.ts`, `src/lib/contact/send-email.ts`, `src/lib/contact/origin.ts`, `src/lib/contact/handle.ts`, plus tests `rate-limit.test.ts`, `env.test.ts`, `turnstile.test.ts`, `send-email.test.ts`, `origin.test.ts`, `handle.test.ts` (all in `src/lib/contact/`)

**Interfaces:**
- **Consumes:** `parseContact`, `ContactInput` (Task 1); `ContactValues`; `ContactState`, `HONEYPOT_FIELD`, `TURNSTILE_FIELD`.
- **Produces** (`rate-limit.ts`): `createRateLimiter({ limit, windowMs, now? })` returning `{ hit(key), size() }`; `contactLimiter` (3 per 10 minutes); `clientIp(headers)`.
- **Produces** (`env.ts`): `EnvVars`, `ContactEnv`, `contactEnv(env?)`, `turnstileSiteKey(env?)`, `TURNSTILE_TEST_SITE_KEY`, `TURNSTILE_TEST_SECRET`.
- **Produces** (`turnstile.ts`): `verifyTurnstile(token, ip, secret, fetchImpl?) → Promise<boolean>`.
- **Produces** (`send-email.ts`): `sendEmail(input, { apiKey, to }, fetchImpl?)`, `emailPayload`, `oneLine`, `FROM`.
- **Produces** (`origin.ts`): `isSameOrigin(headers)`.
- **Produces** (`handle.ts`): `handleContact(form, deps: ContactDeps) → Promise<ContactState>`.

- [ ] **Step 1: Write the failing tests**

`src/lib/contact/rate-limit.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "./rate-limit";

function limiter() {
  let t = 0;
  const l = createRateLimiter({ limit: 3, windowMs: 1000, now: () => t });
  return { l, advance: (ms: number) => (t += ms) };
}

describe("createRateLimiter", () => {
  it("allows 3 hits then blocks with the time left", () => {
    const { l, advance } = limiter();
    expect(l.hit("a")).toEqual({ ok: true });
    expect(l.hit("a")).toEqual({ ok: true });
    advance(400);
    expect(l.hit("a")).toEqual({ ok: true });
    expect(l.hit("a")).toEqual({ ok: false, retryAfterMs: 600 });
  });

  it("counts keys independently", () => {
    const { l } = limiter();
    for (let i = 0; i < 3; i++) l.hit("a");
    expect(l.hit("b")).toEqual({ ok: true });
  });

  it("opens again after the window and prunes old buckets", () => {
    const { l, advance } = limiter();
    for (let i = 0; i < 4; i++) l.hit("a");
    l.hit("b");
    advance(1000);
    expect(l.hit("a")).toEqual({ ok: true });
    expect(l.size()).toBe(1);
  });
});

describe("clientIp", () => {
  it("prefers the first x-forwarded-for entry", () => {
    const h = new Headers({
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
      "x-real-ip": "198.51.100.2",
    });
    expect(clientIp(h)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then unknown", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe(
      "198.51.100.2",
    );
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
```

`src/lib/contact/env.test.ts`:

```ts
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
```

`src/lib/contact/turnstile.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "./turnstile";

const reply = (body: unknown, ok = true) =>
  vi.fn().mockResolvedValue({ ok, json: async () => body } as Response);

describe("verifyTurnstile", () => {
  it("posts the secret, token and IP and accepts success", async () => {
    const fetchMock = reply({ success: true });
    expect(await verifyTurnstile("tok", "203.0.113.7", "sec", fetchMock)).toBe(
      true,
    );
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    const body = init.body as URLSearchParams;
    expect(body.get("secret")).toBe("sec");
    expect(body.get("response")).toBe("tok");
    expect(body.get("remoteip")).toBe("203.0.113.7");
  });

  it("omits an unknown IP", async () => {
    const fetchMock = reply({ success: true });
    await verifyTurnstile("tok", "unknown", "sec", fetchMock);
    expect(
      (fetchMock.mock.calls[0]![1].body as URLSearchParams).has("remoteip"),
    ).toBe(false);
  });

  it.each([
    ["a failed check", reply({ success: false })],
    ["an HTTP error", reply({}, false)],
    ["a network error", vi.fn().mockRejectedValue(new Error("offline"))],
    ["a malformed reply", reply({ success: "yes" })],
  ])("fails closed on %s", async (_, fetchMock) => {
    expect(await verifyTurnstile("tok", "1.2.3.4", "sec", fetchMock)).toBe(
      false,
    );
  });

  it("rejects an empty token without calling Cloudflare", async () => {
    const fetchMock = reply({ success: true });
    expect(await verifyTurnstile("", "1.2.3.4", "sec", fetchMock)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
```

`src/lib/contact/send-email.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { emailPayload, FROM, oneLine, sendEmail } from "./send-email";

const input = {
  name: "Ada\r\nBcc: evil@example.com",
  email: "ada@example.com",
  message: "Hello there!",
};

describe("emailPayload", () => {
  it("sends to the owner, replies to the visitor, one-line subject", () => {
    const p = emailPayload(input, "me@example.com");
    expect(p).toMatchObject({
      from: FROM,
      to: ["me@example.com"],
      reply_to: "ada@example.com",
      subject: "Portfolio: message from Ada Bcc: evil@example.com",
    });
    expect(p.subject).not.toMatch(/[\r\n]/);
    expect(p.text).toContain("Hello there!");
  });

  it("collapses newlines", () => {
    expect(oneLine(" a\n\nb\r\nc ")).toBe("a b c");
  });
});

describe("sendEmail", () => {
  it("posts JSON with the bearer key and reports success", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
    expect(
      await sendEmail(
        input,
        { apiKey: "re_key", to: "me@example.com" },
        fetchMock,
      ),
    ).toBe(true);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_key");
    expect(JSON.parse(init.body).reply_to).toBe("ada@example.com");
  });

  it.each([
    ["an HTTP error", vi.fn().mockResolvedValue({ ok: false } as Response)],
    ["a network error", vi.fn().mockRejectedValue(new Error("offline"))],
  ])("returns false on %s", async (_, fetchMock) => {
    expect(
      await sendEmail(input, { apiKey: "k", to: "me@example.com" }, fetchMock),
    ).toBe(false);
  });
});
```

`src/lib/contact/origin.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isSameOrigin } from "./origin";

const h = (init: Record<string, string>) => new Headers(init);

describe("isSameOrigin", () => {
  it("accepts a matching origin and host", () => {
    expect(
      isSameOrigin(h({ origin: "https://site.example", host: "site.example" })),
    ).toBe(true);
  });

  it("prefers x-forwarded-host behind a proxy", () => {
    expect(
      isSameOrigin(
        h({
          origin: "https://site.example",
          host: "internal:3000",
          "x-forwarded-host": "site.example",
        }),
      ),
    ).toBe(true);
  });

  it.each([
    [
      "a different origin",
      { origin: "https://evil.example", host: "site.example" },
    ],
    ["no origin", { host: "site.example" }],
    ["a malformed origin", { origin: "not a url", host: "site.example" }],
  ])("refuses %s", (_, init) => {
    expect(isSameOrigin(h(init))).toBe(false);
  });
});
```

`src/lib/contact/handle.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/lib/contact`
Expected: FAIL with unresolved imports (`./rate-limit`, `./env`, `./turnstile`, `./send-email`, `./origin`, `./handle`). The Task 1 tests still pass.

- [ ] **Step 3: Implement**

`src/lib/contact/rate-limit.ts`:

```ts
/**
 * Fixed-window counter per key, in memory. Best-effort: each server instance
 * keeps its own counts (spec §1: owner-approved; Turnstile, the honeypot and
 * Resend's daily cap cover the gaps).
 */
export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
}) {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  function prune(t: number) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= t) buckets.delete(key);
    }
  }

  return {
    hit(key: string): { ok: true } | { ok: false; retryAfterMs: number } {
      const t = now();
      prune(t);
      const bucket = buckets.get(key);
      if (!bucket) {
        buckets.set(key, { count: 1, resetAt: t + windowMs });
        return { ok: true };
      }
      if (bucket.count >= limit) {
        return { ok: false, retryAfterMs: bucket.resetAt - t };
      }
      bucket.count += 1;
      return { ok: true };
    },
    /** For tests: number of live buckets. */
    size: () => buckets.size,
  };
}

/** 3 messages per 10 minutes per visitor IP. */
export const contactLimiter = createRateLimiter({
  limit: 3,
  windowMs: 10 * 60 * 1000,
});

/** First x-forwarded-for entry, then x-real-ip, then "unknown". */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown";
}
```

`src/lib/contact/env.ts`:

```ts
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
```

`src/lib/contact/turnstile.ts`:

```ts
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Asks Cloudflare whether a Turnstile token is valid. Fails closed: network
 * errors, timeouts and odd responses all count as "not verified".
 */
export async function verifyTurnstile(
  token: string,
  ip: string,
  secret: string,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip !== "unknown") body.set("remoteip", ip);
    const res = await fetchImpl(SITEVERIFY, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: unknown };
    return data.success === true;
  } catch {
    return false;
  }
}
```

`src/lib/contact/send-email.ts`:

```ts
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
```

`src/lib/contact/origin.ts`:

```ts
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
```

`src/lib/contact/handle.ts`:

```ts
import type { ContactEnv } from "./env";
import { parseContact } from "./schema";
import { type ContactValues } from "./rules";
import { sendEmail } from "./send-email";
import { verifyTurnstile } from "./turnstile";
import { HONEYPOT_FIELD, TURNSTILE_FIELD, type ContactState } from "./types";

export type ContactDeps = {
  env: ContactEnv;
  ip: string;
  limiter: { hit(key: string): { ok: boolean } };
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

  const token = field(form, TURNSTILE_FIELD);
  const human = env.dryRun
    ? token !== "" && token !== "fail"
    : env.turnstileSecret !== undefined &&
      (await verifyTurnstile(token, deps.ip, env.turnstileSecret, deps.fetch));
  if (!human) {
    log("warn", "verification-failed");
    return { status: "error", formError: "verification", values };
  }

  if (env.dryRun) {
    log("info", "dry-run: email not sent");
    return { status: "success" };
  }
  const sent =
    env.resendApiKey !== undefined &&
    (await sendEmail(
      parsed.data,
      { apiKey: env.resendApiKey, to: env.toEmail },
      deps.fetch,
    ));
  if (!sent) {
    log("warn", "send-failed");
    return { status: "error", formError: "sendFailed", values };
  }
  log("info", "sent");
  return { status: "success" };
}
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx vitest run src/lib/contact`
Expected: PASS (every contact library test).

- [ ] **Step 5: Checkpoint (no commit)**

---

### Task 3: The `/api/contact` endpoint, proxy exclusion and environment docs

**Files:**
- Create: `src/app/api/contact/route.ts`, `src/app/api/contact/route.test.ts`
- Modify: `src/proxy.ts`, `src/proxy.test.ts`, `.env.example`, `playwright.config.ts`

**Interfaces:**
- **Consumes:** `contactEnv`, `handleContact`, `isSameOrigin`, `clientIp` and `contactLimiter` (Task 2).
- **Produces:**
  - `POST /api/contact`, which takes multipart form data and returns `ContactState` as JSON. It answers 403 cross-site, 413 when the body is over 32 KB, and 400 when the body isn't form data.
  - The Playwright web server runs with `CONTACT_DRY_RUN=1`.

- [ ] **Step 1: Write the failing tests**

`src/app/api/contact/route.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/contact/env", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/contact/env")>()),
  contactEnv: () => ({
    production: false,
    dryRun: true,
    resendApiKey: undefined,
    toEmail: "me@example.com",
    turnstileSecret: "test",
  }),
}));

function post(body: BodyInit, headers: Record<string, string> = {}) {
  return new Request("http://site.example/api/contact", {
    method: "POST",
    body,
    headers: {
      origin: "http://site.example",
      host: "site.example",
      ...headers,
    },
  });
}

function valid() {
  const f = new FormData();
  f.set("name", "Ada");
  f.set("email", "ada@example.com");
  f.set("message", "Hello there, nice site!");
  f.set("cf-turnstile-response", "tok");
  return f;
}

describe("POST /api/contact", () => {
  it("runs the pipeline and returns its state as JSON", async () => {
    const res = await POST(
      post(valid(), { "x-forwarded-for": "198.51.100.1" }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "success" });
  });

  it("refuses cross-site requests", async () => {
    const res = await POST(post(valid(), { origin: "https://evil.example" }));
    expect(res.status).toBe(403);
  });

  it("refuses oversized bodies", async () => {
    const res = await POST(post(valid(), { "content-length": "999999" }));
    expect(res.status).toBe(413);
  });

  it("refuses a body that isn't form data", async () => {
    const res = await POST(post("{}", { "content-type": "application/json" }));
    expect(res.status).toBe(400);
  });
});
```

Then apply the proxy test change (`/api/contact` must skip locale routing):

```diff
diff --git a/src/proxy.test.ts b/src/proxy.test.ts
index a9c9e0c..eaffb77 100644
--- a/src/proxy.test.ts
+++ b/src/proxy.test.ts
@@ -12,6 +12,7 @@ describe("proxy matcher", () => {
       "/_next/static/chunks/a.js",
       "/_next/image",
       "/icon.svg",
+      "/api/contact",
       RESUME_PATH,
     ]) {
       expect(matcher.test(path), path).toBe(false);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/app/api src/proxy.test.ts`
Expected: FAIL. You'll see `Failed to resolve import "./route"`, and "skips Next internals…" fails on `/api/contact`.

- [ ] **Step 3: Implement**

`src/app/api/contact/route.ts`:

```ts
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
```

Then apply:

```diff
diff --git a/src/proxy.ts b/src/proxy.ts
index c5a6e4e..4e1fc05 100644
--- a/src/proxy.ts
+++ b/src/proxy.ts
@@ -49,5 +49,6 @@ export const config = {
   // RESUME_PATH. A blanket "has a dot" exclusion let /favicon.ico or
   // /work/x.pdf skip locale routing: bare 404s without lang, or soft 200s.
   // Add any new public/ or metadata file (robots.txt, sitemap.xml) here.
-  matcher: ["/((?!_next/|icon\\.svg$|naveen-dwarapudi-resume\\.pdf$).*)"],
+  // api/ holds Route Handlers (the contact endpoint), which have no locale.
+  matcher: ["/((?!_next/|api/|icon\\.svg$|naveen-dwarapudi-resume\\.pdf$).*)"],
 };
```

```diff
diff --git a/.env.example b/.env.example
index a64eb92..4a0447a 100644
--- a/.env.example
+++ b/.env.example
@@ -2,3 +2,17 @@
 # Protocol optional (https assumed); any path is ignored.
 # Required in Vercel production (VERCEL_ENV=production); the build fails without it.
 NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
+
+# Contact form (phase 7). Production (VERCEL_ENV=production) requires all four;
+# elsewhere, unset values fall back to Cloudflare's always-pass Turnstile test
+# keys and a missing RESEND_API_KEY means dry run (logged, nothing sent).
+# Resend API key with "Sending access" (https://resend.com/api-keys).
+RESEND_API_KEY=
+# Inbox that receives messages; must be the Resend account's email until a
+# custom domain is verified.
+CONTACT_TO_EMAIL=dbsnaveen@gmail.com
+# Cloudflare Turnstile widget keys (https://dash.cloudflare.com → Turnstile).
+TURNSTILE_SECRET_KEY=
+NEXT_PUBLIC_TURNSTILE_SITE_KEY=
+# Tests only: skip Cloudflare and Resend entirely. Ignored in production.
+# CONTACT_DRY_RUN=1
```

```diff
diff --git a/playwright.config.ts b/playwright.config.ts
index 11677dd..9a1bff2 100644
--- a/playwright.config.ts
+++ b/playwright.config.ts
@@ -17,5 +17,7 @@ export default defineConfig({
     command: `npm run start -- --port ${PORT}`,
     url: `http://localhost:${PORT}`,
     reuseExistingServer: !process.env.CI,
+    // Contact form: no Cloudflare or Resend calls in tests (ignored in production).
+    env: { CONTACT_DRY_RUN: "1" },
   },
 });
```

- [ ] **Step 4: Run them to verify they pass**

Run: `npx vitest run src/app/api src/proxy.test.ts`
Expected: PASS.

- [ ] **Step 5: Checkpoint (no commit)**

---

### Task 4: The contact form UI

**Files:**
- Create: `src/components/contact/turnstile.ts`, `src/components/contact/contact-form.tsx`, `src/components/contact/contact-form.test.tsx`
- Modify: `src/content/types.ts`, `src/content/en/home.ts`, `src/components/sections/contact.tsx`

**Interfaces:**
- **Consumes:**
  - `validateContact`, `LIMITS`, `CONTACT_FIELDS` and the field types (Task 1);
  - `ContactState`, `HONEYPOT_FIELD`, `TURNSTILE_FIELD`;
  - `turnstileSiteKey()` (Task 2);
  - `POST /api/contact` (Task 3);
  - `currentTheme()` from `@/lib/theme-switch`;
  - `buttonClass` from `@/components/ui/button`.
- **Produces:**
  - `ContactForm({ copy, email, siteKey })`, plus the constants `TOKEN_WAIT_MS` and `CONTACT_ENDPOINT`;
  - `loadTurnstile()` and `TURNSTILE_SRC`;
  - `HomeContent["contact"]["form"]`.

- [ ] **Step 1: Add the copy.** Apply:

```diff
diff --git a/src/content/types.ts b/src/content/types.ts
index 6f69159..087635b 100644
--- a/src/content/types.ts
+++ b/src/content/types.ts
@@ -111,6 +111,26 @@ export type HomeContent = {
     github: { label: string; url: ExternalUrl };
     location: string;
     copy: { idle: string; done: string; announced: string; failed: string };
+    /** Contact form (phase 7). `{count}`, `{max}` and `{email}` are filled in. */
+    form: {
+      heading: string;
+      labels: { name: string; email: string; message: string };
+      honeypotLabel: string;
+      note: string;
+      counter: string;
+      submit: string;
+      sending: string;
+      fieldErrors: {
+        nameRequired: string;
+        nameTooLong: string;
+        emailInvalid: string;
+        messageTooShort: string;
+        messageTooLong: string;
+      };
+      formErrors: { tooMany: string; verification: string; sendFailed: string };
+      success: { heading: string; body: string; again: string };
+      noscript: string;
+    };
   };
   footer: {
     name: string;
```

```diff
diff --git a/src/content/en/home.ts b/src/content/en/home.ts
index dac809c..0d8b59f 100644
--- a/src/content/en/home.ts
+++ b/src/content/en/home.ts
@@ -340,6 +340,37 @@ export const homeContent: HomeContent = {
       announced: "Email address copied",
       failed: "Copy failed — the address is dbsnaveen@gmail.com",
     },
+    form: {
+      heading: "Send a message",
+      labels: { name: "Name", email: "Email", message: "Message" },
+      honeypotLabel: "Leave this field empty",
+      note: "Your message goes straight to my inbox; nothing is stored.",
+      counter: "{count} / {max}",
+      submit: "Send message",
+      sending: "Sending…",
+      fieldErrors: {
+        nameRequired: "Please enter your name.",
+        nameTooLong: "Please keep your name under 100 characters.",
+        emailInvalid: "Please enter a valid email address.",
+        messageTooShort: "Please write at least 10 characters.",
+        messageTooLong: "Please keep your message under 2,000 characters.",
+      },
+      formErrors: {
+        tooMany:
+          "You've sent a few messages already. Please try again in a few minutes, or email me directly:",
+        verification:
+          "We couldn't confirm you're human. Please try again, or email me directly:",
+        sendFailed:
+          "Something went wrong sending your message. Please try again, or email me directly:",
+      },
+      success: {
+        heading: "Thanks, your message is on its way.",
+        body: "I'll reply as soon as I can.",
+        again: "Send another message",
+      },
+      noscript:
+        "The form needs JavaScript. You can email me directly at {email}.",
+    },
   },
   footer: {
     name: "Bhavani Sankar Naveen Dwarapudi",
```

- [ ] **Step 2: Write the failing test `src/components/contact/contact-form.test.tsx`**

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { homeContent } from "@/content/en";
import type { ContactState } from "@/lib/contact/types";
import { ContactForm } from "./contact-form";

const copy = homeContent.contact.form;
const email = homeContent.contact.email;

/** Stands in for the contact endpoint: resolves with the next state. */
const sendContact = vi.fn<(data: FormData) => Promise<ContactState>>();
vi.stubGlobal(
  "fetch",
  vi.fn(async (url: string, init: RequestInit) => {
    expect(url).toBe("/api/contact");
    expect(init.method).toBe("POST");
    const state = await sendContact(init.body as FormData);
    return { json: async () => state } as Response;
  }),
);

const turnstile = {
  render: vi.fn(
    (_el: HTMLElement, opts: { callback?: (t: string) => void }) => {
      opts.callback?.("tok-1");
      return "w1";
    },
  ),
  reset: vi.fn(),
  remove: vi.fn(),
};
const loadTurnstile = vi.fn(async () => turnstile);
vi.mock("./turnstile", () => ({ loadTurnstile: () => loadTurnstile() }));

beforeEach(() => {
  sendContact.mockReset();
  loadTurnstile.mockClear();
  turnstile.render.mockClear();
  turnstile.reset.mockClear();
});

function setup() {
  const user = userEvent.setup();
  render(<ContactForm copy={copy} email={email} siteKey="site-key" />);
  const name = screen.getByLabelText(copy.labels.name);
  const mail = screen.getByLabelText(copy.labels.email);
  const message = screen.getByLabelText(copy.labels.message);
  const submit = screen.getByRole("button", { name: copy.submit });
  return { user, name, mail, message, submit };
}

async function fillValid(f: ReturnType<typeof setup>) {
  await f.user.type(f.name, "Ada");
  await f.user.type(f.mail, "ada@example.com");
  await f.user.type(f.message, "Hello there, nice site!");
}

describe("ContactForm", () => {
  it("labels every field, counts characters and hides the honeypot", async () => {
    const f = setup();
    expect(
      screen.getByRole("form", { name: copy.heading }),
    ).toBeInTheDocument();
    expect(f.name).toHaveAttribute("autocomplete", "name");
    expect(f.mail).toHaveAttribute("type", "email");
    await f.user.type(f.message, "Hello");
    expect(screen.getByText("5 / 2000")).toBeInTheDocument();
    expect(f.message).toHaveAccessibleDescription(/5 \/ 2000/);
    const honeypot = document.querySelector('input[name="website"]')!;
    expect(honeypot).toHaveAttribute("tabindex", "-1");
    expect(honeypot.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it("doesn't load Turnstile until the form is focused", async () => {
    const f = setup();
    expect(loadTurnstile).not.toHaveBeenCalled();
    await f.user.click(f.name);
    await waitFor(() => expect(turnstile.render).toHaveBeenCalledTimes(1));
    expect(turnstile.render.mock.calls[0]![1]).toMatchObject({
      sitekey: "site-key",
      appearance: "interaction-only",
    });
  });

  it("shows browser-side errors, links them and focuses the first", async () => {
    const f = setup();
    await f.user.click(f.submit);
    expect(f.name).toHaveFocus();
    expect(f.name).toHaveAttribute("aria-invalid", "true");
    expect(f.name).toHaveAccessibleDescription(copy.fieldErrors.nameRequired);
    expect(f.mail).toHaveAccessibleDescription(copy.fieldErrors.emailInvalid);
    expect(f.message).toHaveAccessibleDescription(
      new RegExp(copy.fieldErrors.messageTooShort.replace(".", "\\.")),
    );
    expect(sendContact).not.toHaveBeenCalled();
  });

  it("re-checks a field live once it has shown an error", async () => {
    const f = setup();
    await f.user.click(f.submit);
    await f.user.type(f.name, "Ada");
    expect(f.name).not.toHaveAttribute("aria-invalid");
  });

  it("submits with the Turnstile token and shows the success panel", async () => {
    sendContact.mockResolvedValue({ status: "success" });
    const f = setup();
    await fillValid(f);
    await f.user.click(f.submit);
    const panel = await screen.findByRole("status");
    expect(panel).toHaveTextContent(copy.success.heading);
    expect(panel).toHaveFocus();
    const data = sendContact.mock.calls[0]![0];
    expect(data.get("cf-turnstile-response")).toBe("tok-1");
    expect(data.get("name")).toBe("Ada");
    expect(turnstile.reset).toHaveBeenCalled();
  });

  it("'Send another message' brings back an empty form", async () => {
    sendContact.mockResolvedValue({ status: "success" });
    const f = setup();
    await fillValid(f);
    await f.user.click(f.submit);
    await f.user.click(
      await screen.findByRole("button", { name: copy.success.again }),
    );
    expect(screen.getByLabelText(copy.labels.name)).toHaveValue("");
  });

  it("shows a server-side form error as an alert with the email", async () => {
    sendContact.mockResolvedValue({ status: "error", formError: "tooMany" });
    const f = setup();
    await fillValid(f);
    await f.user.click(f.submit);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(copy.formErrors.tooMany);
    expect(alert).toHaveFocus();
    expect(screen.getByRole("link", { name: email })).toHaveAttribute(
      "href",
      `mailto:${email}`,
    );
  });

  it("shows server field errors on the right field", async () => {
    sendContact.mockResolvedValue({
      status: "error",
      fieldErrors: { email: "emailInvalid" },
    });
    const f = setup();
    await fillValid(f);
    await f.user.click(f.submit);
    await waitFor(() => expect(f.mail).toHaveFocus());
    expect(f.mail).toHaveAccessibleDescription(copy.fieldErrors.emailInvalid);
  });

  it("shows the send-failed alert when the network fails", async () => {
    sendContact.mockRejectedValue(new Error("offline"));
    const f = setup();
    await fillValid(f);
    await f.user.click(f.submit);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      copy.formErrors.sendFailed,
    );
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/components/contact/contact-form.test.tsx`
Expected: FAIL with `Failed to resolve import "./contact-form"`.

- [ ] **Step 4: Implement**

`src/components/contact/turnstile.ts`:

```ts
/** The slice of Cloudflare's Turnstile API the contact form uses. */
export type Turnstile = {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: "light" | "dark" | "auto";
      appearance?: "always" | "execute" | "interaction-only";
      size?: "normal" | "flexible" | "compact";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ): string;
  reset(widgetId?: string): void;
  remove(widgetId?: string): void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export const TURNSTILE_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loading: Promise<Turnstile> | null = null;

/**
 * Injects Cloudflare's script once and resolves with window.turnstile. Called
 * on the first focus inside the form, never at page load (27.6 KB gzipped).
 */
export function loadTurnstile(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.onload = () =>
      window.turnstile
        ? resolve(window.turnstile)
        : reject(new Error("turnstile missing"));
    script.onerror = () => {
      loading = null;
      reject(new Error("turnstile failed to load"));
    };
    document.head.append(script);
  });
  return loading;
}

/** For tests: forget a previous load. */
export function resetTurnstileLoader() {
  loading = null;
}
```

`src/components/contact/contact-form.tsx`:

```tsx
"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { buttonClass } from "@/components/ui/button";
import type { HomeContent } from "@/content/types";
import {
  CONTACT_FIELDS,
  LIMITS,
  validateContact,
  type ContactField,
  type ContactValues,
  type FieldErrors,
} from "@/lib/contact/rules";
import {
  HONEYPOT_FIELD,
  TURNSTILE_FIELD,
  type ContactState,
} from "@/lib/contact/types";
import { currentTheme } from "@/lib/theme-switch";
import { loadTurnstile, type Turnstile } from "./turnstile";

type Copy = HomeContent["contact"]["form"];

/** How long a submit waits for a Turnstile token before giving up. */
export const TOKEN_WAIT_MS = 8000;

/** Route Handler (src/app/api/contact/route.ts). */
export const CONTACT_ENDPOINT = "/api/contact";

async function postContact(data: FormData): Promise<ContactState> {
  try {
    const res = await fetch(CONTACT_ENDPOINT, { method: "POST", body: data });
    return (await res.json()) as ContactState;
  } catch {
    return { status: "error", formError: "sendFailed" };
  }
}

const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k]));

const EMPTY: ContactValues = { name: "", email: "", message: "" };

/**
 * Contact form. Validates in the browser for instant feedback; the contact
 * endpoint re-validates and sends. Turnstile loads on the first focus inside
 * the form, so it costs nothing at page load.
 */
export function ContactForm({
  copy,
  email,
  siteKey,
}: {
  copy: Copy;
  /** Shown in error messages as the direct alternative. */
  email: string;
  siteKey: string;
}) {
  const [round, setRound] = useState(0);
  return (
    <ContactFormRound
      // A new key gives "Send another message" a fresh, empty form.
      key={round}
      copy={copy}
      email={email}
      siteKey={siteKey}
      onAgain={() => setRound((r) => r + 1)}
    />
  );
}

function ContactFormRound({
  copy,
  email,
  siteKey,
  onAgain,
}: {
  copy: Copy;
  email: string;
  siteKey: string;
  onAgain: () => void;
}) {
  const [state, setState] = useState<ContactState>({ status: "idle" });
  const [pending, setPending] = useState(false);
  const [values, setValues] = useState<ContactValues>(EMPTY);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [waitFailed, setWaitFailed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const token = useRef("");
  const tokenWaiters = useRef<((t: string) => void)[]>([]);
  const widget = useRef<{ api: Turnstile; id: string } | null>(null);
  const started = useRef(false);

  const serverErrors =
    state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const errors: FieldErrors = { ...serverErrors, ...clientErrors };
  const formError =
    state.status === "error" && state.formError
      ? state.formError
      : waitFailed
        ? "verification"
        : null;

  function setToken(value: string) {
    token.current = value;
    if (value) {
      tokenWaiters.current.forEach((resolve) => resolve(value));
      tokenWaiters.current = [];
    }
  }

  function startTurnstile() {
    if (started.current) return;
    started.current = true;
    loadTurnstile()
      .then((api) => {
        if (!slotRef.current) return;
        const id = api.render(slotRef.current, {
          sitekey: siteKey,
          theme: currentTheme(),
          appearance: "interaction-only",
          size: "flexible",
          callback: setToken,
          "expired-callback": () => setToken(""),
          "error-callback": () => setToken(""),
        });
        widget.current = { api, id };
      })
      .catch(() => {
        // Script blocked or offline: submits will time out waiting for a
        // token and show the "email me directly" alert.
        started.current = false;
      });
  }

  function waitForToken(): Promise<string> {
    if (token.current) return Promise.resolve(token.current);
    return new Promise((resolve) => {
      tokenWaiters.current.push(resolve);
      window.setTimeout(() => resolve(""), TOKEN_WAIT_MS);
    });
  }

  function focusFirstInvalid(errs: FieldErrors) {
    const first = CONTACT_FIELDS.find((f) => errs[f]);
    if (first)
      formRef.current?.querySelector<HTMLElement>(`#contact-${first}`)?.focus();
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setWaitFailed(false);
    const errs = validateContact(values);
    setClientErrors(errs);
    if (Object.keys(errs).length) {
      focusFirstInvalid(errs);
      return;
    }
    startTurnstile();
    const form = event.currentTarget;
    const value = await waitForToken();
    if (!value) {
      setWaitFailed(true);
      return;
    }
    const data = new FormData(form);
    data.set(TURNSTILE_FIELD, value);
    setPending(true);
    const result = await postContact(data);
    setPending(false);
    setState(result);
  }

  // After each server response: tokens are single-use, so reset the widget,
  // then move focus to what changed.
  useEffect(() => {
    if (state.status === "idle") return;
    setToken("");
    if (widget.current) widget.current.api.reset(widget.current.id);
    if (state.status === "success") successRef.current?.focus();
    else if (state.fieldErrors) focusFirstInvalid(state.fieldErrors);
    else if (state.formError) alertRef.current?.focus();
  }, [state]);

  useEffect(() => {
    if (waitFailed) alertRef.current?.focus();
  }, [waitFailed]);

  useEffect(
    () => () => {
      if (widget.current) widget.current.api.remove(widget.current.id);
    },
    [],
  );

  function update(name: ContactField, value: string) {
    const next = { ...values, [name]: value };
    setValues(next);
    // Once a field has shown an error, re-check it live.
    if (clientErrors[name] || serverErrors[name]) {
      setClientErrors((prev) => ({
        ...prev,
        [name]: validateContact(next)[name],
      }));
    }
  }

  if (state.status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="rounded-2xl border border-line bg-surface p-6 focus:outline-none md:p-8"
      >
        <h3 className="font-display text-h3 font-extrabold tracking-[-0.02em]">
          {copy.success.heading}
        </h3>
        <p className="mt-2 text-muted">{copy.success.body}</p>
        <button
          type="button"
          onClick={onAgain}
          className={`mt-6 ${buttonClass("secondary", "sm")}`}
        >
          {copy.success.again}
        </button>
      </div>
    );
  }

  const describedBy = (f: ContactField, extra?: string) =>
    [errors[f] ? `contact-${f}-error` : null, extra]
      .filter(Boolean)
      .join(" ") || undefined;

  const input =
    "mt-1.5 w-full rounded-lg border bg-bg px-3.5 py-2.5 text-[15px] text-text transition-colors focus:border-accent";
  const border = (f: ContactField) =>
    errors[f] ? "border-accent" : "border-line-strong";

  return (
    <form
      ref={formRef}
      data-contact-form
      noValidate
      onSubmit={onSubmit}
      onFocus={startTurnstile}
      aria-labelledby="contact-form-heading"
      className="rounded-2xl border border-line bg-surface p-6 md:p-8"
    >
      <h3
        id="contact-form-heading"
        className="font-display text-h3 font-extrabold tracking-[-0.02em]"
      >
        {copy.heading}
      </h3>

      <div className="mt-6 grid gap-5">
        <div>
          <label htmlFor="contact-name" className="text-sm font-medium">
            {copy.labels.name}
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={LIMITS.nameMax + 50}
            value={values.name}
            onChange={(e) => update("name", e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
            className={`${input} ${border("name")}`}
          />
          <FieldError
            id="contact-name-error"
            text={errors.name && copy.fieldErrors[errors.name]}
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="text-sm font-medium">
            {copy.labels.email}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email")}
            className={`${input} ${border("email")}`}
          />
          <FieldError
            id="contact-email-error"
            text={errors.email && copy.fieldErrors[errors.email]}
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="contact-message" className="text-sm font-medium">
              {copy.labels.message}
            </label>
            <span
              id="contact-message-count"
              className="font-mono text-[11px] text-muted"
            >
              {fill(copy.counter, {
                count: values.message.trim().length,
                max: LIMITS.messageMax,
              })}
            </span>
          </div>
          <textarea
            id="contact-message"
            name="message"
            rows={6}
            value={values.message}
            onChange={(e) => update("message", e.target.value)}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={describedBy("message", "contact-message-count")}
            className={`${input} ${border("message")} resize-y`}
          />
          <FieldError
            id="contact-message-error"
            text={errors.message && copy.fieldErrors[errors.message]}
          />
        </div>

        {/* Honeypot: off-screen, skipped by keyboard and screen readers. */}
        <div
          aria-hidden="true"
          className="absolute -left-[10000px] size-px overflow-hidden"
        >
          <label htmlFor={`contact-${HONEYPOT_FIELD}`}>
            {copy.honeypotLabel}
          </label>
          <input
            id={`contact-${HONEYPOT_FIELD}`}
            name={HONEYPOT_FIELD}
            type="text"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>
      </div>

      <p className="mt-4 text-sm text-muted">{copy.note}</p>

      {/* Turnstile renders here; invisible unless Cloudflare needs a click. */}
      <div ref={slotRef} className="mt-4 empty:mt-0" />

      {formError ? (
        <div
          ref={alertRef}
          tabIndex={-1}
          role="alert"
          className="mt-4 rounded-lg border border-accent/50 bg-accent/8 px-4 py-3 text-sm text-text focus:outline-none"
        >
          {copy.formErrors[formError]}{" "}
          <a
            href={`mailto:${email}`}
            className="text-accent underline underline-offset-2"
          >
            {email}
          </a>
        </div>
      ) : null}

      <button
        type="submit"
        aria-disabled={pending || undefined}
        className={`mt-6 ${buttonClass("primary")}`}
      >
        {pending ? copy.sending : copy.submit}
        {pending ? null : (
          <span
            aria-hidden="true"
            className="transition-transform duration-300 ease-spring group-hover:translate-x-1"
          >
            →
          </span>
        )}
      </button>
    </form>
  );
}

function FieldError({ id, text }: { id: string; text?: string | false }) {
  if (!text) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-accent">
      {text}
    </p>
  );
}
```

Render it in the Contact section, which becomes two columns with a `<noscript>` fallback:

```diff
diff --git a/src/components/sections/contact.tsx b/src/components/sections/contact.tsx
index 783b76f..b7cb150 100644
--- a/src/components/sections/contact.tsx
+++ b/src/components/sections/contact.tsx
@@ -1,9 +1,11 @@
+import { ContactForm } from "@/components/contact/contact-form";
 import { CopyEmailButton } from "@/components/contact/copy-email-button";
 import { Magnetic } from "@/components/motion/pointer-effects";
 import { ButtonLink } from "@/components/ui/button";
 import { Heading } from "@/components/ui/heading";
 import { Section } from "@/components/ui/section";
 import type { HomeContent } from "@/content/types";
+import { turnstileSiteKey } from "@/lib/contact/env";
 
 export function Contact({
   contact,
@@ -14,48 +16,68 @@ export function Contact({
 }) {
   return (
     <Section id="contact" index="07" label={contact.label}>
-      <Heading
-        level="h2"
-        id="contact-heading"
-        className="scroll-reveal mt-4 text-[clamp(2.5rem,7vw,5rem)]"
-      >
-        {contact.heading}
-      </Heading>
-      <p className="scroll-reveal mt-4 text-lg text-muted">{contact.line}</p>
-      <p className="scroll-reveal mt-8">
-        <a
-          href={`mailto:${contact.email}`}
-          className="font-display text-[clamp(1.25rem,4vw,2rem)] font-extrabold tracking-[-0.02em] break-all text-accent underline-offset-4 hover:underline"
-        >
-          {contact.email}
-        </a>
-      </p>
-      <div className="scroll-reveal mt-6 flex flex-wrap gap-3">
-        <CopyEmailButton email={contact.email} labels={contact.copy} />
-        <Magnetic>
-          <ButtonLink
-            href={contact.linkedin.url}
-            variant="secondary"
-            arrow="↗"
-            newTabLabel={newTabLabel}
+      <div className="grid gap-12 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-16">
+        <div>
+          <Heading
+            level="h2"
+            id="contact-heading"
+            className="scroll-reveal mt-4 text-[clamp(2.5rem,7vw,5rem)]"
           >
-            {contact.linkedin.label}
-          </ButtonLink>
-        </Magnetic>
-        <Magnetic>
-          <ButtonLink
-            href={contact.github.url}
-            variant="secondary"
-            arrow="↗"
-            newTabLabel={newTabLabel}
-          >
-            {contact.github.label}
-          </ButtonLink>
-        </Magnetic>
+            {contact.heading}
+          </Heading>
+          <p className="scroll-reveal mt-4 text-lg text-muted">
+            {contact.line}
+          </p>
+          <p className="scroll-reveal mt-8">
+            <a
+              href={`mailto:${contact.email}`}
+              className="font-display text-[clamp(1.25rem,4vw,2rem)] font-extrabold tracking-[-0.02em] break-all text-accent underline-offset-4 hover:underline"
+            >
+              {contact.email}
+            </a>
+          </p>
+          <div className="scroll-reveal mt-6 flex flex-wrap gap-3">
+            <CopyEmailButton email={contact.email} labels={contact.copy} />
+            <Magnetic>
+              <ButtonLink
+                href={contact.linkedin.url}
+                variant="secondary"
+                arrow="↗"
+                newTabLabel={newTabLabel}
+              >
+                {contact.linkedin.label}
+              </ButtonLink>
+            </Magnetic>
+            <Magnetic>
+              <ButtonLink
+                href={contact.github.url}
+                variant="secondary"
+                arrow="↗"
+                newTabLabel={newTabLabel}
+              >
+                {contact.github.label}
+              </ButtonLink>
+            </Magnetic>
+          </div>
+          <p className="mt-6 font-mono text-label tracking-[0.1em] text-muted uppercase">
+            {contact.location}
+          </p>
+        </div>
+        <div className="scroll-reveal">
+          <ContactForm
+            copy={contact.form}
+            email={contact.email}
+            siteKey={turnstileSiteKey()}
+          />
+          {/* Turnstile needs JS; without it, hide the form and point to email. */}
+          <noscript>
+            <style>{"[data-contact-form]{display:none}"}</style>
+            <p className="rounded-2xl border border-line bg-surface p-6 text-muted">
+              {contact.form.noscript.replace("{email}", contact.email)}
+            </p>
+          </noscript>
+        </div>
       </div>
-      <p className="mt-6 font-mono text-label tracking-[0.1em] text-muted uppercase">
-        {contact.location}
-      </p>
     </Section>
   );
 }
```

- [ ] **Step 5: Verify**

```bash
npm run format && npm run lint && npm run typecheck && npm run test
```

Expected: everything passes, with 286 unit tests.

- [ ] **Step 6: Checkpoint (no commit)**

---

### Task 5: E2E, Lighthouse and docs

**Files:**
- Create: `e2e/contact.spec.ts`
- Modify: `CLAUDE.md`, `docs/superpowers/specs/2026-10-11-contact-form-design.md`

- [ ] **Step 1: Write `e2e/contact.spec.ts`**

```ts
import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations } from "./axe";

const TURNSTILE = "https://challenges.cloudflare.com/turnstile/v0/api.js*";

/**
 * Stands in for Cloudflare's script: renders nothing and issues a token at
 * once (window.__tsToken overrides it, e.g. "fail"). The server runs with
 * CONTACT_DRY_RUN=1, which accepts any token except "fail".
 */
const FAKE_TURNSTILE = `window.turnstile = {
  render(el, opts) { setTimeout(() => opts.callback(window.__tsToken || "e2e-token")); return "w1"; },
  reset() {}, remove() {}
};`;

async function setup(page: Page, { token }: { token?: string } = {}) {
  // A unique "IP" per test (workers run in parallel against one server), so
  // the in-memory rate limit never leaks between tests.
  await page.setExtraHTTPHeaders({ "x-forwarded-for": crypto.randomUUID() });
  await page.route(TURNSTILE, (route) =>
    route.fulfill({ contentType: "text/javascript", body: FAKE_TURNSTILE }),
  );
  if (token)
    await page.addInitScript(
      (t) => ((window as unknown as { __tsToken: string }).__tsToken = t),
      token,
    );
  await page.goto("/#contact");
  await page.waitForLoadState("networkidle");
  const form = page.getByRole("form", { name: "Send a message" });
  return {
    form,
    name: form.getByLabel("Name"),
    email: form.getByLabel("Email"),
    message: form.getByLabel("Message"),
    submit: form.getByRole("button", { name: "Send message" }),
  };
}

async function fill(f: Awaited<ReturnType<typeof setup>>) {
  await f.name.fill("Ada Lovelace");
  await f.email.fill("ada@example.com");
  await f.message.fill("Hello! I enjoyed your portfolio.");
}

test("sending a message shows the success panel", async ({ page }) => {
  const f = await setup(page);
  await fill(f);
  await f.submit.click();
  const panel = page.getByRole("status").filter({
    hasText: "Thanks, your message is on its way.",
  });
  await expect(panel).toBeFocused();
  await page.getByRole("button", { name: "Send another message" }).click();
  await expect(f.name).toHaveValue("");
});

test("an empty submit shows three errors and focuses Name", async ({
  page,
}) => {
  const f = await setup(page);
  await f.submit.click();
  await expect(f.name).toBeFocused();
  await expect(f.name).toHaveAttribute("aria-invalid", "true");
  await expect(f.form.getByText("Please enter your name.")).toBeVisible();
  await expect(
    f.form.getByText("Please enter a valid email address."),
  ).toBeVisible();
  await expect(
    f.form.getByText("Please write at least 10 characters."),
  ).toBeVisible();
});

test("a failed human check shows the verification alert", async ({ page }) => {
  const f = await setup(page, { token: "fail" });
  await fill(f);
  await f.submit.click();
  const alert = f.form.getByRole("alert");
  await expect(alert).toContainText("We couldn't confirm you're human");
  await expect(alert).toBeFocused();
  await expect(
    alert.getByRole("link", { name: "dbsnaveen@gmail.com" }),
  ).toBeVisible();
});

test("the fourth message from one visitor is rate limited", async ({
  page,
}) => {
  const f = await setup(page);
  for (let i = 0; i < 3; i++) {
    await fill(f);
    await f.submit.click();
    await page.getByRole("button", { name: "Send another message" }).click();
  }
  await fill(f);
  await f.submit.click();
  await expect(f.form.getByRole("alert")).toContainText(
    "You've sent a few messages already",
  );
});

test("Cloudflare's script isn't requested until the form is focused", async ({
  page,
}) => {
  const requested: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("challenges.cloudflare.com")) requested.push(r.url());
  });
  const f = await setup(page);
  expect(requested).toEqual([]);
  await f.name.focus();
  await expect.poll(() => requested.length).toBe(1);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`no WCAG 2.1 AA violations on the form, with errors (${colorScheme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    const f = await setup(page);
    await expectNoAxeViolations(page, 150);
    await f.submit.click();
    await expect(f.name).toBeFocused();
    await expectNoAxeViolations(page, 150);
  });
}
```

- [ ] **Step 2: Run the full E2E suite**

Run: `npm run build && npx playwright test`
Expected: 96 passed. The contact spec uses a stubbed Turnstile and `CONTACT_DRY_RUN=1`, so no network is needed.

- [ ] **Step 3: Run calibrated Lighthouse**

```bash
CHROME_PATH="$(ls -d ~/Library/Caches/ms-playwright/chromium-*/chrome-mac*/*.app/Contents/MacOS/* | head -1)" \
  npm run lhci -- --upload.target=filesystem --upload.outputDir=.lighthouseci/reports
```

Expected:
- Exit 0.
- `/` script is about 144 KB, and there are no `challenges.cloudflare.com` requests.
- The best home LCP is comparable to `main` (about 2.3–2.4 s on the reference host).
- Budgets are untouched.

- [ ] **Step 4: Update the docs**

In the spec:
- Change the Status to Approved.
- Append these rows to the §7 decisions table:

```markdown
| Endpoint | Route Handler `POST /api/contact` plus client `fetch`, not a Server Action | a client-invoked Server Action pulled 9.8 KB of action runtime into every page; home LCP best 2482 → 2329 ms without it |
| CSRF / size | `isSameOrigin` check and a 32 KB body cap in the handler | replaces the Server Action's built-in Origin check |
| Lazy form chunk | rejected | no measurable LCP gain; the runtime, not the form, was the cost |
```

In `CLAUDE.md`, make these edits:
- **Planned stack:** replace `Server Actions + Zod + react-hook-form · Resend` with `Route Handler + Zod (server only) · Resend REST`.
- **Conventions:** add:

```markdown
- Contact form: `src/components/contact/contact-form.tsx` posts to `src/app/api/contact/route.ts` (same-origin check, 32 KB cap), which runs `handleContact` in `src/lib/contact/` (honeypot → Zod → in-memory rate limit → Turnstile → Resend). Browser rules in `rules.ts` must stay in step with `schema.ts` (parity test). Turnstile loads on first focus only. Tests use `CONTACT_DRY_RUN=1` (ignored in production) and stub Cloudflare's script. Don't call Server Actions from client components: the action runtime costs ~10 KB on every page.
```

- [ ] **Step 5: Final verification, then stop for the owner's review**

```bash
npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build && npx playwright test
```

Expected: everything passes. Leave everything uncommitted, and suggest the commit messages (skill `suggest-commit`).
