import { appendSnapshot } from "@/lib/agents/gsc-snapshot";

/**
 * Seeds the one real baseline data point this system has today: the
 * owner's own report of Search Console's current coverage state for
 * miloosh.com, read directly off the Search Console UI (this environment
 * has no API credential yet, so this could not be fetched automatically —
 * see docs/agents-architecture.md "Google Search Console — connecting
 * real data"). Committed as a script (not just a one-off manual JSON
 * edit) so this real data point survives a `rm -rf var/` and is
 * re-creatable/auditable rather than living only in chat history.
 *
 * Run once: `npx tsx scripts/agents/seo/seed-gsc-baseline.ts`. Running it
 * again appends a duplicate entry (this store is append-only by design —
 * see lib/agents/gsc-snapshot.ts) — don't re-run unless the owner reports
 * a genuinely new reading.
 */

appendSnapshot({
  capturedAt: "2026-08-09",
  source: "owner-reported",
  scope: "Search Console > Pages > Indexing report for miloosh.com — sitemap-submitted URL count vs. indexed count, plus the exclusion-reason breakdown table, as read directly from the Search Console UI by the site owner.",
  sitemapUrls: 1358,
  indexed: 38,
  notIndexed: 1320,
  exclusions: [
    { reason: "Crawled - currently not indexed", count: 1307 },
    { reason: "Crawled - not indexed (state shown separately by Search Console)", count: 13 },
    { reason: "Page with redirect", count: 2 },
    { reason: "Alternate page with proper canonical tag", count: 1 },
  ],
  impressions: null,
  clicks: null,
  averageCtr: null,
  averagePosition: null,
  byTemplate: null,
  notes: "Owner-reported baseline, not fetched via API (no GSC credential configured in this environment yet). The 38+1320=1358 total matches sitemapUrls exactly, so this appears to be the full sitemap-submitted set, not a sampled subset — but that inference is not independently verified against the API and should be treated as a working assumption, not a confirmed fact, until seo-search-console-signals can query the real API directly.",
});

console.log("Seeded GSC baseline snapshot (2026-08-09, owner-reported) into var/agents/gsc-snapshots.json.");
