import type { Software } from "@/data/software";

/**
 * Phase 3B (2026-08-17 growth sprint) — stale-pricing detection. SaaS
 * pricing changes far more often than the rest of a product's profile
 * (see the top-level accessedAt vs pricing.lastVerified distinction in
 * data/software/schema.ts), so a numeric price claim that hasn't been
 * re-checked in a while shouldn't keep being presented as current
 * without at least being flagged. 90 days is the default; call sites can
 * pass a different window for a category known to change pricing faster.
 */
export const DEFAULT_PRICING_STALE_DAYS = 90;

export function isPricingStale(software: Software, now: Date = new Date(), staleDays: number = DEFAULT_PRICING_STALE_DAYS): boolean {
  const lastVerified = software.pricing?.lastVerified;
  if (!lastVerified) return false; // no numeric claim recorded at all — nothing to go stale
  const ageMs = now.getTime() - new Date(lastVerified).getTime();
  return ageMs > staleDays * 24 * 60 * 60 * 1000;
}

export function hasNumericPricingClaim(software: Software): boolean {
  return Boolean(software.pricing?.entryPaid || (software.pricing?.tiers && software.pricing.tiers.length > 0));
}
