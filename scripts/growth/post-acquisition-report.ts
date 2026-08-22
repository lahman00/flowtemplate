import { getAllFirstPartyEvents, type FirstPartyEvent } from "@/lib/analytics/events";
import { isSyntheticOrTestEvent } from "@/scripts/analytics/report";
import { readQueue } from "@/lib/social/queue";

/**
 * ROAD TO THE FIRST 1,000 REAL HUMANS mission (2026-08-22) Priority 3 —
 * "Build a post-level acquisition table." Real gap found and closed in
 * the same investigation: every social post's link is tagged with
 * utm_content=<queue entry id> at publish time, but nothing in the
 * analytics pipeline ever captured utm_content from the landing URL, so
 * true post-level attribution was structurally impossible despite the
 * tag existing on every link (see components/FirstPartyAnalytics.tsx and
 * lib/analytics/events.ts for the capture fix). This script is the other
 * half: join real utmContent-tagged events against the social queue by
 * entry ID to answer "which specific post brought real humans."
 *
 * Data only exists going forward from the capture fix's deploy — this
 * intentionally does not attempt to retroactively reconstruct
 * attribution for the 6 posts published before it existed.
 */
export interface PostAcquisitionRow {
  queueEntryId: string;
  topic: string;
  channel: string;
  destination: string;
  realVisitors: number;
  engaged: number;
  multiPage: number;
  commercialActions: number;
  affiliateClicks: number;
}

export async function buildPostAcquisitionTable(includeSynthetic = false): Promise<PostAcquisitionRow[]> {
  const [events, queue] = await Promise.all([getAllFirstPartyEvents(), readQueue()]);
  const real = events.filter((e) => !isSyntheticOrTestEvent(e, includeSynthetic));

  const visitorsByContentId = new Map<string, Set<string>>();
  const pageViewCountByVisitor = new Map<string, number>();
  const engagedByContentId = new Map<string, Set<string>>();
  const commercialByContentId = new Map<string, Set<string>>();
  const affiliateByContentId = new Map<string, Set<string>>();
  const contentIdByVisitor = new Map<string, string>();

  const sorted = [...real].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  for (const e of sorted) {
    if (e.type === "page_view") {
      pageViewCountByVisitor.set(e.visitorId, (pageViewCountByVisitor.get(e.visitorId) ?? 0) + 1);
      const contentId = (e as FirstPartyEvent & { utmContent?: string }).utmContent;
      if (contentId && !contentIdByVisitor.has(e.visitorId)) {
        contentIdByVisitor.set(e.visitorId, contentId);
        if (!visitorsByContentId.has(contentId)) visitorsByContentId.set(contentId, new Set());
        visitorsByContentId.get(contentId)!.add(e.visitorId);
      }
    }
  }

  for (const e of sorted) {
    const contentId = contentIdByVisitor.get(e.visitorId);
    if (!contentId) continue;
    if (e.type === "engaged_view") {
      if (!engagedByContentId.has(contentId)) engagedByContentId.set(contentId, new Set());
      engagedByContentId.get(contentId)!.add(e.visitorId);
    } else if (e.type === "software_view" || e.type === "comparison_view") {
      if (!commercialByContentId.has(contentId)) commercialByContentId.set(contentId, new Set());
      commercialByContentId.get(contentId)!.add(e.visitorId);
    } else if (e.type === "outbound_click" && e.destination === "affiliate") {
      if (!affiliateByContentId.has(contentId)) affiliateByContentId.set(contentId, new Set());
      affiliateByContentId.get(contentId)!.add(e.visitorId);
    }
  }

  const queueById = new Map(queue.map((entry) => [entry.id, entry]));
  const rows: PostAcquisitionRow[] = [];
  for (const [contentId, visitors] of visitorsByContentId.entries()) {
    const entry = queueById.get(contentId);
    for (const [channel, variant] of Object.entries(entry?.channels ?? {})) {
      const v = variant as { link?: string | null } | undefined;
      if (!v?.link) continue;
      rows.push({
        queueEntryId: contentId,
        topic: entry?.topic ?? "(unknown — queue entry not found)",
        channel,
        destination: v.link,
        realVisitors: visitors.size,
        engaged: engagedByContentId.get(contentId)?.size ?? 0,
        multiPage: [...visitors].filter((vid) => (pageViewCountByVisitor.get(vid) ?? 0) >= 2).length,
        commercialActions: commercialByContentId.get(contentId)?.size ?? 0,
        affiliateClicks: affiliateByContentId.get(contentId)?.size ?? 0,
      });
    }
  }

  return rows.sort((a, b) => b.realVisitors - a.realVisitors);
}

async function main() {
  const includeSynthetic = process.argv.includes("--include-synthetic");
  const rows = await buildPostAcquisitionTable(includeSynthetic);
  console.log("========================================================================================");
  console.log(" POST-LEVEL ACQUISITION TABLE (real visitors attributed via utm_content, per social post)");
  if (rows.length === 0) {
    console.log("   (no attributable data yet — utm_content capture just shipped; nothing published since)");
  } else {
    for (const r of rows) {
      console.log(`   [${r.queueEntryId.slice(0, 8)}] ${r.channel.padEnd(10)} "${r.topic}"`);
      console.log(`     visitors: ${r.realVisitors} | engaged: ${r.engaged} | multi-page: ${r.multiPage} | commercial: ${r.commercialActions} | affiliate: ${r.affiliateClicks}`);
    }
  }
  console.log("========================================================================================\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
