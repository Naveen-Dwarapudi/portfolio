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
