import { getSoftware } from "@/data/software";
import { getRevenueScore } from "@/lib/revenue/scoring";
import type { Finding, Severity } from "@/types/agents";

/**
 * The prioritization formula — Section H of the multi-agent system brief:
 * "Create a simple transparent scoring model... Prefer deterministic
 * scoring over vague AI judgment where possible... Do not pretend the
 * score predicts revenue with scientific precision."
 *
 * estimatedImpact (0-100) = round(100 * weighted average of 5 factors,
 * each normalized to 0-1):
 *
 *   confidence      (weight 0.25) — the finding's own confidence, as-is.
 *   severityUrgency (weight 0.20) — critical=1.0, warning=0.6, info=0.3.
 *   commercialValue (weight 0.20) — the related software's revenue score
 *                    (lib/revenue/scoring.ts, itself a documented
 *                    deterministic formula) ÷ 100, if the finding's
 *                    location resolves to a real software slug; 0.5
 *                    (neutral) otherwise.
 *   actionability   (weight 0.15) — inverse of riskLevel: a Level-0/1
 *                    finding (safe, easily reversible) scores higher than
 *                    a Level-3 one, because it's cheaper to act on.
 *   searchSignal    (weight 0.20) — ALWAYS 0.5 (neutral) today. This
 *                    factor exists to represent real Search Console
 *                    impressions/ranking-position data, which this
 *                    deployment does not have (see docs/agents-architecture.md,
 *                    "blocked agents"). It is not a real signal yet —
 *                    documented here explicitly rather than silently
 *                    hidden, so the score is never mistaken for
 *                    traffic-data-informed.
 *
 * Weights sum to 1.0. This is a ranking aid for a human, not a revenue
 * forecast — two findings a few points apart are not meaningfully
 * different; treat the score as coarse buckets (high/medium/low), not a
 * league table.
 */

const WEIGHTS = {
  confidence: 0.25,
  severityUrgency: 0.2,
  commercialValue: 0.2,
  actionability: 0.15,
  searchSignal: 0.2,
} as const;

function severityUrgency(severity: Severity): number {
  switch (severity) {
    case "critical":
      return 1.0;
    case "warning":
      return 0.6;
    case "info":
      return 0.3;
    default:
      return 0.3;
  }
}

function commercialValue(location: string | null): number {
  if (!location) return 0.5;
  // location is usually a route like "/software/notion" or a bare slug.
  const slugMatch = location.match(/(?:^|\/)([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  const slug = slugMatch?.[1];
  if (!slug) return 0.5;
  const software = getSoftware(slug);
  if (!software) return 0.5;
  return getRevenueScore(software).totalScore / 100;
}

function actionability(riskLevel: number): number {
  // riskLevel 0 -> 1.0, 1 -> 0.75, 2 -> 0.5, 3 -> 0.25, 4 -> 0
  return Math.max(0, 1 - riskLevel / 4);
}

/** The single, neutral placeholder factor — see module doc comment. */
const SEARCH_SIGNAL_PLACEHOLDER = 0.5;

export function computeImpactScore(
  finding: Pick<Finding, "confidence" | "severity" | "location" | "riskLevel">
): number {
  const weighted =
    WEIGHTS.confidence * clamp01(finding.confidence) +
    WEIGHTS.severityUrgency * severityUrgency(finding.severity) +
    WEIGHTS.commercialValue * commercialValue(finding.location) +
    WEIGHTS.actionability * actionability(finding.riskLevel) +
    WEIGHTS.searchSignal * SEARCH_SIGNAL_PLACEHOLDER;

  return Math.round(clamp01(weighted) * 100);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Buckets a 0-100 score into a human label — for reports, not for sorting (sort by the raw number). */
export function impactBucket(score: number): "high" | "medium" | "low" {
  if (score >= 65) return "high";
  if (score >= 40) return "medium";
  return "low";
}
