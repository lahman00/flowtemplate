import type { Software } from "@/data/software";
import { getAllSoftware } from "@/data/software";
import { AFFILIATE_PROGRAMS, type AffiliateProgramInfo } from "@/data/revenue/affiliate-programs";
import { readFirstClickCandidates } from "@/lib/agents/first-click-experiment";
import { readFirstClickStrikeCandidates } from "@/lib/agents/first-click-strike";
import { getPipelineEntry, type AffiliatePipelineStatus } from "@/lib/revenue/affiliate-pipeline";
import { getRevenueScore } from "@/lib/revenue/scoring";

/**
 * Affiliate Revenue Engine, Phase 5 — money-first prioritization.
 *
 * This is deliberately an ADDITIVE weighted score, not the directive's
 * literal "Traffic opportunity x Commercial intent x Commission potential
 * x Approval probability" product: most products have zero real traffic
 * signal (see trafficOpportunityScore below), and multiplying by zero
 * would erase every other real signal a product does have. Exposing each
 * component separately — as the directive itself also requires — is more
 * honest than a single multiplied number that implies more precision than
 * the inputs support.
 */

export type AffiliatePriorityBreakdown = {
  slug: string;
  name: string;
  programExists: AffiliateProgramInfo["programExists"] | "no_entry";
  pipelineStatus: AffiliatePipelineStatus;
  affiliateAvailabilityScore: number;
  categoryValueScore: number;
  commercialIntentScore: number;
  buyingIntentScore: number;
  /** 0-10. Real GSC impressions found for this product's own page(s) in the two prior first-click experiment cohorts — the only per-product traffic data this system actually has. 0 means "no data," never "no traffic." */
  trafficOpportunityScore: number;
  /** Whether trafficOpportunityScore came from a real recorded GSC baseline, or is a structural 0 (no data collected for this product's pages). */
  trafficDataSource: "real-gsc-cohort" | "none";
  /** 0-10. Not a real approval-probability model — a documented proxy: a network the owner already has an account on (PartnerStack) scores highest, a known network scores next, an unnamed/direct program scores lower, and no confirmed application path scores lowest. */
  approvalFrictionScore: number;
  recurringBonus: number;
  totalScore: number;
};

const WEIGHTS = {
  affiliateAvailability: 3.5,
  categoryValue: 1.5,
  commercialIntent: 2,
  buyingIntent: 1.5,
  trafficOpportunity: 3,
  approvalFriction: 1.5,
};
const RECURRING_BONUS = 5;
const MAX_RAW =
  10 * (WEIGHTS.affiliateAvailability + WEIGHTS.categoryValue + WEIGHTS.commercialIntent + WEIGHTS.buyingIntent + WEIGHTS.trafficOpportunity + WEIGHTS.approvalFriction) +
  RECURRING_BONUS;

function scoreAffiliateAvailability(program: AffiliateProgramInfo | undefined): number {
  if (!program) return 0;
  if (program.programExists === "yes") return 10;
  if (program.programExists === "unknown") return 5;
  return 0;
}

/** Real GSC impressions recorded for this slug's own software/compare page(s) in the two prior first-click experiments — the only per-product live-traffic evidence this codebase has collected. Not a general keyword-volume estimate. */
function getRealImpressionsForSlug(slug: string): number {
  let total = 0;
  for (const c of readFirstClickCandidates()) {
    if (c.url.includes(`/software/${slug}`) || c.url.includes(`/compare/`) && c.url.includes(slug)) {
      total += c.baseline.impressions;
    }
  }
  for (const c of readFirstClickStrikeCandidates()) {
    if (c.url.includes(`/software/${slug}`) || (c.url.includes(`/compare/`) && c.url.includes(slug))) {
      total += c.baseline.impressions;
    }
  }
  return total;
}

function scoreTrafficOpportunity(slug: string): { score: number; source: "real-gsc-cohort" | "none" } {
  const impressions = getRealImpressionsForSlug(slug);
  if (impressions <= 0) return { score: 0, source: "none" };
  // Same position-weighted bucketing already used to rank the first-click cohorts (see first-click-experiment.ts) — capped at 10.
  const score = Math.min(10, Math.round(Math.log2(impressions + 1) * 1.8));
  return { score, source: "real-gsc-cohort" };
}

function scoreApprovalFriction(program: AffiliateProgramInfo | undefined): number {
  if (!program || program.programExists !== "yes") return 2;
  if (program.networkName === "PartnerStack") return 10; // owner already has an account here
  if (program.networkName) return 7; // a named network — real infrastructure, just not one we're onboarded to yet
  if (program.type === "direct") return 5;
  return 3;
}

export function getAffiliatePriority(software: Software): AffiliatePriorityBreakdown {
  const program = AFFILIATE_PROGRAMS.find((p) => p.slug === software.slug);
  const revenueScore = getRevenueScore(software);
  const traffic = scoreTrafficOpportunity(software.slug);
  const pipelineEntry = getPipelineEntry(software.slug);
  const approvalFrictionScore = scoreApprovalFriction(program);
  const recurringBonus = program?.recurrence === "recurring" ? RECURRING_BONUS : 0;

  const affiliateAvailabilityScore = scoreAffiliateAvailability(program);

  const raw =
    affiliateAvailabilityScore * WEIGHTS.affiliateAvailability +
    revenueScore.categoryValueScore * WEIGHTS.categoryValue +
    revenueScore.commercialIntentScore * WEIGHTS.commercialIntent +
    revenueScore.buyingIntentScore * WEIGHTS.buyingIntent +
    traffic.score * WEIGHTS.trafficOpportunity +
    approvalFrictionScore * WEIGHTS.approvalFriction +
    recurringBonus;

  return {
    slug: software.slug,
    name: software.name,
    programExists: program?.programExists ?? "no_entry",
    pipelineStatus: pipelineEntry?.status ?? "unresearched",
    affiliateAvailabilityScore,
    categoryValueScore: revenueScore.categoryValueScore,
    commercialIntentScore: revenueScore.commercialIntentScore,
    buyingIntentScore: revenueScore.buyingIntentScore,
    trafficOpportunityScore: traffic.score,
    trafficDataSource: traffic.source,
    approvalFrictionScore,
    recurringBonus,
    totalScore: Math.round((raw / MAX_RAW) * 100),
  };
}

/** Every software with a confirmed ("yes") program, ranked highest-priority first — the only pool it's safe to build a real application batch from. */
export function getRankedApplicationCandidates(): AffiliatePriorityBreakdown[] {
  const software = getAllSoftware();
  return software
    .map((s) => getAffiliatePriority(s))
    .filter((b) => b.programExists === "yes")
    .sort((a, b) => b.totalScore - a.totalScore);
}

/** Every product this priority model has an opinion on, ranked — includes unresolved/no-program entries so the dashboard can show the full picture, not just the actionable slice. */
export function getAllPriorities(): AffiliatePriorityBreakdown[] {
  return getAllSoftware()
    .map((s) => getAffiliatePriority(s))
    .sort((a, b) => b.totalScore - a.totalScore);
}
