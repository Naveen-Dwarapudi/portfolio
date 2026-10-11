import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getContent } from "@/content";
import { homeContent } from "@/content/en";
import { LOCALES } from "@/content/locales";
import type { PaletteInput } from "@/lib/palette/commands";
import { paletteData } from "@/lib/palette/data";
import { PaletteTrigger } from "./palette-trigger";

const copy = homeContent.palette;
const input: PaletteInput = {
  ...paletteData(getContent("en")),
  locale: "en",
  path: "/",
  locales: LOCALES,
};

// A closed <dialog> is excluded from role queries, so select it directly.
const dialog = () => document.querySelector("dialog");

afterEach(() => vi.unstubAllGlobals());

describe("PaletteTrigger", () => {
  it("is a button whose name starts with its visible text", () => {
    render(<PaletteTrigger input={input} />);
    const button = screen.getByRole("button", { name: copy.buttonAria });
    expect(copy.buttonAria.startsWith(copy.buttonLabel)).toBe(true);
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    expect(button).toHaveAttribute("aria-keyshortcuts", "Control+K Meta+K");
  });

  it("doesn't load the palette until first opened", () => {
    render(<PaletteTrigger input={input} />);
    expect(dialog()).not.toBeInTheDocument();
  });

  it("opens on click and returns focus to the button on close", async () => {
    const user = userEvent.setup();
    render(<PaletteTrigger input={input} />);
    const button = screen.getByRole("button", { name: copy.buttonAria });
    await user.click(button);
    await waitFor(() => expect(dialog()).toHaveAttribute("open"));
    (dialog() as HTMLDialogElement).close();
    await waitFor(() => expect(button).toHaveFocus());
  });

  it.each([
    ["Control", "elsewhere", "Win32"],
    ["Meta", "on Apple devices", "MacIntel"],
  ])(
    "%s+K opens it %s and a second press closes it",
    async (modifier, _, platform) => {
      vi.stubGlobal("navigator", { ...navigator, platform });
      const user = userEvent.setup();
      render(<PaletteTrigger input={input} />);
      await user.keyboard(`{${modifier}>}k{/${modifier}}`);
      await waitFor(() => expect(dialog()).toHaveAttribute("open"));
      await user.keyboard(`{${modifier}>}k{/${modifier}}`);
      await waitFor(() => expect(dialog()).not.toHaveAttribute("open"));
    },
  );

  it("leaves Ctrl+K alone on Apple devices (text editing)", async () => {
    vi.stubGlobal("navigator", { ...navigator, platform: "MacIntel" });
    const user = userEvent.setup();
    render(<PaletteTrigger input={input} />);
    await user.keyboard("{Control>}k{/Control}");
    expect(dialog()).toBeNull();
  });

  it("shows Ctrl K by default and ⌘K on Apple devices", () => {
    const { unmount } = render(<PaletteTrigger input={input} />);
    expect(screen.getByText("Ctrl K")).toBeInTheDocument();
    unmount();
    vi.stubGlobal("navigator", { ...navigator, platform: "MacIntel" });
    render(<PaletteTrigger input={input} />);
    expect(screen.getByText("⌘K")).toBeInTheDocument();
  });
});
