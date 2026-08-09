import { SITE_URL } from "@/lib/site";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * The single fastest, coarsest check in the whole swarm: is production
 * even up? Distinct from qa-homepage-smoke (which checks page content) —
 * this only checks that the origin responds at all and returns real HTML,
 * so it can run first/fast as a fail-fast gate.
 */
export const run: AgentRunFn = async () => {
  const agentId = "qa-production-deployment-smoke";
  try {
    const res = await fetch(SITE_URL, { signal: AbortSignal.timeout(10_000) });
    const contentType = res.headers.get("content-type") ?? "";

    if (res.status !== 200 || !contentType.includes("text/html")) {
      return {
        summary: `Production smoke check failed: HTTP ${res.status}, content-type "${contentType}".`,
        findings: [
          makeFinding({
            agentId,
            kind: "issue",
            severity: "critical",
            title: "Production origin not healthy",
            description: `${SITE_URL} returned HTTP ${res.status} with content-type "${contentType}" (expected 200 text/html).`,
            location: "/",
            evidence: [`HTTP ${res.status}`, `content-type: ${contentType}`],
            confidence: 1,
            riskLevel: 0,
            recommendedAction: "Investigate immediately — production may be down or misconfigured.",
            dedupeKey: `${agentId}:unhealthy`,
          }),
        ],
      };
    }

    return { summary: `Production origin (${SITE_URL}) healthy: HTTP 200, text/html.`, findings: [] };
  } catch (err) {
    return {
      summary: "Production origin unreachable.",
      findings: [
        makeFinding({
          agentId,
          kind: "issue",
          severity: "critical",
          title: "Production origin unreachable",
          description: `Fetch to ${SITE_URL} failed: ${err instanceof Error ? err.message : String(err)}`,
          location: "/",
          evidence: [String(err)],
          confidence: 1,
          riskLevel: 0,
          recommendedAction: "Investigate immediately.",
          dedupeKey: `${agentId}:unreachable`,
        }),
      ],
    };
  }
};
