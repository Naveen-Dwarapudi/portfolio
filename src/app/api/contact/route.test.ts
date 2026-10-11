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
