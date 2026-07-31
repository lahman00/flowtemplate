import type { Software } from "@/data/software";
import { getComparisonsInvolving } from "@/data/comparisons";
import { getAffiliateProgram } from "@/lib/revenue/affiliate-manager";
import { getCategoryValueScore } from "@/lib/revenue/category-value";

/**
 * Sprint 8 Phase 2 — revenue scoring. Every input is either a real, stored
 * fact (the Phase 1 affiliate research, the software's own `pricing.model`,
 * how many published comparisons it appears in) or a documented editorial
 * weight (category value — see lib/revenue/category-value.ts). No
 * commission percentage is ever used as a score input, so a vendor with a
 * highly specific published rate doesn't get treated as more "valuable"
 * than one with an unconfirmed program — see docs/revenue.md for why.
 */

export type RevenueScoreBreakdown = {
  slug: string;
  affiliateAvailabilityScore: number;
  categoryValueScore: number;
  commercialIntentScore: number;
  buyingIntentScore: number;
  /** 0-100, weighted sum of the four scores above. */
  totalScore: number;
};

/** 0-10. A confirmed program scores highest; an unresolved one scores as a real "worth following up" middle value rather than zero. */
function scoreAffiliateAvailability(slug: string): number {
  const program = getAffiliateProgram(slug);
  if (!program) return 0;
  if (program.programExists === "yes") return 10;
  if (program.programExists === "unknown") return 5;
  return 0;
}

/**
 * 0-10, derived from the software's own stored `pricing.model` — paid
 * products have the clearest purchase decision (and the affiliate
 * commissions to match); free/open-source tools rarely fund one.
 */
function scoreCommercialIntent(software: Software): number {
  switch (software.pricing?.model) {
    case "paid":
      return 10;
    case "freemium":
      return 7;
    case "unknown":
      return 5;
    case "free":
      return 3;
    case "open_source":
      return 2;
    default:
      return 5;
  }
}

/**
 * 0-10, derived from a real computed signal already in this dataset: how
 * many curated /compare pages (data/comparisons.ts) this product appears
 * in. More comparisons published means more of our own users are actively
 * weighing a switch involving this tool — a genuine proxy for buying
 * intent, not an invented number.
 */
function scoreBuyingIntent(slug: string): number {
  const comparisonCount = getComparisonsInvolving(slug).length;
  return Math.min(10, comparisonCount * 2.5);
}

const WEIGHTS = {
  affiliateAvailability: 3.5,
  categoryValue: 2,
  commercialIntent: 2.5,
  buyingIntent: 2,
};

export function getRevenueScore(software: Software): RevenueScoreBreakdown {
  const affiliateAvailabilityScore = scoreAffiliateAvailability(software.slug);
  const categoryValueScore = getCategoryValueScore(software.category);
  const commercialIntentScore = scoreCommercialIntent(software);
  const buyingIntentScore = scoreBuyingIntent(software.slug);

  const totalScore = Math.round(
    affiliateAvailabilityScore * WEIGHTS.affiliateAvailability +
      categoryValueScore * WEIGHTS.categoryValue +
      commercialIntentScore * WEIGHTS.commercialIntent +
      buyingIntentScore * WEIGHTS.buyingIntent
  );

  return {
    slug: software.slug,
    affiliateAvailabilityScore,
    categoryValueScore,
    commercialIntentScore,
    buyingIntentScore,
    totalScore,
  };
}

export function getRevenueScores(allSoftware: Software[]): RevenueScoreBreakdown[] {
  return allSoftware.map(getRevenueScore).sort((a, b) => b.totalScore - a.totalScore);
}
