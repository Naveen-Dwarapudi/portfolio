import { getImageProps, type StaticImageData } from "next/image";
import { Parallax } from "./pointer-effects";

/**
 * Hero photo. The image paints immediately (it is the LCP candidate); the
 * reveal is a curtain overlay sliding away, so animation never delays LCP.
 */
export function Portrait({
  src,
  alt,
  badge,
}: {
  src: StaticImageData;
  alt: string;
  badge?: React.ReactNode;
}) {
  const { props: imageProps } = getImageProps({
    src,
    alt,
    loading: "eager",
    fetchPriority: "high",
    sizes: "(max-width: 820px) 200px, 340px",
  });
  return (
    <Parallax>
      <div className="relative aspect-square w-[200px] md:w-[340px]">
        <div
          aria-hidden="true"
          className="absolute -inset-[3px] rounded-[30px] motion-safe:animate-[ring-spin_6s_linear_infinite]"
          style={{
            background:
              "conic-gradient(from var(--ring-angle), var(--accent), transparent 30%, transparent 60%, var(--accent))",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-[12%_-10%_-10%_12%] -z-10 rounded-[40px] bg-[var(--glow-1)] blur-[50px]"
        />
        <div className="absolute inset-0 overflow-hidden rounded-[28px] bg-[#111]">
          {/* eslint-disable-next-line @next/next/no-img-element -- props come from getImageProps (optimized, server-only, no client JS) */}
          <img {...imageProps} alt={alt} className="size-full object-cover" />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-bg motion-safe:animate-[curtain_0.9s_var(--ease-out)_0.2s_forwards] motion-reduce:hidden"
          />
        </div>
        {badge ? (
          <div className="absolute bottom-5 -left-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 font-mono text-xs whitespace-nowrap text-muted shadow-[0_12px_30px_-12px_rgb(0_0_0/0.5)] motion-safe:animate-[bob_4s_ease-in-out_2s_infinite] md:-left-5">
            {badge}
          </div>
        ) : null}
      </div>
    </Parallax>
  );
}
