import "./_load-env";
import { readAffiliatePipeline } from "@/lib/revenue/affiliate-pipeline";
import { readNetworkStatuses } from "@/lib/revenue/affiliate-network-status";
import { AFFILIATE_PROGRAMS } from "@/data/revenue/affiliate-programs";
import { getAllSoftware } from "@/data/software";

/**
 * Affiliate Revenue Engine — read-only health audit (2026-08-16). Never
 * writes anything; safe to run any time. Surfaces exactly the kind of
 * drift that has repeatedly cost real owner time this project: stale
 * research, silently-broken duplicate affiliate URLs (the Miro/monday
 * incident), approved programs missing their link, catalog products with
 * no affiliate research at all, and submitted applications that have
 * gone quiet long enough to be worth a follow-up.
 *
 * Usage: npx tsx --env-file=.env.local scripts/affiliate/audit.ts
 */

const STALE_DAYS = 14;
const FOLLOWUP_DAYS = 14;

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

async function main() {
  const pipeline = await readAffiliatePipeline();
  const networks = await readNetworkStatuses();
  const software = getAllSoftware();
  const softwareSlugs = new Set(software.map((s) => s.slug));

  const problems: { category: string; slug: string; message: string }[] = [];

  // 1. Stale research (static research file, lastVerifiedAt older than STALE_DAYS)
  for (const p of AFFILIATE_PROGRAMS) {
    if (p.programExists !== "yes") continue;
    const age = daysSince(`${p.lastVerifiedAt}T00:00:00.000Z`);
    if (age > STALE_DAYS) {
      problems.push({ category: "stale-research", slug: p.slug, message: `Last verified ${p.lastVerifiedAt} (${age} days ago).` });
    }
  }

  // 2. Duplicate affiliate URLs across approved/active entries
  const urlToSlugs = new Map<string, string[]>();
  for (const e of pipeline) {
    if (!e.affiliateUrl) continue;
    if (!["approved", "affiliate_link_received", "activated", "earning"].includes(e.status)) continue;
    if (!urlToSlugs.has(e.affiliateUrl)) urlToSlugs.set(e.affiliateUrl, []);
    urlToSlugs.get(e.affiliateUrl)!.push(e.slug);
  }
  for (const [url, slugs] of urlToSlugs) {
    if (slugs.length > 1) {
      problems.push({ category: "duplicate-affiliate-url", slug: slugs.join(", "), message: `Same URL (${url}) recorded for ${slugs.length} approved programs — at most one can be real.` });
    }
  }

  // 3. Approved status with no affiliate URL
  for (const e of pipeline) {
    if (["approved", "affiliate_link_received", "activated", "earning"].includes(e.status) && !e.affiliateUrl) {
      problems.push({ category: "approved-missing-link", slug: e.slug, message: `Status is "${e.status}" but no affiliateUrl is recorded.` });
    }
  }

  // 4. Catalog products with no affiliate research entry at all
  const researchedSlugs = new Set(AFFILIATE_PROGRAMS.map((p) => p.slug));
  const uncoveredCount = software.filter((s) => !researchedSlugs.has(s.slug)).length;
  if (uncoveredCount > 0) {
    problems.push({ category: "catalog-gap", slug: "(aggregate)", message: `${uncoveredCount} of ${software.length} catalog products have no affiliate research entry at all.` });
  }

  // 5. Research entries pointing at a software slug that no longer exists in the catalog
  for (const p of AFFILIATE_PROGRAMS) {
    if (!softwareSlugs.has(p.slug)) {
      problems.push({ category: "orphaned-research", slug: p.slug, message: `Research entry exists but no matching data/software/${p.slug}.json.` });
    }
  }

  // 6. Submitted programs overdue for a follow-up
  for (const e of pipeline) {
    if (e.status === "submitted" && e.submittedAt) {
      const age = daysSince(e.submittedAt);
      if (age > FOLLOWUP_DAYS) {
        problems.push({ category: "overdue-followup", slug: e.slug, message: `Submitted ${age} days ago (${e.submittedAt.slice(0, 10)}) with no recorded decision — worth a follow-up.` });
      }
    }
  }

  // 7. Status/research conflicts — pipeline says approved/submitted but static research says program doesn't exist or is unknown
  for (const e of pipeline) {
    const research = AFFILIATE_PROGRAMS.find((p) => p.slug === e.slug);
    const isActive = ["submitted", "pending_review", "approved", "affiliate_link_received", "activated", "earning"].includes(e.status);
    if (isActive && research && research.programExists !== "yes") {
      problems.push({ category: "status-research-conflict", slug: e.slug, message: `Pipeline status is "${e.status}" (real progress) but research file says programExists="${research.programExists}" — research file is stale relative to real events.` });
    }
  }

  // 8. Network-level statuses that might be gating individual programs stuck at needs_owner_action
  const frozenNetworks = networks.filter((n) => n.status === "pending_review");
  for (const n of frozenNetworks) {
    problems.push({ category: "network-pending", slug: `(${n.network})`, message: `Network-level relationship "${n.network}" is still pending_review — any program blocked on it should not be treated as independently actionable.` });
  }

  // ---- Report ----
  console.log(`Affiliate audit — ${new Date().toISOString().slice(0, 10)}`);
  console.log(`${software.length} catalog products · ${AFFILIATE_PROGRAMS.length} research entries · ${pipeline.length} pipeline entries · ${problems.length} findings\n`);

  const byCategory = new Map<string, typeof problems>();
  for (const p of problems) {
    if (!byCategory.has(p.category)) byCategory.set(p.category, []);
    byCategory.get(p.category)!.push(p);
  }
  for (const [category, items] of byCategory) {
    console.log(`\n=== ${category} (${items.length}) ===`);
    for (const item of items) console.log(`  [${item.slug}] ${item.message}`);
  }

  if (problems.length === 0) console.log("No issues found.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
