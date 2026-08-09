import type { MaintenanceIssue, MaintenanceReport } from "@/types/maintenance";
import type { AgentRunFn, Finding, RiskLevel } from "@/types/agents";
import { makeFinding } from "@/lib/agents/finding";

/**
 * Phase 2 of the multi-agent build: migrate, don't rewrite. The six
 * existing maintenance agents (scripts/maintenance/*.ts) already do real,
 * working, well-tested-in-production work — this wraps each one's
 * `executeXAgent()` so it plugs into the new registry/orchestrator without
 * touching a single line of its own logic. See docs/agents-architecture.md
 * for why nothing here duplicates scripts/maintenance/seo.ts's checks
 * (canonical/JSON-LD/sitemap/robots/orphan-risk) — that agent is wrapped
 * whole, not decomposed into fake "narrower" registry entries, because the
 * checks share one read of the same data and splitting them would just be
 * relabeling, not narrowing responsibility.
 */

function issueToFinding(agentId: string, issue: MaintenanceIssue, riskLevel: RiskLevel): Finding {
  return makeFinding({
    agentId,
    kind: "issue",
    severity: issue.severity,
    title: issue.title,
    description: issue.description,
    location: issue.location ?? null,
    evidence: (issue.evidence ?? []).map((e) => `[${e.status}]${e.httpStatus ? ` HTTP ${e.httpStatus}` : ""} ${e.url}${e.details ? ` — ${e.details}` : ""}`),
    confidence: 1,
    riskLevel,
    dedupeKey: `${agentId}:${issue.id}`,
    idSuffix: issue.id,
  });
}

/**
 * Wraps a maintenance agent's `executeXAgent()` into the new AgentRunFn
 * shape. `opportunityIds` marks which issue ids represent info-level
 * opportunities (comparisons/affiliate) rather than problems, so they map
 * to Finding.kind "opportunity" instead of "issue" in reports/dashboards.
 */
export function wrapMaintenanceAgent(
  agentId: string,
  execute: () => Promise<MaintenanceReport<unknown>>,
  options: { opportunityKind?: boolean; riskLevel?: RiskLevel } = {}
): AgentRunFn {
  const riskLevel: RiskLevel = options.riskLevel ?? 1;

  return async () => {
    const report = await execute();
    const findings = report.issues.map((issue) =>
      options.opportunityKind
        ? { ...issueToFinding(agentId, issue, riskLevel), kind: "opportunity" as const }
        : issueToFinding(agentId, issue, riskLevel)
    );
    return { summary: report.summary, findings };
  };
}
