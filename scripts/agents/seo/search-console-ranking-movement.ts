import { GoogleSearchConsoleClient, type SearchAnalyticsRow } from "@/scripts/agents/seo/lib/google-search-console-client";
import { recentAndPriorWindows } from "@/scripts/agents/seo/lib/date-windows";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn, Finding } from "@/types/agents";

/**
 * "Ranking movement" — compares real average position per query between
 * two adjacent windows (no historical state needed; both windows are
 * queried fresh each run — see date-windows.ts). A real drop signals
 * something worth investigating (a competitor outranking, a technical
 * regression, seasonal demand); a real gain is worth noting as an
 * opportunity to reinforce. Position deltas are compared only for
 * queries with meaningful impression volume in both windows — otherwise
 * a query with 2 impressions moving from position 45 to 12 is noise, not
 * signal.
 */

const MIN_IMPRESSIONS_BOTH_WINDOWS = 20;
const SIGNIFICANT_POSITION_DELTA = 5; // positions

export function analyzeRankingMovement(agentId: string, recentRows: SearchAnalyticsRow[], priorRows: SearchAnalyticsRow[]): Finding[] {
  const priorByQuery = new Map(priorRows.map((r) => [r.keys[0], r]));
  const findings: Finding[] = [];

  for (const recentRow of recentRows) {
    const query = recentRow.keys[0];
    const priorRow = priorByQuery.get(query);
    if (!priorRow) continue;
    if (recentRow.impressions < MIN_IMPRESSIONS_BOTH_WINDOWS || priorRow.impressions < MIN_IMPRESSIONS_BOTH_WINDOWS) continue;

    const delta = recentRow.position - priorRow.position; // positive = worse (position numbers count up from 1)
    if (Math.abs(delta) < SIGNIFICANT_POSITION_DELTA) continue;

    const worsened = delta > 0;
    findings.push(
      makeFinding({
        agentId,
        kind: worsened ? "regression" : "opportunity",
        severity: worsened ? "warning" : "info",
        title: `${worsened ? "Ranking dropped" : "Ranking improved"}: "${query}" (${priorRow.position.toFixed(1)} → ${recentRow.position.toFixed(1)})`,
        description: `Average position for "${query}" moved from ${priorRow.position.toFixed(1)} to ${recentRow.position.toFixed(1)} between the two most recent comparable windows (${Math.abs(delta).toFixed(1)} position ${worsened ? "worse" : "better"}), with ${recentRow.impressions} recent impressions.`,
        location: null,
        evidence: [`prior position=${priorRow.position.toFixed(1)} (${priorRow.impressions} impressions)`, `recent position=${recentRow.position.toFixed(1)} (${recentRow.impressions} impressions)`],
        confidence: 0.9,
        riskLevel: 1,
        recommendedAction: worsened ? `Investigate why "${query}" dropped — check for new competitors, a technical regression, or content staleness.` : `"${query}" is trending up — consider reinforcing with an internal link or fresher content.`,
        dedupeKey: `seo-search-console-ranking-movement:${query}`,
      })
    );
  }

  return findings;
}

export const run: AgentRunFn = async () => {
  const agentId = "seo-search-console-ranking-movement";
  const client = GoogleSearchConsoleClient.fromEnv();
  if (!client) {
    throw new Error("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT / GOOGLE_SEARCH_CONSOLE_PROPERTY not configured — this agent must not run without real credentials.");
  }

  const { recent, prior } = recentAndPriorWindows();
  const [recentRows, priorRows] = await Promise.all([
    client.querySearchAnalytics({ ...recent, dimensions: ["query"], rowLimit: 1000 }),
    client.querySearchAnalytics({ ...prior, dimensions: ["query"], rowLimit: 1000 }),
  ]);
  const findings = analyzeRankingMovement(agentId, recentRows, priorRows);

  return {
    summary: `Compared real average position for queries across two windows (${prior.startDate}..${prior.endDate} vs ${recent.startDate}..${recent.endDate}). ${findings.length} significant movement(s).`,
    findings,
  };
};
