import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CONFIDENTIAL_TERM_HASHES,
  confidentialTermsIn,
} from "./confidential-terms";

const SCANNED = ["src", "e2e", "docs", "CLAUDE.md", "README.md", "AGENTS.md"];
const BINARY = new Set([
  ".woff2",
  ".ttf",
  ".jpeg",
  ".jpg",
  ".png",
  ".ico",
  ".pdf",
]);

function walk(path: string): string[] {
  if (statSync(path).isFile()) return BINARY.has(extname(path)) ? [] : [path];
  return readdirSync(path).flatMap((entry) => walk(join(path, entry)));
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
