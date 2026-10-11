import { describe, expect, it } from "vitest";
import { caseStudies, homeContent } from "@/content/en";
import { confidentialTermsIn } from "@/test/confidential-terms";
import {
  caseStudyStructuredData,
  homeStructuredData,
  serializeJsonLd,
} from "./structured-data";

const base = new URL("https://site.example");

describe("homeStructuredData", () => {
  const data = homeStructuredData(homeContent, base) as {
    "@graph": Record<string, unknown>[];
  };
  const [person, website] = data["@graph"];

  it("describes the owner as a Person with full name and profiles", () => {
    expect(person).toMatchObject({
      "@type": "Person",
      "@id": "https://site.example/#person",
      name: "Bhavani Sankar Naveen Dwarapudi",
      alternateName: "Naveen Dwarapudi",
      jobTitle: homeContent.seo.jobTitle,
      worksFor: { "@type": "Organization", name: "Aziro Technologies" },
      url: "https://site.example/",
      email: `mailto:${homeContent.contact.email}`,
      sameAs: [
        homeContent.contact.linkedin.url,
        homeContent.contact.github.url,
      ],
    });
  });

  it("links the WebSite to the Person", () => {
    expect(website).toMatchObject({
      "@type": "WebSite",
      author: { "@id": "https://site.example/#person" },
    });
  });
});

describe("caseStudyStructuredData", () => {
  it.each(caseStudies.map((c) => [c.slug, c]))(
    "%s is a CreativeWork by the Person, naming no client",
    (_, study) => {
      const data = caseStudyStructuredData(study, homeContent, base);
      expect(data).toMatchObject({
        "@type": "CreativeWork",
        name: study.title,
        url: `https://site.example/work/${study.slug}`,
        author: { "@id": "https://site.example/#person" },
      });
      expect(confidentialTermsIn(JSON.stringify(data))).toEqual([]);
      // Google doesn't resolve @id across pages, so the author is named here.
      expect(data.author).toEqual({
        "@type": "Person",
        "@id": "https://site.example/#person",
        name: "Bhavani Sankar Naveen Dwarapudi",
        url: "https://site.example/",
      });
    },
  );
});

describe("serializeJsonLd", () => {
  it("escapes < so content can't close the script tag", () => {
    const out = serializeJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual({
      name: "</script><script>alert(1)</script>",
    });
  });
});
