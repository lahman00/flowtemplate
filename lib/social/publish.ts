import { getSocialStrategy } from "@/lib/social/strategy";
import { readQueue, updateQueueEntry, setQueueState } from "@/lib/social/queue";
import { ADAPTERS } from "@/lib/social/channels/registry";
import type { SocialAdapter } from "@/lib/social/channels/types";
import { publishWithRetry } from "@/lib/social/retry";
import type { Channel, PublishResult, SocialQueueEntry } from "@/lib/social/types";

/**
 * Publish orchestrator — the TypeScript equivalent of Need Go Home's
 * publish_agent.py + scheduler/run_window.py, adapted to this project's
 * serverless/Vercel-Cron execution model instead of a long-lived macOS
 * launchd process:
 *
 *   - KILL SWITCH: social-strategy.json's `paused` flag (same role as
 *     NeeGoHome's PAUSE file) — checked first, before anything else.
 *   - IDEMPOTENCY: only entries in state SCHEDULED with scheduledFor in
 *     the past are picked up; a re-run of the cron job (e.g. a retry)
 *     just finds nothing new to do, since a successful attempt always
 *     transitions the entry out of SCHEDULED.
 *   - FAILURE ISOLATION: every channel's publish() call is awaited
 *     independently and wrapped so one channel's exception can never
 *     stop the loop for the others (Phase 8's explicit requirement).
 *   - No file-lock is needed the way NeeGoHome's process needed
 *     `flock` — Vercel Cron invokes the route serially, and each
 *     invocation is a single short-lived function call, not a
 *     long-running daemon that could overlap itself.
 */

export type PublishRunSummary = {
  ranAt: string;
  dryRun: boolean;
  paused: boolean;
  entriesAttempted: number;
  results: Array<{ entryId: string; channel: Channel; status: PublishResult["status"] }>;
  staleHandling: {
    graceWindowMs: number;
    maxCatchupPerRun: number;
    maxRequeueAttempts: number;
    /** Overdue entries pushed forward to a fresh slot this run instead of being auto-published as-is. */
    requeued: Array<{ entryId: string; previousScheduledFor: string; newScheduledFor: string; attempt: number }>;
    /** Overdue entries that had already been requeued maxRequeueAttempts times — moved to FAILED for a human to look at, rather than requeued forever. */
    abandoned: Array<{ entryId: string; reason: string }>;
    /** Stale entries that exist but weren't touched this run because maxCatchupPerRun was already spent — still pending, picked up by a future run. */
    staleRemaining: number;
  };
};

const DAILY_ENTRY_CAP = 20; // hard ceiling a scheduler bug can't cross, mirrors NeeGoHome's MAX_PER_DAY concept at the entry level.

/**
 * Overdue-backlog policy (2026-08-17). Without this, any entry with
 * scheduledFor <= now — including one scheduled weeks ago and never run
 * (e.g. after an extended pause) — would publish in full the moment the
 * kill switch is lifted, with content that may reference stale pricing or
 * dates. Instead:
 *   - within GRACE_WINDOW_MS of due: publish normally (today's behavior).
 *   - overdue beyond that: never auto-published as-is. Pushed forward to
 *     a fresh slot (REQUEUE_OFFSET_MS out) so schedule.ts's normal
 *     cadence re-sorts it in, bounded to MAX_CATCHUP_PER_RUN entries per
 *     cron invocation so a large backlog can't be dumped/rescheduled in
 *     one shot.
 *   - an entry requeued MAX_REQUEUE_ATTEMPTS times without ever landing
 *     inside the grace window (i.e. it keeps missing its own rescheduled
 *     slot) stops being auto-requeued and moves to FAILED with a note —
 *     surfaced for manual review instead of looping forever.
 */
export const GRACE_WINDOW_MS = 24 * 60 * 60 * 1000;
export const MAX_CATCHUP_PER_RUN = 5;
export const MAX_REQUEUE_ATTEMPTS = 3;
export const REQUEUE_OFFSET_MS = 24 * 60 * 60 * 1000;

function countPriorRequeues(entry: SocialQueueEntry): number {
  return entry.history.filter((h) => h.note?.startsWith("stale-requeue:")).length;
}

/** Pure — no I/O, easy to unit test. Splits due SCHEDULED entries into on-time (publish normally) vs stale (never auto-published as-is). Stale entries are sorted oldest-first so the longest-waiting ones claim the bounded per-run catch-up slots first. */
export function classifyScheduledEntries(queue: SocialQueueEntry[], now: Date): { onTime: SocialQueueEntry[]; stale: SocialQueueEntry[] } {
  const onTime: SocialQueueEntry[] = [];
  const stale: SocialQueueEntry[] = [];
  for (const e of queue) {
    if (e.state !== "SCHEDULED" || !e.scheduledFor) continue;
    const scheduledMs = new Date(e.scheduledFor).getTime();
    if (scheduledMs > now.getTime()) continue; // not due yet
    const overdueMs = now.getTime() - scheduledMs;
    if (overdueMs <= GRACE_WINDOW_MS) onTime.push(e);
    else stale.push(e);
  }
  stale.sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime());
  return { onTime, stale };
}

/** Adapters are injectable (default: the real registry) so tests can exercise failure isolation with a fake adapter that throws, without needing real channel credentials or network access. */
export async function publishOneEntry(
  entry: SocialQueueEntry,
  dryRun: boolean,
  adapters: Record<Channel, SocialAdapter> = ADAPTERS
): Promise<{ channel: Channel; result: PublishResult }[]> {
  const attempts: { channel: Channel; result: PublishResult }[] = [];
  const channelKeys = Object.keys(entry.channels) as Channel[];

  for (const channel of channelKeys) {
    const variant = entry.channels[channel];
    if (!variant) continue;
    const adapter = adapters[channel];
    let result: PublishResult;
    try {
      result = await publishWithRetry(() => adapter.publish(variant, { dryRun }));
    } catch (err) {
      // Failure-safe fallback in case an adapter implementation itself
      // throws instead of catching its own error (contract violation,
      // but the orchestrator must never let it propagate regardless).
      result = {
        channel,
        status: "FAILED",
        text: variant.text,
        link: variant.link ?? "",
        postUrl: null,
        postId: null,
        verified: false,
        error: `orchestrator caught unhandled adapter error: ${err instanceof Error ? err.message : String(err)}`,
        contentHash: "",
      };
    }
    attempts.push({ channel, result });
  }

  return attempts;
}

export async function runPublishCycle(options: { dryRun: boolean; now?: Date; strategy?: ReturnType<typeof getSocialStrategy> }): Promise<PublishRunSummary> {
  const now = options.now ?? new Date();
  const strategy = options.strategy ?? getSocialStrategy();

  const emptyStaleHandling = { graceWindowMs: GRACE_WINDOW_MS, maxCatchupPerRun: MAX_CATCHUP_PER_RUN, maxRequeueAttempts: MAX_REQUEUE_ATTEMPTS, requeued: [], abandoned: [], staleRemaining: 0 };

  if (strategy.paused) {
    return { ranAt: now.toISOString(), dryRun: options.dryRun, paused: true, entriesAttempted: 0, results: [], staleHandling: emptyStaleHandling };
  }

  const queue = await readQueue();
  const { onTime, stale } = classifyScheduledEntries(queue, now);
  const due = onTime.slice(0, DAILY_ENTRY_CAP);
  const staleToHandle = stale.slice(0, MAX_CATCHUP_PER_RUN);

  const requeued: PublishRunSummary["staleHandling"]["requeued"] = [];
  const abandoned: PublishRunSummary["staleHandling"]["abandoned"] = [];

  for (const entry of staleToHandle) {
    const priorAttempts = countPriorRequeues(entry);
    if (priorAttempts >= MAX_REQUEUE_ATTEMPTS) {
      const reason = `exceeded max requeue attempts (${MAX_REQUEUE_ATTEMPTS}) — needs manual review`;
      abandoned.push({ entryId: entry.id, reason });
      if (!options.dryRun) {
        await setQueueState(entry.id, "FAILED", `Stale backlog: overdue and requeued ${priorAttempts} times without becoming current. Needs manual review/reschedule, not auto-published. ${reason}`);
      }
      continue;
    }
    const newScheduledFor = new Date(now.getTime() + REQUEUE_OFFSET_MS).toISOString();
    requeued.push({ entryId: entry.id, previousScheduledFor: entry.scheduledFor!, newScheduledFor, attempt: priorAttempts + 1 });
    if (!options.dryRun) {
      await updateQueueEntry(entry.id, {
        scheduledFor: newScheduledFor,
        history: [
          ...entry.history,
          { state: "SCHEDULED", at: now.toISOString(), note: `stale-requeue: was overdue (originally ${entry.scheduledFor}), rescheduled to ${newScheduledFor} (attempt ${priorAttempts + 1}/${MAX_REQUEUE_ATTEMPTS})` },
        ],
      });
    }
  }

  const staleHandling: PublishRunSummary["staleHandling"] = {
    graceWindowMs: GRACE_WINDOW_MS,
    maxCatchupPerRun: MAX_CATCHUP_PER_RUN,
    maxRequeueAttempts: MAX_REQUEUE_ATTEMPTS,
    requeued,
    abandoned,
    staleRemaining: stale.length - staleToHandle.length,
  };

  const results: PublishRunSummary["results"] = [];

  for (const entry of due) {
    const attempts = await publishOneEntry(entry, options.dryRun);
    for (const { channel, result } of attempts) {
      results.push({ entryId: entry.id, channel, status: result.status });
    }

    // A dry run is a preview: it must never mutate the queue, or running
    // one (e.g. to sanity-check what's about to fire) would permanently
    // dead-end a SCHEDULED entry into PUBLISHED with no real post having
    // happened anywhere — the queue's PUBLISHED state has no outgoing
    // transition, so this would be irreversible. Only a real (--live /
    // authenticated cron) run is allowed to persist anything.
    if (options.dryRun) continue;

    const updatedChannels = { ...entry.channels };
    for (const { channel, result } of attempts) {
      updatedChannels[channel] = { ...updatedChannels[channel]!, publishResult: result };
    }
    await updateQueueEntry(entry.id, { channels: updatedChannels });

    const anySucceeded = attempts.some((a) => a.result.status === "PUBLISHED" || a.result.status === "MANUAL_ONLY");
    await setQueueState(entry.id, anySucceeded ? "PUBLISHED" : "FAILED", anySucceeded ? undefined : "All channel attempts failed — see per-channel publishResult for detail.");
  }

  return { ranAt: now.toISOString(), dryRun: options.dryRun, paused: false, entriesAttempted: due.length, results, staleHandling };
}
