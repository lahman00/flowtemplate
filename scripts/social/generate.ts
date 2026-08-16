import "./_load-env";
import { readQueue, addQueueEntries, lastUsedAtByTopic } from "@/lib/social/queue";
import { generateDraftedQueueEntries } from "@/lib/social/content-engine";

/**
 * Generates new DRAFTED queue entries from real Miloosh data, skipping
 * any topic still inside its cooldown window (see social-strategy.json's
 * topicRepeatCooldownDays). Safe to run repeatedly — addQueueEntries()
 * dedupes by id, and this always generates fresh random ids, so re-running
 * without QA-approving anything first just produces more candidates, not
 * duplicates of already-approved content.
 *
 * Usage: npx tsx --env-file=.env.local scripts/social/generate.ts [--limit=N]
 */
async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : undefined;

  const existing = await readQueue();
  const lastUsed = lastUsedAtByTopic(existing);
  const entries = generateDraftedQueueEntries(lastUsed);
  const toAdd = limit ? entries.slice(0, limit) : entries;

  await addQueueEntries(toAdd);

  const byPillar = new Map<string, number>();
  for (const e of toAdd) byPillar.set(e.pillar, (byPillar.get(e.pillar) ?? 0) + 1);

  console.log(`Generated ${toAdd.length} new DRAFTED queue entries (${entries.length} eligible before --limit).`);
  for (const [pillar, count] of byPillar) console.log(`  ${pillar}: ${count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
