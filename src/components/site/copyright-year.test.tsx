import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CopyrightYear } from "./copyright-year";

describe("CopyrightYear", () => {
  it("renders the current year", async () => {
    const { container } = render(await CopyrightYear());
    expect(container.textContent).toBe(String(new Date().getFullYear()));
  });
});
