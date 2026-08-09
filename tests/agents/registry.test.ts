import { describe, it, expect } from "vitest";
import { AGENT_REGISTRY } from "@/lib/agents/registry";
import { topologicalWaves, resolveAgentsForMode, CircularDependencyError } from "@/lib/agents/orchestrator";

describe("agent registry", () => {
  it("has no duplicate agent ids", () => {
    const ids = AGENT_REGISTRY.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no duplicate singleResponsibility statements (a proxy for two agents doing the same job)", () => {
    const responsibilities = AGENT_REGISTRY.map((a) => a.singleResponsibility);
    const seen = new Map<string, string[]>();
    for (const a of AGENT_REGISTRY) {
      seen.set(a.singleResponsibility, [...(seen.get(a.singleResponsibility) ?? []), a.id]);
    }
    const duplicates = Array.from(seen.entries()).filter(([, ids]) => ids.length > 1);
    expect(duplicates, `Duplicate singleResponsibility across agents: ${JSON.stringify(duplicates)}`).toEqual([]);
    expect(responsibilities.length).toBeGreaterThan(0);
  });

  it("every entry with enabled:true has a run function, and every disabled entry has run:null + a blockedReason", () => {
    for (const agent of AGENT_REGISTRY) {
      if (agent.enabled) {
        expect(agent.run, `${agent.id} is enabled but has no run function`).not.toBeNull();
      } else {
        expect(agent.run, `${agent.id} is disabled but still has a run function — should be null`).toBeNull();
        expect(agent.blockedReason, `${agent.id} is disabled but has no blockedReason`).toBeTruthy();
      }
    }
  });

  it("every dependency id refers to a real registry entry", () => {
    const ids = new Set(AGENT_REGISTRY.map((a) => a.id));
    for (const agent of AGENT_REGISTRY) {
      for (const dep of agent.dependencies) {
        expect(ids.has(dep), `${agent.id} depends on unknown agent "${dep}"`).toBe(true);
      }
    }
  });

  it("every verificationAgent id refers to a real registry entry, if set", () => {
    const ids = new Set(AGENT_REGISTRY.map((a) => a.id));
    for (const agent of AGENT_REGISTRY) {
      if (agent.verificationAgent) {
        expect(ids.has(agent.verificationAgent), `${agent.id}'s verificationAgent "${agent.verificationAgent}" doesn't exist`).toBe(true);
      }
    }
  });

  it("has no circular dependencies among enabled agents", () => {
    const agents = AGENT_REGISTRY.filter((a) => a.enabled);
    expect(() => topologicalWaves(agents)).not.toThrow();
  });

  it("every enabled agent appears in at least one operation mode", () => {
    for (const agent of AGENT_REGISTRY.filter((a) => a.enabled)) {
      expect(agent.modes.length, `${agent.id} has no modes`).toBeGreaterThan(0);
    }
  });

  it("resolveAgentsForMode('full') includes every enabled, runnable agent", () => {
    const enabledRunnable = AGENT_REGISTRY.filter((a) => a.enabled && a.run !== null);
    const full = resolveAgentsForMode("full");
    expect(full.length).toBe(enabledRunnable.length);
  });

  it("timeoutMs and retryPolicy are sane for every agent", () => {
    for (const agent of AGENT_REGISTRY) {
      expect(agent.timeoutMs, `${agent.id} timeoutMs too low`).toBeGreaterThan(0);
      expect(agent.retryPolicy.maxAttempts, `${agent.id} maxAttempts must be >= 1`).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("topologicalWaves", () => {
  it("detects a real circular dependency", () => {
    const base = AGENT_REGISTRY[0];
    const a = { ...base, id: "cycle-a", dependencies: ["cycle-b"] };
    const b = { ...base, id: "cycle-b", dependencies: ["cycle-a"] };
    expect(() => topologicalWaves([a, b])).toThrow(CircularDependencyError);
  });

  it("orders independent agents into the same wave", () => {
    const base = AGENT_REGISTRY[0];
    const a = { ...base, id: "indep-a", dependencies: [] };
    const b = { ...base, id: "indep-b", dependencies: [] };
    const waves = topologicalWaves([a, b]);
    expect(waves).toHaveLength(1);
    expect(waves[0].map((x) => x.id).sort()).toEqual(["indep-a", "indep-b"]);
  });

  it("puts a dependent agent in a later wave than its dependency", () => {
    const base = AGENT_REGISTRY[0];
    const upstream = { ...base, id: "upstream", dependencies: [] };
    const downstream = { ...base, id: "downstream", dependencies: ["upstream"] };
    const waves = topologicalWaves([downstream, upstream]);
    expect(waves).toHaveLength(2);
    expect(waves[0][0].id).toBe("upstream");
    expect(waves[1][0].id).toBe("downstream");
  });
});
