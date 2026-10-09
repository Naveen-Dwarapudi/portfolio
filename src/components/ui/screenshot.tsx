import { getImageProps, type StaticImageData } from "next/image";

/**
 * Below-the-fold image: optimised AVIF/WebP via getImageProps (server-only, no
 * client JS), lazy-loaded, with intrinsic width/height so it causes no CLS.
 */
export function Screenshot({
  src,
  alt,
  sizes,
  className = "",
}: {
  src: StaticImageData;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const { props } = getImageProps({ src, alt, sizes, loading: "lazy" });
  return (
    // eslint-disable-next-line @next/next/no-img-element -- props come from getImageProps (optimized, server-only, no client JS)
    <img {...props} alt={alt} className={`h-auto w-full ${className}`} />
  );
}
