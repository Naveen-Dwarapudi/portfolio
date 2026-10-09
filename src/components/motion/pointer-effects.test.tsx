import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockMatchMedia } from "@/test/setup";
import { InteractiveCard, Magnetic } from "./pointer-effects";

const FINE = "(hover: hover) and (pointer: fine)";
const REDUCE = "(prefers-reduced-motion: reduce)";

function wrapperOf(text: string) {
  const el = screen.getByText(text).closest("[class*='transition']");
  if (!(el instanceof HTMLElement)) throw new Error("wrapper not found");
  return el;
}

describe("Magnetic", () => {
  it("moves toward the pointer on precise-pointer devices", () => {
    mockMatchMedia([FINE]);
    render(
      <Magnetic>
        <span>Pull</span>
      </Magnetic>,
    );
    const el = wrapperOf("Pull");
    fireEvent.pointerMove(el, { clientX: 50, clientY: 10 });
    expect(el.style.transform).toMatch(/^translate\(/);
    fireEvent.pointerLeave(el);
    expect(el.style.transform).toBe("");
  });

  it("stays still on touch devices", () => {
    mockMatchMedia([]);
    render(
      <Magnetic>
        <span>Pull</span>
      </Magnetic>,
    );
    const el = wrapperOf("Pull");
    fireEvent.pointerMove(el, { clientX: 50, clientY: 10 });
    expect(el.style.transform).toBe("");
  });

  it("stays still under reduced motion", () => {
    mockMatchMedia([FINE, REDUCE]);
    render(
      <Magnetic>
        <span>Pull</span>
      </Magnetic>,
    );
    const el = wrapperOf("Pull");
    fireEvent.pointerMove(el, { clientX: 50, clientY: 10 });
    expect(el.style.transform).toBe("");
  });
});

describe("InteractiveCard", () => {
  it("tracks the pointer for the glow and tilts on precise pointers", () => {
    mockMatchMedia([FINE]);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      DOMRect.fromRect({ x: 0, y: 0, width: 200, height: 100 }),
    );
    render(
      <InteractiveCard>
        <p>Card body</p>
      </InteractiveCard>,
    );
    const card = screen.getByText("Card body").closest(".group");
    if (!(card instanceof HTMLElement)) throw new Error("card not found");
    fireEvent.pointerMove(card, { clientX: 20, clientY: 30 });
    expect(card.style.getPropertyValue("--mx")).toBe("20px");
    expect(card.style.transform).toContain("perspective(800px)");
  });

  it("keeps the glow but never tilts on touch devices", () => {
    mockMatchMedia([]);
    render(
      <InteractiveCard>
        <p>Card body</p>
      </InteractiveCard>,
    );
    const card = screen.getByText("Card body").closest(".group");
    if (!(card instanceof HTMLElement)) throw new Error("card not found");
    fireEvent.pointerMove(card, { clientX: 20, clientY: 30 });
    expect(card.style.getPropertyValue("--mx")).toBe("20px");
    expect(card.style.transform).toBe("");
  });
});
