import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CopyEmailButton } from "./copy-email-button";

const labels = {
  idle: "Copy email",
  done: "Copied",
  announced: "Email address copied",
  failed: "Copy failed — the address is me@example.com",
};

describe("CopyEmailButton", () => {
  it("copies the address and announces success", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    render(<CopyEmailButton email="me@example.com" labels={labels} />);
    await user.click(screen.getByRole("button", { name: "Copy email" }));
    expect(writeText).toHaveBeenCalledWith("me@example.com");
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Email address copied",
    );
  });

  it("announces the address when the clipboard is refused", async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValue(
      new Error("denied"),
    );
    render(<CopyEmailButton email="me@example.com" labels={labels} />);
    await user.click(screen.getByRole("button", { name: "Copy email" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Copy failed — the address is me@example.com",
    );
  });
});
