import { getAllSoftware } from "@/data/software";
import { PUBLISHED_COMPARISONS } from "@/data/comparisons";

/**
 * Phase 5 (2026-08-17 growth sprint) — internal linking graph audit.
 * Deterministic, reads only real site data (no network calls). Counts
 * real inbound links a software page receives from two real sources:
 *   - another product listing it in its `alternatives` array (rendered
 *     as AlternativeCard links on that product's page)
 *   - a published comparison pairing (rendered as a compare-page link)
 * Every catalog page also always gets one inbound link from its
 * category page and from /browse, which this report doesn't count
 * separately since it's structurally guaranteed for all 218 products —
 * the point here is to find pages with WEAK cross-linking beyond that
 * baseline, not truly zero-inbound pages (there are none).
 */
function main() {
  const all = getAllSoftware();
  const inbound = new Map<string, { fromAlternatives: number; fromComparisons: number }>();
  for (const s of all) inbound.set(s.slug, { fromAlternatives: 0, fromComparisons: 0 });

  for (const s of all) {
    for (const alt of s.alternatives) {
      const row = inbound.get(alt.slug);
      if (row) row.fromAlternatives += 1;
    }
  }
  for (const [a, b] of PUBLISHED_COMPARISONS) {
    const rowA = inbound.get(a);
    const rowB = inbound.get(b);
    if (rowA) rowA.fromComparisons += 1;
    if (rowB) rowB.fromComparisons += 1;
  }

  const rows = all.map((s) => {
    const counts = inbound.get(s.slug)!;
    return { slug: s.slug, name: s.name, total: counts.fromAlternatives + counts.fromComparisons, ...counts };
  });

  const weak = rows.filter((r) => r.total === 0).sort((a, b) => a.name.localeCompare(b.name));
  const overlinked = rows.filter((r) => r.total > 20).sort((a, b) => b.total - a.total);

  console.log(`Internal linking graph — ${all.length} products`);
  console.log(`Average inbound cross-links per product: ${(rows.reduce((s, r) => s + r.total, 0) / rows.length).toFixed(1)}`);
  console.log(`\nWeak-link pages (0 inbound from alternatives/comparisons — only reachable via category/browse): ${weak.length}`);
  for (const r of weak) console.log(`  ${r.slug} (${r.name})`);

  console.log(`\nOverlinked pages (>20 inbound — sitewide-hub candidates, not necessarily a problem): ${overlinked.length}`);
  for (const r of overlinked.slice(0, 15)) console.log(`  ${r.slug}: ${r.total} (alt=${r.fromAlternatives}, cmp=${r.fromComparisons})`);
}

main();
