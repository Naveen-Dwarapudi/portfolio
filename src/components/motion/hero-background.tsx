/** Slowly drifting gradient mesh. Pure CSS, decorative. */
export function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        className="absolute -inset-[30%] blur-[60px] motion-safe:animate-[mesh-drift_28s_linear_infinite]"
        style={{
          background:
            "radial-gradient(40% 35% at 25% 35%, var(--glow-1), transparent 70%), radial-gradient(35% 40% at 75% 30%, var(--glow-2), transparent 70%), radial-gradient(45% 40% at 55% 80%, var(--glow-3), transparent 70%)",
        }}
      />
    </div>
  );
}
