/**
 * Shared word-overlap similarity — extracted here because three separate
 * agents now need it (content-duplicate-description-detector.ts,
 * growth-cannibalization-detector.ts, and the new
 * seo-indexed-vs-nonindexed-comparator.ts's content-similarity dimension)
 * and it had already been copy-pasted twice before this extraction.
 */

export function wordSet(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) if (b.has(word)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
