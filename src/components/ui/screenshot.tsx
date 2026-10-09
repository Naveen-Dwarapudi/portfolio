import { getImageProps, type StaticImageData } from "next/image";

/**
 * Optimised AVIF/WebP via getImageProps (server-only, no client JS), with
 * intrinsic width/height so it causes no CLS. Lazy by default; pass `eager`
 * when the image may be the largest element above the fold (LCP).
 */
export function Screenshot({
  src,
  alt,
  sizes,
  eager = false,
  className = "",
}: {
  src: StaticImageData;
  alt: string;
  sizes: string;
  eager?: boolean;
  className?: string;
}) {
  const { props } = getImageProps({
    src,
    alt,
    sizes,
    ...(eager
      ? { loading: "eager" as const, fetchPriority: "high" as const }
      : { loading: "lazy" as const }),
  });
  return (
    // eslint-disable-next-line @next/next/no-img-element -- props come from getImageProps (optimized, server-only, no client JS)
    <img {...props} alt={alt} className={`h-auto w-full ${className}`} />
  );
}
