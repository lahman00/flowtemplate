/**
 * Shared types for the growth/QA agent swarm (scripts/agents/*.ts,
 * orchestrated by lib/agents/orchestrator.ts). This layer sits ON TOP OF,
 * not instead of, the existing maintenance system (types/maintenance.ts) —
 * the six existing maintenance agents are wrapped, not rewritten (see
 * lib/agents/registry.ts, domain "maintenance-wrapper" entries).
 *
 * Design note on the state model: the brief for this system named ten
 * entities (Opportunity, Finding, Incident, Proposal, Task, Verification,
 * Metric, AgentRun, Approval, Artifact). This file collapses them into
 * three concrete types — AgentDefinition, AgentRunResult, Finding — plus a
 * Summary/Report wrapper, because nothing in this system currently
 * performs an irreversible action: every agent is read-only (inspect,
 * crawl, analyze, score, report). A full Approval ledger or a mutable Task
 * board would be process theater with nothing behind it. Instead, each
 * concern from the fuller model is folded into a field on Finding:
 *   Opportunity/Incident  -> Finding.kind
 *   Proposal/Task         -> Finding.recommendedAction (+ requiresApproval)
 *   Verification          -> Finding.confidence + Finding.evidence +
 *                            AgentDefinition.verificationAgent
 *   Approval               -> Finding.requiresApproval + Finding.riskLevel
 *   Artifact               -> Finding.artifactsReferenced (paths, not files)
 *   Metric                 -> AgentSwarmSummary (aggregate counts), not a
 *                            persisted timeseries — this isn't a metrics
 *                            platform, it's a report generator.
 * If a future agent ever needs to take a real mutating action, extend
 * Finding with a real Approval record at that point — don't build the
 * ledger speculatively for actions that don't exist yet.
 */

import type { Severity } from "./maintenance";

export type { Severity };

/** Coarse-grained domain grouping, used for routing/reporting/dashboard sectioning. */
export type AgentDomain =
  | "orchestration"
  | "seo"
  | "growth"
  | "content"
  | "qa";

/**
 * How much autonomy a finding's recommended action requires before a human
 * acts on it. This is about the ACTION an agent recommends, not about how
 * risky it was to merely observe/report — observation is always Level 0.
 *
 * LEVEL 0 — read-only observation/report. No approval boundary at all.
 * LEVEL 1 — recommends a low-risk, easily-reversible data/content edit
 *           (e.g. "shorten this meta description").
 * LEVEL 2 — recommends a structural content change (e.g. "add this
 *           comparison pair", "add this internal link").
 * LEVEL 3 — recommends a change touching shared infrastructure/config
 *           (e.g. env vars, legal-page copy, analytics wiring).
 * LEVEL 4 — anything resembling the explicitly prohibited action list
 *           (publishing outreach, spend, DNS, deletion) — no agent in this
 *           registry is permitted to reach Level 4 automatically; it exists
 *           so the type system can represent "this would be Level 4" and
 *           force a hard stop rather than silently downgrading it.
 */
export type RiskLevel = 0 | 1 | 2 | 3 | 4;

export type CostClass = "free" | "cheap" | "moderate" | "expensive";

/** What triggers a run: called by the orchestrator on a schedule, or only on demand. */
export type AgentTrigger = "scheduled" | "on-demand";

export type OperationMode = "quick" | "daily" | "weekly" | "full";

export type RetryPolicy = {
  maxAttempts: number;
  backoffMs: number;
};

/**
 * One row of the agent registry (lib/agents/registry.ts). This is metadata
 * ABOUT an agent, resolved by the orchestrator before anything runs — it is
 * not the agent's implementation. `run` is the actual callable, imported
 * from scripts/agents/**.
 */
export type AgentDefinition = {
  id: string;
  name: string;
  domain: AgentDomain;
  description: string;
  /** One sentence. If you can't state this in one sentence, split the agent. */
  singleResponsibility: string;
  /** What real data/signals this agent reads. */
  inputs: string[];
  /** What kind of output it produces (e.g. "Finding[] (opportunity)"). */
  outputs: string[];
  trigger: AgentTrigger;
  /** Which operation modes include this agent. */
  modes: OperationMode[];
  /** Registry ids of agents that must run first (results may be reused). */
  dependencies: string[];
  /** Plain-language description of what this agent is permitted to touch. Every agent in this registry is read-only against product data; permissions describes what it reads/calls, not what it may mutate. */
  permissions: string[];
  riskLevel: RiskLevel;
  costClass: CostClass;
  /** "none" = pure deterministic code. Anything else names what would be required (e.g. "llm:classification") — see modelRequirement below for why none of these run as live LLM calls today. */
  modelRequirement: "none" | "llm:classification" | "llm:judgment";
  timeoutMs: number;
  retryPolicy: RetryPolicy;
  /** Plain-language statement of what "this agent worked" means. */
  successCriteria: string;
  /** Plain-language statement of what "this agent's run should be treated as a failure" means. */
  failureCriteria: string;
  /** Registry id of another agent whose job is to sanity-check this one's output, if any. */
  verificationAgent: string | null;
  enabled: boolean;
  /** Set false (with blockedReason) for a fully-specified agent this environment cannot actually run yet — e.g. it needs an external API credential nobody has configured here. Never fake a result for a blocked agent. */
  blockedReason: string | null;
  version: string;
  /** The actual implementation. Absent for blocked/disabled agents. */
  run: AgentRunFn | null;
};

export type AgentContext = {
  mode: OperationMode;
  /** Previous run's findings for this agent, if any — lets an agent see what it already reported (used for cooldown/dedup, not required). */
  previousFindings: Finding[];
  /** Findings other agents have already produced earlier in this same swarm run, for cross-agent dedup. */
  swarmFindingsSoFar: Finding[];
};

export type AgentRunFn = (ctx: AgentContext) => Promise<{
  summary: string;
  findings: Finding[];
}>;

export type FindingKind = "opportunity" | "issue" | "regression" | "info";

/**
 * The unified atomic output of every agent. Deliberately close to the
 * example schema in the task brief (agent/task/status/finding/evidence/
 * confidence/recommended_action/estimated_impact/risk/requires_approval/
 * artifacts_changed), adapted to this codebase's existing conventions
 * (camelCase, the Severity type already defined for the maintenance
 * system, SourceEvidence-shaped evidence).
 */
export type Finding = {
  id: string;
  agentId: string;
  kind: FindingKind;
  severity: Severity;
  title: string;
  description: string;
  /** Route, slug, or file path this finding is about, if any. */
  location: string | null;
  /** Concrete, checkable backing for the finding — a URL fetched, a file read, a computed count. Never invented. */
  evidence: string[];
  /** 0-1. How sure the agent is. Deterministic checks (a broken link, a missing field) should be 1. Heuristic pattern-matches should be lower. */
  confidence: number;
  recommendedAction: string | null;
  /** 0-100, from lib/agents/scoring.ts — see docs/agents-architecture.md for the formula. Null for pure QA pass/fail findings, which aren't "opportunities" to prioritize. */
  estimatedImpact: number | null;
  riskLevel: RiskLevel;
  requiresApproval: boolean;
  /** File/route paths this finding references — not files it changed, since no agent mutates product data. */
  artifactsReferenced: string[];
  /** A stable key used for cross-run and cross-agent deduplication (see lib/agents/dedupe.ts). Two findings with the same dedupeKey are the same underlying observation. */
  dedupeKey: string;
};

export type AgentOutcomeStatus = "success" | "warning" | "failure" | "blocked" | "skipped";

export type AgentRunResult = {
  agentId: string;
  status: AgentOutcomeStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  summary: string;
  findings: Finding[];
  error: string | null;
};

/** QA-swarm-specific rollup: PASS/WARN/FAIL per check, independent of the growth-finding severity model. */
export type QaVerdict = "PASS" | "WARN" | "FAIL";

export type QaCheckResult = {
  agentId: string;
  verdict: QaVerdict;
  detail: string;
  evidence: string[];
};

/** The full output of one orchestrator run — var/agents/latest-report.json. */
export type AgentSwarmReport = {
  generatedAt: string;
  mode: OperationMode;
  runtimeMs: number;
  agentResults: AgentRunResult[];
  /** All findings across all agents, AFTER cross-agent dedup. */
  findings: Finding[];
  /** How many raw findings were merged away as duplicates. */
  duplicatesMerged: number;
  qaResults: QaCheckResult[];
  qaOverall: QaVerdict;
  summary: AgentSwarmSummary;
};

/** Machine-readable execution summary — Section L of the brief. */
export type AgentSwarmSummary = {
  agentsInvoked: number;
  agentsSucceeded: number;
  agentsWarned: number;
  agentsFailed: number;
  agentsBlocked: number;
  agentsSkipped: number;
  tasksCompleted: number;
  opportunitiesFound: number;
  duplicatesMerged: number;
  criticalIssues: number;
  estimatedHighImpactOpportunities: number;
  runtimeMs: number;
  llmApiCallsMade: number;
};
