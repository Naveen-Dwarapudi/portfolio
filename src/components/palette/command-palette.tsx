"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { copyText } from "@/lib/clipboard";
import {
  buildCommands,
  GROUP_ORDER,
  type Command,
  type PaletteInput,
} from "@/lib/palette/commands";
import { rankCommands } from "@/lib/palette/rank";
import { currentTheme, switchTheme } from "@/lib/theme-switch";

/** How long "Email copied" stays visible before the palette closes. */
export const COPY_CLOSE_DELAY = 600;

function fill(template: string, values: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(values[k]));
}

function navigate(run: Extract<Command["run"], { kind: "link" }>) {
  if (run.external) {
    window.open(run.href, "_blank", "noopener,noreferrer");
  } else if (run.download) {
    const a = document.createElement("a");
    a.href = run.href;
    a.download = "";
    a.click();
  } else {
    window.location.assign(run.href);
  }
}

/**
 * Lazy-loaded palette (PaletteTrigger imports it on first open). A native
 * modal <dialog> provides the focus trap, Esc and the backdrop; the input and
 * list follow the ARIA 1.2 combobox pattern.
 */
export default function CommandPalette({
  input,
  open,
  onClosed,
}: {
  input: PaletteInput;
  open: boolean;
  /** Called after the dialog has closed, by any route (Esc, click, command). */
  onClosed: () => void;
}) {
  const { copy } = input;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState("");
  const [theme, setTheme] = useState(() => currentTheme());

  const commands = useMemo(() => buildCommands(input, theme), [input, theme]);
  const ranked = useMemo(
    () => rankCommands(query, commands),
    [query, commands],
  );
  const results = ranked.commands;
  const activeCommand = results[active];
  const optionId = (c: Command) => `${listId}-${c.id}`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setTheme(currentTheme());
      dialog.showModal();
      inputRef.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!activeCommand) return;
    document
      .getElementById(optionId(activeCommand))
      ?.scrollIntoView?.({ block: "nearest" });
    // optionId is stable for a given listId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCommand]);

  function close() {
    dialogRef.current?.close();
  }

  // Reset on close rather than on open: showModal() and focus run before a
  // state update would land, so keys typed right after reopening would join
  // the old query.
  function onDialogClose() {
    setQuery("");
    setActive(0);
    setStatus("");
    onClosed();
  }

  function onQuery(value: string) {
    const next = rankCommands(value, commands);
    const count = next.commands.length;
    setQuery(value);
    setActive(next.best);
    setStatus(
      !value.trim()
        ? ""
        : count === 0
          ? fill(copy.noResults, { query: value.trim() })
          : count === 1
            ? copy.results.one
            : fill(copy.results.other, { count }),
    );
  }

  async function runCommand(command: Command | undefined) {
    if (!command || command.disabled) return;
    const { run } = command;
    switch (run.kind) {
      case "none":
        close();
        return;
      case "link":
        close();
        navigate(run);
        return;
      case "theme":
        close();
        switchTheme({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
        return;
      case "copy":
        if (await copyText(run.text)) {
          setStatus(copy.emailCopied);
          window.setTimeout(close, COPY_CLOSE_DELAY);
        } else {
          setStatus(copy.copyFailed);
        }
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    const last = results.length - 1;
    const moves: Record<string, () => number> = {
      ArrowDown: () => (active >= last ? 0 : active + 1),
      ArrowUp: () => (active <= 0 ? last : active - 1),
      Home: () => 0,
      End: () => last,
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      if (results.length) setActive(move());
    } else if (event.key === "Enter") {
      event.preventDefault();
      void runCommand(activeCommand);
    }
  }

  function onDialogClick(event: React.MouseEvent<HTMLDialogElement>) {
    // Clicks on the ::backdrop land on the dialog element itself.
    if (event.target !== event.currentTarget) return;
    const r = event.currentTarget.getBoundingClientRect();
    const inside =
      event.clientX >= r.left &&
      event.clientX <= r.right &&
      event.clientY >= r.top &&
      event.clientY <= r.bottom;
    if (!inside) close();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-label={copy.dialogLabel}
      onClose={onDialogClose}
      onClick={onDialogClick}
      className="palette fixed inset-x-0 top-[12vh] m-0 mx-auto w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border border-line bg-surface p-0 text-text shadow-[0_24px_60px_-24px_rgb(0_0_0/0.65)] backdrop:bg-bg/60 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-center gap-3 border-b border-line px-4">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="size-4 shrink-0 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeCommand ? optionId(activeCommand) : undefined
          }
          aria-label={copy.placeholder}
          placeholder={copy.placeholder}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          spellCheck={false}
          className="h-14 w-full bg-transparent text-[15px] text-text placeholder:text-muted focus:outline-none"
        />
      </div>

      <div
        id={listId}
        role="listbox"
        aria-label={copy.dialogLabel}
        className="max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain p-2"
      >
        {GROUP_ORDER.map((group) => {
          const items = results.filter((c) => c.group === group);
          if (!items.length) return null;
          const headingId = `${listId}-${group}`;
          return (
            <div
              key={group}
              role="group"
              aria-labelledby={headingId}
              className="py-1"
            >
              <div
                id={headingId}
                className="px-3 pt-2 pb-1 font-mono text-label tracking-[0.1em] text-muted uppercase"
              >
                {copy.groups[group]}
              </div>
              {items.map((c) => {
                const index = results.indexOf(c);
                const selected = index === active;
                const external = c.run.kind === "link" && c.run.external;
                return (
                  <div
                    key={c.id}
                    id={optionId(c)}
                    role="option"
                    aria-selected={selected}
                    aria-disabled={c.disabled || undefined}
                    onMouseMove={() => !selected && setActive(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => void runCommand(c)}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm ${
                      selected ? "bg-surface-2" : ""
                    } ${c.disabled ? "cursor-default text-muted" : "text-text"}`}
                  >
                    <span lang={c.lang}>
                      {c.label}
                      {external ? (
                        <span className="sr-only"> {input.newTab}</span>
                      ) : null}
                    </span>
                    {c.hint ? (
                      <span className="font-mono text-[11px] tracking-[0.06em] text-muted uppercase">
                        <span className="sr-only">, </span>
                        {c.hint}
                      </span>
                    ) : c.current ? (
                      <span className="text-accent">
                        <span aria-hidden="true">✓</span>
                        <span className="sr-only">, {copy.current}</span>
                      </span>
                    ) : external ? (
                      <span aria-hidden="true" className="text-muted">
                        ↗
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      {/* Outside the listbox, which may only contain options and groups. */}
      {results.length === 0 ? (
        <p className="px-3 pt-4 pb-8 text-center text-sm text-muted">
          {fill(copy.noResults, { query: query.trim() })}
        </p>
      ) : null}

      <div
        aria-hidden="true"
        className="flex gap-4 border-t border-line px-4 py-2.5 font-mono text-[11px] text-muted [@media(hover:none)]:hidden"
      >
        <span>
          <kbd>↑↓</kbd> {copy.hints.move}
        </span>
        <span>
          <kbd>↵</kbd> {copy.hints.select}
        </span>
        <span>
          <kbd>esc</kbd> {copy.hints.close}
        </span>
      </div>

      <p role="status" className="sr-only">
        {status}
      </p>
    </dialog>
  );
}
