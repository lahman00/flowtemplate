import fs from "node:fs";
import path from "node:path";
import { AGENTS_DIR } from "@/lib/agents/paths";

/**
 * Affiliate Revenue Engine (2026-08-14) — persistent application-pipeline
 * state, separate from data/revenue/affiliate-programs.ts on purpose:
 * that file is static RESEARCH (what we know about a program, rarely
 * changes, lives in git) while this is RUNTIME PIPELINE STATE (where we
 * are in applying, changes constantly, gitignored) — the same split this
 * codebase already uses for var/agents/gsc-snapshots.json (research
 * snapshot) vs var/agents/experiment-candidates.json (live tracking).
 *
 * Lifecycle (owner directive, 2026-08-14):
 *   unresearched -> program_found -> verified -> ready_to_apply ->
 *   application_in_progress -> submitted -> pending_review -> approved
 *   -> affiliate_link_received -> activated -> earning
 *   (rejected, no_program, program_closed, needs_owner_action,
 *   needs_more_research are terminal/side states reachable from several
 *   points, not strictly linear.)
 */

export type AffiliatePipelineStatus =
  | "unresearched"
  | "program_found"
  | "verified"
  | "ready_to_apply"
  | "application_in_progress"
  | "submitted"
  | "pending_review"
  | "approved"
  | "rejected"
  | "affiliate_link_received"
  | "activated"
  | "earning"
  | "no_program"
  | "program_closed"
  | "needs_owner_action"
  | "needs_more_research";

export type AffiliatePipelineEntry = {
  slug: string;
  status: AffiliatePipelineStatus;
  /** Free-text reason, required whenever status is needs_owner_action or rejected — why a human needs to look, or why it was turned down. */
  ownerActionRequired: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  affiliateUrl: string | null;
  trackingId: string | null;
  notes: string | null;
  /** Append-only audit trail — every transition, never rewritten. */
  history: Array<{ status: AffiliatePipelineStatus; at: string; note: string | null }>;
};

const PIPELINE_PATH = path.join(AGENTS_DIR, "affiliate-pipeline.json");

const VALID_TRANSITIONS: Record<AffiliatePipelineStatus, AffiliatePipelineStatus[]> = {
  unresearched: ["program_found", "no_program", "needs_more_research"],
  program_found: ["verified", "needs_more_research", "no_program"],
  verified: ["ready_to_apply", "program_closed", "needs_owner_action"],
  ready_to_apply: ["application_in_progress", "needs_owner_action"],
  application_in_progress: ["submitted", "needs_owner_action"],
  submitted: ["pending_review", "needs_owner_action"],
  pending_review: ["approved", "rejected", "needs_owner_action"],
  approved: ["affiliate_link_received", "needs_owner_action"],
  rejected: ["needs_more_research", "ready_to_apply"], // some programs allow reapplying later
  affiliate_link_received: ["activated"],
  activated: ["earning"],
  earning: [],
  no_program: ["needs_more_research"], // re-check later — programs launch
  program_closed: ["needs_more_research"],
  needs_owner_action: [
    "verified",
    "ready_to_apply",
    "application_in_progress",
    "submitted",
    "pending_review",
    "approved",
    "affiliate_link_received",
  ], // resumes wherever it was once the owner acts — not a strict single next state
  needs_more_research: ["program_found", "no_program", "verified"],
};

export function isValidTransition(from: AffiliatePipelineStatus, to: AffiliatePipelineStatus): boolean {
  if (from === to) return true; // re-recording the same status (e.g. adding a note) is always allowed
  return VALID_TRANSITIONS[from].includes(to);
}

export function readAffiliatePipeline(): AffiliatePipelineEntry[] {
  try {
    return JSON.parse(fs.readFileSync(PIPELINE_PATH, "utf-8")) as AffiliatePipelineEntry[];
  } catch {
    return [];
  }
}

function writeAffiliatePipeline(entries: AffiliatePipelineEntry[]): void {
  fs.mkdirSync(AGENTS_DIR, { recursive: true });
  fs.writeFileSync(PIPELINE_PATH, JSON.stringify(entries, null, 2));
}

export function getPipelineEntry(slug: string): AffiliatePipelineEntry | undefined {
  return readAffiliatePipeline().find((e) => e.slug === slug);
}

function blankEntry(slug: string): AffiliatePipelineEntry {
  return {
    slug,
    status: "unresearched",
    ownerActionRequired: null,
    submittedAt: null,
    approvedAt: null,
    rejectedAt: null,
    affiliateUrl: null,
    trackingId: null,
    notes: null,
    history: [],
  };
}

/**
 * Moves one program to a new status. Throws on an invalid transition
 * (real guard, not just documentation) rather than silently allowing the
 * pipeline to skip states in a way that would misrepresent real progress.
 * `now` is injectable for tests.
 */
export function setPipelineStatus(
  slug: string,
  status: AffiliatePipelineStatus,
  options: { note?: string; affiliateUrl?: string; trackingId?: string; ownerActionRequired?: string } = {},
  now: string = new Date().toISOString()
): AffiliatePipelineEntry {
  const entries = readAffiliatePipeline();
  const existingIndex = entries.findIndex((e) => e.slug === slug);
  const entry = existingIndex >= 0 ? entries[existingIndex]! : blankEntry(slug);

  if (!isValidTransition(entry.status, status)) {
    throw new Error(`Invalid affiliate pipeline transition for ${slug}: ${entry.status} -> ${status}`);
  }

  const updated: AffiliatePipelineEntry = {
    ...entry,
    status,
    ownerActionRequired: status === "needs_owner_action" ? (options.ownerActionRequired ?? entry.ownerActionRequired ?? "See notes.") : status === "verified" || status === "ready_to_apply" ? null : entry.ownerActionRequired,
    submittedAt: status === "submitted" ? now : entry.submittedAt,
    approvedAt: status === "approved" ? now : entry.approvedAt,
    rejectedAt: status === "rejected" ? now : entry.rejectedAt,
    affiliateUrl: options.affiliateUrl ?? entry.affiliateUrl,
    trackingId: options.trackingId ?? entry.trackingId,
    notes: options.note ?? entry.notes,
    history: [...entry.history, { status, at: now, note: options.note ?? null }],
  };

  if (existingIndex >= 0) {
    entries[existingIndex] = updated;
  } else {
    entries.push(updated);
  }
  writeAffiliatePipeline(entries);
  return updated;
}

export function countByPipelineStatus(): Record<AffiliatePipelineStatus, number> {
  const counts = {} as Record<AffiliatePipelineStatus, number>;
  for (const status of Object.keys(VALID_TRANSITIONS) as AffiliatePipelineStatus[]) counts[status] = 0;
  for (const entry of readAffiliatePipeline()) counts[entry.status] += 1;
  return counts;
}
