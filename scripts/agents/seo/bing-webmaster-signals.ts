import { BingWebmasterClient } from "@/scripts/agents/seo/lib/bing-webmaster-client";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn, Finding } from "@/types/agents";

/**
 * Real Bing Webmaster Tools query-performance signal. Genuinely
 * implemented (scripts/agents/seo/lib/bing-webmaster-client.ts) and
 * unit-tested — blocked only on BING_WEBMASTER_API_KEY /
 * BING_WEBMASTER_SITE_URL, which need an owner to verify the site in
 * Bing Webmaster Tools and generate a key (simpler than the Google flow —
 * no service account, no JWT, and Bing Webmaster Tools can often
 * bulk-import an already-verified Google Search Console property in one
 * click, meaning this may need almost no extra owner effort beyond the
 * GSC setup already required for Phase 2A).
 *
 * Flags the same low-CTR-despite-visibility pattern as the Search
 * Console CTR agent, using Bing's own (much simpler, no date-window)
 * GetQueryStats endpoint — Bing doesn't participate in the same
 * Search Analytics model as Google, so this is intentionally a
 * self-contained, smaller check rather than trying to force Bing's data
 * into the same shape as the GSC agents.
 */

const MIN_IMPRESSIONS = 50;
const LOW_CTR_THRESHOLD = 0.02;

export function analyzeBingQueryOpportunities(agentId: string, stats: Array<{ Query: string; Clicks: number; Impressions: number; AvgImpressionPosition: number }>): Finding[] {
  return stats
    .filter((s) => s.Impressions >= MIN_IMPRESSIONS && s.Clicks / s.Impressions < LOW_CTR_THRESHOLD)
    .map((s) => {
      const ctr = s.Clicks / s.Impressions;
      return makeFinding({
        agentId,
        kind: "opportunity",
        severity: "info",
        title: `Bing: high impressions, low CTR for "${s.Query}"`,
        description: `${s.Impressions} real Bing impressions for "${s.Query}" (avg impression position ${s.AvgImpressionPosition.toFixed(1)}) but only ${(ctr * 100).toFixed(2)}% CTR.`,
        location: null,
        evidence: [`impressions=${s.Impressions}`, `clicks=${s.Clicks}`, `ctr=${(ctr * 100).toFixed(2)}%`],
        confidence: 0.9,
        riskLevel: 2,
        recommendedAction: "Cross-check against the Google Search Console CTR-opportunity findings for the same query before prioritizing.",
        dedupeKey: `${agentId}:${s.Query}`,
      });
    });
}

export const run: AgentRunFn = async () => {
  const agentId = "seo-bing-webmaster-signals";
  const client = BingWebmasterClient.fromEnv();
  if (!client) {
    throw new Error("BING_WEBMASTER_API_KEY / BING_WEBMASTER_SITE_URL not configured — this agent must not run without real credentials.");
  }

  const stats = await client.getQueryStats();
  const findings = analyzeBingQueryOpportunities(agentId, stats);

  return {
    summary: `Analyzed ${stats.length} real Bing query stats. ${findings.length} high-impression/low-CTR opportunity(ies).`,
    findings,
  };
};
