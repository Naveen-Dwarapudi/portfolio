import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom has no matchMedia or IntersectionObserver. Default: no media query
// matches; tests override with mockMatchMedia().
function createMatchMedia(matching: string[]) {
  return (query: string): MediaQueryList => ({
    matches: matching.includes(query),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

export function mockMatchMedia(matching: string[] = []) {
  window.matchMedia = createMatchMedia(matching);
}

mockMatchMedia();

class NoopIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("IntersectionObserver", NoopIntersectionObserver);

afterEach(() => {
  cleanup();
  mockMatchMedia();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  vi.restoreAllMocks();
});
