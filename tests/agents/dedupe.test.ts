import { describe, it, expect } from "vitest";
import { dedupeFindings } from "@/lib/agents/dedupe";
import type { Finding } from "@/types/agents";

function finding(overrides: Partial<Finding>): Finding {
  return {
    id: "f1",
    agentId: "test-agent",
    kind: "issue",
    severity: "warning",
    title: "Test finding",
    description: "desc",
    location: null,
    evidence: [],
    confidence: 0.5,
    recommendedAction: null,
    estimatedImpact: null,
    riskLevel: 1,
    requiresApproval: false,
    artifactsReferenced: [],
    dedupeKey: "key-1",
    ...overrides,
  };
}

describe("dedupeFindings", () => {
  it("merges two findings that share a dedupeKey — this is the 'ten agents recommend the same fix' scenario from the brief", () => {
    const a = finding({ id: "a", agentId: "agent-a", dedupeKey: "same-key", confidence: 0.6 });
    const b = finding({ id: "b", agentId: "agent-b", dedupeKey: "same-key", confidence: 0.9 });
    const c = finding({ id: "c", agentId: "agent-c", dedupeKey: "same-key", confidence: 0.3 });

    const { findings, duplicatesMerged } = dedupeFindings([a, b, c]);

    expect(findings).toHaveLength(1);
    expect(duplicatesMerged).toBe(2);
    expect(findings[0].id).toBe("b"); // highest confidence wins
  });

  it("keeps findings with different dedupeKeys separate", () => {
    const a = finding({ id: "a", dedupeKey: "key-a" });
    const b = finding({ id: "b", dedupeKey: "key-b" });
    const { findings, duplicatesMerged } = dedupeFindings([a, b]);
    expect(findings).toHaveLength(2);
    expect(duplicatesMerged).toBe(0);
  });

  it("breaks a confidence tie by severity (critical > warning > info)", () => {
    const a = finding({ id: "a", dedupeKey: "k", confidence: 0.8, severity: "info" });
    const b = finding({ id: "b", dedupeKey: "k", confidence: 0.8, severity: "critical" });
    const { findings } = dedupeFindings([a, b]);
    expect(findings[0].id).toBe("b");
  });

  it("handles an empty list without throwing", () => {
    expect(dedupeFindings([])).toEqual({ findings: [], duplicatesMerged: 0 });
  });

  it("is stable: running twice on the same already-deduped input changes nothing", () => {
    const a = finding({ id: "a", dedupeKey: "k1" });
    const b = finding({ id: "b", dedupeKey: "k2" });
    const first = dedupeFindings([a, b]);
    const second = dedupeFindings(first.findings);
    expect(second.duplicatesMerged).toBe(0);
    expect(second.findings).toHaveLength(2);
  });
});
