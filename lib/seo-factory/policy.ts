import type { SeoIntent } from "@/lib/seo-factory/types";

export type PublicationEvidence = {
  impressions: number;
  intent: SeoIntent;
  existingCanonical: string | null;
  factualSources: number;
  internalLinkSources: number;
  uniqueDecisionValue: boolean;
  cannibalizationRisk: "none" | "possible" | "confirmed";
};

export function assessPublicationThreshold(evidence: PublicationEvidence): { eligible: false; blockers: string[] } {
  const blockers: string[] = [];
  if (evidence.impressions < 25) blockers.push("insufficient real query demand");
  if (evidence.intent === "UNKNOWN" || evidence.intent === "SUPPORT_HOW_TO") blockers.push("intent is outside or unclear for Miloosh");
  if (evidence.existingCanonical) blockers.push("an existing canonical page should be improved first");
  if (evidence.factualSources < 2) blockers.push("insufficient first-party factual evidence");
  if (evidence.internalLinkSources < 2) blockers.push("insufficient contextual internal-link support");
  if (!evidence.uniqueDecisionValue) blockers.push("incremental decision value not established");
  if (evidence.cannibalizationRisk !== "none") blockers.push("cannibalization risk requires review");
  // v1 is deliberately Level 0. Even a candidate with no evidence blocker
  // remains review-required; no code path can autonomously publish it.
  blockers.push("SEO Factory v1 autonomy is Level 0 (analysis only)");
  return { eligible: false, blockers };
}

export function experimentIsCoolingDown(lastInterventionAt: string | null, measurementWindowDays: number, now = Date.now()): boolean {
  if (!lastInterventionAt) return false;
  const timestamp = Date.parse(lastInterventionAt);
  if (Number.isNaN(timestamp)) return true;
  return now - timestamp < measurementWindowDays * 24 * 60 * 60 * 1000;
}
