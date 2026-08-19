import { getAllSoftware, type Software } from "@/data/software";
import { PUBLISHED_COMPARISONS, getComparisonSlug } from "@/data/comparisons";
import { getActivePartner } from "@/data/affiliate/active-partners";
import { getOutboundEvents } from "@/lib/revenue/events";
import { GoogleSearchConsoleClient, type SearchAnalyticsRow } from "@/scripts/agents/seo/lib/google-search-console-client";
import { recentAndPriorWindows } from "@/scripts/agents/seo/lib/date-windows";
import { SITE_URL } from "@/lib/site";

/**
 * Phase 12 — Money Map. A page-level revenue-opportunity dataset built
 * ONLY from data this project can actually produce today:
 *
 *   - REAL: fetched or measured directly (live Google Search Console
 *     Search Analytics, real outbound-click events from
 *     lib/revenue/events.ts's Blob store, the canonical affiliate
 *     registry).
 *   - DERIVED: mechanically computed from real stored facts (e.g.
 *     monetization coverage from the affiliate registry, a commercial-
 *     intent tier from a product's stored pricing model).
 *   - HEURISTIC: a documented rule of thumb, not a measured fact (e.g.
 *     "comparison pages carry stronger buying intent than software
 *     pages" — an editorial judgment about query intent, not something
 *     Miloosh has measured).
 *   - unavailable: explicitly absent, never silently defaulted to a
 *     neutral/zero value. This project already has one real example of
 *     the anti-pattern this avoids: lib/agents/scoring.ts's
 *     SEARCH_SIGNAL_PLACEHOLDER, a hardcoded "always 0.5, not a real
 *     signal yet." The Money Score below does the opposite — a
 *     component that isn't available is excluded from the weighted
 *     average entirely, not faked as neutral.
 *
 * GSC note: the live Search Analytics call only succeeds when this code
 * runs on Vercel (GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT /
 * GOOGLE_SEARCH_CONSOLE_PROPERTY are "Sensitive" Vercel env vars,
 * injected into the deployed runtime but not retrievable by a local/CI
 * CLI — see var/agents/gsc-snapshots.json's 2026-08-13 entry for the
 * prior confirmed-working real pull). Locally/in tests, GoogleSearchConsoleClient.fromEnv()
 * returns null and every page's GSC fields are honestly "unavailable" —
 * never faked.
 */

export type DataAvailability = "real" | "derived" | "heuristic" | "unavailable";

export type MoneyMapPageType = "software" | "comparison";

export type MoneyMapProductRef = {
  slug: string;
  name: string;
  /** From the canonical registry (data/affiliate/active-partners.ts) — the only source of truth for "is this an active affiliate CTA today." */
  affiliateStatus: "active" | "not-active";
  network: string | null;
};

export type MoneyMapGscMetrics = {
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
};

export type MoneyMapClickMetrics = {
  affiliateClicks: number;
  officialClicks: number;
  totalClicks: number;
};

export type MoneyScoreComponent = {
  label: string;
  weight: number;
  /** 0-10, or null when unavailable — never a faked neutral value. */
  value: number | null;
  availability: DataAvailability;
  note: string;
};

export type MoneyMapBucket = "A" | "B" | "C" | "D" | "E" | "F" | null;

export type MoneyMapPage = {
  url: string;
  fullUrl: string;
  pageType: MoneyMapPageType;
  products: MoneyMapProductRef[];
  monetizationCoverage: "both" | "one" | "none";
  commercialIntent: "high" | "medium" | "low";
  commercialIntentAvailability: DataAvailability;
  gsc: MoneyMapGscMetrics | null;
  gscAvailability: DataAvailability;
  clicks: MoneyMapClickMetrics;
  clicksAvailability: DataAvailability;
  moneyScore: number;
  scoreComponents: MoneyScoreComponent[];
  /** How many of the 6 scoring components had real/derived/heuristic data, out of 6 — a transparency signal, not part of the score itself. */
  componentsAvailable: number;
  bucket: MoneyMapBucket;
  bucketReason: string;
  recommendedAction: string;
};

export type MoneyMapDataset = {
  generatedAt: string;
  gscFetchAvailability: DataAvailability;
  gscFetchNote: string;
  totalPagesAnalyzed: number;
  totalOutboundEventsSitewide: number;
  pages: MoneyMapPage[];
};

// ---------------------------------------------------------------------
// Expected-CTR curve for the CTR-gap component. This is a well-known,
// widely-published INDUSTRY heuristic (organic CTR tends to fall off
// steeply after the first few positions), not a Miloosh-measured fact —
// explicitly labeled "heuristic" everywhere it's used below.
// ---------------------------------------------------------------------
function heuristicExpectedCtr(position: number): number {
  if (position <= 1) return 0.28;
  if (position <= 2) return 0.15;
  if (position <= 3) return 0.11;
  if (position <= 5) return 0.07;
  if (position <= 10) return 0.03;
  if (position <= 20) return 0.015;
  return 0.005;
}

function bucketFromCount(n: number, breaks: number[], scores: number[]): number {
  for (let i = 0; i < breaks.length; i++) {
    if (n < breaks[i]!) return scores[i]!;
  }
  return scores[scores.length - 1]!;
}

function commercialIntentTierFromSoftware(software: Software): { tier: "high" | "medium" | "low"; availability: DataAvailability; note: string } {
  const model = software.pricing?.model;
  if (!model || model === "unknown") {
    // Deliberately still contributes a value — "low" is a conservative
    // fallback assumption, not a real derivation from stored data, so
    // it's labeled "heuristic" rather than "unavailable". "unavailable"
    // is reserved for components excluded from the score entirely.
    return { tier: "low", availability: "heuristic", note: "No stored pricing model for this product; commercial intent cannot be derived from real data, so a conservative 'low' assumption is used instead of guessing high." };
  }
  if (model === "paid" || model === "freemium") {
    return { tier: "medium", availability: "derived", note: `Derived from stored pricing.model = "${model}".` };
  }
  return { tier: "low", availability: "derived", note: `Derived from stored pricing.model = "${model}".` };
}

async function fetchLiveGscByPage(): Promise<{ rows: Map<string, MoneyMapGscMetrics>; availability: DataAvailability; note: string }> {
  const client = GoogleSearchConsoleClient.fromEnv();
  if (!client) {
    return {
      rows: new Map(),
      availability: "unavailable",
      note: "GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT / GOOGLE_SEARCH_CONSOLE_PROPERTY not available in this runtime — real per-page Search Console data requires this code to execute on Vercel production, where those credentials are injected. Locally/in tests this is always unavailable, by design; nothing here is estimated as a substitute.",
    };
  }

  try {
    const { recent } = recentAndPriorWindows(28);
    const rawRows: SearchAnalyticsRow[] = await client.queryAllSearchAnalytics({
      startDate: recent.startDate,
      endDate: recent.endDate,
      dimensions: ["page"],
      rowLimit: 5000,
    });
    const rows = new Map<string, MoneyMapGscMetrics>();
    for (const row of rawRows) {
      const url = row.keys[0];
      if (!url) continue;
      rows.set(url, { impressions: row.impressions, clicks: row.clicks, ctr: row.ctr, position: row.position });
    }
    return {
      rows,
      availability: "real",
      note: `Live Search Console Search Analytics, ${recent.startDate} to ${recent.endDate} (28-day window), dimension="page", ${rawRows.length} rows returned. A page with no row here had zero recorded impressions in this window — that is real information, not missing data.`,
    };
  } catch (error) {
    return {
      rows: new Map(),
      availability: "unavailable",
      note: `Live Search Console call failed: ${error instanceof Error ? error.message : String(error)}. Treated as unavailable, not estimated.`,
    };
  }
}

function toProductRef(software: Software): MoneyMapProductRef {
  const partner = getActivePartner(software.slug);
  return {
    slug: software.slug,
    name: software.name,
    affiliateStatus: partner?.affiliateUrl ? "active" : "not-active",
    network: partner?.affiliateUrl ? "PartnerStack/Impact (see data/affiliate/active-partners.ts)" : null,
  };
}

function buildScoreComponents(page: {
  gsc: MoneyMapGscMetrics | null;
  gscAvailability: DataAvailability;
  monetizationCoverage: "both" | "one" | "none";
  commercialIntent: "high" | "medium" | "low";
  commercialIntentAvailability: DataAvailability;
  clicks: MoneyMapClickMetrics;
  clicksAvailability: DataAvailability;
}): MoneyScoreComponent[] {
  const components: MoneyScoreComponent[] = [];

  // 1. Search visibility (weight 3) — REAL when GSC is available.
  if (page.gscAvailability === "unavailable") {
    components.push({ label: "Search visibility (impressions)", weight: 3, value: null, availability: "unavailable", note: "GSC data unavailable in this run." });
  } else {
    const impressions = page.gsc?.impressions ?? 0;
    const value = bucketFromCount(impressions, [1, 10, 50, 200, 1000], [0, 2, 4, 6, 8, 10]);
    components.push({ label: "Search visibility (impressions)", weight: 3, value, availability: "real", note: `${impressions} impressions, last 28 days (real, live GSC).` });
  }

  // 2. Ranking proximity (weight 2) — REAL, only meaningful when the page has impressions (GSC only returns a position for pages it has data on).
  if (page.gscAvailability === "unavailable" || !page.gsc || page.gsc.impressions === 0) {
    components.push({ label: "Ranking proximity", weight: 2, value: null, availability: page.gscAvailability === "unavailable" ? "unavailable" : "real", note: page.gscAvailability === "unavailable" ? "GSC data unavailable." : "Zero real impressions in this window — no meaningful position to score." });
  } else {
    const position = page.gsc.position;
    const value = position <= 3 ? 10 : position <= 10 ? 7 : position <= 20 ? 4 : position <= 50 ? 2 : 0.5;
    components.push({ label: "Ranking proximity", weight: 2, value, availability: "real", note: `Average position ${position.toFixed(1)} (real, live GSC).` });
  }

  // 3. CTR gap vs. a heuristic expected-CTR curve (weight 1.5) — real inputs, heuristic benchmark.
  if (page.gscAvailability === "unavailable" || !page.gsc || page.gsc.impressions === 0) {
    components.push({ label: "CTR opportunity gap", weight: 1.5, value: null, availability: page.gscAvailability === "unavailable" ? "unavailable" : "real", note: "No impressions to compute a real CTR from." });
  } else {
    const expected = heuristicExpectedCtr(page.gsc.position);
    const gap = Math.max(0, expected - page.gsc.ctr);
    const value = Math.min(10, (gap / expected) * 10);
    components.push({ label: "CTR opportunity gap", weight: 1.5, value: Math.round(value * 10) / 10, availability: "heuristic", note: `Real CTR ${(page.gsc.ctr * 100).toFixed(1)}% at position ${page.gsc.position.toFixed(1)} vs. a heuristic expected CTR of ${(expected * 100).toFixed(1)}% for that position (industry rule of thumb, not Miloosh-measured).` });
  }

  // 4. Commercial intent (weight 2) — derived from pricing model (software) or heuristic (comparison, see caller).
  const intentValue = page.commercialIntent === "high" ? 8 : page.commercialIntent === "medium" ? 6 : 3;
  components.push({ label: "Commercial intent", weight: 2, value: intentValue, availability: page.commercialIntentAvailability, note: `Classified "${page.commercialIntent}".` });

  // 5. Monetization readiness (weight 2.5) — real, from the canonical affiliate registry.
  const readinessValue = page.monetizationCoverage === "both" ? 10 : page.monetizationCoverage === "one" ? 6 : 0;
  components.push({ label: "Monetization readiness", weight: 2.5, value: readinessValue, availability: "real", note: `Affiliate coverage: ${page.monetizationCoverage} (from data/affiliate/active-partners.ts).` });

  // 6. Real outbound-click evidence (weight 1, deliberately low — see note).
  if (page.clicksAvailability === "unavailable") {
    components.push({ label: "Real outbound-click evidence", weight: 1, value: null, availability: "unavailable", note: "Outbound-click tracking not available in this run." });
  } else {
    const value = page.clicks.affiliateClicks > 0 ? 10 : page.clicks.officialClicks > 0 ? 3 : 0;
    components.push({ label: "Real outbound-click evidence", weight: 1, value, availability: "real", note: `${page.clicks.affiliateClicks} real affiliate click(s), ${page.clicks.officialClicks} real official-site click(s) recorded for this exact page. Sitewide click history is still very young (production tracking enabled 2026-08-19) — treat this component as a weak, early signal only, not a mature one.` });
  }

  return components;
}

function computeMoneyScore(components: MoneyScoreComponent[]): { score: number; componentsAvailable: number } {
  const available = components.filter((c) => c.value !== null);
  if (available.length === 0) return { score: 0, componentsAvailable: 0 };
  const weightedSum = available.reduce((sum, c) => sum + c.value! * c.weight, 0);
  const weightTotal = available.reduce((sum, c) => sum + c.weight, 0);
  const score = (weightedSum / weightTotal) * 10; // components are 0-10, rescale weighted average to 0-100
  return { score: Math.round(score * 10) / 10, componentsAvailable: available.length };
}

function classifyBucket(page: {
  pageType: MoneyMapPageType;
  gsc: MoneyMapGscMetrics | null;
  gscAvailability: DataAvailability;
  monetizationCoverage: "both" | "one" | "none";
  clicks: MoneyMapClickMetrics;
  clicksAvailability: DataAvailability;
}): { bucket: MoneyMapBucket; reason: string; action: string } {
  const hasRealGsc = page.gscAvailability === "real";
  const impressions = page.gsc?.impressions ?? 0;
  const clicks = page.gsc?.clicks ?? 0;
  const position = page.gsc?.position ?? null;
  const ctr = page.gsc?.ctr ?? null;

  if (!hasRealGsc) {
    if (page.monetizationCoverage !== "both" && page.monetizationCoverage !== "none") {
      // still classify D (monetization gap) — that bucket doesn't require traffic data, only real registry data.
    }
  }

  // D. MONETIZATION GAP — real registry data only, no traffic required.
  if (page.monetizationCoverage === "one" && page.pageType === "comparison") {
    return { bucket: "D", reason: "One of the two compared products has an active affiliate link, the other doesn't — real registry gap, independent of traffic.", action: "Confirm whether the non-monetized product's affiliate program can be pursued; if not viable, no action needed beyond noting the gap." };
  }

  // A. MONEY NOW — real traffic AND real monetization.
  if (hasRealGsc && clicks > 0 && page.monetizationCoverage !== "none") {
    return { bucket: "A", reason: `Real GSC clicks (${clicks} in 28 days) on a monetized page.`, action: "Protect and reinforce — verify the CTA is prominent and the content stays accurate." };
  }

  // C. RANKING STRIKE ZONE — commercial page, real impressions, position in reach of page 1.
  if (hasRealGsc && impressions >= 10 && position !== null && position > 10 && position <= 20 && page.monetizationCoverage !== "none") {
    return { bucket: "C", reason: `Real average position ${position!.toFixed(1)} with ${impressions} impressions — inside striking distance of page one.`, action: "Strengthen on-page relevance/depth for the ranking query; internal-link this page from higher-authority pages." };
  }

  // B. CTR OPPORTUNITY — real impressions/position good enough to be seen, real CTR below the heuristic expectation.
  if (hasRealGsc && impressions >= 10 && position !== null && position <= 20 && ctr !== null && ctr < heuristicExpectedCtr(position)) {
    return { bucket: "B", reason: `Real position ${position!.toFixed(1)} with ${impressions} impressions but CTR ${(ctr * 100).toFixed(1)}% is below the heuristic expected rate for that position.`, action: "Rewrite title/meta description to better match query intent and stand out in the results snippet." };
  }

  // E. CLICK OPTIMIZATION — only with enough real click volume to mean anything. Sitewide total is 1 event today, so this bucket is intentionally near-impossible to reach right now — that's honest, not a bug.
  if (page.clicksAvailability === "real" && page.clicks.totalClicks >= 20 && page.monetizationCoverage !== "none" && page.clicks.affiliateClicks / Math.max(1, page.clicks.totalClicks) < 0.1) {
    return { bucket: "E", reason: `${page.clicks.totalClicks} real recorded clicks on this page but very few converted to the affiliate CTA specifically.`, action: "Review CTA placement/copy — visitors are clicking through but not choosing the monetized option." };
  }

  // F. BUILD/EXPAND — real registry says fully monetized, but real GSC shows this page effectively invisible (or GSC data itself unavailable), and it's a comparison (the highest-leverage page type per the sitewide GSC snapshot's own finding that /compare/ pages get disproportionately few impressions).
  if (page.pageType === "comparison" && page.monetizationCoverage === "both" && (!hasRealGsc || impressions === 0)) {
    return { bucket: "F", reason: "Fully monetized comparison (both products have active affiliate links) but real Search Console data shows zero or unavailable impressions — an indexing/visibility gap, not a monetization gap.", action: "Check indexing status for this URL and strengthen internal linking to it; this is exactly the page-type the sitewide GSC snapshot shows Google is under-crawling relative to /software/ pages." };
  }

  return { bucket: null, reason: hasRealGsc ? "Does not meet the evidence threshold for any bucket today." : "Real Search Console data unavailable for this page in this run, and it doesn't qualify for a registry-only bucket (D/F).", action: "No action recommended without more evidence." };
}

export async function buildMoneyMap(): Promise<MoneyMapDataset> {
  const software = getAllSoftware();
  const softwareBySlug = new Map(software.map((s) => [s.slug, s]));

  const { rows: gscByUrl, availability: gscFetchAvailability, note: gscFetchNote } = await fetchLiveGscByPage();
  const outboundEvents = await getOutboundEvents();

  const clicksBySourcePage = new Map<string, MoneyMapClickMetrics>();
  for (const event of outboundEvents) {
    const existing = clicksBySourcePage.get(event.sourcePage) ?? { affiliateClicks: 0, officialClicks: 0, totalClicks: 0 };
    if (event.type === "affiliate_link_click") existing.affiliateClicks += 1;
    else existing.officialClicks += 1;
    existing.totalClicks += 1;
    clicksBySourcePage.set(event.sourcePage, existing);
  }
  const clicksAvailability: DataAvailability = "real"; // tracking is on in production; a page with no entry had a real zero, not missing data.

  const pages: MoneyMapPage[] = [];

  function assemblePage(url: string, pageType: MoneyMapPageType, products: MoneyMapProductRef[], commercialIntent: "high" | "medium" | "low", commercialIntentAvailability: DataAvailability): MoneyMapPage {
    const fullUrl = `${SITE_URL}${url}`;
    const gsc = gscByUrl.get(fullUrl) ?? gscByUrl.get(url) ?? null;
    const monetizedCount = products.filter((p) => p.affiliateStatus === "active").length;
    const monetizationCoverage: "both" | "one" | "none" = pageType === "software" ? (monetizedCount > 0 ? "both" : "none") : monetizedCount === 2 ? "both" : monetizedCount === 1 ? "one" : "none";
    const clicks = clicksBySourcePage.get(url) ?? { affiliateClicks: 0, officialClicks: 0, totalClicks: 0 };

    const scoreComponents = buildScoreComponents({
      gsc,
      gscAvailability: gscFetchAvailability,
      monetizationCoverage,
      commercialIntent,
      commercialIntentAvailability,
      clicks,
      clicksAvailability,
    });
    const { score, componentsAvailable } = computeMoneyScore(scoreComponents);
    const { bucket, reason, action } = classifyBucket({ pageType, gsc, gscAvailability: gscFetchAvailability, monetizationCoverage, clicks, clicksAvailability });

    return {
      url,
      fullUrl,
      pageType,
      products,
      monetizationCoverage,
      commercialIntent,
      commercialIntentAvailability,
      gsc,
      gscAvailability: gsc ? "real" : gscFetchAvailability === "unavailable" ? "unavailable" : "real",
      clicks,
      clicksAvailability,
      moneyScore: score,
      scoreComponents,
      componentsAvailable,
      bucket,
      bucketReason: reason,
      recommendedAction: action,
    };
  }

  for (const item of software) {
    const intent = commercialIntentTierFromSoftware(item);
    pages.push(assemblePage(`/software/${item.slug}`, "software", [toProductRef(item)], intent.tier, intent.availability));
  }

  for (const [slugA, slugB] of PUBLISHED_COMPARISONS) {
    const a = softwareBySlug.get(slugA);
    const b = softwareBySlug.get(slugB);
    if (!a || !b) continue;
    const url = `/compare/${getComparisonSlug(slugA, slugB)}`;
    pages.push(assemblePage(url, "comparison", [toProductRef(a), toProductRef(b)], "high", "heuristic"));
  }

  pages.sort((x, y) => y.moneyScore - x.moneyScore);

  return {
    generatedAt: new Date().toISOString(),
    gscFetchAvailability,
    gscFetchNote,
    totalPagesAnalyzed: pages.length,
    totalOutboundEventsSitewide: outboundEvents.length,
    pages,
  };
}
