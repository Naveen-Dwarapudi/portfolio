import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * SHA-256 of each lower-cased confidential client term. Stored hashed so this
 * public repository never spells the names out (see CLAUDE.md, Confidentiality).
 * To add a term: node -e 'console.log(require("crypto").createHash("sha256").update("term").digest("hex"))'
 */
const CONFIDENTIAL_TERM_HASHES = new Set([
  "518951c1f845a1c4409bdc6246b29eb96d5617a2389f74ea23399f68d5f9cb97",
  "3e3ff086c6a39df3b3745e8f7896dbc94a73be0cf44090f1b5202dc01fdc7c58",
  "7b4c98e6c99504dd262d22f6982f96d955f4015a9594b4d5431603cefc0f4257",
  "cbc62794911ff31b2864ecd3dbbbee7ebcb7ea41c5a42e2cba377f3cfdb42811",
  "229e386398b5ad8b9d44cafdb445a762b1f7ab56cc974848647170e4e351ba75",
  "12fc7d4bde3356b4f67d650ec8314d325a43800f50771739db30c6a0e7211c4b",
]);

const SCANNED = ["src", "e2e", "docs", "CLAUDE.md", "README.md", "AGENTS.md"];
const BINARY = new Set([".woff2", ".jpeg", ".jpg", ".png", ".ico", ".pdf"]);

function walk(path: string): string[] {
  if (statSync(path).isFile()) return BINARY.has(extname(path)) ? [] : [path];
  return readdirSync(path).flatMap((entry) => walk(join(path, entry)));
}

function confidentialTermsIn(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  return words.filter((w) =>
    CONFIDENTIAL_TERM_HASHES.has(createHash("sha256").update(w).digest("hex")),
  );
}

describe("confidentiality", () => {
  it("detects a hashed term (guard self-check)", () => {
    // "pharma" is not confidential; the self-check uses a hash we know is listed.
    expect(confidentialTermsIn("pharma portal")).toEqual([]);
    expect(
      CONFIDENTIAL_TERM_HASHES.has(
        createHash("sha256")
          .update(String.fromCharCode(97, 109, 97, 122, 111, 110))
          .digest("hex"),
      ),
    ).toBe(true);
  });

  it("no tracked text file names a confidential client", () => {
    const offenders = SCANNED.flatMap(walk).flatMap((file) => {
      const hits = confidentialTermsIn(readFileSync(file, "utf8"));
      return hits.length ? [`${file}: ${hits.length} hit(s)`] : [];
    });
    expect(offenders).toEqual([]);
  });
});
