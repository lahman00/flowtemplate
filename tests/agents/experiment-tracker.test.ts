import { describe, it, expect, beforeEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { recordCandidateSelection, candidatesReadyForVerification, recordVerificationOutcome, readExperimentCandidates } from "@/lib/agents/experiment-tracker";

const TRACKER_PATH = path.join(process.cwd(), "var", "agents", "experiment-candidates.json");

// Isolate this suite from any real tracker file the live agents may have written.
beforeEach(() => {
  fs.rmSync(TRACKER_PATH, { force: true });
});

describe("experiment tracker (item J's data source)", () => {
  it("records a new candidate selection", () => {
    const updated = recordCandidateSelection("https://miloosh.com/compare/a-vs-b", ["Low inbound links"], "NEUTRAL", "Crawled - currently not indexed");
    expect(updated).toHaveLength(1);
    expect(updated[0].verifiedAt).toBeNull();
  });

  it("does not create a duplicate pending candidate for the same URL", () => {
    recordCandidateSelection("https://miloosh.com/compare/a-vs-b", ["reason 1"], "NEUTRAL", "state1");
    const updated = recordCandidateSelection("https://miloosh.com/compare/a-vs-b", ["reason 2"], "NEUTRAL", "state1");
    expect(updated).toHaveLength(1);
  });

  it("is not ready for verification before the minimum age", () => {
    const now = Date.now();
    recordCandidateSelection("https://miloosh.com/a", ["r"], "NEUTRAL", "state", new Date(now).toISOString());
    const ready = candidatesReadyForVerification(14 * 24 * 60 * 60 * 1000, now + 1000);
    expect(ready).toHaveLength(0);
  });

  it("is ready for verification after the minimum age", () => {
    const selectedAt = Date.now() - 15 * 24 * 60 * 60 * 1000;
    recordCandidateSelection("https://miloosh.com/a", ["r"], "NEUTRAL", "state", new Date(selectedAt).toISOString());
    const ready = candidatesReadyForVerification(14 * 24 * 60 * 60 * 1000, Date.now());
    expect(ready).toHaveLength(1);
  });

  it("records a verification outcome and detects a real state change", () => {
    recordCandidateSelection("https://miloosh.com/a", ["r"], "NEUTRAL", "Crawled - currently not indexed");
    const updated = recordVerificationOutcome("https://miloosh.com/a", "PASS", "Submitted and indexed");
    expect(updated[0].verifiedAt).not.toBeNull();
    expect(updated[0].changed).toBe(true);
  });

  it("records a verification outcome with no change", () => {
    recordCandidateSelection("https://miloosh.com/a", ["r"], "NEUTRAL", "Crawled - currently not indexed");
    const updated = recordVerificationOutcome("https://miloosh.com/a", "NEUTRAL", "Crawled - currently not indexed");
    expect(updated[0].changed).toBe(false);
  });

  it("a verified candidate no longer appears in candidatesReadyForVerification", () => {
    const selectedAt = Date.now() - 15 * 24 * 60 * 60 * 1000;
    recordCandidateSelection("https://miloosh.com/a", ["r"], "NEUTRAL", "state", new Date(selectedAt).toISOString());
    recordVerificationOutcome("https://miloosh.com/a", "PASS", "Submitted and indexed");
    const ready = candidatesReadyForVerification(14 * 24 * 60 * 60 * 1000, Date.now());
    expect(ready).toHaveLength(0);
  });

  it("allows re-selecting a URL as a new candidate after its prior experiment was verified", () => {
    recordCandidateSelection("https://miloosh.com/a", ["r1"], "NEUTRAL", "state");
    recordVerificationOutcome("https://miloosh.com/a", "PASS", "Submitted and indexed");
    const updated = recordCandidateSelection("https://miloosh.com/a", ["r2"], "PASS", "Submitted and indexed");
    expect(updated.filter((c) => c.url === "https://miloosh.com/a")).toHaveLength(2);
  });

  it("reads back real persisted data", () => {
    recordCandidateSelection("https://miloosh.com/a", ["r"], "NEUTRAL", "state");
    expect(readExperimentCandidates()).toHaveLength(1);
  });
});
