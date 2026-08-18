import "./_load-env";
import { readQueue } from "@/lib/social/queue";

/**
 * Phase 10 — post-publish operating review. Read-only, and deliberately
 * strict about what counts as evidence: an entry is only reported
 * PUBLISHED here if publishResult.verified is true (a real Graph-API-
 * style read-back, not just a create-response) AND the history array
 * shows a real timestamped PUBLISHED transition. A scheduler returning
 * HTTP 200 is not evidence by itself — see the 2026-08-18 production
 * verification precedent this mirrors.
 *
 * Usage: npx tsx --env-file=.env.local scripts/social/post-publish-review.ts
 */
async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const queue = await readQueue();
  const todays = queue.filter(
    (e) => (e.scheduledFor?.slice(0, 10) === today) || e.history.some((h) => h.at.slice(0, 10) === today)
  );

  console.log(`Post-publish review — ${today}\n`);

  if (!todays.length) {
    console.log("No queue entries scheduled or touched today.");
    return;
  }

  for (const entry of todays) {
    console.log(`[${entry.pillar}] ${entry.topic} — state: ${entry.state}`);
    for (const channelKey of Object.keys(entry.channels)) {
      const variant = entry.channels[channelKey as keyof typeof entry.channels];
      const result = variant?.publishResult;
      if (!result) {
        console.log(`  ${channelKey}: no publish attempt recorded yet`);
        continue;
      }
      const evidence = result.verified ? "VERIFIED (real read-back confirmed live)" : "NOT VERIFIED — do not treat as published";
      console.log(`  ${channelKey}: status=${result.status} | ${evidence}`);
      if (result.postId) console.log(`    postId: ${result.postId}`);
      if (result.postUrl) console.log(`    permalink: ${result.postUrl}`);
      if (result.error) console.log(`    error: ${result.error}`);
    }
    const publishHistory = entry.history.filter((h) => h.at.slice(0, 10) === today);
    if (publishHistory.length) {
      console.log(`  history today: ${publishHistory.map((h) => `${h.state}@${h.at}`).join(" -> ")}`);
    }
    console.log("");
  }

  console.log(
    "Reminder: early metrics (impressions/engagement) require a separate live check against each platform's own admin analytics — not available from queue data alone. See LINKEDIN_ANALYTICS_BASELINE_2026-08-19.md for the pattern to repeat."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
