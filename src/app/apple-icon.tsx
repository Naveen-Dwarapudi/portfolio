import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OG_COLORS as C } from "@/lib/og/colors";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Read at module load: reads during rendering count as uncached IO under
// Cache Components and would make the icon render per request.
const display = await readFile(
  join(process.cwd(), "src/fonts/og/bricolage-grotesque-800-latin.ttf"),
);

/** Home-screen icon: the "ND." monogram on the dark background. */
export default async function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.bg,
        color: C.text,
        fontFamily: "Bricolage",
        fontSize: 84,
        letterSpacing: -4,
      }}
    >
      ND<span style={{ color: C.accent }}>.</span>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Bricolage", data: display, weight: 800, style: "normal" },
      ],
    },
  );
}
