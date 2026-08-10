import { describe, it, expect } from "vitest";
import { run } from "@/scripts/agents/content/comparison-similarity-analyzer";

describe("content-comparison-similarity-analyzer", () => {
  it("runs against the real dataset without throwing and returns a summary describing what was checked", async () => {
    const result = await run({ mode: "full" } as never);
    expect(result.summary).toContain("shared-product comparison-page pairs");
    expect(typeof result.summary).toBe("string");
  });

  it("reports at most one finding (systemic, not per-pair) even though thousands of pairs are checked", async () => {
    const result = await run({ mode: "full" } as never);
    expect(result.findings.length).toBeLessThanOrEqual(1);
  });

  it("explicitly disclaims causation rather than asserting similarity causes non-indexation, if a finding is produced", async () => {
    const result = await run({ mode: "full" } as never);
    for (const f of result.findings) {
      expect(f.description.toLowerCase()).toContain("not a claim that it causes non-indexation");
    }
  });
});
