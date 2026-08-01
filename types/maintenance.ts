/**
 * Sprint 12 — shared types for the autonomous maintenance system. Every
 * maintenance agent (scripts/maintenance/*.ts) reads real project data or
 * makes real network calls and reports what it finds; nothing here
 * represents or implies a mechanism for automatically publishing a
 * factual change. See docs/maintenance-system.md.
 */

/** How a single agent's execution went — distinct from the severity of what it found. A "success" run can still report critical-severity issues; only a genuine execution failure (couldn't read data, threw, etc.) is "failure". */
export type RunStatus = "success" | "warning" | "failure" | "skipped";

/** Severity of an individual finding, not of the run itself. */
export type Severity = "critical" | "warning" | "info";

/** Where a piece of evidence backing a finding came from — always a real, checkable source, never invented. */
export type SourceEvidence = {
  url: string;
  /** ISO 8601 timestamp of when this evidence was actually checked. */
  checkedAt: string;
  status: "ok" | "broken" | "redirect" | "unreachable" | "unknown";
  httpStatus?: number;
  details?: string;
};

/** A single finding surfaced by an agent. */
export type MaintenanceIssue = {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  /** File path, route, or software/comparison slug this issue is about. */
  location?: string;
  evidence?: SourceEvidence[];
};

/**
 * A suggested edit to real project data. This type exists to describe a
 * suggestion for a human to review — nothing in this codebase ever
 * applies a ProposedChange automatically. See the "no automatic factual
 * publishing" rule in docs/maintenance-system.md.
 */
export type ProposedChange = {
  target: string;
  field: string;
  currentValue: string | null;
  proposedValue: string;
  reason: string;
  evidence: SourceEvidence[];
  /** Always true — documents the constraint in the type itself, not just in prose. */
  requiresHumanReview: true;
};

/** One run of one agent. */
export type AgentRun = {
  agent: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: RunStatus;
};

/** The full output of a single maintenance agent — this is what gets serialized to var/maintenance/<agent>.json. */
export type MaintenanceReport<TData = unknown> = {
  agent: string;
  generatedAt: string;
  run: AgentRun;
  summary: string;
  issues: MaintenanceIssue[];
  proposedChanges?: ProposedChange[];
  /** Agent-specific structured payload (link results, freshness rankings, etc.). Null only when run.status is "failure" — the agent never got far enough to produce one. */
  data: TData | null;
};

export function countBySeverity(issues: MaintenanceIssue[]): Record<Severity, number> {
  return {
    critical: issues.filter((issue) => issue.severity === "critical").length,
    warning: issues.filter((issue) => issue.severity === "warning").length,
    info: issues.filter((issue) => issue.severity === "info").length,
  };
}

/** One agent's entry in the master summary — status plus where to find its full report. */
export type MaintenanceSummaryAgentEntry = {
  agent: string;
  status: RunStatus;
  durationMs: number;
  summary: string;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  jsonReportPath: string;
  markdownReportPath: string;
};

/** var/maintenance/latest-summary.json — the output of `npm run maintenance`. */
export type MaintenanceSummary = {
  generatedAt: string;
  agents: MaintenanceSummaryAgentEntry[];
  totalCritical: number;
  totalWarning: number;
  totalInfo: number;
  /** Plain-language next steps for a human — never an instruction to auto-apply anything. */
  recommendedHumanActions: string[];
  /**
   * True unless at least one agent's own run.status is "failure" — a
   * status of "warning" (an escalation-eligible agent found a real
   * critical issue) or plain findings of any severity never flip this to
   * false on their own. This is what gates `npm run maintenance`'s exit
   * code; see lib/maintenance/run-agent.ts.
   */
  allAgentsSucceeded: boolean;
};
