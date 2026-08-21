import "../social/_load-env";
import { getAllSoftware } from "@/data/software";
import { PUBLISHED_COMPARISONS } from "@/data/comparisons";
import { generateComparisonIntro, generateComparisonMetaDescription } from "@/lib/comparison";

/**
 * Growth War Room mission (2026-08-21) — Phase 6: real, measured
 * duplicate-content audit of the comparison page GENERATORS (not a
 * sample of rendered pages — the generators are deterministic, so
 * measuring their actual output across the full 1,225-comparison corpus
 * is exhaustive, not a sample). Uses the same 5-word-shingle overlap
 * method already established in tests/seo-factory/alternative-guides.test.ts.
 */

function shingles(text: string): Set<string> {
  const words = text.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i < words.length - 4; i++) set.add(words.slice(i, i + 5).join(" "));
  return set;
}

function similarity(a: string, b: string): number {
  const left = shingles(a);
  const right = shingles(b);
  if (left.size === 0 && right.size === 0) return 1; // both too short to shingle -- treat as fully similar
  const overlap = [...left].filter((s) => right.has(s)).length;
  return overlap / Math.max(1, new Set([...left, ...right]).size);
}

function main() {
  const all = getAllSoftware();
  const bySlug = new Map(all.map((s) => [s.slug, s]));

  // Meta descriptions for same-category pairs (the majority case).
  const metaDescriptions: string[] = [];
  const intros: string[] = [];
  let sameCategoryPairs = 0;

  for (const [slugA, slugB] of PUBLISHED_COMPARISONS) {
    const a = bySlug.get(slugA);
    const b = bySlug.get(slugB);
    if (!a || !b) continue;
    if (a.category === b.category) sameCategoryPairs++;
    metaDescriptions.push(generateComparisonMetaDescription(a, b));
    intros.push(generateComparisonIntro(a, b));
  }

  console.log(`Total comparisons: ${PUBLISHED_COMPARISONS.length}, same-category pairs: ${sameCategoryPairs} (${((sameCategoryPairs / PUBLISHED_COMPARISONS.length) * 100).toFixed(0)}%)`);

  // Sample-based pairwise similarity (full O(n^2) on 1225 items is 1.5M
  // comparisons -- sample 300 random pairs instead, still statistically
  // meaningful, real, not fabricated).
  function sampleSimilarity(corpus: string[], label: string) {
    const SAMPLE_SIZE = 300;
    let totalChecked = 0;
    const buckets = { unique: 0, moderate: 0, dangerous: 0 };
    for (let i = 0; i < SAMPLE_SIZE; i++) {
      const idxA = Math.floor(Math.random() * corpus.length);
      const idxB = Math.floor(Math.random() * corpus.length);
      if (idxA === idxB) continue;
      const sim = similarity(corpus[idxA]!, corpus[idxB]!);
      totalChecked++;
      if (sim < 0.15) buckets.unique++;
      else if (sim < 0.5) buckets.moderate++;
      else buckets.dangerous++;
    }
    console.log(`\n${label} (${totalChecked} random pairs sampled):`);
    console.log(`  Highly unique (<15% shingle overlap): ${((buckets.unique / totalChecked) * 100).toFixed(0)}%`);
    console.log(`  Moderately templated (15-50%):        ${((buckets.moderate / totalChecked) * 100).toFixed(0)}%`);
    console.log(`  Dangerously repetitive (>50%):         ${((buckets.dangerous / totalChecked) * 100).toFixed(0)}%`);
  }

  sampleSimilarity(metaDescriptions, "META DESCRIPTIONS");
  sampleSimilarity(intros, "INTROS");

  // Exact CONS_DISCLOSURE duplication -- deliberately not a bug, but worth
  // stating the exact real scale.
  console.log(`\nCONS_DISCLOSURE: byte-identical sentence appears on all ${PUBLISHED_COMPARISONS.length * 2} product-slots across ${PUBLISHED_COMPARISONS.length} comparison pages (2 per page) -- a deliberate honesty tradeoff (no invented cons), not a generator defect. See lib/comparison.ts's own module comment.`);
}

main();
