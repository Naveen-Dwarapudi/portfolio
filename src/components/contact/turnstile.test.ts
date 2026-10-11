import { afterEach, describe, expect, it } from "vitest";
import {
  loadTurnstile,
  resetTurnstileLoader,
  TURNSTILE_SRC,
} from "./turnstile";

const scripts = () =>
  [...document.head.querySelectorAll("script")].filter(
    (s) => s.src === TURNSTILE_SRC,
  );

afterEach(() => {
  resetTurnstileLoader();
  scripts().forEach((s) => s.remove());
  delete window.turnstile;
});

describe("loadTurnstile", () => {
  it("retries cleanly after a stub script without window.turnstile", async () => {
    const first = loadTurnstile();
    const [script] = scripts();
    script!.onload!(new Event("load")); // e.g. an ad blocker's empty stub
    await expect(first).rejects.toThrow("turnstile missing");
    expect(scripts()).toHaveLength(0);

    const second = loadTurnstile();
    expect(second).not.toBe(first);
    expect(scripts()).toHaveLength(1);
  });

  it("removes the tag after a network error", async () => {
    const p = loadTurnstile();
    scripts()[0]!.onerror!(new Event("error"));
    await expect(p).rejects.toThrow("failed to load");
    expect(scripts()).toHaveLength(0);
  });
});
