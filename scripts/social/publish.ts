import "./_load-env";
import { runPublishCycle } from "@/lib/social/publish";

/**
 * Manual/local equivalent of the Vercel Cron route
 * (app/api/cron/social-publish/route.ts) — same runPublishCycle()
 * function, so behavior is identical to production. Dry-run by default;
 * --live requires explicit intent, matching every other publish path in
 * this system.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/social/publish.ts           # dry-run
 *   npx tsx --env-file=.env.local scripts/social/publish.ts --live    # real publish
 */
async function main() {
  const live = process.argv.includes("--live");
  const summary = await runPublishCycle({ dryRun: !live });

  console.log(`Mode: ${live ? "LIVE" : "DRY-RUN"}`);
  if (summary.paused) {
    console.log("PAUSED via social-strategy.json — nothing attempted.");
    return;
  }
  console.log(`Entries attempted: ${summary.entriesAttempted}`);
  for (const r of summary.results) {
    console.log(`  [${r.entryId.slice(0, 8)}] ${r.channel}: ${r.status}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
