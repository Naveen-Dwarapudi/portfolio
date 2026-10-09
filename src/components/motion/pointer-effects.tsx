"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { canHoverPrecisely, prefersReducedMotion } from "@/lib/motion";

function motionAllowed() {
  return canHoverPrecisely() && !prefersReducedMotion();
}

/** Pulls its child toward the pointer and springs back on leave. */
export function Magnetic({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  return (
    <span
      ref={ref}
      className="inline-flex transition-transform duration-300 ease-spring"
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el || !motionAllowed()) return;
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) * 0.18;
        const dy = (e.clientY - r.top - r.height / 2) * 0.3;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      {children}
    </span>
  );
}

/** Card whose glow follows the pointer, with a slight 3D tilt. */
export function InteractiveCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-[14px] border border-line bg-surface p-6 transition-[transform,border-color] duration-500 ease-spring hover:border-accent/45 ${className}`}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        el.style.setProperty("--mx", `${x}px`);
        el.style.setProperty("--my", `${y}px`);
        if (!motionAllowed() || r.width === 0 || r.height === 0) return;
        const rx = (0.5 - y / r.height) * 6;
        const ry = (x / r.width - 0.5) * 6;
        el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(380px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--accent) 22%, transparent), transparent 60%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Drifts its child slightly as the pointer moves anywhere in the window. */
export function Parallax({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!motionAllowed()) return;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const dx = e.clientX / window.innerWidth - 0.5;
      const dy = e.clientY / window.innerHeight - 0.5;
      el.style.transform = `translate(${dx * 14}px, ${dy * 14}px) rotate(${dx * 2}deg)`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return (
    <div ref={ref} className="transition-transform duration-500 ease-out-expo">
      {children}
    </div>
  );
}
