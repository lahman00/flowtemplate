import type { Software } from "@/data/software";
import { getAllSoftware } from "@/data/software";

/**
 * Software not already shown as a direct alternative on this page — keeps
 * cross-links spread across the whole catalog instead of repeating the same
 * neighbors everywhere.
 */
export function getRelatedSoftware(software: Software, limit = 3): Software[] {
  const directAlternativeSlugs = new Set(software.alternatives.map((alt) => alt.slug));

  return getAllSoftware()
    .filter((item) => item.slug !== software.slug && !directAlternativeSlugs.has(item.slug))
    .slice(0, limit);
}

export function getSameCategorySoftware(software: Software, limit = 3): Software[] {
  return getAllSoftware()
    .filter((item) => item.slug !== software.slug && item.category === software.category)
    .slice(0, limit);
}

/** Returns [] until entries actually carry a `pricing.model` value. */
export function getSamePricingSoftware(software: Software, limit = 3): Software[] {
  if (!software.pricing?.model) {
    return [];
  }

  return getAllSoftware()
    .filter(
      (item) => item.slug !== software.slug && item.pricing?.model === software.pricing?.model
    )
    .slice(0, limit);
}

/**
 * No field in the current schema captures target company size, and none of
 * the current entries can be honestly bucketed by it — this intentionally
 * returns [] rather than guessing from unrelated fields.
 */
export function getSameCompanySizeSoftware(_software: Software, limit = 3): Software[] {
  return ([] as Software[]).slice(0, limit);
}

/**
 * "Popular" is defined as: most often listed as another tool's alternative
 * in this dataset. It's a real, computed number from our own data — not a
 * rating or review count we don't have.
 */
export function getPopularAlternatives(limit = 5): Software[] {
  const allSoftware = getAllSoftware();
  const mentionCounts = new Map<string, number>();

  for (const software of allSoftware) {
    for (const alternative of software.alternatives) {
      mentionCounts.set(alternative.slug, (mentionCounts.get(alternative.slug) ?? 0) + 1);
    }
  }

  return [...allSoftware]
    .sort((a, b) => (mentionCounts.get(b.slug) ?? 0) - (mentionCounts.get(a.slug) ?? 0))
    .slice(0, limit);
}
