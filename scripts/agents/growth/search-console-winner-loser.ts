import { GoogleSearchConsoleClient, type SearchAnalyticsRow } from "@/scripts/agents/seo/lib/google-search-console-client";
import { recentAndPriorWindows } from "@/scripts/agents/seo/lib/date-windows";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn, Finding } from "@/types/agents";

/**
 * "Growth winner/loser" — real click-count deltas per page between two
 * adjacent windows. Distinct from ranking-movement (position, per query):
 * this is clicks, per page — the actual traffic outcome, which position
 * alone doesn't capture (a page can hold position but lose clicks to a
 * new SERP feature, or vice versa).
 */

const MIN_CLICKS_TO_CONSIDER = 5; // ignore near-zero-traffic noise
const SIGNIFICANT_RELATIVE_CHANGE = 0.3; // 30%+ swing

export function analyzeWinnersLosers(agentId: string, recentRows: SearchAnalyticsRow[], priorRows: SearchAnalyticsRow[]): Finding[] {
  const priorByPage = new Map(priorRows.map((r) => [r.keys[0], r]));
  const findings: Finding[] = [];

  for (const recentRow of recentRows) {
    const page = recentRow.keys[0];
    const priorRow = priorByPage.get(page);
    const priorClicks = priorRow?.clicks ?? 0;
    if (Math.max(recentRow.clicks, priorClicks) < MIN_CLICKS_TO_CONSIDER) continue;

    const relativeChange = priorClicks === 0 ? Infinity : (recentRow.clicks - priorClicks) / priorClicks;
    if (Math.abs(relativeChange) < SIGNIFICANT_RELATIVE_CHANGE) continue;

    const isWinner = recentRow.clicks > priorClicks;
    findings.push(
      makeFinding({
        agentId,
        kind: isWinner ? "opportunity" : "regression",
        severity: isWinner ? "info" : "warning",
        title: `${isWinner ? "Growth winner" : "Growth loser"}: ${page} (${priorClicks} → ${recentRow.clicks} clicks)`,
        description: `Real clicks for ${page} moved from ${priorClicks} to ${recentRow.clicks} between the two most recent comparable windows (${relativeChange === Infinity ? "new" : `${(relativeChange * 100).toFixed(0)}%`} change).`,
        location: page,
        evidence: [`prior clicks=${priorClicks}`, `recent clicks=${recentRow.clicks}`, `recent impressions=${recentRow.impressions}`],
        confidence: 0.9,
        riskLevel: 1,
        recommendedAction: isWinner ? "Understand what's working here — consider linking to it more, or applying the same pattern elsewhere." : "Investigate the drop — check for a ranking change, a broken element on the page, or a seasonal shift.",
        dedupeKey: `growth-search-console-winner-loser:${page}`,
      })
    );
  }

  return findings;
}

export const run: AgentRunFn = async () => {
  const agentId = "growth-search-console-winner-loser";
  const client = GoogleSearchConsoleClient.fromEnv();
  if (!client) {
    throw new Error("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT / GOOGLE_SEARCH_CONSOLE_PROPERTY not configured — this agent must not run without real credentials.");
  }

  const { recent, prior } = recentAndPriorWindows();
  const [recentRows, priorRows] = await Promise.all([
    client.querySearchAnalytics({ ...recent, dimensions: ["page"], rowLimit: 1000 }),
    client.querySearchAnalytics({ ...prior, dimensions: ["page"], rowLimit: 1000 }),
  ]);
  const findings = analyzeWinnersLosers(agentId, recentRows, priorRows);

  return {
    summary: `Compared real click counts per page across two windows (${prior.startDate}..${prior.endDate} vs ${recent.startDate}..${recent.endDate}). ${findings.length} significant winner(s)/loser(s).`,
    findings,
  };
};
