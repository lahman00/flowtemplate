import fs from "node:fs";
import type { MaintenanceIssue, MaintenanceReport, MaintenanceSummary, Severity } from "@/types/maintenance";
import { MAINTENANCE_DIR, reportJsonPath, reportMarkdownPath, SUMMARY_JSON_PATH, SUMMARY_MARKDOWN_PATH } from "@/lib/maintenance/paths";

function ensureDir(): void {
  fs.mkdirSync(MAINTENANCE_DIR, { recursive: true });
}

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "🔴 Critical",
  warning: "🟡 Warning",
  info: "🔵 Info",
};

function renderIssuesMarkdown(issues: MaintenanceIssue[]): string {
  if (issues.length === 0) {
    return "No issues found.\n";
  }

  const lines: string[] = [];
  for (const issue of issues) {
    lines.push(`### ${SEVERITY_LABEL[issue.severity]} — ${issue.title}`);
    if (issue.location) lines.push(`**Location:** \`${issue.location}\``);
    lines.push("");
    lines.push(issue.description);
    if (issue.evidence && issue.evidence.length > 0) {
      lines.push("");
      lines.push("**Evidence:**");
      for (const evidence of issue.evidence) {
        const statusPart = evidence.httpStatus ? ` (HTTP ${evidence.httpStatus})` : "";
        lines.push(`- [${evidence.status}]${statusPart} ${evidence.url}${evidence.details ? ` — ${evidence.details}` : ""}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

/** Renders a MaintenanceReport as a standalone Markdown document. Agent-specific `data` is rendered separately by each agent via `extraSections`. */
export function renderReportMarkdown<TData>(report: MaintenanceReport<TData>, extraSections = ""): string {
  const critical = report.issues.filter((i) => i.severity === "critical").length;
  const warning = report.issues.filter((i) => i.severity === "warning").length;
  const info = report.issues.filter((i) => i.severity === "info").length;

  return [
    `# ${report.agent} — maintenance report`,
    "",
    `Generated: ${report.generatedAt}`,
    `Run status: ${report.run.status} (${report.run.durationMs}ms)`,
    "",
    `${report.summary}`,
    "",
    `**Issues:** ${critical} critical, ${warning} warning, ${info} info`,
    "",
    extraSections,
    "## Issues",
    "",
    renderIssuesMarkdown(report.issues),
  ].join("\n");
}

export function writeReport<TData>(report: MaintenanceReport<TData>, extraMarkdownSections = ""): void {
  ensureDir();
  fs.writeFileSync(reportJsonPath(report.agent), JSON.stringify(report, null, 2));
  fs.writeFileSync(reportMarkdownPath(report.agent), renderReportMarkdown(report, extraMarkdownSections));
}

export function writeSummary(summary: MaintenanceSummary, markdown: string): void {
  ensureDir();
  fs.writeFileSync(SUMMARY_JSON_PATH, JSON.stringify(summary, null, 2));
  fs.writeFileSync(SUMMARY_MARKDOWN_PATH, markdown);
}

export function readLatestSummary(): MaintenanceSummary | null {
  try {
    const contents = fs.readFileSync(SUMMARY_JSON_PATH, "utf-8");
    return JSON.parse(contents) as MaintenanceSummary;
  } catch {
    return null;
  }
}

export function readAgentReport<TData = unknown>(agent: string): MaintenanceReport<TData> | null {
  try {
    const contents = fs.readFileSync(reportJsonPath(agent), "utf-8");
    return JSON.parse(contents) as MaintenanceReport<TData>;
  } catch {
    return null;
  }
}
