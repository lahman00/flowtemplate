import "./_load-env";
import { runScheduleCycle } from "@/lib/social/schedule";

/**
 * Manual/local equivalent of the Vercel Cron route
 * (app/api/cron/social-schedule/route.ts) — same runScheduleCycle()
 * function, so behavior is identical to production. Dry-run by default;
 * --live requires explicit intent, matching every other publish/schedule
 * path in this system.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/social/schedule.ts           # dry-run
 *   npx tsx --env-file=.env.local scripts/social/schedule.ts --live    # real schedule
 */
async function main() {
  const live = process.argv.includes("--live");
  const summary = await runScheduleCycle({ dryRun: !live });

  console.log(`Mode: ${live ? "LIVE" : "DRY-RUN"}`);
  if (summary.reason) {
    console.log(summary.reason);
    return;
  }
  console.log(`Scheduled ${summary.scheduledCount} of ${summary.approvedCount} approved entries (${summary.perDay}/day pace, min channel cadence ${summary.minCadence}/week).`);
  if (summary.remainingApprovedCount > 0) {
    console.log(`${summary.remainingApprovedCount} entries remain APPROVED_FOR_AUTO — re-run after these publish, or widen the scheduling window.`);
  }
  for (const id of summary.scheduledEntryIds) console.log(`  [${id.slice(0, 8)}] scheduled`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
