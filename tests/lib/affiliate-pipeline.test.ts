import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  setPipelineStatus,
  getPipelineEntry,
  readAffiliatePipeline,
  isValidTransition,
  countByPipelineStatus,
} from "@/lib/revenue/affiliate-pipeline";

const PIPELINE_PATH = path.join(process.cwd(), "var", "agents", "affiliate-pipeline.json");

// Same backup/restore discipline as tests/agents/experiment-tracker.test.ts —
// this file holds the real, already-submitted Pipedrive application record
// and must never be permanently wiped by a test run.
let realBackup: string | null = null;

beforeAll(() => {
  realBackup = fs.existsSync(PIPELINE_PATH) ? fs.readFileSync(PIPELINE_PATH, "utf-8") : null;
});

beforeEach(() => {
  fs.rmSync(PIPELINE_PATH, { force: true });
});

afterAll(() => {
  if (realBackup !== null) {
    fs.mkdirSync(path.dirname(PIPELINE_PATH), { recursive: true });
    fs.writeFileSync(PIPELINE_PATH, realBackup);
  } else {
    fs.rmSync(PIPELINE_PATH, { force: true });
  }
});

describe("affiliate pipeline state transitions", () => {
  it("starts unresearched for a slug with no entry", () => {
    expect(getPipelineEntry("clickup")).toBeUndefined();
  });

  it("allows the documented lifecycle path", () => {
    setPipelineStatus("clickup", "program_found");
    setPipelineStatus("clickup", "verified");
    setPipelineStatus("clickup", "ready_to_apply");
    setPipelineStatus("clickup", "application_in_progress");
    setPipelineStatus("clickup", "submitted");
    const updated = setPipelineStatus("clickup", "pending_review");
    expect(updated.status).toBe("pending_review");
    expect(updated.submittedAt).not.toBeNull();
  });

  it("rejects an invalid transition (skipping states)", () => {
    expect(() => setPipelineStatus("notion", "pending_review")).toThrow(/Invalid affiliate pipeline transition/);
  });

  it("rejects going backward from a terminal-ish state without an allowed edge", () => {
    setPipelineStatus("figma", "program_found");
    setPipelineStatus("figma", "verified");
    setPipelineStatus("figma", "ready_to_apply");
    setPipelineStatus("figma", "application_in_progress");
    setPipelineStatus("figma", "submitted");
    setPipelineStatus("figma", "pending_review");
    setPipelineStatus("figma", "approved");
    setPipelineStatus("figma", "affiliate_link_received", { affiliateUrl: "https://example.com/ref/abc" });
    setPipelineStatus("figma", "activated");
    setPipelineStatus("figma", "earning");
    expect(() => setPipelineStatus("figma", "submitted")).toThrow();
  });

  it("re-recording the same status is always allowed (idempotent)", () => {
    setPipelineStatus("canva", "program_found");
    expect(() => setPipelineStatus("canva", "program_found", { note: "still found" })).not.toThrow();
  });

  it("isValidTransition matches setPipelineStatus's own enforcement", () => {
    expect(isValidTransition("unresearched", "program_found")).toBe(true);
    expect(isValidTransition("unresearched", "approved")).toBe(false);
    expect(isValidTransition("earning", "earning")).toBe(true);
    expect(isValidTransition("earning", "unresearched")).toBe(false);
  });

  it("does not create duplicate entries for the same slug", () => {
    setPipelineStatus("miro", "program_found");
    setPipelineStatus("miro", "verified");
    const all = readAffiliatePipeline().filter((e) => e.slug === "miro");
    expect(all).toHaveLength(1);
  });

  it("appends every transition to history without rewriting prior entries", () => {
    setPipelineStatus("asana", "program_found", { note: "first" });
    setPipelineStatus("asana", "verified", { note: "second" });
    const entry = getPipelineEntry("asana")!;
    expect(entry.history).toHaveLength(2);
    expect(entry.history[0].note).toBe("first");
    expect(entry.history[1].note).toBe("second");
  });

  it("rejected can move back to needs_more_research or ready_to_apply (reapply path)", () => {
    setPipelineStatus("todoist", "program_found");
    setPipelineStatus("todoist", "verified");
    setPipelineStatus("todoist", "ready_to_apply");
    setPipelineStatus("todoist", "application_in_progress");
    setPipelineStatus("todoist", "submitted");
    setPipelineStatus("todoist", "pending_review");
    const rejected = setPipelineStatus("todoist", "rejected");
    expect(rejected.rejectedAt).not.toBeNull();
    expect(() => setPipelineStatus("todoist", "ready_to_apply")).not.toThrow();
  });

  it("countByPipelineStatus tallies real entries and zero-initializes every status", () => {
    setPipelineStatus("slack", "program_found");
    const counts = countByPipelineStatus();
    expect(counts.program_found).toBeGreaterThanOrEqual(1);
    expect(counts.earning).toBe(0);
  });
});
