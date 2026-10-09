import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { mockMatchMedia } from "@/test/setup";
import { ThemeToggle, wipeOrigin } from "./theme-toggle";

describe("ThemeToggle", () => {
  it("offers light when the effective theme is dark (no OS preference)", () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Switch to light theme" }),
    ).toBeInTheDocument();
  });

  it("offers dark when the OS prefers light", () => {
    mockMatchMedia(["(prefers-color-scheme: light)"]);
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    ).toBeInTheDocument();
  });

  it("flips the theme, stores the choice, and updates its label", async () => {
    render(<ThemeToggle />);
    await userEvent.click(
      screen.getByRole("button", { name: "Switch to light theme" }),
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
    expect(
      screen.getByRole("button", { name: "Switch to dark theme" }),
    ).toBeInTheDocument();
  });

  it("still switches when storage throws", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<ThemeToggle />);
    await userEvent.click(
      screen.getByRole("button", { name: "Switch to light theme" }),
    );
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});

describe("wipeOrigin", () => {
  const rect = DOMRect.fromRect({ x: 100, y: 20, width: 40, height: 40 });

  it("starts from the pointer for mouse clicks", () => {
    expect(wipeOrigin({ clientX: 110, clientY: 30, detail: 1 }, rect)).toEqual({
      x: 110,
      y: 30,
    });
  });

  it("starts from the button centre for keyboard activation", () => {
    expect(wipeOrigin({ clientX: 0, clientY: 0, detail: 0 }, rect)).toEqual({
      x: 120,
      y: 40,
    });
  });
});
