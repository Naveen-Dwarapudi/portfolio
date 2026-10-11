import { describe, expect, it } from "vitest";
import { clientIp, createRateLimiter } from "./rate-limit";

function limiter() {
  let t = 0;
  const l = createRateLimiter({ limit: 3, windowMs: 1000, now: () => t });
  return { l, advance: (ms: number) => (t += ms) };
}

describe("createRateLimiter", () => {
  it("allows 3 hits then blocks with the time left", () => {
    const { l, advance } = limiter();
    expect(l.hit("a")).toEqual({ ok: true });
    expect(l.hit("a")).toEqual({ ok: true });
    advance(400);
    expect(l.hit("a")).toEqual({ ok: true });
    expect(l.hit("a")).toEqual({ ok: false, retryAfterMs: 600 });
  });

  it("counts keys independently", () => {
    const { l } = limiter();
    for (let i = 0; i < 3; i++) l.hit("a");
    expect(l.hit("b")).toEqual({ ok: true });
  });

  it("opens again after the window and prunes old buckets", () => {
    const { l, advance } = limiter();
    for (let i = 0; i < 4; i++) l.hit("a");
    l.hit("b");
    advance(1000);
    expect(l.hit("a")).toEqual({ ok: true });
    expect(l.size()).toBe(1);
  });
});

describe("refund", () => {
  it("gives one slot back, never below zero", () => {
    const { l } = limiter();
    for (let i = 0; i < 3; i++) l.hit("a");
    l.refund("a");
    expect(l.hit("a")).toEqual({ ok: true });
    expect(l.hit("a").ok).toBe(false);
    l.refund("nobody"); // unknown keys are ignored
  });
});

describe("clientIp", () => {
  it("prefers the first x-forwarded-for entry", () => {
    const h = new Headers({
      "x-forwarded-for": "203.0.113.7, 10.0.0.1",
      "x-real-ip": "198.51.100.2",
    });
    expect(clientIp(h)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then unknown", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe(
      "198.51.100.2",
    );
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
