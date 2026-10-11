import { createHash } from "node:crypto";

/**
 * SHA-256 of each lower-cased confidential client term. Stored hashed so this
 * public repository never spells the names out (see CLAUDE.md, Confidentiality).
 * To add a term: node -e 'console.log(require("crypto").createHash("sha256").update("term").digest("hex"))'
 */
export const CONFIDENTIAL_TERM_HASHES = new Set([
  "518951c1f845a1c4409bdc6246b29eb96d5617a2389f74ea23399f68d5f9cb97",
  "3e3ff086c6a39df3b3745e8f7896dbc94a73be0cf44090f1b5202dc01fdc7c58",
  "7b4c98e6c99504dd262d22f6982f96d955f4015a9594b4d5431603cefc0f4257",
  "cbc62794911ff31b2864ecd3dbbbee7ebcb7ea41c5a42e2cba377f3cfdb42811",
  "229e386398b5ad8b9d44cafdb445a762b1f7ab56cc974848647170e4e351ba75",
  "12fc7d4bde3356b4f67d650ec8314d325a43800f50771739db30c6a0e7211c4b",
]);

/** Confidential client terms found in `text` (empty when clean). */
export function confidentialTermsIn(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? [];
  return words.filter((w) =>
    CONFIDENTIAL_TERM_HASHES.has(createHash("sha256").update(w).digest("hex")),
  );
}
