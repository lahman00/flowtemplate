import { describe, it, expect } from "vitest";
import {
  isInspectionCached,
  partitionByInspectionCache,
  getCachedInspection,
  recordInspection,
  DEFAULT_INSPECTION_COOLDOWN_MS,
} from "@/lib/agents/state";
import type { AgentSwarmState } from "@/lib/agents/state";

/**
 * This cache is the entire mechanism behind "respect quotas... do not
 * inspect all 1,358 URLs repeatedly" — Google's URL Inspection API is
 * 2,000 queries/day, 600/minute, per property, and it's shared across
 * every GSC-backed agent that inspects URLs.
 */

const emptyState: AgentSwarmState = { lastRunAt: {}, firstSeenAt: {}, dismissedKeys: [], indexNowSubmittedAt: {}, urlInspectionCache: {} };

describe("URL Inspection cache/cooldown", () => {
  it("a never-inspected URL is not cached", () => {
    expect(isInspectionCached(emptyState, "https://miloosh.com/software/notion")).toBe(false);
  });

  it("a URL inspected moments ago is cached (within cooldown)", () => {
    const now = Date.now();
    const state = recordInspection(emptyState, "https://miloosh.com/", { verdict: "PASS" }, new Date(now).toISOString());
    expect(isInspectionCached(state, "https://miloosh.com/", DEFAULT_INSPECTION_COOLDOWN_MS, now + 1000)).toBe(true);
  });

  it("a URL inspected before the cooldown window is no longer cached", () => {
    const inspectedAt = Date.now() - DEFAULT_INSPECTION_COOLDOWN_MS - 1000;
    const state = recordInspection(emptyState, "https://miloosh.com/", { verdict: "PASS" }, new Date(inspectedAt).toISOString());
    expect(isInspectionCached(state, "https://miloosh.com/", DEFAULT_INSPECTION_COOLDOWN_MS, Date.now())).toBe(false);
  });

  it("respects a custom cooldown window", () => {
    const now = Date.now();
    const state = recordInspection(emptyState, "https://miloosh.com/", { verdict: "PASS" }, new Date(now - 5000).toISOString());
    expect(isInspectionCached(state, "https://miloosh.com/", 1000, now)).toBe(false); // 5s old, 1s cooldown -> stale
    expect(isInspectionCached(state, "https://miloosh.com/", 10_000, now)).toBe(true); // 5s old, 10s cooldown -> fresh
  });

  it("partitions a URL list into cached vs. needing real inspection — the core quota-respecting mechanism", () => {
    const now = Date.now();
    let state = emptyState;
    state = recordInspection(state, "https://miloosh.com/a", {}, new Date(now).toISOString());
    // https://miloosh.com/b was never inspected.

    const { cached, needsInspection } = partitionByInspectionCache(state, ["https://miloosh.com/a", "https://miloosh.com/b"], DEFAULT_INSPECTION_COOLDOWN_MS, now);
    expect(cached).toEqual(["https://miloosh.com/a"]);
    expect(needsInspection).toEqual(["https://miloosh.com/b"]);
  });

  it("a second run against the same fresh cache needs zero new inspections (repeated-runs guarantee)", () => {
    const now = Date.now();
    const urls = ["https://miloosh.com/a", "https://miloosh.com/b", "https://miloosh.com/c"];
    let state = emptyState;
    for (const url of urls) state = recordInspection(state, url, {}, new Date(now).toISOString());

    const { needsInspection } = partitionByInspectionCache(state, urls, DEFAULT_INSPECTION_COOLDOWN_MS, now + 1000);
    expect(needsInspection).toEqual([]);
  });

  it("retrieves the exact cached result payload", () => {
    const state = recordInspection(emptyState, "https://miloosh.com/", { verdict: "PASS", coverageState: "Submitted and indexed" });
    const cached = getCachedInspection<{ verdict: string; coverageState: string }>(state, "https://miloosh.com/");
    expect(cached).toEqual({ verdict: "PASS", coverageState: "Submitted and indexed" });
  });

  it("returns null for a URL with no cached result", () => {
    expect(getCachedInspection(emptyState, "https://miloosh.com/nowhere")).toBeNull();
  });
});
