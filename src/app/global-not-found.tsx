import type { Metadata } from "next";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { TextLink } from "@/components/ui/text-link";
import { getContent } from "@/content";
import { DEFAULT_LOCALE } from "@/content/locales";
import { siteUrl } from "@/lib/site-url";
import { themeInitScript } from "@/lib/theme";
import { fontVariables } from "./fonts";
import "./globals.css";

const { homeContent: c } = getContent(DEFAULT_LOCALE);

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: c.notFound.title,
  robots: { index: false },
};

/**
 * Every 404 (unknown paths, unknown case studies, unpublished locales via
 * src/proxy.ts). It bypasses layouts, so it renders the full document itself.
 */
export default function GlobalNotFound() {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontVariables} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader
          site={c.site}
          nav={c.nav}
          locale={DEFAULT_LOCALE}
          path="/"
        />
        <main id="main" className="flex flex-1 items-center">
          <Container className="py-24">
            <p className="kicker">404</p>
            <h1 className="mt-4 font-display text-[clamp(2.25rem,6vw,4rem)] leading-[1] font-extrabold tracking-[-0.04em]">
              {c.notFound.heading}
            </h1>
            <p className="mt-5 max-w-[560px] text-lg text-muted">
              {c.notFound.body}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <ButtonLink href="/" arrow="→">
                {c.notFound.home}
              </ButtonLink>
              <TextLink href="/#experience">{c.notFound.work}</TextLink>
            </div>
          </Container>
        </main>
        <SiteFooter footer={c.footer} newTabLabel={c.newTab} />
      </body>
    </html>
  );
}
