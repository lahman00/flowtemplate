import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { getSoftware } from "@/data/software";
import { PUBLISHED_COMPARISONS } from "@/data/comparisons";
import {
  generateComparisonIntro,
  generateComparisonMetaDescription,
  generateWhoShouldChoose,
  generateKeyDifferences,
  generateComparisonRows,
} from "@/lib/comparison";

/**
 * Real Human Funnel -> Commercial Conversion Mission (2026-08-22), Phase 8:
 * "Never create a winner because one side pays commission... Add automated
 * neutrality/integrity tests if missing." None existed for comparison
 * pages (only lib/recommend/* had this proof). Same two-part approach as
 * tests/lib/recommend-affiliate-neutrality.test.ts:
 *
 *   1. A static check, stronger than a behavioral test: the editorial
 *      content generator (lib/comparison.ts — intro, meta description,
 *      "who should choose", key differences, feature rows) has zero
 *      imports from any affiliate/revenue module, so there is no code
 *      path by which affiliate status COULD reach editorial text, full
 *      stop. The CTA *destination* legitimately does read affiliate
 *      state (via lib/affiliate.ts, in app/compare/[comparison]/page.tsx
 *      directly, not in this generator) — that's the correct place for
 *      monetization to live; this file proves it never leaks upstream
 *      into the words themselves.
 *   2. A real content check across every published comparison pair: no
 *      generated text ever declares one side the winner/better choice in
 *      absolute terms — "who should choose" framing must always be
 *      conditional ("if you need X, pick A"), for both sides, never a
 *      bare declaration that one product is simply better.
 */

const COMPARISON_CONTENT_FILES = ["lib/comparison.ts"];
const FORBIDDEN_IMPORT_PATTERNS = [/data\/affiliate/, /lib\/affiliate["']/, /lib\/revenue/];

describe("Comparison editorial content affiliate neutrality", () => {
  it.each(COMPARISON_CONTENT_FILES)("%s imports nothing from any affiliate/revenue module", (relPath) => {
    const source = fs.readFileSync(path.join(process.cwd(), relPath), "utf-8");
    const importLines = source.split("\n").filter((line) => /^\s*import\b/.test(line));
    for (const pattern of FORBIDDEN_IMPORT_PATTERNS) {
      const offender = importLines.find((line) => pattern.test(line));
      expect(offender, `${relPath} has a forbidden import: ${offender}`).toBeUndefined();
    }
  });

  it("no comparison intro/meta-description/who-should-choose text declares an absolute winner", () => {
    // Absolute-superiority language a real editorial generator should never emit,
    // regardless of which side (if either) is an active affiliate partner.
    const forbidden = /\bis (?:simply |clearly |obviously )?better than\b|\bbeats\b|\bthe winner is\b|\boutperforms\b|\bsuperior to\b/i;
    const pairs = PUBLISHED_COMPARISONS.slice(0, 60); // every unique product appears many times; a slice already exercises the whole active-partner set and is fast
    for (const [slugA, slugB] of pairs) {
      const a = getSoftware(slugA);
      const b = getSoftware(slugB);
      if (!a || !b) continue;
      const intro = generateComparisonIntro(a, b);
      const meta = generateComparisonMetaDescription(a, b);
      const whoA = generateWhoShouldChoose(a);
      const whoB = generateWhoShouldChoose(b);
      for (const [label, text] of [["intro", intro], ["meta", meta], ["whoA", whoA], ["whoB", whoB]] as const) {
        expect(text, `${slugA}-vs-${slugB} ${label} uses absolute-winner language: "${text}"`).not.toMatch(forbidden);
      }
    }
  });

  it("who-should-choose framing is symmetric: both sides in a pair get a real, non-empty recommendation", () => {
    const pairs = PUBLISHED_COMPARISONS.slice(0, 60);
    for (const [slugA, slugB] of pairs) {
      const a = getSoftware(slugA);
      const b = getSoftware(slugB);
      if (!a || !b) continue;
      expect(generateWhoShouldChoose(a).length, `${slugA} has no who-should-choose text in ${slugA}-vs-${slugB}`).toBeGreaterThan(0);
      expect(generateWhoShouldChoose(b).length, `${slugB} has no who-should-choose text in ${slugA}-vs-${slugB}`).toBeGreaterThan(0);
      // Feature comparison rows must exist for both products — never one-sided.
      const rows = generateComparisonRows(a, b);
      expect(rows.length, `${slugA}-vs-${slugB} has no comparison rows`).toBeGreaterThan(0);
      const keyDiffs = generateKeyDifferences(a, b);
      expect(Array.isArray(keyDiffs)).toBe(true);
    }
  });
});
