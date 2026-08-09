import fs from "node:fs";
import path from "node:path";
import { AGENTS_DIR } from "@/lib/agents/paths";

/**
 * Tracks indexation experiment candidates end to end: item I
 * (seo-priority-candidate-selector) selects a URL and records the
 * baseline state it had at selection time; item J
 * (seo-experiment-verifier) later re-checks it and records what changed.
 * This is what makes "track whether indexing changes later" (brief
 * Section 8) a real mechanism instead of a one-off report nobody revisits.
 *
 * Append/update store, gitignored (var/agents/), same posture as every
 * other state file in this system.
 */

export type ExperimentCandidate = {
  url: string;
  selectedAt: string; // ISO date
  reasons: string[];
  baselineVerdict: string;
  baselineCoverageState: string | null;
  /** Set once seo-experiment-verifier has checked it — null means "still waiting," not "nothing happened." */
  verifiedAt: string | null;
  outcomeVerdict: string | null;
  outcomeCoverageState: string | null;
  changed: boolean | null;
};

const TRACKER_PATH = path.join(AGENTS_DIR, "experiment-candidates.json");

export function readExperimentCandidates(): ExperimentCandidate[] {
  try {
    return JSON.parse(fs.readFileSync(TRACKER_PATH, "utf-8")) as ExperimentCandidate[];
  } catch {
    return [];
  }
}

function writeExperimentCandidates(candidates: ExperimentCandidate[]): void {
  fs.mkdirSync(AGENTS_DIR, { recursive: true });
  fs.writeFileSync(TRACKER_PATH, JSON.stringify(candidates, null, 2));
}

/** Records a newly-selected candidate. No-op (returns existing list unchanged) if this URL is already an unverified candidate — never re-select the same URL as a "new" experiment while one is already pending. */
export function recordCandidateSelection(url: string, reasons: string[], baselineVerdict: string, baselineCoverageState: string | null, now = new Date().toISOString()): ExperimentCandidate[] {
  const existing = readExperimentCandidates();
  if (existing.some((c) => c.url === url && c.verifiedAt === null)) return existing;

  const updated: ExperimentCandidate[] = [
    ...existing,
    { url, selectedAt: now, reasons, baselineVerdict, baselineCoverageState, verifiedAt: null, outcomeVerdict: null, outcomeCoverageState: null, changed: null },
  ];
  writeExperimentCandidates(updated);
  return updated;
}

/** Candidates selected at least `minAgeMs` ago that haven't been verified yet — what seo-experiment-verifier should re-check this run. */
export function candidatesReadyForVerification(minAgeMs: number, now = Date.now()): ExperimentCandidate[] {
  return readExperimentCandidates().filter((c) => c.verifiedAt === null && now - new Date(c.selectedAt).getTime() >= minAgeMs);
}

export function recordVerificationOutcome(url: string, outcomeVerdict: string, outcomeCoverageState: string | null, now = new Date().toISOString()): ExperimentCandidate[] {
  const candidates = readExperimentCandidates();
  const updated = candidates.map((c) => {
    if (c.url !== url || c.verifiedAt !== null) return c;
    const changed = c.baselineCoverageState !== outcomeCoverageState || c.baselineVerdict !== outcomeVerdict;
    return { ...c, verifiedAt: now, outcomeVerdict, outcomeCoverageState, changed };
  });
  writeExperimentCandidates(updated);
  return updated;
}
