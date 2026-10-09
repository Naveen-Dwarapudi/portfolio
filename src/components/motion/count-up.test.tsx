import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { mockMatchMedia } from "@/test/setup";
import { CountUp, introDelay } from "./count-up";

describe("CountUp", () => {
  it("server-renders the final value", () => {
    expect(renderToString(<CountUp value={30} />)).toContain(">30<");
  });

  it("shows the final value immediately under reduced motion", () => {
    mockMatchMedia(["(prefers-reduced-motion: reduce)"]);
    render(<CountUp value={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });
});

describe("introDelay", () => {
  it("waits out the rest of the intro when counting starts during page load", () => {
    expect(introDelay(700, 200)).toBe(500);
  });

  it("starts at once when the metrics are first seen after the intro", () => {
    expect(introDelay(700, 5000)).toBe(0);
  });
});
