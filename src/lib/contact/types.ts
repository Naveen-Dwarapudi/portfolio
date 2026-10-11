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

/**
 * Field name of the honeypot input; humans never see or fill it. Deliberately
 * meaningless: autofill fills names like "website", which would silently drop
 * a real visitor's message.
 */
export const HONEYPOT_FIELD = "hp_extra";

/** Field name Turnstile writes its token into. */
export const TURNSTILE_FIELD = "cf-turnstile-response";
