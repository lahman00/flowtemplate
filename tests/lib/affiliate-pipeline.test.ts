import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  setPipelineStatus,
  getPipelineEntry,
  readAffiliatePipeline,
  isValidTransition,
  countByPipelineStatus,
  fastTrackToSubmitted,
} from "@/lib/revenue/affiliate-pipeline";

const PIPELINE_PATH = path.join(process.cwd(), "var", "agents", "affiliate-pipeline.json");

// Same backup/restore discipline as tests/agents/experiment-tracker.test.ts —
// this file holds the real, already-submitted Pipedrive application record
// and must never be permanently wiped by a test run.
let realBackup: string | null = null;
// Force the local-file fallback path regardless of what's in the shell env
// (e.g. a developer who ran `vercel env pull`) — these tests verify the
// state-machine logic, not real network calls to the Blob store.
let realBlobToken: string | undefined;

beforeAll(() => {
  realBackup = fs.existsSync(PIPELINE_PATH) ? fs.readFileSync(PIPELINE_PATH, "utf-8") : null;
  realBlobToken = process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_READ_WRITE_TOKEN;
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
  if (realBlobToken !== undefined) process.env.BLOB_READ_WRITE_TOKEN = realBlobToken;
});

describe("affiliate pipeline state transitions", () => {
  it("starts unresearched for a slug with no entry", async () => {
    expect(await getPipelineEntry("clickup")).toBeUndefined();
  });

  it("allows the documented lifecycle path", async () => {
    await setPipelineStatus("clickup", "program_found");
    await setPipelineStatus("clickup", "verified");
    await setPipelineStatus("clickup", "ready_to_apply");
    await setPipelineStatus("clickup", "application_in_progress");
    await setPipelineStatus("clickup", "submitted");
    const updated = await setPipelineStatus("clickup", "pending_review");
    expect(updated.status).toBe("pending_review");
    expect(updated.submittedAt).not.toBeNull();
  });

  it("rejects an invalid transition (skipping states)", async () => {
    await expect(setPipelineStatus("notion", "pending_review")).rejects.toThrow(/Invalid affiliate pipeline transition/);
  });

  it("rejects going backward from a terminal-ish state without an allowed edge", async () => {
    await setPipelineStatus("figma", "program_found");
    await setPipelineStatus("figma", "verified");
    await setPipelineStatus("figma", "ready_to_apply");
    await setPipelineStatus("figma", "application_in_progress");
    await setPipelineStatus("figma", "submitted");
    await setPipelineStatus("figma", "pending_review");
    await setPipelineStatus("figma", "approved");
    await setPipelineStatus("figma", "affiliate_link_received", { affiliateUrl: "https://example.com/ref/abc" });
    await setPipelineStatus("figma", "activated");
    await setPipelineStatus("figma", "earning");
    await expect(setPipelineStatus("figma", "submitted")).rejects.toThrow();
  });

  it("re-recording the same status is always allowed (idempotent)", async () => {
    await setPipelineStatus("canva", "program_found");
    await expect(setPipelineStatus("canva", "program_found", { note: "still found" })).resolves.not.toThrow();
  });

  it("isValidTransition matches setPipelineStatus's own enforcement", () => {
    expect(isValidTransition("unresearched", "program_found")).toBe(true);
    expect(isValidTransition("unresearched", "approved")).toBe(false);
    expect(isValidTransition("earning", "earning")).toBe(true);
    expect(isValidTransition("earning", "unresearched")).toBe(false);
  });

  it("does not create duplicate entries for the same slug", async () => {
    await setPipelineStatus("miro", "program_found");
    await setPipelineStatus("miro", "verified");
    const all = (await readAffiliatePipeline()).filter((e) => e.slug === "miro");
    expect(all).toHaveLength(1);
  });

  it("appends every transition to history without rewriting prior entries", async () => {
    await setPipelineStatus("asana", "program_found", { note: "first" });
    await setPipelineStatus("asana", "verified", { note: "second" });
    const entry = (await getPipelineEntry("asana"))!;
    expect(entry.history).toHaveLength(2);
    expect(entry.history[0].note).toBe("first");
    expect(entry.history[1].note).toBe("second");
  });

  it("rejected can move back to needs_more_research or ready_to_apply (reapply path)", async () => {
    await setPipelineStatus("todoist", "program_found");
    await setPipelineStatus("todoist", "verified");
    await setPipelineStatus("todoist", "ready_to_apply");
    await setPipelineStatus("todoist", "application_in_progress");
    await setPipelineStatus("todoist", "submitted");
    await setPipelineStatus("todoist", "pending_review");
    const rejected = await setPipelineStatus("todoist", "rejected");
    expect(rejected.rejectedAt).not.toBeNull();
    await expect(setPipelineStatus("todoist", "ready_to_apply")).resolves.not.toThrow();
  });

  it("countByPipelineStatus tallies real entries and zero-initializes every status", async () => {
    await setPipelineStatus("slack", "program_found");
    const counts = await countByPipelineStatus();
    expect(counts.program_found).toBeGreaterThanOrEqual(1);
    expect(counts.earning).toBe(0);
  });

  it("fastTrackToSubmitted chains a fresh slug all the way to submitted in one call", async () => {
    const result = await fastTrackToSubmitted("hubspot");
    expect(result.status).toBe("submitted");
    const entry = (await getPipelineEntry("hubspot"))!;
    expect(entry.history.map((h) => h.status)).toEqual([
      "program_found",
      "verified",
      "ready_to_apply",
      "application_in_progress",
      "submitted",
    ]);
  });

  it("fastTrackToSubmitted resumes from wherever the slug already is, without redoing earlier states", async () => {
    await setPipelineStatus("monday", "program_found");
    await setPipelineStatus("monday", "verified");
    await fastTrackToSubmitted("monday");
    const entry = (await getPipelineEntry("monday"))!;
    expect(entry.status).toBe("submitted");
    expect(entry.history.map((h) => h.status)).toEqual([
      "program_found",
      "verified",
      "ready_to_apply",
      "application_in_progress",
      "submitted",
    ]);
  });

  it("a program stuck behind a network approval can move to waiting_on_network from needs_owner_action or verified", async () => {
    await setPipelineStatus("miro", "program_found");
    await setPipelineStatus("miro", "verified");
    await setPipelineStatus("miro", "needs_owner_action", { ownerActionRequired: "Needs a PartnerStack account." });
    const updated = await setPipelineStatus("miro", "waiting_on_network", {
      note: "PartnerStack Network Profile submitted; owner action complete.",
    });
    expect(updated.status).toBe("waiting_on_network");
    expect(updated.ownerActionRequired).toBeNull(); // cleared — nothing left for the owner to do on this program specifically
  });

  it("waiting_on_network resolves forward once the network responds", async () => {
    await setPipelineStatus("airtable", "program_found");
    await setPipelineStatus("airtable", "verified");
    await setPipelineStatus("airtable", "waiting_on_network");
    await expect(setPipelineStatus("airtable", "ready_to_apply")).resolves.not.toThrow();
  });

  it("waiting_on_network cannot jump straight to submitted", async () => {
    await setPipelineStatus("zendesk", "program_found");
    await setPipelineStatus("zendesk", "verified");
    await setPipelineStatus("zendesk", "waiting_on_network");
    await expect(setPipelineStatus("zendesk", "submitted")).rejects.toThrow(/Invalid affiliate pipeline transition/);
  });
});
