import type { AgentRun, MaintenanceIssue, MaintenanceReport, RunStatus } from "@/types/maintenance";

/**
 * Uniform execution wrapper every agent script uses. `status` here means
 * "did the agent's own logic run to completion," never "did it like what
 * it found" — a critical-severity issue list normally still yields status
 * "success" (or "warning" if issues exist); only a thrown exception or a
 * "the agent couldn't get the data it needed" case yields "failure".
 *
 * The one exception is `escalateCriticalToFailure`: for agents whose
 * critical findings mean "our own codebase is inconsistent" rather than
 * "something in the outside world changed" (the SEO integrity agent's
 * broken internal references, the recommendation regression agent's
 * failed fixtures), a critical finding IS a real build-integrity problem
 * per Sprint 12's rule that those should fail `npm run maintenance` — so
 * those two agents opt into escalation. Link health and freshness never
 * do: a 404 on a vendor's site or a stale accessedAt is a fact about the
 * world, not a bug in this codebase, and must never block anything
 * automatically. See types/maintenance.ts and docs/maintenance-system.md.
 */
export async function runAgent<TData>(
  agent: string,
  fn: () => Promise<{ summary: string; issues: MaintenanceIssue[]; data: TData }>,
  options: { escalateCriticalToFailure?: boolean } = {}
): Promise<MaintenanceReport<TData>> {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();

  try {
    const { summary, issues, data } = await fn();
    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;
    const hasCritical = issues.some((issue) => issue.severity === "critical");

    const status: RunStatus = hasCritical ? (options.escalateCriticalToFailure ? "failure" : "warning") : "success";

    const run: AgentRun = { agent, startedAt, finishedAt, durationMs, status };

    return {
      agent,
      generatedAt: finishedAt,
      run,
      summary,
      issues,
      data,
    };
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const durationMs = Date.now() - startTime;
    const message = error instanceof Error ? error.message : String(error);

    const run: AgentRun = { agent, startedAt, finishedAt, durationMs, status: "failure" };

    return {
      agent,
      generatedAt: finishedAt,
      run,
      summary: `Agent failed to complete: ${message}`,
      issues: [
        {
          id: `${agent}-execution-failure`,
          severity: "critical",
          title: "Agent execution failed",
          description: message,
        },
      ],
      data: null,
    };
  }
}
