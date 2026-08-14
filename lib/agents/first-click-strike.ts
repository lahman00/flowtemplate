import fs from "node:fs";
import path from "node:path";
import { AGENTS_DIR } from "@/lib/agents/paths";

/**
 * First Click Strike (2026-08-14) — separate from both
 * lib/agents/experiment-tracker.ts (GSC verdict/coverageState, for the
 * indexation-analysis workflow) and lib/agents/first-click-experiment.ts
 * (Operation First Click's 13-page cohort). This experiment specifically
 * covers the two additional real, non-branded-commercial-intent
 * candidates audited on 2026-08-14 (docker-vs-vercel, gitlab-vs-postman)
 * — kept separate per explicit instruction not to mix experiments.
 */

export type FirstClickStrikeCandidate = {
  url: string;
  query: string;
  baseline: {
    dateRangeStart: string;
    dateRangeEnd: string;
    impressions: number;
    clicks: number;
    ctr: number;
    position: number;
  };
  decision: "no_change" | "changed";
  reasoning: string;
  internalLinksVerified: string[];
  treatment: string | null;
  auditedAt: string;
};

const STORE_PATH = path.join(AGENTS_DIR, "first-click-strike.json");

export function readFirstClickStrikeCandidates(): FirstClickStrikeCandidate[] {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")) as FirstClickStrikeCandidate[];
  } catch {
    return [];
  }
}

export function writeFirstClickStrikeCandidates(candidates: FirstClickStrikeCandidate[]): void {
  fs.mkdirSync(AGENTS_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(candidates, null, 2));
}
