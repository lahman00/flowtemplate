import fs from "node:fs";
import path from "node:path";
import { AGENTS_DIR } from "@/lib/agents/paths";

/**
 * Operation First Click (2026-08-14) — tracks the specific cohort of
 * existing pages selected from real Search Console query/page data as the
 * best near-term evidence for producing the site's first organic click.
 * Separate from lib/agents/experiment-tracker.ts (which tracks GSC
 * verdict/coverageState for the indexation-analysis workflow) because this
 * experiment is about CTR/position/impressions on already-indexed pages,
 * a different question with different fields — not a code gap, a
 * deliberately different measurement.
 */

export type FirstClickCandidate = {
  url: string;
  pageType: "software" | "comparison" | "category" | "other";
  queryCluster: string[];
  reasonSelected: string;
  baseline: {
    capturedAt: string; // real GSC data date range end, not "now"
    dateRangeStart: string;
    dateRangeEnd: string;
    impressions: number;
    clicks: number;
    ctr: number;
    bestPosition: number;
  };
  treatment: string;
  deployedAt: string | null;
  status: "pending" | "changed" | "audited_no_change";
};

const STORE_PATH = path.join(AGENTS_DIR, "first-click-experiment.json");

export function readFirstClickCandidates(): FirstClickCandidate[] {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8")) as FirstClickCandidate[];
  } catch {
    return [];
  }
}

export function writeFirstClickCandidates(candidates: FirstClickCandidate[]): void {
  fs.mkdirSync(AGENTS_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(candidates, null, 2));
}
