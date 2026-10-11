import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { homeContent } from "@/content/en";
import { HONEYPOT_FIELD } from "@/lib/contact/types";
import type { ContactState } from "@/lib/contact/types";
import { CHALLENGE_WAIT_MS, ContactForm, TOKEN_WAIT_MS } from "./contact-form";

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

/** When false, the token arrives only when a test calls `issueToken`. */
let autoToken = true;
let issueToken: ((t: string) => void) | undefined;
type WidgetOptions = {
  callback?: (t: string) => void;
  "expired-callback"?: () => void;
  "before-interactive-callback"?: () => void;
};
let widgetOptions: WidgetOptions | undefined;
const turnstile = {
  render: vi.fn((_el: HTMLElement, opts: WidgetOptions) => {
    widgetOptions = opts;
    if (autoToken) opts.callback?.("tok-1");
    else issueToken = opts.callback;
    return "w1";
  }),
  reset: vi.fn(),
  remove: vi.fn(),
};
const loadTurnstile = vi.fn(async () => turnstile);
vi.mock("./turnstile", () => ({ loadTurnstile: () => loadTurnstile() }));

beforeEach(() => {
  autoToken = true;
  issueToken = undefined;
  widgetOptions = undefined;
  loadTurnstile.mockImplementation(async () => turnstile);
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
    const honeypot = document.querySelector(`input[name="${HONEYPOT_FIELD}"]`)!;
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

  it("sends once, showing Sending…, even if clicked again while the human check runs", async () => {
    autoToken = false;
    sendContact.mockResolvedValue({ status: "success" });
    const f = setup();
    await fillValid(f);
    await f.user.click(f.submit);
    expect(f.submit).toHaveTextContent(copy.sending);
    expect(f.submit).toHaveAttribute("aria-disabled", "true");
    await f.user.click(f.submit);
    await waitFor(() => expect(issueToken).toBeDefined());
    await act(async () => issueToken!("tok-late"));
    await screen.findByRole("status");
    expect(sendContact).toHaveBeenCalledTimes(1);
  });

  it("posts to the endpoint natively if JS hasn't taken over, never via the URL", () => {
    setup();
    const form = screen.getByRole("form", { name: copy.heading });
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/api/contact");
  });

  it("names the honeypot so autofill won't fill it", () => {
    // Password managers and browsers fill fields with these names; a filled
    // honeypot silently drops a real visitor's message.
    const autofillNames = [
      "website",
      "url",
      "homepage",
      "company",
      "phone",
      "tel",
      "address",
      "name",
      "email",
    ];
    expect(autofillNames).not.toContain(HONEYPOT_FIELD.toLowerCase());
    expect(HONEYPOT_FIELD).not.toMatch(/web|url|site|mail|phone|name|company/i);
  });

  it("shows the verification alert after the wait when Turnstile can't load", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    loadTurnstile.mockRejectedValue(new Error("blocked"));
    const f = setup();
    await fillValid(f);
    await f.user.click(f.submit);
    await act(() => vi.advanceTimersByTimeAsync(TOKEN_WAIT_MS));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      copy.formErrors.verification,
    );
    expect(sendContact).not.toHaveBeenCalled();
    expect(f.submit).not.toHaveAttribute("aria-disabled");
    vi.useRealTimers();
  });

  it("keeps waiting while a person solves Cloudflare's challenge", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    autoToken = false;
    sendContact.mockResolvedValue({ status: "success" });
    const f = setup();
    await fillValid(f);
    await f.user.click(f.submit);
    await waitFor(() => expect(widgetOptions).toBeDefined());
    act(() => widgetOptions!["before-interactive-callback"]!());
    await act(() => vi.advanceTimersByTimeAsync(TOKEN_WAIT_MS + 1000));
    expect(screen.queryByRole("alert")).toBeNull();
    await act(async () => issueToken!("tok-solved"));
    expect(await screen.findByRole("status")).toHaveTextContent(
      copy.success.heading,
    );
    expect(CHALLENGE_WAIT_MS).toBeGreaterThan(TOKEN_WAIT_MS);
    vi.useRealTimers();
  });

  it("waits for a fresh token after the old one expires", async () => {
    sendContact.mockResolvedValue({ status: "success" });
    const f = setup();
    await f.user.click(f.name); // loads Turnstile; token tok-1 issued
    await waitFor(() => expect(widgetOptions).toBeDefined());
    act(() => widgetOptions!["expired-callback"]!());
    await fillValid(f);
    await f.user.click(f.submit);
    expect(sendContact).not.toHaveBeenCalled();
    await act(async () => widgetOptions!.callback!("tok-fresh"));
    await screen.findByRole("status");
    expect(sendContact.mock.calls[0]![0].get("cf-turnstile-response")).toBe(
      "tok-fresh",
    );
  });
});
