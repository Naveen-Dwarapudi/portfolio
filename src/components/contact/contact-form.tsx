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
  const inFlight = useRef(false);

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
    // A ref, not state: a second click can land before a re-render.
    if (inFlight.current) return;
    setWaitFailed(false);
    const errs = validateContact(values);
    setClientErrors(errs);
    if (Object.keys(errs).length) {
      focusFirstInvalid(errs);
      return;
    }
    // "Sending…" from here on, including the wait for the human check, so the
    // visitor sees progress and a second click can't send twice.
    inFlight.current = true;
    setPending(true);
    startTurnstile();
    const form = event.currentTarget;
    const value = await waitForToken();
    if (!value) {
      inFlight.current = false;
      setPending(false);
      setWaitFailed(true);
      return;
    }
    const data = new FormData(form);
    data.set(TURNSTILE_FIELD, value);
    const result = await postContact(data);
    inFlight.current = false;
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
      // Without JS taking over (failed or slow to load), a native submit
      // POSTs here instead of putting the message in the URL.
      method="post"
      action={CONTACT_ENDPOINT}
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
