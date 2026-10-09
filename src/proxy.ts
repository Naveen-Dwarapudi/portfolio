import { NextResponse, type NextRequest } from "next/server";
import { caseStudies } from "@/content/en";

const SLUGS = new Set(caseStudies.map((c) => c.slug));

/**
 * Real 404s for unknown case studies. With Cache Components, unknown slugs
 * would otherwise get the prerendered shell (200) with notFound() streamed in
 * afterwards. Rewriting to a path no route matches renders the not-found page
 * with a 404 status. Scoped to /work/* only.
 */
export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/")[2] ?? "";
  if (SLUGS.has(slug)) return NextResponse.next();
  return NextResponse.rewrite(new URL("/__not-found", request.url));
}

export const config = {
  matcher: "/work/:slug",
};
