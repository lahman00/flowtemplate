import { GoogleSearchConsoleClient, type SearchAnalyticsRow } from "@/scripts/agents/seo/lib/google-search-console-client";
import { recentAndPriorWindows } from "@/scripts/agents/seo/lib/date-windows";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn, Finding } from "@/types/agents";

/**
 * "High-impression/low-CTR opportunity" (brief Marketing item 17) — real
 * Search Console data: pages Google shows often (real impressions) but
 * that visitors rarely click (real low CTR) despite a decent average
 * position, which points at the title/description rather than the
 * content or ranking. This is the ONE piece genuinely blocked on a
 * credential this environment doesn't have; the logic below
 * (`analyzeCtrOpportunities`) is a pure function unit-tested with
 * synthetic rows (tests/agents/search-console-agents.test.ts) — only the
 * live API call itself is untestable here.
 */

const MIN_IMPRESSIONS = 100;
const MAX_HEALTHY_POSITION = 20; // visible on page 1-2 — a real click opportunity, not a ranking problem
const LOW_CTR_THRESHOLD = 0.02; // 2%

export function analyzeCtrOpportunities(agentId: string, rows: SearchAnalyticsRow[]): Finding[] {
  return rows
    .filter((r) => r.impressions >= MIN_IMPRESSIONS && r.position <= MAX_HEALTHY_POSITION && r.ctr < LOW_CTR_THRESHOLD)
    .map((r) => {
      const page = r.keys[0];
      return makeFinding({
        agentId,
        kind: "opportunity",
        severity: "info",
        title: `High impressions, low CTR: ${page}`,
        description: `${r.impressions} real impressions and average position ${r.position.toFixed(1)} over the analyzed window, but only ${(r.ctr * 100).toFixed(2)}% CTR (${r.clicks} clicks). The page is visible in search but the snippet isn't earning clicks proportionate to its visibility.`,
        location: page,
        evidence: [`impressions=${r.impressions}`, `clicks=${r.clicks}`, `ctr=${(r.ctr * 100).toFixed(2)}%`, `avgPosition=${r.position.toFixed(1)}`],
        confidence: 1,
        riskLevel: 2,
        recommendedAction: "Review and rewrite this page's title/meta description — it's earning impressions but not clicks.",
        dedupeKey: `growth-search-console-ctr-opportunity:${page}`,
      });
    });
}

export const run: AgentRunFn = async () => {
  const agentId = "growth-search-console-ctr-opportunity";
  const client = GoogleSearchConsoleClient.fromEnv();
  if (!client) {
    throw new Error("GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT / GOOGLE_SEARCH_CONSOLE_PROPERTY not configured — this agent must not run without real credentials.");
  }

  const { recent } = recentAndPriorWindows();
  const rows = await client.querySearchAnalytics({ ...recent, dimensions: ["page"], rowLimit: 500 });
  const findings = analyzeCtrOpportunities(agentId, rows);

  return {
    summary: `Analyzed ${rows.length} pages' real Search Console performance (${recent.startDate} to ${recent.endDate}). ${findings.length} high-impression/low-CTR opportunity(ies).`,
    findings,
  };
};
