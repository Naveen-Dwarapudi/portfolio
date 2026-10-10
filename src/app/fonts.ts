import localFont from "next/font/local";

/**
 * Local subset fonts (see src/fonts/README.md), shared by the [lang] root
 * layout and global-not-found.tsx (which bypasses layouts).
 */
const geist = localFont({
  src: "../fonts/geist-400-500-latin.woff2",
  weight: "400 500",
  variable: "--font-geist",
  display: "swap",
});
const geistMono = localFont({
  src: "../fonts/geist-mono-400-latin.woff2",
  weight: "400",
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
});
const bricolage = localFont({
  src: "../fonts/bricolage-grotesque-800-latin.woff2",
  weight: "800",
  variable: "--font-bricolage",
  display: "swap",
});

export const fontVariables = `${geist.variable} ${geistMono.variable} ${bricolage.variable}`;
