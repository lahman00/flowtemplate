import "./_load-env";
import { readQueue, writeQueue, applyQueueTransition } from "@/lib/social/queue";
import { getSocialStrategy, getEffectiveCadence } from "@/lib/social/strategy";
import { CHANNELS } from "@/lib/social/types";
import { interleaveByPillarWeight } from "@/lib/social/content-engine";
import { localTimeToUtc } from "@/lib/social/timezone";
import type { SocialQueueEntry } from "@/lib/social/types";

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
 * CONTENT MIX (2026-08-17 Facebook launch): entries are no longer taken
 * in raw queue order (effectively oldest-first, since that's insertion
 * order) — reused interleaveByPillarWeight() (same tested function that
 * already prevents pillar monotony at generation time) so the pillar mix
 * scheduled here matches social-strategy.json's pillarWeights, then a
 * lightweight pass nudges apart any two ADJACENT scheduled entries that
 * share a sourceSlug (same vendor two days in a row), swapping in the
 * nearest non-colliding candidate from later in the pool where one
 * exists. Not a full constraint solver — a best-effort local fix, honest
 * about that scope.
 *
 * Usage: npx tsx --env-file=.env.local scripts/social/schedule.ts
 */
const DAYS_AHEAD = 14;
/**
 * 2026-08-18 — Facebook's daily post must land at 13:00 in
 * social-strategy.json's `timezone` (America/New_York), DST-handled via
 * lib/social/timezone.ts rather than a fixed UTC hour (the previous
 * POST_HOUR_UTC=15 constant never actually tracked DST and drifted
 * relative to any local-time target across the March/November
 * transitions). Since every enabled channel currently shares one
 * scheduledFor per entry (see KNOWN SIMPLIFICATION above), this anchors
 * all of them to Facebook's required time, not just Facebook — a real,
 * intentional consequence of the existing single-scheduledFor design,
 * not something this change could avoid without splitting entries per
 * channel (out of scope here).
 */
const POST_HOUR_LOCAL = 13;

function sharesVendor(a: SocialQueueEntry, b: SocialQueueEntry): boolean {
  return a.sourceSlugs.some((slug) => b.sourceSlugs.includes(slug));
}

/** Best-effort local de-collision: for each position, if it shares a vendor with the previous pick, swap in the nearest later candidate that doesn't. */
function avoidAdjacentSameVendor(ordered: SocialQueueEntry[]): SocialQueueEntry[] {
  const result = [...ordered];
  for (let i = 1; i < result.length; i++) {
    if (!sharesVendor(result[i]!, result[i - 1]!)) continue;
    const swapIndex = result.findIndex((e, j) => j > i && !sharesVendor(e, result[i - 1]!) && !sharesVendor(e, result[i + 1] ?? e));
    if (swapIndex !== -1) {
      [result[i], result[swapIndex]] = [result[swapIndex]!, result[i]!];
    }
  }
  return result;
}

async function main() {
  const strategy = getSocialStrategy();
  const now = new Date();
  const enabledCadences = CHANNELS.filter((c) => strategy.enabledChannels[c]).map((c) => getEffectiveCadence(strategy, c, now));
  const minCadence = enabledCadences.length ? Math.min(...enabledCadences.filter((c) => c > 0)) : 0;
  const perDay = Math.max(1, Math.round(minCadence / 7));

  const queue = await readQueue();
  const approved = queue.filter((e) => e.state === "APPROVED_FOR_AUTO");

  if (approved.length === 0) {
    console.log("No APPROVED_FOR_AUTO entries to schedule. Run generate.ts then qa.ts first.");
    return;
  }
  if (minCadence === 0) {
    console.log("No channel has cadence > 0 in social-strategy.json — nothing to schedule.");
    return;
  }

  const ordered = avoidAdjacentSameVendor(interleaveByPillarWeight(approved, strategy.pillarWeights));
  const approvedIds = ordered.map((e) => e.id);

  const scheduledForById = new Map<string, string>();
  let cursor = 0;
  for (let day = 0; day < DAYS_AHEAD && cursor < approvedIds.length; day++) {
    const dayAnchor = new Date(now);
    dayAnchor.setUTCDate(dayAnchor.getUTCDate() + day);
    for (let slot = 0; slot < perDay && cursor < approvedIds.length; slot++) {
      // Anchor at POST_HOUR_LOCAL in strategy.timezone (DST-correct), then
      // space any additional same-day slots by whole hours from there —
      // same spacing behavior as before, just a correct anchor instant.
      const when = localTimeToUtc(dayAnchor, POST_HOUR_LOCAL, 0, strategy.timezone);
      when.setTime(when.getTime() + slot * 60 * 60 * 1000);
      scheduledForById.set(approvedIds[cursor]!, when.toISOString());
      cursor += 1;
    }
  }

  const updated = queue.map((entry) => {
    const when = scheduledForById.get(entry.id);
    if (!when) return entry;
    const transitioned = applyQueueTransition(entry, "SCHEDULED", `Scheduled for ${when} by schedule.ts (pace: ${perDay}/day, min channel cadence ${minCadence}/week, pillar-interleaved + vendor-adjacency-checked order).`);
    return { ...transitioned, scheduledFor: when };
  });

  await writeQueue(updated);

  console.log(`Scheduled ${scheduledForById.size} of ${approvedIds.length} approved entries across the next ${DAYS_AHEAD} days (${perDay}/day pace, pillar-mixed order).`);
  if (scheduledForById.size < approvedIds.length) {
    console.log(`${approvedIds.length - scheduledForById.size} entries remain APPROVED_FOR_AUTO — re-run after these publish, or widen DAYS_AHEAD.`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
