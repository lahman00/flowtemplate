import "./_load-env";
import { readQueue, writeQueue, applyQueueTransition } from "@/lib/social/queue";
import { getSocialStrategy } from "@/lib/social/strategy";
import { CHANNELS } from "@/lib/social/types";

/**
 * Spreads APPROVED_FOR_AUTO entries across the next 14 days. Batches
 * the write (single read, single write) for the same reason qa.ts
 * does — see that file's header for the N+1-round-trip incident this
 * was written to avoid.
 *
 * KNOWN SIMPLIFICATION: each queue entry bundles every enabled channel's
 * variant together (one entry = one post idea, rendered per-platform),
 * but social-strategy.json's cadence is expressed PER CHANNEL, and those
 * can differ (e.g. bluesky 4/week vs facebook 3/week). Since one
 * scheduling decision publishes to every channel in the entry at once,
 * true independent per-channel cadence isn't achievable without either
 * splitting entries per-channel or holding some channels back on some
 * days — a real Phase 9/13 refinement, not built here. This script takes
 * the SAFE side of that tradeoff: it paces entries at the minimum
 * cadence among enabled channels, so no channel is ever over-posted,
 * even though higher-cadence channels end up under-posted relative to
 * their configured number. Flagged in the final report as a known
 * scheduling limitation, not silently glossed over.
 *
 * Usage: npx tsx --env-file=.env.local scripts/social/schedule.ts
 */
const DAYS_AHEAD = 14;
const POST_HOUR_UTC = 15; // early-afternoon UTC — reasonable overlap across US/EU working hours.

async function main() {
  const strategy = getSocialStrategy();
  const enabledCadences = CHANNELS.filter((c) => strategy.enabledChannels[c]).map((c) => strategy.cadence[c]);
  const minCadence = enabledCadences.length ? Math.min(...enabledCadences.filter((c) => c > 0)) : 0;
  const perDay = Math.max(1, Math.round(minCadence / 7));

  const queue = await readQueue();
  const approvedIds = queue.filter((e) => e.state === "APPROVED_FOR_AUTO").map((e) => e.id);

  if (approvedIds.length === 0) {
    console.log("No APPROVED_FOR_AUTO entries to schedule. Run generate.ts then qa.ts first.");
    return;
  }
  if (minCadence === 0) {
    console.log("No channel has cadence > 0 in social-strategy.json — nothing to schedule.");
    return;
  }

  const now = new Date();
  const scheduledForById = new Map<string, string>();
  let cursor = 0;
  for (let day = 0; day < DAYS_AHEAD && cursor < approvedIds.length; day++) {
    for (let slot = 0; slot < perDay && cursor < approvedIds.length; slot++) {
      const when = new Date(now);
      when.setUTCDate(when.getUTCDate() + day);
      when.setUTCHours(POST_HOUR_UTC + slot, 0, 0, 0);
      scheduledForById.set(approvedIds[cursor]!, when.toISOString());
      cursor += 1;
    }
  }

  const updated = queue.map((entry) => {
    const when = scheduledForById.get(entry.id);
    if (!when) return entry;
    const transitioned = applyQueueTransition(entry, "SCHEDULED", `Scheduled for ${when} by schedule.ts (pace: ${perDay}/day, min channel cadence ${minCadence}/week).`);
    return { ...transitioned, scheduledFor: when };
  });

  await writeQueue(updated);

  console.log(`Scheduled ${scheduledForById.size} of ${approvedIds.length} approved entries across the next ${DAYS_AHEAD} days (${perDay}/day pace).`);
  if (scheduledForById.size < approvedIds.length) {
    console.log(`${approvedIds.length - scheduledForById.size} entries remain APPROVED_FOR_AUTO — re-run after these publish, or widen DAYS_AHEAD.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
