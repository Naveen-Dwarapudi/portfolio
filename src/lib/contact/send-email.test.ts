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
