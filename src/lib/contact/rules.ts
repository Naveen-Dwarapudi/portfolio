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
