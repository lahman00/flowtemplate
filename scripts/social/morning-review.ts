import "./_load-env";
import { readQueue, countByQueueState } from "@/lib/social/queue";
import { getAllChannelHealth } from "@/lib/social/channels/registry";
import { runQaGates } from "@/lib/social/qa-gates";
import { getAllSoftware } from "@/data/software";

/**
 * Phase 10 — morning operating review. Read-only: reports today's real
 * queue state, re-runs QA against the CURRENT catalog (catches pricing
 * that went stale since the post was drafted — checkStaleClaim needs a
 * fresh run, not the QA result cached at draft time), flags scheduled
 * items already QA-approved, and re-checks for duplicates against
 * everything real. Never marks anything published — status.ts and qa.ts
 * remain the tools that mutate the queue; this only reports on it.
 *
 * Usage: npx tsx --env-file=.env.local scripts/social/morning-review.ts
 */
async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const queue = await readQueue();
  const counts = countByQueueState(queue);
  const health = getAllChannelHealth();

  console.log(`Morning review — ${today}\n`);

  console.log("Channel health:");
  for (const [channel, h] of Object.entries(health)) console.log(`  ${channel}: ${h.status} — ${h.detail}`);

  console.log(`\nQueue (${queue.length} total):`);
  for (const [state, count] of Object.entries(counts)) console.log(`  ${state}: ${count}`);

  const todaysScheduled = queue.filter((e) => e.state === "SCHEDULED" && e.scheduledFor?.slice(0, 10) === today);
  console.log(`\nToday's scheduled items (${todaysScheduled.length}):`);
  let freshnessIssues = 0;
  let duplicateIssues = 0;
  for (const entry of todaysScheduled) {
    const findings = runQaGates(entry, queue);
    const errors = findings.filter((f) => f.severity === "error");
    const staleWarnings = findings.filter((f) => f.message.includes("doesn't appear in the drafted text"));
    if (errors.length) console.log(`  ⚠ ${entry.scheduledFor} [${entry.pillar}] ${entry.topic} — ${errors.length} error(s): ${errors.map((f) => f.message).join("; ")}`);
    else console.log(`  ✓ ${entry.scheduledFor} [${entry.pillar}] ${entry.topic}`);
    if (staleWarnings.length) freshnessIssues += 1;
    if (findings.some((f) => f.message.includes("already scheduled or published"))) duplicateIssues += 1;
  }

  console.log(`\nFactual freshness: ${freshnessIssues} item(s) cite pricing that may have changed since drafting.`);
  console.log(`Duplicates: ${duplicateIssues} item(s) flagged as duplicate content.`);

  const catalogSize = getAllSoftware().length;
  console.log(`\nCatalog size at time of this review: ${catalogSize} products (sanity check — compare against the last review if this moved unexpectedly).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
