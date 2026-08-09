import { describe, it, expect, vi } from "vitest";
import { runSwarm } from "@/lib/agents/orchestrator";
import type { AgentDefinition, Finding } from "@/types/agents";

/**
 * These tests use small, fully fake registries — not the real 40-agent
 * AGENT_REGISTRY — so they run fast and never touch the network or the
 * real dataset. runSwarm() still writes to the real, gitignored
 * var/agents/state.json as a side effect (same as every other agent in
 * this codebase writing to var/ — see lib/maintenance's identical
 * pattern), which is intentional and harmless for a local test run.
 */

function baseAgent(overrides: Partial<AgentDefinition>): AgentDefinition {
  return {
    id: "fake-agent",
    name: "Fake Agent",
    domain: "qa",
    description: "A fake agent for testing.",
    singleResponsibility: "Do nothing real.",
    inputs: [],
    outputs: [],
    trigger: "scheduled",
    modes: ["quick", "daily", "weekly", "full"],
    dependencies: [],
    permissions: [],
    riskLevel: 0,
    costClass: "free",
    modelRequirement: "none",
    timeoutMs: 1000,
    retryPolicy: { maxAttempts: 1, backoffMs: 0 },
    successCriteria: "n/a",
    failureCriteria: "n/a",
    verificationAgent: null,
    enabled: true,
    blockedReason: null,
    version: "1.0.0",
    run: async () => ({ summary: "ok", findings: [] }),
    ...overrides,
  };
}

function goodFinding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: "f1",
    agentId: "fake-agent",
    kind: "issue",
    severity: "warning",
    title: "t",
    description: "d",
    location: null,
    evidence: [],
    confidence: 0.5,
    recommendedAction: null,
    estimatedImpact: null,
    riskLevel: 1,
    requiresApproval: false,
    artifactsReferenced: [],
    dedupeKey: "f1",
    ...overrides,
  };
}

describe("runSwarm — happy path", () => {
  it("runs a single successful agent and reports success", async () => {
    const agent = baseAgent({ id: "a1", run: async () => ({ summary: "did stuff", findings: [] }) });
    const report = await runSwarm("quick", [agent]);
    expect(report.agentResults).toHaveLength(1);
    expect(report.agentResults[0].status).toBe("success");
    expect(report.summary.agentsSucceeded).toBe(1);
  });
});

describe("runSwarm — malformed agent output", () => {
  it("drops a malformed finding rather than crashing the swarm or polluting the report", async () => {
    const agent = baseAgent({
      id: "a-malformed",
      // Deliberately wrong shape — missing required fields, confidence out of range.
      run: async () => ({ summary: "malformed", findings: [{ confidence: 5 } as unknown as Finding] }),
    });
    const report = await runSwarm("quick", [agent]);
    expect(report.findings).toHaveLength(0);
    expect(report.agentResults[0].summary).toContain("malformed");
  });

  it("treats an agent that ONLY produces malformed output as a failure, not a silent success", async () => {
    const agent = baseAgent({
      id: "a-all-malformed",
      run: async () => ({ summary: "oops", findings: [{} as unknown as Finding] }),
    });
    const report = await runSwarm("quick", [agent]);
    expect(report.agentResults[0].status).toBe("failure");
  });
});

describe("runSwarm — timeout and failure isolation", () => {
  it("marks a hanging agent as failed after its own timeoutMs, without hanging the whole swarm", async () => {
    const hanging = baseAgent({
      id: "a-hangs",
      timeoutMs: 50,
      retryPolicy: { maxAttempts: 1, backoffMs: 0 },
      run: () => new Promise(() => {}), // never resolves
    });
    const fine = baseAgent({ id: "a-fine", run: async () => ({ summary: "ok", findings: [] }) });

    const start = Date.now();
    const report = await runSwarm("quick", [hanging, fine]);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000); // did not hang
    const hangingResult = report.agentResults.find((r) => r.agentId === "a-hangs");
    const fineResult = report.agentResults.find((r) => r.agentId === "a-fine");
    expect(hangingResult?.status).toBe("failure");
    expect(fineResult?.status).toBe("success");
  });

  it("one agent throwing does not stop other agents in the same wave from completing (partial swarm failure)", async () => {
    const throws = baseAgent({
      id: "a-throws",
      run: async () => {
        throw new Error("boom");
      },
    });
    const fine = baseAgent({ id: "a-fine-2", run: async () => ({ summary: "ok", findings: [] }) });

    const report = await runSwarm("quick", [throws, fine]);
    const throwsResult = report.agentResults.find((r) => r.agentId === "a-throws");
    const fineResult = report.agentResults.find((r) => r.agentId === "a-fine-2");
    expect(throwsResult?.status).toBe("failure");
    expect(throwsResult?.error).toContain("boom");
    expect(fineResult?.status).toBe("success");
  });

  it("retries up to maxAttempts before giving up", async () => {
    let attempts = 0;
    const flaky = baseAgent({
      id: "a-flaky",
      retryPolicy: { maxAttempts: 3, backoffMs: 1 },
      run: async () => {
        attempts += 1;
        throw new Error("still failing");
      },
    });
    await runSwarm("quick", [flaky]);
    expect(attempts).toBe(3);
  });
});

describe("runSwarm — conflicting/duplicate recommendations", () => {
  it("merges findings from two different agents that share a dedupeKey, so a human never sees the same recommendation twice", async () => {
    const agentA = baseAgent({
      id: "a-dup-1",
      run: async () => ({ summary: "found it", findings: [goodFinding({ id: "x", agentId: "a-dup-1", dedupeKey: "shared-key", confidence: 0.6 })] }),
    });
    const agentB = baseAgent({
      id: "a-dup-2",
      run: async () => ({ summary: "found it too", findings: [goodFinding({ id: "y", agentId: "a-dup-2", dedupeKey: "shared-key", confidence: 0.9 })] }),
    });

    const report = await runSwarm("quick", [agentA, agentB]);
    expect(report.findings).toHaveLength(1);
    expect(report.duplicatesMerged).toBe(1);
  });
});

describe("runSwarm — scoring", () => {
  it("assigns every non-info finding an estimatedImpact score after the swarm runs", async () => {
    const agent = baseAgent({
      id: "a-scored",
      run: async () => ({ summary: "found", findings: [goodFinding({ id: "s1", agentId: "a-scored", kind: "opportunity", dedupeKey: "s1" })] }),
    });
    const report = await runSwarm("quick", [agent]);
    expect(report.findings[0].estimatedImpact).not.toBeNull();
    expect(report.findings[0].estimatedImpact).toBeGreaterThanOrEqual(0);
  });
});

describe("runSwarm — mode filtering / skipped agents", () => {
  it("does not run an agent outside its declared modes, and reports it as skipped", async () => {
    const weeklyOnly = baseAgent({ id: "a-weekly-only", modes: ["weekly", "full"], run: vi.fn(async () => ({ summary: "should not run", findings: [] })) });
    const report = await runSwarm("quick", [weeklyOnly]);
    expect(weeklyOnly.run).not.toHaveBeenCalled();
    const result = report.agentResults.find((r) => r.agentId === "a-weekly-only");
    expect(result?.status).toBe("skipped");
  });
});

describe("runSwarm — disabled/blocked agents never fake a result", () => {
  it("reports a disabled agent as blocked with its blockedReason, and never invents findings for it", async () => {
    const blocked = baseAgent({ id: "a-blocked", enabled: false, blockedReason: "no credentials", run: null });
    const report = await runSwarm("full", [blocked]);
    const result = report.agentResults.find((r) => r.agentId === "a-blocked");
    expect(result?.status).toBe("blocked");
    expect(result?.summary).toBe("no credentials");
    expect(result?.findings).toEqual([]);
  });
});

describe("runSwarm — dry-run safety / unchanged-site behavior", () => {
  it("running the swarm twice in a row against agents with no side effects produces the same findings both times", async () => {
    const agent = baseAgent({
      id: "a-stable",
      run: async () => ({ summary: "same every time", findings: [goodFinding({ id: "st1", agentId: "a-stable", dedupeKey: "stable-key" })] }),
    });
    const first = await runSwarm("quick", [agent]);
    const second = await runSwarm("quick", [agent]);
    expect(first.findings.map((f) => f.dedupeKey)).toEqual(second.findings.map((f) => f.dedupeKey));
  });

  it("never calls the run function of a disabled agent (dry-run safety for blocked capabilities)", async () => {
    const spy = vi.fn(async () => ({ summary: "should never run", findings: [] }));
    const blocked = baseAgent({ id: "a-never-run", enabled: false, blockedReason: "blocked", run: spy });
    await runSwarm("full", [blocked]);
    expect(spy).not.toHaveBeenCalled();
  });
});
