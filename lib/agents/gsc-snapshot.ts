import fs from "node:fs";
import path from "node:path";
import { AGENTS_DIR } from "@/lib/agents/paths";

/**
 * Dated snapshots of Search Console's indexation state — Section 11 of
 * the indexation-analysis brief: "Store dated snapshots so future runs
 * can measure change... do not pretend the current number is a permanent
 * or complete measure if Search Console's reporting scope differs; label
 * exactly what the report represents."
 *
 * That labeling requirement is why `source` and `scope` are required
 * fields, not decoration: a snapshot this system fetched itself via the
 * real API is a fundamentally different kind of evidence than one an
 * owner read off their own Search Console UI and reported in chat — both
 * are real, neither should be silently presented as the other.
 *
 * Append-only, gitignored (var/agents/), same posture as every other
 * agents state file — never edited in place, only appended to, so the
 * history itself is the audit trail.
 */

export type GscExclusionReason = {
  /** The exact label as Search Console shows it (e.g. "Crawled - currently not indexed") — never paraphrased, so it stays greppable against Search Console's own UI. */
  reason: string;
  count: number;
};

export type GscSnapshot = {
  capturedAt: string; // ISO date this snapshot represents
  /** "owner-reported" = a human read this off the Search Console UI and told the agent (exactly what seeds this store today). "api" = fetched by this system via the real Search Console API. Never blend the two without saying which is which. */
  source: "owner-reported" | "api";
  /** Plain-language statement of what this snapshot actually measures — e.g. "Search Console > Pages > Indexing report, sitemap-submitted URLs only." Required because Search Console's own reporting scope varies by view. */
  scope: string;
  sitemapUrls: number | null;
  indexed: number | null;
  notIndexed: number | null;
  exclusions: GscExclusionReason[];
  /** Aggregate Search Analytics figures, when available — null fields mean "not measured in this snapshot," never "zero." */
  impressions: number | null;
  clicks: number | null;
  averageCtr: number | null;
  averagePosition: number | null;
  byTemplate: Record<string, { indexed: number | null; notIndexed: number | null }> | null;
  notes: string | null;
};

const SNAPSHOTS_PATH = path.join(AGENTS_DIR, "gsc-snapshots.json");

export function readSnapshots(): GscSnapshot[] {
  try {
    const raw = fs.readFileSync(SNAPSHOTS_PATH, "utf-8");
    return JSON.parse(raw) as GscSnapshot[];
  } catch {
    return [];
  }
}

export function appendSnapshot(snapshot: GscSnapshot): GscSnapshot[] {
  const snapshots = [...readSnapshots(), snapshot];
  fs.mkdirSync(AGENTS_DIR, { recursive: true });
  fs.writeFileSync(SNAPSHOTS_PATH, JSON.stringify(snapshots, null, 2));
  return snapshots;
}

export function latestSnapshot(): GscSnapshot | null {
  const snapshots = readSnapshots();
  return snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
}

/** Snapshots strictly before `snapshot.capturedAt`, most recent first — used by the experiment verifier to find "what did this look like before." */
export function snapshotsBefore(snapshots: GscSnapshot[], capturedAt: string): GscSnapshot[] {
  return snapshots.filter((s) => s.capturedAt < capturedAt).sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1));
}
