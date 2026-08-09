import { SITE_URL } from "@/lib/site";
import { checkUrlsWithConcurrency } from "@/lib/maintenance/http";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * The core, hand-picked marketing/legal routes a real visitor could land
 * on directly (nav links, footer links, direct bookmarks) — checked every
 * run regardless of mode, since a break here is maximally visible.
 * Distinct from seo-redirect-broken-url-check's much larger sampled set.
 */
const CRITICAL_ROUTES = ["/", "/recommend", "/compare", "/about", "/contact", "/privacy", "/cookies", "/terms"];

export const run: AgentRunFn = async () => {
  const agentId = "qa-critical-route-availability";
  const results = await checkUrlsWithConcurrency(
    CRITICAL_ROUTES.map((path) => `${SITE_URL}${path}`),
    4
  );

  const findings = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const path = CRITICAL_ROUTES[i];
    if (result.outcome === "ok") continue;

    findings.push(
      makeFinding({
        agentId,
        kind: "issue",
        severity: "critical",
        title: `Critical route not healthy: ${path}`,
        description: `${path} returned outcome "${result.outcome}"${result.httpStatus ? ` (HTTP ${result.httpStatus})` : ""}. This is a core navigation route.`,
        location: path,
        evidence: [`${result.finalUrl ?? path} — ${result.outcome}`],
        confidence: 1,
        riskLevel: 0,
        recommendedAction: "Investigate immediately.",
        dedupeKey: `${agentId}:${path}`,
      })
    );
  }

  return {
    summary: `Checked ${CRITICAL_ROUTES.length} critical routes. ${findings.length} not healthy.`,
    findings,
  };
};
