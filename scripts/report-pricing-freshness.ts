import { getAllSoftware } from "@/data/software";
import { isPricingStale, hasNumericPricingClaim, DEFAULT_PRICING_STALE_DAYS } from "@/lib/pricing-freshness";

/**
 * Phase 3B / Phase 8 (2026-08-17 growth sprint) — deterministic pricing-
 * freshness report. No network calls, no LLM judgment — just checks
 * data/software/*.json's own pricing.lastVerified field against today.
 *
 * Usage: npx tsx scripts/report-pricing-freshness.ts
 */
function main() {
  const all = getAllSoftware();
  const withNumericClaim = all.filter(hasNumericPricingClaim);
  const stale = withNumericClaim.filter((s) => isPricingStale(s));
  const noPricingAtAll = all.filter((s) => !s.pricing);

  console.log(`Pricing freshness report — ${new Date().toISOString().slice(0, 10)}`);
  console.log(`${all.length} total products in catalog.`);
  console.log(`${withNumericClaim.length} have a numeric pricing claim (entryPaid or tiers).`);
  console.log(`${noPricingAtAll.length} have no pricing data at all.`);
  console.log(`${stale.length} numeric pricing claims are stale (last verified > ${DEFAULT_PRICING_STALE_DAYS} days ago).`);

  if (stale.length > 0) {
    console.log(`\nStale (needs re-verification):`);
    for (const s of stale) {
      console.log(`  ${s.slug} — last verified ${s.pricing?.lastVerified}`);
    }
  }

  const fresh = withNumericClaim.filter((s) => !isPricingStale(s));
  if (fresh.length > 0) {
    console.log(`\nFresh (verified within ${DEFAULT_PRICING_STALE_DAYS} days):`);
    for (const s of fresh) {
      console.log(`  ${s.slug} — verified ${s.pricing?.lastVerified}, source: ${s.pricing?.officialSource ?? "(none recorded)"}`);
    }
  }
}

main();
