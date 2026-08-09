import { AGENT_REGISTRY } from "@/lib/agents/registry";
import { dedupeFindings } from "@/lib/agents/dedupe";
import { computeImpactScore } from "@/lib/agents/scoring";
import { readState, updateState, writeState, isDismissed } from "@/lib/agents/state";
import type {
  AgentDefinition,
  AgentRunResult,
  AgentSwarmReport,
  AgentSwarmSummary,
  Finding,
  OperationMode,
  QaCheckResult,
  QaVerdict,
} from "@/types/agents";

/**
 * The Growth Orchestrator (Section A of the brief). Responsibilities and
 * where each lives:
 *   - which agents run                -> resolveAgentsForMode()
 *   - dependency order / parallel dispatch -> topologicalWaves()
 *   - duplicate work prevention       -> lib/agents/dedupe.ts
 *   - prioritization                  -> lib/agents/scoring.ts
 *   - budgets/timeouts                -> runWithTimeout()
 *   - safety/quality rules            -> validateFindingShape() (malformed
 *                                        agent output never reaches the report)
 *   - execution state                 -> lib/agents/state.ts
 *   - infinite-loop prevention        -> circular-dependency detection in
 *                                        topologicalWaves() + per-agent
 *                                        timeout (an agent can't hang the
 *                                        swarm) + agents are one-shot pure
 *                                        functions with no self-invocation
 *   - repeated-suggestion suppression -> dismissedKeys in state.ts
 *   - final report                    -> lib/agents/report-io.ts
 */

export class CircularDependencyError extends Error {
  constructor(cycle: string[]) {
    super(`Circular agent dependency detected: ${cycle.join(" -> ")}`);
    this.name = "CircularDependencyError";
  }
}

/** Agents enabled, targeted at this mode, in the registry — before dependency resolution. */
export function resolveAgentsForMode(mode: OperationMode, registry: AgentDefinition[] = AGENT_REGISTRY): AgentDefinition[] {
  return registry.filter((a) => a.enabled && a.run !== null && a.modes.includes(mode));
}

/**
 * Groups agents into ordered "waves": every agent in wave N only depends on
 * agents in waves < N, so all agents within a wave can run in parallel.
 * Throws CircularDependencyError if the dependency graph has a cycle.
 * Dependencies pointing at an agent that isn't part of this run (disabled,
 * or excluded from this mode) are ignored — an agent should not fail to
 * run just because an optional upstream agent isn't active in this mode.
 */
export function topologicalWaves(agents: AgentDefinition[]): AgentDefinition[][] {
  const byId = new Map(agents.map((a) => [a.id, a]));
  const remaining = new Set(agents.map((a) => a.id));
  const waves: AgentDefinition[][] = [];

  let guard = 0;
  while (remaining.size > 0) {
    guard += 1;
    if (guard > agents.length + 1) {
      throw new CircularDependencyError(Array.from(remaining));
    }

    const ready = Array.from(remaining).filter((id) => {
      const deps = byId.get(id)!.dependencies.filter((d) => remaining.has(d) || byId.has(d));
      return deps.every((d) => !remaining.has(d));
    });

    if (ready.length === 0) {
      throw new CircularDependencyError(Array.from(remaining));
    }

    waves.push(ready.map((id) => byId.get(id)!));
    for (const id of ready) remaining.delete(id);
  }

  return waves;
}

class TimeoutError extends Error {}

function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/** Guards against a misbehaving agent handing the orchestrator garbage instead of a Finding[]. */
function validateFindingShape(agentId: string, value: unknown): value is Finding {
  if (typeof value !== "object" || value === null) return false;
  const f = value as Partial<Finding>;
  const ok =
    typeof f.id === "string" &&
    f.agentId === agentId &&
    typeof f.title === "string" &&
    typeof f.description === "string" &&
    typeof f.confidence === "number" &&
    f.confidence >= 0 &&
    f.confidence <= 1 &&
    typeof f.dedupeKey === "string" &&
    Array.isArray(f.evidence) &&
    Array.isArray(f.artifactsReferenced);
  return ok;
}

async function runAgent(agent: AgentDefinition, ctx: Parameters<NonNullable<AgentDefinition["run"]>>[0]): Promise<AgentRunResult> {
  const startedAt = new Date().toISOString();
  const start = Date.now();

  if (!agent.run) {
    return {
      agentId: agent.id,
      status: "blocked",
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: 0,
      summary: agent.blockedReason ?? "Agent is not enabled.",
      findings: [],
      error: null,
    };
  }

  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < agent.retryPolicy.maxAttempts) {
    attempt += 1;
    try {
      const result = await runWithTimeout(agent.run(ctx), agent.timeoutMs, agent.id);
      const malformed = result.findings.filter((f) => !validateFindingShape(agent.id, f));
      const validFindings = result.findings.filter((f) => validateFindingShape(agent.id, f));

      const hasCritical = validFindings.some((f) => f.severity === "critical");
      const status: AgentRunResult["status"] = malformed.length > 0 && validFindings.length === 0 ? "failure" : hasCritical ? "warning" : "success";

      return {
        agentId: agent.id,
        status,
        startedAt,
        finishedAt: new Date().toISOString(),
        durationMs: Date.now() - start,
        summary: malformed.length > 0 ? `${result.summary} (${malformed.length} malformed finding(s) dropped)` : result.summary,
        findings: validFindings,
        error: null,
      };
    } catch (err) {
      lastError = err;
      if (attempt < agent.retryPolicy.maxAttempts) {
        await new Promise((r) => setTimeout(r, agent.retryPolicy.backoffMs));
      }
    }
  }

  return {
    agentId: agent.id,
    status: "failure",
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
    summary: `Agent failed after ${agent.retryPolicy.maxAttempts} attempt(s).`,
    findings: [],
    error: lastError instanceof Error ? lastError.message : String(lastError),
  };
}

function deriveQaVerdict(result: AgentRunResult): QaVerdict {
  if (result.status === "failure") return "FAIL";
  if (result.findings.some((f) => f.severity === "critical")) return "FAIL";
  if (result.status === "warning" || result.findings.some((f) => f.severity === "warning")) return "WARN";
  return "PASS";
}

export async function runSwarm(mode: OperationMode, registry: AgentDefinition[] = AGENT_REGISTRY): Promise<AgentSwarmReport> {
  const swarmStart = Date.now();
  const state = readState();

  const agents = resolveAgentsForMode(mode, registry);
  const waves = topologicalWaves(agents);

  const agentResults: AgentRunResult[] = [];
  const allFindings: Finding[] = [];

  for (const wave of waves) {
    const waveResults = await Promise.all(
      wave.map((agent) =>
        runAgent(agent, {
          mode,
          previousFindings: [],
          swarmFindingsSoFar: allFindings,
        })
      )
    );
    for (const result of waveResults) {
      agentResults.push(result);
      allFindings.push(...result.findings);
    }
  }

  // Include registry entries that were skipped for this mode/disabled, for a complete status picture.
  const skippedOrBlocked = registry.filter((a) => !agents.some((r) => r.id === a.id));
  for (const agent of skippedOrBlocked) {
    if (!agent.enabled) {
      agentResults.push({
        agentId: agent.id,
        status: "blocked",
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 0,
        summary: agent.blockedReason ?? "Disabled in registry.",
        findings: [],
        error: null,
      });
    } else if (!agent.modes.includes(mode)) {
      agentResults.push({
        agentId: agent.id,
        status: "skipped",
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        durationMs: 0,
        summary: `Not included in ${mode} mode (runs in: ${agent.modes.join(", ")}).`,
        findings: [],
        error: null,
      });
    }
  }

  const notDismissed = allFindings.filter((f) => !isDismissed(state, f.dedupeKey));
  const { findings: dedupedFindings, duplicatesMerged } = dedupeFindings(notDismissed);

  const scoredFindings = dedupedFindings.map((f) => ({
    ...f,
    estimatedImpact: f.kind === "info" ? f.estimatedImpact : computeImpactScore(f),
  }));

  const registryById = new Map(registry.map((a) => [a.id, a]));
  // A QA agent "skipped" purely because this mode doesn't include it isn't
  // a health signal — it's out of scope for this run and would otherwise
  // permanently pollute qaOverall with a false WARN on every QUICK run.
  // "blocked" (genuinely disabled/no-credentials) still counts as a real
  // capability gap worth a WARN.
  const qaResults: QaCheckResult[] = agentResults
    .filter((r) => registryById.get(r.agentId)?.domain === "qa" && r.status !== "skipped")
    .map((r) => ({
      agentId: r.agentId,
      verdict: r.status === "blocked" ? "WARN" : deriveQaVerdict(r),
      detail: r.summary,
      evidence: r.findings.flatMap((f) => f.evidence).slice(0, 5),
    }));

  const qaOverall: QaVerdict = qaResults.some((q) => q.verdict === "FAIL")
    ? "FAIL"
    : qaResults.some((q) => q.verdict === "WARN")
      ? "WARN"
      : "PASS";

  const summary: AgentSwarmSummary = {
    agentsInvoked: agentResults.length,
    agentsSucceeded: agentResults.filter((r) => r.status === "success").length,
    agentsWarned: agentResults.filter((r) => r.status === "warning").length,
    agentsFailed: agentResults.filter((r) => r.status === "failure").length,
    agentsBlocked: agentResults.filter((r) => r.status === "blocked").length,
    agentsSkipped: agentResults.filter((r) => r.status === "skipped").length,
    tasksCompleted: agentResults.filter((r) => r.status === "success" || r.status === "warning").length,
    opportunitiesFound: scoredFindings.filter((f) => f.kind === "opportunity").length,
    duplicatesMerged,
    criticalIssues: scoredFindings.filter((f) => f.severity === "critical").length,
    estimatedHighImpactOpportunities: scoredFindings.filter((f) => f.kind === "opportunity" && (f.estimatedImpact ?? 0) >= 65).length,
    runtimeMs: Date.now() - swarmStart,
    llmApiCallsMade: 0,
  };

  const report: AgentSwarmReport = {
    generatedAt: new Date().toISOString(),
    mode,
    runtimeMs: Date.now() - swarmStart,
    agentResults,
    findings: scoredFindings,
    duplicatesMerged,
    qaResults,
    qaOverall,
    summary,
  };

  const nextState = updateState(
    state,
    agents.map((a) => a.id),
    scoredFindings.map((f) => f.dedupeKey)
  );
  writeState(nextState);

  return report;
}
