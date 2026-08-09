import { getAllSoftware, type Software } from "@/data/software";
import { getComparisonsInvolving } from "@/data/comparisons";
import { getRelatedSoftware } from "@/lib/related";
import { getRevenueScore } from "@/lib/revenue/scoring";
import { getRevenueTier } from "@/lib/revenue/tiers";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * Computes a real inbound-internal-link count per software page by
 * replaying the actual link-placement logic the site uses at render
 * time (not a live crawl): its own category page (always +1 — every
 * category page lists every software in it), every comparison it's
 * published in, every OTHER software page whose alternatives[] names it,
 * and every other software page whose getRelatedSoftware() picks it
 * (the same function app/software/[slug]/page.tsx actually calls).
 *
 * A true zero-inbound orphan is structurally impossible today (the
 * category link alone prevents it) — so this agent's real signal is
 * "under-linked relative to its business value": a Tier A/B revenue
 * product with only the bare-minimum category link and nothing else
 * pointing to it is leaving real internal link equity on the table.
 */

const LOW_INBOUND_THRESHOLD = 2; // category link + at most 1 other

/** Exported so other agents (e.g. seo-indexed-vs-nonindexed-comparator.ts's internal-link-strength dimension) can reuse this same computation instead of re-deriving it. */
export function computeInboundCounts(allSoftware: Software[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const s of allSoftware) counts.set(s.slug, 1); // its own category page

  for (const s of allSoftware) {
    for (const alt of s.alternatives) {
      if (counts.has(alt.slug)) counts.set(alt.slug, (counts.get(alt.slug) ?? 0) + 1);
    }
    for (const related of getRelatedSoftware(s, 3)) {
      counts.set(related.slug, (counts.get(related.slug) ?? 0) + 1);
    }
  }

  for (const s of allSoftware) {
    const comparisonCount = getComparisonsInvolving(s.slug).length;
    counts.set(s.slug, (counts.get(s.slug) ?? 0) + comparisonCount);
  }

  return counts;
}

export const run: AgentRunFn = async () => {
  const agentId = "growth-internal-link-opportunity";
  const allSoftware = getAllSoftware();
  const inboundCounts = computeInboundCounts(allSoftware);

  const findings = [];
  for (const s of allSoftware) {
    const count = inboundCounts.get(s.slug) ?? 0;
    if (count > LOW_INBOUND_THRESHOLD) continue;

    const tier = getRevenueTier(getRevenueScore(s).totalScore);
    if (tier === "C") continue; // low-value pages aren't worth prioritizing for link-building

    findings.push(
      makeFinding({
        agentId,
        kind: "opportunity",
        severity: "info",
        title: `Under-linked Tier ${tier} page: ${s.name}`,
        description: `/software/${s.slug} has only ${count} computed inbound internal link source(s) (category page${count > 1 ? " + others" : " only"}), despite being a revenue Tier ${tier} product. More internal links from related software pages, comparisons, or category context would help both crawl discovery and click-through.`,
        location: `/software/${s.slug}`,
        evidence: [`Computed inbound link sources: ${count}`, `Revenue tier: ${tier}`],
        confidence: 0.85,
        riskLevel: 2,
        recommendedAction: `Consider adding a comparison page involving ${s.name}, or check why it isn't appearing in more related-software lists.`,
        dedupeKey: `${agentId}:${s.slug}`,
      })
    );
  }

  return {
    summary: `Computed inbound internal-link counts for ${allSoftware.length} software pages. ${findings.length} under-linked Tier A/B page(s) flagged.`,
    findings,
  };
};
