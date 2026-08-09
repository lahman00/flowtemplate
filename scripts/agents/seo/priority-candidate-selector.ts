import { SITE_URL } from "@/lib/site";
import { GoogleSearchConsoleClient } from "@/scripts/agents/seo/lib/google-search-console-client";
import { inspectSampleWithCache } from "@/scripts/agents/seo/lib/inspect-with-cache";
import { buildSampleUrls } from "@/scripts/agents/seo/indexed-vs-nonindexed-comparator";
import { getAllSoftware, getSoftware } from "@/data/software";
import { computeInboundCounts } from "@/scripts/agents/growth/internal-link-opportunity";
import { wordSet, jaccardSimilarity } from "@/scripts/agents/shared/text-similarity";
import { scoreSoftware } from "@/scripts/maintenance/freshness";
import { getRevenueScore } from "@/lib/revenue/scoring";
import { getRevenueTier } from "@/lib/revenue/tiers";
import { recordCandidateSelection } from "@/lib/agents/experiment-tracker";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn, Finding } from "@/types/agents";
import type { UrlInspectionResult } from "@/scripts/agents/seo/lib/google-search-console-client";

/**
 * Item I: from everything the other indexation-workflow agents observed,
 * pick 5-20 REAL, specific URLs worth a small, reversible experiment —
 * never "fix all 1,307." Revenue tier is used exactly as the brief
 * requires: "as a business prioritization signal, not as an SEO cause" —
 * it breaks ties among equally-evidenced candidates, it never manufactures
 * evidence on its own. Every selection is recorded in
 * lib/agents/experiment-tracker.ts so seo-experiment-verifier can check
 * back later.
 */

const MIN_CANDIDATES = 5;
const MAX_CANDIDATES = 20;
const LOW_INBOUND_THRESHOLD = 2;
const HIGH_SIMILARITY_THRESHOLD = 0.5;
const LOW_FRESHNESS_THRESHOLD = 70;
const STALE_CRAWL_DAYS = 30;

type ScoredCandidate = {
  url: string;
  reasons: string[];
  score: number;
  baselineVerdict: string;
  baselineCoverageState: string | null;
};

export function selectPriorityCandidates(
  crawledNotIndexedUrls: Array<{
    url: string;
    inspection: UrlInspectionResult;
    inboundLinks: number | null;
    maxSimilarityToOther: number | null;
    freshnessScore: number | null;
    revenueTier: "A" | "B" | "C" | null;
  }>,
  now = new Date()
): ScoredCandidate[] {
  const scored: Array<ScoredCandidate & { evidencedReasonCount: number }> = crawledNotIndexedUrls.map((c) => {
    const evidencedReasons: string[] = [];
    let score = 0;

    if (c.inboundLinks !== null && c.inboundLinks <= LOW_INBOUND_THRESHOLD) {
      evidencedReasons.push(`Low internal inbound link count (${c.inboundLinks})`);
      score += 1;
    }
    if (c.maxSimilarityToOther !== null && c.maxSimilarityToOther >= HIGH_SIMILARITY_THRESHOLD) {
      evidencedReasons.push(`High content similarity to another page (${(c.maxSimilarityToOther * 100).toFixed(0)}%)`);
      score += 1;
    }
    if (c.freshnessScore !== null && c.freshnessScore < LOW_FRESHNESS_THRESHOLD) {
      evidencedReasons.push(`Low documentation-freshness score (${c.freshnessScore}/100)`);
      score += 1;
    }
    if (c.inspection.lastCrawlTime) {
      const ageDays = (now.getTime() - new Date(c.inspection.lastCrawlTime).getTime()) / (24 * 60 * 60 * 1000);
      if (ageDays > STALE_CRAWL_DAYS) {
        evidencedReasons.push(`Stale crawl (${Math.round(ageDays)} days ago)`);
        score += 1;
      }
    }

    // Revenue tier breaks ties among equally-evidenced candidates — a business-priority signal, added last and weighted lightly. Kept OUT of evidencedReasonCount below so tier alone can never satisfy "must have at least one evidenced reason."
    const tierBonus = c.revenueTier === "A" ? 0.3 : c.revenueTier === "B" ? 0.15 : 0;
    const reasons = [...evidencedReasons];
    if (tierBonus > 0) reasons.push(`Revenue tier ${c.revenueTier} (business-priority tiebreaker, not an SEO cause)`);

    return {
      url: c.url,
      reasons,
      evidencedReasonCount: evidencedReasons.length,
      score: score + tierBonus,
      baselineVerdict: c.inspection.verdict,
      baselineCoverageState: c.inspection.coverageState,
    };
  });

  return scored
    .filter((c) => c.evidencedReasonCount > 0) // never select a URL on revenue tier alone — it must have at least one real evidenced weakness
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CANDIDATES);
}

export const run: AgentRunFn = async () => {
  const agentId = "seo-priority-candidate-selector";
  const client = GoogleSearchConsoleClient.fromEnv();
  if (!client) {
    throw new Error("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT / GOOGLE_SEARCH_CONSOLE_PROPERTY not configured — this agent must not run without real credentials.");
  }

  const allSoftware = getAllSoftware();
  const sampleUrls = buildSampleUrls();
  const { results } = await inspectSampleWithCache(client, sampleUrls);
  const inboundCounts = computeInboundCounts(allSoftware);

  const crawledNotIndexed = Array.from(results.entries())
    .filter(([, inspection]) => inspection.coverageState?.toLowerCase().includes("crawled") && inspection.coverageState?.toLowerCase().includes("not indexed"))
    .map(([url, inspection]) => {
      const path = url.replace(SITE_URL, "");
      const slug = path.startsWith("/software/") ? path.slice("/software/".length) : null;
      const software = slug ? getSoftware(slug) : undefined;
      return {
        url,
        inspection,
        inboundLinks: slug ? (inboundCounts.get(slug) ?? null) : null,
        maxSimilarityToOther: software ? Math.max(0, ...allSoftware.filter((s) => s.slug !== slug).map((s) => jaccardSimilarity(wordSet(software.description), wordSet(s.description)))) : null,
        freshnessScore: software ? scoreSoftware(software, new Date()).score : null,
        revenueTier: software ? getRevenueTier(getRevenueScore(software).totalScore) : null,
      };
    });

  const candidates = selectPriorityCandidates(crawledNotIndexed);

  const findings: Finding[] = candidates.map((c) => {
    recordCandidateSelection(c.url, c.reasons, c.baselineVerdict, c.baselineCoverageState);
    return makeFinding({
      agentId,
      kind: "opportunity",
      severity: "info",
      title: `Experiment candidate: ${c.url.replace(SITE_URL, "")}`,
      description: `Selected for a minimal, reversible indexation experiment based on ${c.reasons.length} evidenced factor(s): ${c.reasons.join("; ")}.`,
      location: c.url.replace(SITE_URL, ""),
      evidence: [`Baseline verdict: ${c.baselineVerdict}`, `Baseline coverageState: ${c.baselineCoverageState}`, ...c.reasons],
      confidence: 0.5,
      riskLevel: 2,
      requiresApproval: true,
      recommendedAction: "Make one minimal, reversible improvement targeting the strongest evidenced factor above, then let seo-experiment-verifier check back in 2-4 weeks — do not change multiple factors at once, or the result won't be attributable.",
      dedupeKey: `${agentId}:${c.url}`,
    });
  });

  const belowMinimum = candidates.length < MIN_CANDIDATES ? ` (fewer than the target minimum of ${MIN_CANDIDATES} — only URLs with real evidenced reasons were selected, none were padded in to hit a quota)` : "";

  return {
    summary: `Selected ${candidates.length} experiment candidate(s) from ${crawledNotIndexed.length} crawled-not-indexed URLs in the sample${belowMinimum}.`,
    findings,
  };
};
