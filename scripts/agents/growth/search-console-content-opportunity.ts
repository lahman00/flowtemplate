import { GoogleSearchConsoleClient, type SearchAnalyticsRow } from "@/scripts/agents/seo/lib/google-search-console-client";
import { recentAndPriorWindows } from "@/scripts/agents/seo/lib/date-windows";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn, Finding } from "@/types/agents";

/**
 * "Content opportunity" — real queries Google already shows Miloosh for
 * (real impressions) but ranks poorly on (position beyond a normal
 * first-two-pages range), meaning no existing page serves that query
 * well. Distinct from CTR opportunity (decent position, weak snippet):
 * this is "no strong content exists for this real, evidenced query at
 * all" — the clearest, most evidence-backed version of "write about X"
 * this system can produce, because X is a query real searchers already
 * used to find (or almost find) Miloosh.
 */

const MIN_IMPRESSIONS = 50;
const WEAK_POSITION_THRESHOLD = 30;

export function analyzeContentOpportunities(agentId: string, rows: SearchAnalyticsRow[]): Finding[] {
  return rows
    .filter((r) => r.impressions >= MIN_IMPRESSIONS && r.position > WEAK_POSITION_THRESHOLD)
    .sort((a, b) => b.impressions - a.impressions)
    .map((r) => {
      const query = r.keys[0];
      return makeFinding({
        agentId,
        kind: "opportunity",
        severity: "info",
        title: `Content gap: "${query}" (${r.impressions} impressions, position ${r.position.toFixed(0)})`,
        description: `"${query}" generated ${r.impressions} real impressions but Miloosh's average position was ${r.position.toFixed(1)} — too weak to realistically compete. No existing page appears to serve this query well.`,
        location: null,
        evidence: [`impressions=${r.impressions}`, `clicks=${r.clicks}`, `avgPosition=${r.position.toFixed(1)}`],
        confidence: 0.85,
        riskLevel: 2,
        recommendedAction: `Evaluate whether a dedicated page (a new software entry, category, or comparison — never fabricated content) would genuinely serve "${query}".`,
        dedupeKey: `growth-search-console-content-opportunity:${query}`,
      });
    });
}

export const run: AgentRunFn = async () => {
  const agentId = "growth-search-console-content-opportunity";
  const client = GoogleSearchConsoleClient.fromEnv();
  if (!client) {
    throw new Error("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT / GOOGLE_SEARCH_CONSOLE_PROPERTY not configured — this agent must not run without real credentials.");
  }

  const { recent } = recentAndPriorWindows();
  const rows = await client.querySearchAnalytics({ ...recent, dimensions: ["query"], rowLimit: 1000 });
  const findings = analyzeContentOpportunities(agentId, rows).slice(0, 30);

  return {
    summary: `Analyzed ${rows.length} real queries (${recent.startDate} to ${recent.endDate}). ${findings.length} content-gap opportunity(ies).`,
    findings,
  };
};
