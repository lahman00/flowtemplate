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
  /** False when there's a concrete, evidenced reason this shouldn't go in a ready-to-apply batch yet (see KNOWN_APPLICATION_BLOCKERS / applicationUrl missing / low confidence) — even if programExists is "yes". */
  readyToApply: boolean;
  blockReason: string | null;
};

/**
 * Concrete, evidenced reasons a confirmed ("yes") program still isn't safe
 * to hand the owner as a one-click application — found during the
 * Completion Pass re-verification (2026-08-14) by actually re-reading each
 * official page rather than trusting the "yes" flag alone. Hand-maintained
 * rather than string-matched against `notes`, so it stays exact and
 * auditable; add an entry here (with the real source) whenever a
 * confirmed program turns out to have a real blocker.
 */
export const KNOWN_APPLICATION_BLOCKERS: Record<string, string> = {
  notion: "Official page currently shows 'Program is currently not accepting new affiliates' (re-checked 2026-08-14).",
  asana: "Application requires being an existing paying Asana customer and runs through a Salesforce sales portal — not a fit for Miloosh's comparison-publisher model.",
  canva: "Official Help Center pages return 403 on every direct fetch attempt; network and current open/closed status could not be independently confirmed.",
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

export async function getAffiliatePriority(software: Software): Promise<AffiliatePriorityBreakdown> {
  const program = AFFILIATE_PROGRAMS.find((p) => p.slug === software.slug);
  const revenueScore = getRevenueScore(software);
  const traffic = scoreTrafficOpportunity(software.slug);
  const pipelineEntry = await getPipelineEntry(software.slug);
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
    readyToApply: Boolean(program?.applicationUrl) && program?.confidence !== "low" && !KNOWN_APPLICATION_BLOCKERS[software.slug],
    blockReason:
      KNOWN_APPLICATION_BLOCKERS[software.slug] ??
      (!program?.applicationUrl ? "No confirmed application URL yet." : program.confidence === "low" ? "Research confidence is low — key facts (network, current status) unconfirmed." : null),
  };
}

/** Every software with a confirmed ("yes") program, ranked highest-priority first — the only pool it's safe to build a real application batch from. */
export async function getRankedApplicationCandidates(): Promise<AffiliatePriorityBreakdown[]> {
  const software = getAllSoftware();
  const breakdowns = await Promise.all(software.map((s) => getAffiliatePriority(s)));
  return breakdowns.filter((b) => b.programExists === "yes").sort((a, b) => b.totalScore - a.totalScore);
}

/** Every product this priority model has an opinion on, ranked — includes unresolved/no-program entries so the dashboard can show the full picture, not just the actionable slice. */
export async function getAllPriorities(): Promise<AffiliatePriorityBreakdown[]> {
  const breakdowns = await Promise.all(getAllSoftware().map((s) => getAffiliatePriority(s)));
  return breakdowns.sort((a, b) => b.totalScore - a.totalScore);
}
