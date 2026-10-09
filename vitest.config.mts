import react from "@vitejs/plugin-react";
import { basename } from "node:path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig, type Plugin } from "vitest/config";

/**
 * Next imports images as StaticImageData ({ src, width, height }); Vite would
 * import a URL string. Mirror Next's shape so components using getImageProps
 * render in tests. Dimensions are placeholders; tests never depend on them.
 */
function staticImages(): Plugin {
  return {
    name: "static-images",
    enforce: "pre",
    load(id) {
      if (!/\.(png|jpe?g|webp|avif)$/.test(id)) return null;
      const src = `/_next/static/media/${basename(id)}`;
      return `export default { src: ${JSON.stringify(src)}, width: 1200, height: 800 };`;
    },
  };
}

export default defineConfig({
  plugins: [staticImages(), tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
