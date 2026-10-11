"use client";

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { PaletteInput } from "@/lib/palette/commands";

const CommandPalette = lazy(() => import("./command-palette"));

const noopSubscribe = () => () => {};
const isApple = () =>
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/**
 * Header button plus the global Ctrl/⌘+K shortcut. The palette itself is a
 * separate chunk, fetched the first time it opens, so it costs nothing at
 * page load.
 */
export function PaletteTrigger({ input }: { input: PaletteInput }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const returnTo = useRef<HTMLElement | null>(null);
  // Server snapshot: "Ctrl K"; Apple devices switch to ⌘K after hydration.
  const apple = useSyncExternalStore(noopSubscribe, isApple, () => false);

  const show = useCallback(() => {
    returnTo.current = document.activeElement as HTMLElement | null;
    setLoaded(true);
    setOpen(true);
  }, []);

  const onClosed = useCallback(() => {
    setOpen(false);
    returnTo.current?.focus();
    returnTo.current = null;
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.isComposing) return;
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault();
        if (open) setOpen(false);
        else show();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, show]);

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-label={input.copy.buttonAria}
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+K Meta+K"
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-2.5 text-sm text-muted transition-colors hover:text-text md:px-3"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span className="hidden md:inline">{input.copy.buttonLabel}</span>
        <kbd className="hidden rounded border border-line px-1.5 font-mono text-[11px] md:inline">
          {apple ? "⌘K" : "Ctrl K"}
        </kbd>
      </button>
      {loaded ? (
        <Suspense fallback={null}>
          <CommandPalette input={input} open={open} onClosed={onClosed} />
        </Suspense>
      ) : null}
    </>
  );
}
