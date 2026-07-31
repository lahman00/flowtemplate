import type { RevenueScoreBreakdown } from "@/lib/revenue/scoring";

/**
 * Sprint 8 Phase 3 — commercial priority tiers, derived directly from the
 * Phase 2 revenue score. Thresholds are a simple, documented three-way
 * split of the 0-100 score range — see docs/revenue.md for the reasoning.
 */

export type RevenueTier = "A" | "B" | "C";

const TIER_A_THRESHOLD = 70;
const TIER_B_THRESHOLD = 40;

export function getRevenueTier(totalScore: number): RevenueTier {
  if (totalScore >= TIER_A_THRESHOLD) return "A";
  if (totalScore >= TIER_B_THRESHOLD) return "B";
  return "C";
}

/** A short, factual sentence explaining why a score landed in its tier, built from the breakdown itself — never a canned line. */
export function explainTier(breakdown: RevenueScoreBreakdown): string {
  const tier = getRevenueTier(breakdown.totalScore);
  const reasons: string[] = [];

  if (breakdown.affiliateAvailabilityScore === 10) {
    reasons.push("a confirmed affiliate program");
  } else if (breakdown.affiliateAvailabilityScore === 5) {
    reasons.push("an unresolved affiliate program (worth a follow-up)");
  } else {
    reasons.push("no confirmed affiliate program");
  }

  if (breakdown.commercialIntentScore >= 9) {
    reasons.push("a paid pricing model");
  } else if (breakdown.commercialIntentScore <= 3) {
    reasons.push("a free or open-source pricing model");
  }

  if (breakdown.buyingIntentScore >= 5) {
    reasons.push("strong presence across our published comparisons");
  } else if (breakdown.buyingIntentScore === 0) {
    reasons.push("no published comparisons yet");
  }

  if (breakdown.categoryValueScore >= 8) {
    reasons.push("a high-value category");
  } else if (breakdown.categoryValueScore <= 5) {
    reasons.push("a lower-value category");
  }

  return `Tier ${tier} (score ${breakdown.totalScore}/100): ${reasons.join(", ")}.`;
}

export function countByTier(breakdowns: RevenueScoreBreakdown[]): Record<RevenueTier, number> {
  const counts: Record<RevenueTier, number> = { A: 0, B: 0, C: 0 };
  for (const breakdown of breakdowns) {
    counts[getRevenueTier(breakdown.totalScore)] += 1;
  }
  return counts;
}
