import { About } from "@/components/sections/about";
import { Contact } from "@/components/sections/contact";
import { Credentials } from "@/components/sections/credentials";
import { Experience } from "@/components/sections/experience";
import { Hero } from "@/components/sections/hero";
import { Projects } from "@/components/sections/projects";
import { Skills } from "@/components/sections/skills";
import { homeContent as c } from "@/content/en";

export default function Home() {
  return (
    <main id="main" className="flex-1">
      <Hero hero={c.hero} metrics={c.metrics} />
      <About about={c.about} />
      <Experience experience={c.experience} techStackLabel={c.techStack} />
      <Skills skills={c.skills} />
      <Projects
        projects={c.projects}
        newTabLabel={c.newTab}
        techStackLabel={c.techStack}
      />
      <Credentials credentials={c.credentials} />
      <Contact contact={c.contact} newTabLabel={c.newTab} />
    </main>
  );
}
