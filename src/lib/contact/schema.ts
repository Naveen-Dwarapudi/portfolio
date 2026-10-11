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
