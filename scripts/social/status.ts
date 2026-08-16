import "./_load-env";
import { readQueue, countByQueueState } from "@/lib/social/queue";
import { getAllChannelHealth } from "@/lib/social/channels/registry";
import { getSocialStrategy } from "@/lib/social/strategy";

/** Usage: npx tsx --env-file=.env.local scripts/social/status.ts */
async function main() {
  const strategy = getSocialStrategy();
  const queue = await readQueue();
  const counts = countByQueueState(queue);
  const health = getAllChannelHealth();

  console.log(`Social system status — ${new Date().toISOString().slice(0, 10)}`);
  console.log(`Paused: ${strategy.paused}`);
  console.log(`\nQueue (${queue.length} total):`);
  for (const [state, count] of Object.entries(counts)) console.log(`  ${state}: ${count}`);

  console.log(`\nChannel health:`);
  for (const [channel, h] of Object.entries(health)) console.log(`  ${channel}: ${h.status} — ${h.detail}`);

  const nextScheduled = queue
    .filter((e) => e.state === "SCHEDULED")
    .sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""))
    .slice(0, 5);
  if (nextScheduled.length) {
    console.log(`\nNext scheduled:`);
    for (const e of nextScheduled) console.log(`  ${e.scheduledFor} — [${e.pillar}] ${e.topic}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
