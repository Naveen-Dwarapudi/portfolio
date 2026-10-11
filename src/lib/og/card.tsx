import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { OG_COLORS as C } from "./colors";

export const OG_SIZE = { width: 1200, height: 630 } as const;

const FONTS = join(process.cwd(), "src/fonts/og");
const PORTRAIT = join(process.cwd(), "src/images/mypic-2.jpeg");

/** Build-time assets: TTF subsets (satori can't read woff2) and the portrait. */
async function loadAssets() {
  const [display, body, bodyMedium, portrait] = await Promise.all([
    readFile(join(FONTS, "bricolage-grotesque-800-latin.ttf")),
    readFile(join(FONTS, "geist-400-latin.ttf")),
    readFile(join(FONTS, "geist-500-latin.ttf")),
    readFile(PORTRAIT),
  ]);
  return {
    fonts: [
      {
        name: "Bricolage",
        data: display,
        weight: 800 as const,
        style: "normal" as const,
      },
      {
        name: "Geist",
        data: body,
        weight: 400 as const,
        style: "normal" as const,
      },
      {
        name: "Geist",
        data: bodyMedium,
        weight: 500 as const,
        style: "normal" as const,
      },
    ],
    portrait: `data:image/jpeg;base64,${portrait.toString("base64")}`,
  };
}

// Read once at module load, as Next's docs show: file reads during rendering
// count as uncached IO under Cache Components and block static generation.
const ASSETS = await loadAssets();

type Card =
  | { kind: "home"; name: string; role: string; host: string }
  | { kind: "case-study"; kicker: string; title: string; byline: string };

/** A 1200×630 share card on the dark theme, with the portrait on the right. */
export async function renderCard(card: Card): Promise<ImageResponse> {
  const { fonts, portrait } = ASSETS;
  const home = card.kind === "home";
  const photo = home ? 360 : 220;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 56,
        padding: "0 88px 0 96px",
        background: `radial-gradient(circle at 85% 20%, rgba(255,138,61,0.16), transparent 55%), ${C.bg}`,
        color: C.text,
        fontFamily: "Geist",
        position: "relative",
      }}
    >
      {/* Accent bar on the left edge. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 10,
          background: C.accent,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        {home ? (
          <>
            <div
              style={{
                fontFamily: "Bricolage",
                fontSize: 70,
                lineHeight: 1.02,
                letterSpacing: -2,
              }}
            >
              {card.name}
            </div>
            <div
              style={{
                marginTop: 28,
                fontSize: 32,
                fontWeight: 500,
                color: C.muted,
              }}
            >
              {card.role}
            </div>
            <div style={{ marginTop: 40, fontSize: 26, color: C.accent }}>
              {card.host}
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                fontSize: 24,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: C.accent,
              }}
            >
              {card.kicker}
            </div>
            <div
              style={{
                marginTop: 24,
                fontFamily: "Bricolage",
                fontSize: 64,
                lineHeight: 1.04,
                letterSpacing: -2,
              }}
            >
              {card.title}
            </div>
            <div
              style={{
                marginTop: 36,
                fontSize: 26,
                fontWeight: 500,
                color: C.muted,
              }}
            >
              {card.byline}
            </div>
          </>
        )}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- satori renders <img>, not next/image */}
      <img
        src={portrait}
        width={photo}
        height={photo}
        alt=""
        style={{
          width: photo,
          height: photo,
          objectFit: "cover",
          borderRadius: home ? 28 : photo / 2,
          border: `2px solid ${C.line}`,
        }}
      />
    </div>,
    { ...OG_SIZE, fonts },
  );
}
