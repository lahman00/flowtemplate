import type { Software } from "@/data/software";
import { getAllSoftware } from "@/data/software";
import { getPopularAlternatives } from "@/lib/related";

/**
 * Phase 5 (Sprint 4) — monetization-ready architecture. Everything here is
 * real, functioning logic; none of it is switched on by fake data. No
 * entry in data/software currently sets sponsored or featured — see
 * docs/monetization.md. Affiliate-link mechanics (CTA URL, tracking
 * params, disclosure) live in lib/affiliate.ts.
 */

export function isSponsored(software: Software): boolean {
  return software.sponsored === true;
}

export function isFeatured(software: Software): boolean {
  return software.featured === true;
}

/** Entries editorially/commercially flagged as featured. Returns [] today — none are. */
export function getFeaturedSoftware(limit = 5): Software[] {
  return getAllSoftware()
    .filter((software) => isFeatured(software))
    .slice(0, limit);
}

/**
 * Prefers explicitly featured entries; falls back to the same honest
 * "most often listed as an alternative" metric getPopularAlternatives uses,
 * so this never needs fabricated ratings to produce a real list.
 */
export function getRecommendedSoftware(limit = 5): Software[] {
  const featured = getFeaturedSoftware(limit);
  if (featured.length > 0) {
    return featured;
  }
  return getPopularAlternatives(limit);
}
