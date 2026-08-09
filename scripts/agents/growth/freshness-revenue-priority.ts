import { getAllSoftware } from "@/data/software";
import { scoreSoftware } from "@/scripts/maintenance/freshness";
import { getRevenueScore } from "@/lib/revenue/scoring";
import { getRevenueTier } from "@/lib/revenue/tiers";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * Not a new signal — a re-slice of two signals that already exist for
 * real, different reasons (maint-freshness's documentation-recency score,
 * lib/revenue/scoring.ts's revenue score), combined for a growth-specific
 * question neither answers alone: "of everything that's stale, what's
 * actually worth re-researching first?" A stale Tier-C product is low
 * priority; a stale Tier-A product is actively costing potential revenue
 * accuracy. Reuses scoreSoftware()/getRevenueScore() directly rather than
 * re-deriving either scoring model.
 */

const STALE_THRESHOLD = 70; // matches maint-freshness's own issue threshold

export const run: AgentRunFn = async () => {
  const agentId = "growth-freshness-revenue-priority";
  const now = new Date();
  const software = getAllSoftware();

  const findings = [];
  for (const s of software) {
    const freshness = scoreSoftware(s, now);
    if (freshness.score >= STALE_THRESHOLD) continue;

    const tier = getRevenueTier(getRevenueScore(s).totalScore);
    if (tier === "C") continue;

    findings.push(
      makeFinding({
        agentId,
        kind: "opportunity",
        severity: tier === "A" ? "warning" : "info",
        title: `Stale Tier ${tier} product worth re-researching: ${s.name}`,
        description: `${s.name} has a documentation-freshness score of ${freshness.score}/100 (below the ${STALE_THRESHOLD} threshold) and is a revenue Tier ${tier} product. Re-verifying its facts against the vendor's own site would carry more business value than re-checking a lower-tier stale entry.`,
        location: `/software/${s.slug}`,
        evidence: [`Freshness score: ${freshness.score}/100`, `Revenue tier: ${tier}`, ...freshness.factors.filter((f) => f.deduction > 0).map((f) => `${f.label} (-${f.deduction}): ${f.reason}`)],
        confidence: 1,
        riskLevel: 1,
        recommendedAction: `Re-verify ${s.name}'s pricing, features, and other documented facts against its own site, then update accessed_at.`,
        dedupeKey: `${agentId}:${s.slug}`,
      })
    );
  }

  return {
    summary: `Cross-referenced freshness and revenue tier for ${software.length} products. ${findings.length} stale Tier A/B product(s) flagged for priority re-research.`,
    findings,
  };
};
