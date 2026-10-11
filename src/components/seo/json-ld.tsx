import { serializeJsonLd } from "@/lib/structured-data";

/** Structured data for search engines (server-rendered, no client JS). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
