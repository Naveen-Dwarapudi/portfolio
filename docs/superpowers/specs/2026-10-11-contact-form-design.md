# Design: Contact Form (Phase 7)

**Date:** 2026-10-11
**Status:** Draft — awaiting owner review
**Parent spec:** `2026-09-19-nextjs-portfolio-design.md` (§3 stack, §7 budgets, §10 testing)
**Branch:** `feat/contact`

---

## 1. Purpose and scope

Visitors can send a message from the Contact section without leaving the site. It
reaches the owner's inbox and keeps spam out, at zero cost. The existing email
link, Copy email, LinkedIn and GitHub stay as alternatives.

### Success criteria

1. **The form:** a Name / Email / Message form in the Contact section. It is
   validated in the browser for instant feedback and again on the server, which
   is authoritative.
2. **Delivery:** a valid submission emails `CONTACT_TO_EMAIL` through Resend,
   with **Reply-To set to the visitor**.
3. **Spam layers:** a honeypot, Cloudflare Turnstile, a per-IP rate limit (3
   per 10 minutes, in memory), and Resend's free-tier daily cap as the final
   backstop. No charges are possible.
4. **Accessibility (WCAG 2.1 AA, both themes):**
   - every field has a visible label;
   - errors are linked with `aria-describedby` and `aria-invalid`, and focus
     moves to the first invalid field;
   - form-level errors use `role="alert"`;
   - success is announced and receives focus;
   - axe passes on the form at rest and with errors.
5. **Budgets unchanged:**
   - **Turnstile** (`api.js`, 27.6 KB gzipped) loads only on the first focus
     inside the form, never at page load.
   - **The form's own client code** stays ≤ 3 KB gzipped.
   - **No client-side Zod or react-hook-form.**
6. **Secrets:** they live only in Vercel environment variables. `.env.example`
   documents every variable. Nothing secret is committed.
7. **Deterministic tests:** they need no network or real keys (a dry-run mode
   plus a stubbed Turnstile).

### Deviations from the parent spec

- **react-hook-form and client-side Zod are dropped.**
  - **Why:** together they cost about 20 KB gzipped against about 12 KB of
    script headroom.
  - **Instead:** React 19's `useActionState` plus a ~0.5 KB hand-written
    validator handle the client side. Zod runs **server-side only**, so it
    costs no client JS.
  - **Keeping them aligned:** a unit test asserts the client validator and the
    server schema agree on a shared table of inputs.
- **The Resend SDK is not used.** One `fetch` to the documented REST endpoint,
  which avoids a dependency.
- **The rate limit lives in memory, per server instance.**
  - **What that means:** it is best-effort, since Vercel may run or recycle
    several instances.
  - **Why it's acceptable:** this was owner-approved. It sits behind Turnstile
    and the honeypot, and Resend's daily cap bounds the worst case.
  - **Rejected alternative:** Upstash Redis, which would be an extra account
    and is effectively a database.

---

## 2. User experience

- **Layout (`lg` and up):** two columns. **Left:** the existing heading, line,
  email link, Copy / LinkedIn / GitHub buttons and location. **Right:** a
  surface card holding the form.
- **Below `lg`:** stacked, with the form after the buttons.
- **Fields, in order:**

| Field | Input | Rules (trimmed) | Autocomplete |
|---|---|---|---|
| Name | `text` | required, ≤ 100 chars | `name` |
| Email | `email` | required, valid address, ≤ 254 chars | `email` |
| Message | `textarea` (6 rows) | 10–2000 chars; live `n / 2000` counter | `off` |

- **Honeypot:** a `website` text input.
  - It is off-screen (not `display: none`, which some bots skip), with
    `tabIndex={-1}`, `autoComplete="off"` and `aria-hidden="true"` on its
    wrapper.
  - Its label tells humans to leave it empty.
- **Note** under the fields, in muted small text: "Your message goes straight
  to my inbox; nothing is stored."
- **Submit:** a primary `Button`, "Send message →". While pending it shows
  "Sending…" with `aria-disabled="true"`, and repeated submits are ignored.
- **Client validation:**
  - It runs on submit, then live per field once that field has shown an error.
  - Each error renders under its field, in a `<p id>` referenced by
    `aria-describedby`.
  - Focus moves to the first invalid field. There are no native browser
    bubbles (`noValidate`).
- **Server field errors:** shown the same way. The values are preserved.
- **Form-level errors:** a `role="alert"` box above the submit button. Each
  message offers the email address as an alternative (as a `mailto:` link).
  - **Too many messages:** "You've sent a few messages already. Please try
    again in a few minutes, or email me directly."
  - **Verification failed:** "We couldn't confirm you're human. Please try
    again, or email me directly."
  - **Sending failed or unavailable:** "Something went wrong sending your
    message. Please try again, or email me directly."
- **Success:**
  - The form is replaced by a panel (`tabIndex={-1}`, focused on mount) whose
    heading reads "Thanks, your message is on its way." and whose body reads
    "I'll reply as soon as I can."
  - A secondary "Send another message" button restores an empty form.
- **Turnstile:**
  - It renders in a reserved slot above the submit button with
    `appearance: "interaction-only"`, so it stays invisible unless Cloudflare
    needs a click.
  - It also uses `size: "flexible"`, and its theme comes from `currentTheme()`.
- **Without JS:** a `<noscript>` note replaces the form: "The form needs
  JavaScript. You can email me directly at {email}." The left column is
  unaffected.
- **Motion:** none beyond the existing `scroll-reveal` on the section. The
  pending spinner is hidden under reduced motion (the text alone remains).

---

## 3. Architecture

| Unit | Responsibility |
|---|---|
| `src/lib/contact/rules.ts` (pure, shared) | Field limits, `ContactField`, `FieldErrorKey`, and `validateContact(values) → Partial<Record<ContactField, FieldErrorKey>>`. Used by the client form. |
| `src/lib/contact/schema.ts` (server) | The Zod schema built from the same limits, mapping issues to the same `FieldErrorKey`s. |
| `src/lib/contact/rate-limit.ts` (server) | `createRateLimiter({ limit, windowMs, now })` → `hit(key): { ok: true } \| { ok: false; retryAfterMs }`, with expired buckets pruned. A module-level instance holds 3 per 10 minutes. |
| `src/lib/contact/turnstile.ts` (server) | `verifyTurnstile(token, ip, secret): Promise<boolean>`: POST to `https://challenges.cloudflare.com/turnstile/v0/siteverify`, with a 5 s timeout; it fails closed. |
| `src/lib/contact/send-email.ts` (server) | `sendEmail({ name, email, message }, env): Promise<boolean>`: POST to `https://api.resend.com/emails`, with an 8 s timeout. The sender is `Portfolio contact <onboarding@resend.dev>`, `reply_to` the visitor, the subject `Portfolio: message from {name}` (CR and LF stripped), and the body plain text. |
| `src/lib/contact/env.ts` (server) | `contactEnv()` resolves the configuration and applies the defaults and dry-run rules below. |
| `src/app/actions/contact.ts` (`"use server"`) | `sendContact(prev: ContactState, formData): Promise<ContactState>`, which runs the pipeline in §3.1. |
| `src/components/contact/contact-form.tsx` (client) | The form UI: `useActionState(sendContact)`, client validation, the focus rules, and lazy Turnstile. |
| `src/components/contact/turnstile.ts` (client) | `loadTurnstile(): Promise<Turnstile>`, a once-only script injection of `api.js?render=explicit`, plus a tiny typed wrapper. |
| `src/components/sections/contact.tsx` | The two-column layout that renders `ContactForm`. |

### 3.1 Server pipeline (`sendContact`)

1. **Honeypot:** if `website` is non-empty, return `{ status: "success" }`
   without sending. Bots learn nothing.
2. **Validate with Zod.** On failure, return
   `{ status: "error", fieldErrors, values }`.
3. **Rate limit:** the key is the first `x-forwarded-for` entry, then
   `x-real-ip`, then `"unknown"`. Only submissions that passed validation count.
   Over the limit, it returns `formError: "tooMany"`.
4. **Turnstile:** it verifies `cf-turnstile-response` (in dry run, a local check that rejects an empty token or `"fail"`).
   Failure returns `formError: "verification"`.
5. **Send via Resend** (logged and skipped in dry run). Failure returns
   `formError: "sendFailed"`.
6. **Success:** return `{ status: "success" }`.

The form state is defined as:

```ts
type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | {
      status: "error";
      fieldErrors?: Partial<Record<ContactField, FieldErrorKey>>;
      formError?: "tooMany" | "verification" | "sendFailed";
      values?: { name: string; email: string; message: string };
    };
```

Every outcome also logs a one-line `console.info` / `console.warn` with the
outcome, never the message content, for Vercel's logs.

### 3.2 Environment (`contactEnv()`)

**Variables:**

| Variable | Production | Elsewhere when unset |
|---|---|---|
| `RESEND_API_KEY` | required (missing gives `sendFailed` plus a server log) | dry run (log instead of send) |
| `CONTACT_TO_EMAIL` | required | `homeContent.contact.email` |
| `TURNSTILE_SECRET_KEY` | required (missing fails closed) | Cloudflare test secret `1x0000000000000000000000000000000AA` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | required | Cloudflare test site key `1x00000000000000000000AA` |
| `CONTACT_DRY_RUN=1` | **ignored** | no network: Turnstile verification becomes a local check (any non-empty token except `"fail"` passes), and sending is logged instead |

**What counts as production:** `VERCEL_ENV === "production"`.

**How tests run:** e2e sets `CONTACT_DRY_RUN=1` on its web server. Unit tests
inject the configuration directly.

### 3.3 Client flow (`ContactForm`)

1. **Load the human check.** On the first `focusin` inside the form, call
   `loadTurnstile()`, then `turnstile.render(slot, {...})`. The token is kept
   in a ref and in a hidden input. `expired-callback` and `error-callback`
   clear it.
2. **On submit:**
   - Run `validateContact`. If anything fails, `preventDefault`, show the
     errors, focus the first invalid field, and stop.
   - Otherwise, if there is no token yet, wait for it (up to 8 s) before
     submitting programmatically (`requestSubmit`). After a timeout, show
     `formError: "verification"`.
3. **After every server response:**
   - Call `turnstile.reset()`, since tokens are single-use.
   - On `fieldErrors`, focus the first invalid field. On `formError`, focus the
     alert. On success, focus the success panel.
4. **"Send another message"** resets to `idle` by remounting the form with a
   new `key`.

---

## 4. Copy (`homeContent.contact.form`, typed)

- **Headings and labels:**
  - `heading`: "Send a message"
  - `labels`: { name: "Name", email: "Email", message: "Message" }
  - `honeypotLabel`: "Leave this field empty"
- **Note and counter:**
  - `note`: "Your message goes straight to my inbox; nothing is stored."
  - `counter`: "{count} / {max}"
- **Buttons:** `submit`: "Send message" · `sending`: "Sending…"
- **Field errors** (`fieldErrors`):
  - `nameRequired`: "Please enter your name."
  - `nameTooLong`: "Please keep your name under 100 characters."
  - `emailInvalid`: "Please enter a valid email address."
  - `messageTooShort`: "Please write at least 10 characters."
  - `messageTooLong`: "Please keep your message under 2,000 characters."
- **Form errors** (`formErrors`):
  - `tooMany`: "You've sent a few messages already. Please try again in a few
    minutes, or email me directly."
  - `verification`: "We couldn't confirm you're human. Please try again, or
    email me directly."
  - `sendFailed`: "Something went wrong sending your message. Please try
    again, or email me directly."
- **Success:**
  - `success`: { heading: "Thanks, your message is on its way.", body: "I'll
    reply as soon as I can.", again: "Send another message" }
- **No JavaScript:** `noscript`: "The form needs JavaScript. You can email me
  directly at {email}."

---

## 5. Testing

- **Unit (Vitest):**
  - **`rules.ts`:** every boundary (0 / 1 / 100 / 101 name chars; valid and
    invalid emails; 9 / 10 / 2000 / 2001 message chars; whitespace-only
    input).
  - **`schema.ts`:** agrees with `validateContact` on the same table (parity).
  - **`rate-limit.ts`:** 3 pass, the 4th is blocked with `retryAfterMs`;
    keys are independent; the window expires (injected clock); pruning works.
  - **`turnstile.ts`:** success, failure, network error and timeout; the last
    two fail closed (mocked `fetch`).
  - **`send-email.ts`:** the request shape (auth header, `reply_to`, subject
    with newlines stripped) and failure statuses.
  - **`env.ts`:** production requires keys and ignores dry run; elsewhere the
    defaults apply.
  - **`sendContact`:** honeypot gives a fake success with no send; invalid
    input gives field errors and values; then rate limited, verification
    failed, send failed, and success. Configuration and `fetch` are injected
    or mocked; `headers()` is mocked.
  - **`ContactForm`:**
    - labels and the counter;
    - client errors with `aria-invalid` / `aria-describedby` and focus on the
      first invalid field;
    - the server error alert;
    - the success panel focus and "Send another";
    - Turnstile loading on first focus only (mocked loader).
- **E2E (Playwright):** the web server runs with `CONTACT_DRY_RUN=1`, and
  `page.route` stubs `challenges.cloudflare.com/turnstile/v0/api.js` with a
  fake that issues a token.
  - **Happy path:** fill the fields, send, see the success panel, which has
    focus.
  - **Client validation:** an empty submit shows three errors and focuses Name.
  - **Server-side error path:** a stubbed token `"fail"` (dry run rejects it)
    shows the verification alert.
  - **Rate limit:** the 4th send from one IP (via a custom
    `x-forwarded-for`) shows `tooMany`.
  - **No Turnstile at load:** no request to `challenges.cloudflare.com`
    before the form is focused.
  - **axe:** passes on the form at rest and with errors, in both themes.
- **LHCI:** budgets unchanged. The script on `/` is measured and recorded.

---

## 6. Owner setup (done 2026-10-11)

- **Resend:** an account on dbsnaveen@gmail.com and a sending-access API key.
- **Turnstile:** a managed widget for `naveen-dwarapudi.vercel.app` and
  `localhost`.
- **Vercel environment variables:** set as in §3.2. **Preview** uses the
  Cloudflare always-pass Turnstile test keys, because preview hostnames differ
  from the widget's hostnames.

---

## 7. Decisions log

| Decision | Choice | Why |
|---|---|---|
| Client validation | Hand-written validator plus `useActionState`; Zod server-only | react-hook-form plus Zod is about 20 KB against about 12 KB headroom |
| Turnstile loading | On first focus inside the form | 27.6 KB gzipped; never at page load |
| Rate limit | In memory, 3 per 10 minutes per IP, best-effort | owner choice; no database; Turnstile, the honeypot and Resend's cap cover the gaps |
| Email transport | Resend REST through `fetch`, sending from `onboarding@resend.dev` | no SDK dependency; no custom domain yet |
| Honeypot hit | Fake success | doesn't teach bots |
| Test strategy | `CONTACT_DRY_RUN` (ignored in production) plus a stubbed Turnstile | deterministic CI with no network or secrets |
| No-JS | `<noscript>` points to the email address | Turnstile can't run without JS |
