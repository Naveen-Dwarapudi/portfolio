import { NextResponse, type NextRequest } from "next/server";
import { caseStudies } from "@/content/en/case-studies";
import { DEFAULT_LOCALE } from "@/content/locales";
import { publishedLocales, splitLocale } from "@/lib/i18n";

/** Case-study slugs are the same in every locale. */
const SLUGS = new Set(caseStudies.map((c) => c.slug));
const PUBLISHED = new Set<string>(publishedLocales().map((l) => l.code));
/** Matches no route, so Next renders the 404 page with a 404 status. */
const NOT_FOUND = `/${DEFAULT_LOCALE}/__not-found`;

/** Only /work/<known-slug> is servable under /work. */
function isServable(rest: string): boolean {
  const [first, slug, ...more] = rest.split("/").filter(Boolean);
  if (first !== "work") return true;
  return slug !== undefined && more.length === 0 && SLUGS.has(slug);
}

/**
 * Locale routing (Next's i18n guide pattern, no library):
 * - "/x"        → rewrite to "/en/x" (English URLs stay unprefixed)
 * - "/en/x"     → 308 to "/x" (one canonical URL)
 * - "/hi/x"     → 404 while Hindi is unpublished
 * - unknown /work/<slug> → 404 in any locale. With Cache Components the
 *   prerendered shell would otherwise answer 200 and stream notFound() later.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { locale, rest } = splitLocale(pathname);

  if (locale === DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = rest;
    return NextResponse.redirect(url, 308);
  }
  if ((locale && !PUBLISHED.has(locale)) || !isServable(rest)) {
    return NextResponse.rewrite(new URL(NOT_FOUND, request.url));
  }
  if (locale) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Everything except Next internals and the real static files. Must be a
  // literal (Next reads it at build time), so proxy.test.ts pins it to
  // RESUME_PATH. A blanket "has a dot" exclusion let /favicon.ico or
  // /work/x.pdf skip locale routing: bare 404s without lang, or soft 200s.
  // Add any new public/ or metadata file (robots.txt, sitemap.xml) here.
  matcher: ["/((?!_next/|icon\\.svg$|naveen-dwarapudi-resume\\.pdf$).*)"],
};
