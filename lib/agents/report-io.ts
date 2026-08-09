import fs from "node:fs";
import type { AgentSwarmReport, Finding, Severity } from "@/types/agents";
import { AGENTS_DIR, LATEST_REPORT_JSON_PATH, LATEST_REPORT_MARKDOWN_PATH } from "@/lib/agents/paths";

function ensureDir(): void {
  fs.mkdirSync(AGENTS_DIR, { recursive: true });
}

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "🔴 Critical",
  warning: "🟡 Warning",
  info: "🔵 Info",
};

function renderFindingsMarkdown(findings: Finding[]): string {
  if (findings.length === 0) return "No findings.\n";

  const lines: string[] = [];
  for (const finding of findings) {
    lines.push(`### ${SEVERITY_LABEL[finding.severity]} — ${finding.title} (impact ${finding.estimatedImpact ?? "n/a"})`);
    lines.push(`**Agent:** \`${finding.agentId}\` · **Kind:** ${finding.kind} · **Confidence:** ${finding.confidence}`);
    if (finding.location) lines.push(`**Location:** \`${finding.location}\``);
    lines.push("");
    lines.push(finding.description);
    if (finding.recommendedAction) {
      lines.push("");
      lines.push(`**Recommended action:** ${finding.recommendedAction}${finding.requiresApproval ? " _(requires human approval)_" : ""}`);
    }
    if (finding.evidence.length > 0) {
      lines.push("");
      lines.push("**Evidence:**");
      for (const e of finding.evidence) lines.push(`- ${e}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

export function renderSwarmReportMarkdown(report: AgentSwarmReport): string {
  const s = report.summary;
  const qaLines = report.qaResults.map(
    (r) => `- ${r.verdict === "PASS" ? "✅" : r.verdict === "WARN" ? "⚠️" : "❌"} \`${r.agentId}\` — ${r.detail}`
  );

  return [
    `# Growth/QA swarm report — ${report.mode.toUpperCase()}`,
    "",
    `Generated: ${report.generatedAt}`,
    `Runtime: ${report.runtimeMs}ms`,
    "",
    `**Agents:** ${s.agentsInvoked} invoked, ${s.agentsSucceeded} succeeded, ${s.agentsWarned} warned, ${s.agentsFailed} failed, ${s.agentsBlocked} blocked, ${s.agentsSkipped} skipped`,
    `**Findings:** ${report.findings.length} (after merging ${report.duplicatesMerged} duplicates) · ${s.opportunitiesFound} opportunities · ${s.criticalIssues} critical issues · ${s.estimatedHighImpactOpportunities} high-impact`,
    `**QA overall:** ${report.qaOverall}`,
    "",
    "## QA checks",
    "",
    qaLines.join("\n") || "No QA checks ran.",
    "",
    "## Findings (sorted by estimated impact)",
    "",
    renderFindingsMarkdown([...report.findings].sort((a, b) => (b.estimatedImpact ?? 0) - (a.estimatedImpact ?? 0))),
    "## Agent run detail",
    "",
    report.agentResults
      .map((r) => `- \`${r.agentId}\`: ${r.status} (${r.durationMs}ms) — ${r.summary}${r.error ? ` — error: ${r.error}` : ""}`)
      .join("\n"),
  ].join("\n");
}

export function writeSwarmReport(report: AgentSwarmReport): void {
  ensureDir();
  fs.writeFileSync(LATEST_REPORT_JSON_PATH, JSON.stringify(report, null, 2));
  fs.writeFileSync(LATEST_REPORT_MARKDOWN_PATH, renderSwarmReportMarkdown(report));
}

export function readLatestSwarmReport(): AgentSwarmReport | null {
  try {
    const contents = fs.readFileSync(LATEST_REPORT_JSON_PATH, "utf-8");
    return JSON.parse(contents) as AgentSwarmReport;
  } catch {
    return null;
  }
}
