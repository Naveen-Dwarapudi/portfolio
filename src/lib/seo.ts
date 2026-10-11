import type { Metadata } from "next";
import { siteUrl } from "@/lib/site-url";

/** Absolute URL on the canonical origin (NEXT_PUBLIC_SITE_URL). */
export function absoluteUrl(path: string, base: URL = siteUrl): string {
  return new URL(path, base).toString();
}

/**
 * Canonical, Open Graph and Twitter metadata for one page. The share image
 * comes from the route's opengraph-image file, which Next adds on its own.
 */
export function pageMetadata({
  title,
  description,
  path,
  type,
  siteName,
}: {
  title: string;
  description: string;
  /** Locale-free path, e.g. "/" or "/work/x". */
  path: string;
  type: "website" | "article";
  siteName: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type,
      url: path,
      title,
      description,
      siteName,
      locale: "en",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}
