import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Credentials } from "@/components/sections/credentials";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { Projects } from "@/components/sections/projects";
import { Skills } from "@/components/sections/skills";
import { SiteHeader } from "@/components/site/site-header";
import type { Locale } from "@/content/locales";
import type { HomeContent } from "@/content/types";

export function HomePage({
  content: c,
  locale,
}: {
  content: HomeContent;
  locale: Locale;
}) {
  return (
    <>
      <SiteHeader site={c.site} nav={c.nav} locale={locale} path="/" />
      <main id="main" className="flex-1">
        <Hero hero={c.hero} metrics={c.metrics} />
        <About about={c.about} />
        <Experience
          experience={c.experience}
          techStackLabel={c.techStack}
          readCaseStudyLabel={c.readCaseStudy}
          locale={locale}
        />
        <Skills skills={c.skills} />
        <Projects
          projects={c.projects}
          newTabLabel={c.newTab}
          techStackLabel={c.techStack}
          readCaseStudyLabel={c.readCaseStudy}
          locale={locale}
        />
        <Credentials credentials={c.credentials} />
        <Contact contact={c.contact} newTabLabel={c.newTab} />
      </main>
    </>
  );
}
