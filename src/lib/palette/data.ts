import type { SiteContent } from "@/content";
import { RESUME_PATH } from "@/lib/resume";
import type { PaletteData } from "./commands";

/** Builds the palette's serialisable data from a locale's content. */
export function paletteData({
  homeContent: c,
  caseStudies,
}: SiteContent): PaletteData {
  return {
    copy: c.palette,
    nav: c.nav,
    caseStudies: caseStudies.map((s) => ({
      slug: s.slug,
      title: s.title,
      keywords: [...s.kicker.split("·").map((k) => k.trim()), ...s.stack],
    })),
    email: c.contact.email,
    github: c.contact.github,
    linkedin: c.contact.linkedin,
    resumePath: RESUME_PATH,
    newTab: c.newTab,
    comingSoon: c.site.comingSoon,
  };
}
