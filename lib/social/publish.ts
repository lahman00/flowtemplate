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
};

const DAILY_ENTRY_CAP = 20; // hard ceiling a scheduler bug can't cross, mirrors NeeGoHome's MAX_PER_DAY concept at the entry level.

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

  if (strategy.paused) {
    return { ranAt: now.toISOString(), dryRun: options.dryRun, paused: true, entriesAttempted: 0, results: [] };
  }

  const queue = await readQueue();
  const due = queue
    .filter((e) => e.state === "SCHEDULED" && e.scheduledFor && new Date(e.scheduledFor).getTime() <= now.getTime())
    .slice(0, DAILY_ENTRY_CAP);

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

  return { ranAt: now.toISOString(), dryRun: options.dryRun, paused: false, entriesAttempted: due.length, results };
}
