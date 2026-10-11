import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getContent } from "@/content";
import { homeContent } from "@/content/en";
import { LOCALES } from "@/content/locales";
import type { PaletteInput } from "@/lib/palette/commands";
import { paletteData } from "@/lib/palette/data";
import { nameWithSuffix } from "@/test/accessible-name";
import CommandPalette, { COPY_CLOSE_DELAY } from "./command-palette";

const copy = homeContent.palette;
const input: PaletteInput = {
  ...paletteData(getContent("en")),
  locale: "en",
  path: "/",
  locales: LOCALES,
};

function setup() {
  const onClosed = vi.fn();
  const user = userEvent.setup();
  render(<CommandPalette input={input} open onClosed={onClosed} />);
  const combobox = screen.getByRole("combobox", { name: copy.placeholder });
  return { user, onClosed, combobox };
}

const activeOption = (combobox: HTMLElement) =>
  document.getElementById(combobox.getAttribute("aria-activedescendant")!);

describe("CommandPalette", () => {
  it("opens as a labelled dialog with the combobox focused", () => {
    const { combobox } = setup();
    expect(
      screen.getByRole("dialog", { name: copy.dialogLabel }),
    ).toHaveAttribute("open");
    expect(combobox).toHaveFocus();
    expect(combobox).toHaveAttribute("aria-expanded", "true");
    expect(combobox).toHaveAttribute(
      "aria-controls",
      screen.getByRole("listbox").id,
    );
  });

  it("groups options under labelled groups, first option active", () => {
    const { combobox } = setup();
    for (const name of Object.values(copy.groups)) {
      expect(screen.getByRole("group", { name })).toBeInTheDocument();
    }
    const first = screen.getAllByRole("option")[0]!;
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(activeOption(combobox)).toBe(first);
  });

  it("moves with arrow keys and wraps around", async () => {
    const { user, combobox } = setup();
    const options = screen.getAllByRole("option");
    await user.keyboard("{ArrowDown}");
    expect(activeOption(combobox)).toBe(options[1]);
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(activeOption(combobox)).toBe(options.at(-1));
    await user.keyboard("{ArrowDown}");
    expect(activeOption(combobox)).toBe(options[0]);
    await user.keyboard("{End}");
    expect(activeOption(combobox)).toBe(options.at(-1));
    await user.keyboard("{Home}");
    expect(activeOption(combobox)).toBe(options[0]);
  });

  it("filters as you type and announces the count", async () => {
    const { user } = setup();
    await user.keyboard("wrhs");
    expect(screen.getAllByRole("option")[0]).toHaveTextContent("Warehouse");
    expect(screen.getByRole("status").textContent).toMatch(/results?$/);
  });

  it("shows and announces no results", async () => {
    const { user } = setup();
    await user.keyboard("qqqqzz");
    expect(screen.queryAllByRole("option")).toHaveLength(0);
    const message = copy.noResults.replace("{query}", "qqqqzz");
    expect(screen.getByRole("status")).toHaveTextContent(message);
    // A listbox may only contain options or groups (axe aria-required-children).
    expect(screen.getByRole("listbox")).toBeEmptyDOMElement();
    expect(screen.getByRole("dialog")).toHaveTextContent(message);
  });

  it("resets the query when it closes, ready for the next open", async () => {
    const { user, combobox } = setup();
    await user.keyboard("theme");
    act(() => (screen.getByRole("dialog") as HTMLDialogElement).close());
    expect(combobox).toHaveValue("");
    // The closed dialog is hidden, so include hidden elements.
    expect(screen.getByRole("status", { hidden: true })).toBeEmptyDOMElement();
  });

  it("names options with their state for screen readers", async () => {
    const { user } = setup();
    await user.keyboard("English");
    expect(
      screen.getByRole("option", { name: /^English/ }),
    ).toHaveAccessibleName(new RegExp(`^English,\\s*${copy.current}$`));
    await user.clear(screen.getByRole("combobox"));
    await user.keyboard("हिन्दी");
    expect(screen.getByRole("option", { name: /हिन्दी/ })).toHaveAccessibleName(
      new RegExp(`^हिन्दी,\\s*${homeContent.site.comingSoon}$`),
    );
  });

  it("navigates to a section on Enter and closes", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    const { user, onClosed } = setup();
    await user.keyboard("about{Enter}");
    expect(assign).toHaveBeenCalledWith("/#about");
    expect(onClosed).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("opens external links in a new tab and labels them", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const { user } = setup();
    await user.keyboard("github");
    expect(activeOption(screen.getByRole("combobox"))).toHaveAccessibleName(
      nameWithSuffix(copy.openGithub, homeContent.newTab),
    );
    await user.keyboard("{Enter}");
    expect(open).toHaveBeenCalledWith(
      homeContent.contact.github.url,
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("copies the email, announces it, then closes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    const { user, onClosed } = setup();
    await user.keyboard("copy email{Enter}");
    expect(writeText).toHaveBeenCalledWith(homeContent.contact.email);
    expect(screen.getByRole("status")).toHaveTextContent(copy.emailCopied);
    expect(onClosed).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(COPY_CLOSE_DELAY));
    expect(onClosed).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("stays open and explains when the clipboard is refused", async () => {
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(new Error());
    const { user, onClosed } = setup();
    await user.keyboard("copy email{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent(copy.copyFailed);
    expect(onClosed).not.toHaveBeenCalled();
  });

  it("switches the theme from the palette", async () => {
    const { user } = setup();
    await user.keyboard("theme{Enter}");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });

  it("can highlight but not run a coming-soon language", async () => {
    const { user, onClosed } = setup();
    await user.keyboard("हिन्दी");
    const hindi = screen.getByRole("option", { name: /हिन्दी/ });
    expect(hindi).toHaveAttribute("aria-disabled", "true");
    expect(within(hindi).getByText(homeContent.site.comingSoon)).toBeVisible();
    await user.keyboard("{Enter}");
    expect(onClosed).not.toHaveBeenCalled();
  });

  it("ignores the Enter that ends an IME composition (Safari keyCode 229)", () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    const { combobox } = setup();
    fireEvent.change(combobox, { target: { value: "about" } });
    fireEvent.keyDown(combobox, { key: "Enter", keyCode: 229 });
    expect(assign).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("a palette reopened soon after Copy email isn't closed by the old timer", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    const onClosed = vi.fn();
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const { rerender } = render(
      <CommandPalette input={input} open onClosed={onClosed} />,
    );
    await user.keyboard("copy email{Enter}");
    await screen.findByText(copy.emailCopied);
    const dialog = screen.getByRole("dialog") as HTMLDialogElement;
    act(() => dialog.close()); // Esc before the delayed close
    rerender(<CommandPalette input={input} open={false} onClosed={onClosed} />);
    rerender(<CommandPalette input={input} open onClosed={onClosed} />);
    expect(dialog).toHaveAttribute("open");
    await act(() => vi.advanceTimersByTimeAsync(COPY_CLOSE_DELAY));
    expect(dialog).toHaveAttribute("open");
    vi.useRealTimers();
  });
});
