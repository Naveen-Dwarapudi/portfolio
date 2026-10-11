import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DismissibleDetails } from "./dismissible-details";

function setup() {
  render(
    <>
      <button type="button">Outside</button>
      <DismissibleDetails>
        <summary>Menu</summary>
        <a href="#x">Inside link</a>
      </DismissibleDetails>
    </>,
  );
  const summary = screen.getByText("Menu");
  const details = summary.closest("details")!;
  return { summary, details };
}

describe("DismissibleDetails", () => {
  it("closes on a pointer press outside", async () => {
    const user = userEvent.setup();
    const { summary, details } = setup();
    await user.click(summary);
    expect(details.open).toBe(true);
    fireEvent.pointerDown(screen.getByRole("button", { name: "Outside" }));
    expect(details.open).toBe(false);
  });

  it("stays open on a press inside", async () => {
    const user = userEvent.setup();
    const { summary, details } = setup();
    await user.click(summary);
    fireEvent.pointerDown(screen.getByRole("link", { name: "Inside link" }));
    expect(details.open).toBe(true);
  });

  it("ignores Esc when focus is elsewhere, so it never steals focus", async () => {
    const user = userEvent.setup();
    const { summary } = setup();
    await user.click(summary);
    const outside = screen.getByRole("button", { name: "Outside" });
    outside.focus();
    await user.keyboard("{Escape}");
    expect(outside).toHaveFocus();
  });

  it("closes on Esc and returns focus to the summary", async () => {
    const user = userEvent.setup();
    const { summary, details } = setup();
    await user.click(summary);
    screen.getByRole("link", { name: "Inside link" }).focus();
    await user.keyboard("{Escape}");
    expect(details.open).toBe(false);
    expect(summary).toHaveFocus();
  });
});
