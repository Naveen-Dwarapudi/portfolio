import type { MetadataRoute } from "next";
import { caseStudies } from "@/content/en/case-studies";
import { absoluteUrl } from "@/lib/seo";

/** Home plus every case study (English; other locales join when published). */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "monthly", priority: 1 },
    ...caseStudies.map((c) => ({
      url: absoluteUrl(`/work/${c.slug}`),
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
