import "./_load-env";
import { readQueue } from "@/lib/social/queue";

/**
 * Phase 13 learning-loop report — summarizes what actually published,
 * grouped by channel and pillar, from real queue history. Does NOT
 * report clicks/impressions/follower growth: those require either the
 * Google Analytics Data API (GA4 property G-BBFL3YH9NZ is referenced in
 * .env.example, but reading it back programmatically needs its own
 * OAuth/service-account setup, not built in this pass) or extending
 * lib/revenue/events.ts's outbound-click capture to also record inbound
 * UTM-tagged social referral traffic. Both are real, buildable next
 * steps — this script reports honestly on what it can already measure
 * (publish outcomes) rather than fabricating engagement numbers.
 *
 * Usage: npx tsx --env-file=.env.local scripts/social/report.ts
 */
async function main() {
  const queue = await readQueue();
  const published = queue.filter((e) => e.state === "PUBLISHED");

  console.log(`Social publish report — ${new Date().toISOString().slice(0, 10)}`);
  console.log(`${published.length} published queue entries out of ${queue.length} total.\n`);

  const byPillar = new Map<string, number>();
  const byChannelStatus = new Map<string, Map<string, number>>();

  for (const entry of published) {
    byPillar.set(entry.pillar, (byPillar.get(entry.pillar) ?? 0) + 1);
    for (const [channel, variant] of Object.entries(entry.channels)) {
      const status = variant?.publishResult?.status ?? "UNKNOWN";
      if (!byChannelStatus.has(channel)) byChannelStatus.set(channel, new Map());
      const statusMap = byChannelStatus.get(channel)!;
      statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
    }
  }

  console.log("By pillar:");
  for (const [pillar, count] of byPillar) console.log(`  ${pillar}: ${count}`);

  console.log("\nBy channel (publish outcome breakdown):");
  for (const [channel, statusMap] of byChannelStatus) {
    const parts = [...statusMap.entries()].map(([status, count]) => `${status}=${count}`).join(", ");
    console.log(`  ${channel}: ${parts}`);
  }

  console.log("\nNot yet available (needs future work, see file header): click-through, impressions, follower growth, best-performing hook/pillar by engagement.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
