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
