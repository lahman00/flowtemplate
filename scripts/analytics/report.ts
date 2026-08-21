import { getAllFirstPartyEvents, type FirstPartyEvent } from "@/lib/analytics/events";
import { getOutboundEvents, type StoredOutboundEvent } from "@/lib/revenue/events";

export interface PeriodSummary {
  periodName: string;
  uniqueVisitors: number;
  newVisitors: number;
  returningVisitors: number;
  sessions: number;
  engagedVisitors: number;
  multiPageVisitors: number;
  totalPageViews: number;
  softwareVisitors: number;
  comparisonVisitors: number;
  categoryVisitors: number;
  guideVisitors: number;
  recommendUsers: number;
  meaningfulClickers: number;
  outboundClickers: number;
  affiliateClickers: number;
  funnel: {
    stage: string;
    uniquePeople: number;
    pctOfTotalVisitors: string;
    conversionFromPrev: string;
  }[];
  topLandingPages: { path: string; visits: number }[];
  topExitPages: { path: string; exits: number }[];
  topPages: { path: string; views: number }[];
  topSoftware: { slug: string; views: number }[];
  topComparisons: { slug: string; views: number }[];
  topCategories: { slug: string; views: number }[];
  topGuides: { slug: string; views: number }[];
  topOutboundDestinations: { url: string; clicks: number }[];
  topAffiliateProducts: { slug: string; clicks: number }[];
}

export function isSyntheticOrTestEvent(e: FirstPartyEvent): boolean {
  if (e.isTest) return true;
  if (e.visitorId.startsWith("v_test_") || e.visitorId.startsWith("v_synthetic_") || e.visitorId.startsWith("v_anon_test")) return true;
  if (e.sessionId.startsWith("s_test_") || e.sessionId.startsWith("s_synthetic_") || e.sessionId.startsWith("s_anon_test")) return true;
  return false;
}

export function filterEventsByDate(events: FirstPartyEvent[], startDateIso: string, endDateIso?: string): FirstPartyEvent[] {
  return events.filter(e => {
    if (isSyntheticOrTestEvent(e)) return false;
    if (e.timestamp < startDateIso) return false;
    if (endDateIso && e.timestamp > endDateIso) return false;
    return true;
  });
}

export function computePeriodMetrics(
  periodName: string,
  events: FirstPartyEvent[],
  allHistoricalEvents: FirstPartyEvent[] = [],
  legacyClicks: StoredOutboundEvent[] = []
): PeriodSummary {
  const visitors = new Set<string>();
  const sessions = new Set<string>();
  const sessionsByVisitor = new Map<string, Set<string>>();
  const pageViewsByVisitor = new Map<string, number>();
  const engagedVisitors = new Set<string>();
  const softwareVisitors = new Set<string>();
  const comparisonVisitors = new Set<string>();
  const categoryVisitors = new Set<string>();
  const guideVisitors = new Set<string>();
  const recommendUsers = new Set<string>();
  const meaningfulClickers = new Set<string>();
  const outboundClickers = new Set<string>();
  const affiliateClickers = new Set<string>();

  const landingPageCounts = new Map<string, number>();
  const sessionLastPage = new Map<string, { path: string; timestamp: string }>();
  const pageCounts = new Map<string, number>();
  const softwareCounts = new Map<string, number>();
  const comparisonCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const guideCounts = new Map<string, number>();
  const outboundCounts = new Map<string, number>();
  const affiliateCounts = new Map<string, number>();

  let totalPageViews = 0;

  // Build global session map to calculate new vs returning visitors across all time
  const globalSessionsByVisitor = new Map<string, Set<string>>();
  for (const he of allHistoricalEvents) {
    if (isSyntheticOrTestEvent(he)) continue;
    if (!globalSessionsByVisitor.has(he.visitorId)) {
      globalSessionsByVisitor.set(he.visitorId, new Set<string>());
    }
    globalSessionsByVisitor.get(he.visitorId)!.add(he.sessionId);
  }

  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  for (const e of sortedEvents) {
    if (isSyntheticOrTestEvent(e)) continue;

    // Track landing page: first page view per session
    if (!sessions.has(e.sessionId) && e.type === "page_view") {
      landingPageCounts.set(e.path, (landingPageCounts.get(e.path) ?? 0) + 1);
    }

    visitors.add(e.visitorId);
    sessions.add(e.sessionId);

    if (!sessionsByVisitor.has(e.visitorId)) {
      sessionsByVisitor.set(e.visitorId, new Set<string>());
    }
    sessionsByVisitor.get(e.visitorId)!.add(e.sessionId);

    if (e.type === "page_view") {
      totalPageViews++;
      pageViewsByVisitor.set(e.visitorId, (pageViewsByVisitor.get(e.visitorId) ?? 0) + 1);
      pageCounts.set(e.path, (pageCounts.get(e.path) ?? 0) + 1);
      sessionLastPage.set(e.sessionId, { path: e.path, timestamp: e.timestamp });
    } else if (e.type === "engaged_view") {
      engagedVisitors.add(e.visitorId);
    } else if (e.type === "software_view") {
      softwareVisitors.add(e.visitorId);
      softwareCounts.set(e.softwareSlug, (softwareCounts.get(e.softwareSlug) ?? 0) + 1);
    } else if (e.type === "comparison_view") {
      comparisonVisitors.add(e.visitorId);
      comparisonCounts.set(e.comparisonSlug, (comparisonCounts.get(e.comparisonSlug) ?? 0) + 1);
    } else if (e.type === "category_view") {
      categoryVisitors.add(e.visitorId);
      categoryCounts.set(e.categorySlug, (categoryCounts.get(e.categorySlug) ?? 0) + 1);
    } else if (e.type === "guide_view") {
      guideVisitors.add(e.visitorId);
      guideCounts.set(e.guideSlug, (guideCounts.get(e.guideSlug) ?? 0) + 1);
    } else if (e.type === "recommend_use") {
      recommendUsers.add(e.visitorId);
    } else if (e.type === "internal_cta_click") {
      meaningfulClickers.add(e.visitorId);
    } else if (e.type === "outbound_click") {
      meaningfulClickers.add(e.visitorId);
      outboundClickers.add(e.visitorId);
      outboundCounts.set(e.url, (outboundCounts.get(e.url) ?? 0) + 1);
      if (e.destination === "affiliate") {
        affiliateClickers.add(e.visitorId);
        affiliateCounts.set(e.softwareSlug, (affiliateCounts.get(e.softwareSlug) ?? 0) + 1);
      }
    }
  }

  // Calculate exit pages from last recorded page in each session
  const exitPageCounts = new Map<string, number>();
  for (const { path } of sessionLastPage.values()) {
    exitPageCounts.set(path, (exitPageCounts.get(path) ?? 0) + 1);
  }

  // Include legacy historical outbound events if present and not already in first-party
  if (legacyClicks.length > 0 && events.length === 0) {
    for (const lc of legacyClicks) {
      outboundCounts.set(lc.url, (outboundCounts.get(lc.url) ?? 0) + 1);
      if (lc.destination === "affiliate") {
        affiliateCounts.set(lc.softwareSlug, (affiliateCounts.get(lc.softwareSlug) ?? 0) + 1);
      }
    }
  }

  // Include multi-page visitors into engaged
  const multiPageVisitors = new Set<string>();
  for (const [vid, count] of pageViewsByVisitor.entries()) {
    if (count >= 2) {
      multiPageVisitors.add(vid);
      engagedVisitors.add(vid);
    }
  }

  // Classify new vs returning visitors
  let returningCount = 0;
  let newCount = 0;
  for (const vid of visitors) {
    const totalSessions = (globalSessionsByVisitor.get(vid)?.size ?? sessionsByVisitor.get(vid)?.size) ?? 1;
    if (totalSessions > 1) {
      returningCount++;
    } else {
      newCount++;
    }
  }

  const totalVisitorsCount = visitors.size;
  const engagedCount = engagedVisitors.size;
  const multiPageCount = multiPageVisitors.size;
  const highIntentCount = new Set([...recommendUsers, ...comparisonVisitors, ...softwareVisitors]).size;
  const meaningfulCount = meaningfulClickers.size;
  const outboundCount = outboundClickers.size;
  const affiliateCount = affiliateClickers.size;

  const funnel = [
    {
      stage: "1. REAL VISITORS",
      uniquePeople: totalVisitorsCount,
      pctOfTotalVisitors: "100.0%",
      conversionFromPrev: "100.0%"
    },
    {
      stage: "2. ENGAGED VISITORS (>10s / Multi-Page)",
      uniquePeople: engagedCount,
      pctOfTotalVisitors: totalVisitorsCount > 0 ? `${((engagedCount / totalVisitorsCount) * 100).toFixed(1)}%` : "0.0%",
      conversionFromPrev: totalVisitorsCount > 0 ? `${((engagedCount / totalVisitorsCount) * 100).toFixed(1)}%` : "0.0%"
    },
    {
      stage: "3. VIEWED 2+ PAGES",
      uniquePeople: multiPageCount,
      pctOfTotalVisitors: totalVisitorsCount > 0 ? `${((multiPageCount / totalVisitorsCount) * 100).toFixed(1)}%` : "0.0%",
      conversionFromPrev: engagedCount > 0 ? `${((multiPageCount / engagedCount) * 100).toFixed(1)}%` : "0.0%"
    },
    {
      stage: "4. HIGH-INTENT EVALUATION (Software/Compare/Recommend)",
      uniquePeople: highIntentCount,
      pctOfTotalVisitors: totalVisitorsCount > 0 ? `${((highIntentCount / totalVisitorsCount) * 100).toFixed(1)}%` : "0.0%",
      conversionFromPrev: multiPageCount > 0 ? `${((highIntentCount / multiPageCount) * 100).toFixed(1)}%` : "0.0%"
    },
    {
      stage: "5. MEANINGFUL CTA CLICK",
      uniquePeople: meaningfulCount,
      pctOfTotalVisitors: totalVisitorsCount > 0 ? `${((meaningfulCount / totalVisitorsCount) * 100).toFixed(1)}%` : "0.0%",
      conversionFromPrev: highIntentCount > 0 ? `${((meaningfulCount / highIntentCount) * 100).toFixed(1)}%` : "0.0%"
    },
    {
      stage: "6. CLICKED OUT TO VENDOR",
      uniquePeople: outboundCount,
      pctOfTotalVisitors: totalVisitorsCount > 0 ? `${((outboundCount / totalVisitorsCount) * 100).toFixed(1)}%` : "0.0%",
      conversionFromPrev: meaningfulCount > 0 ? `${((outboundCount / meaningfulCount) * 100).toFixed(1)}%` : "0.0%"
    },
    {
      stage: "7. CLICKED AFFILIATE LINK",
      uniquePeople: affiliateCount,
      pctOfTotalVisitors: totalVisitorsCount > 0 ? `${((affiliateCount / totalVisitorsCount) * 100).toFixed(1)}%` : "0.0%",
      conversionFromPrev: outboundCount > 0 ? `${((affiliateCount / outboundCount) * 100).toFixed(1)}%` : "0.0%"
    }
  ];

  const topLandingPages = [...landingPageCounts.entries()].map(([path, visits]) => ({ path, visits })).sort((a, b) => b.visits - a.visits).slice(0, 10);
  const topExitPages = [...exitPageCounts.entries()].map(([path, exits]) => ({ path, exits })).sort((a, b) => b.exits - a.exits).slice(0, 10);
  const topPages = [...pageCounts.entries()].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 10);
  const topSoftware = [...softwareCounts.entries()].map(([slug, views]) => ({ slug, views })).sort((a, b) => b.views - a.views).slice(0, 10);
  const topComparisons = [...comparisonCounts.entries()].map(([slug, views]) => ({ slug, views })).sort((a, b) => b.views - a.views).slice(0, 10);
  const topCategories = [...categoryCounts.entries()].map(([slug, views]) => ({ slug, views })).sort((a, b) => b.views - a.views).slice(0, 10);
  const topGuides = [...guideCounts.entries()].map(([slug, views]) => ({ slug, views })).sort((a, b) => b.views - a.views).slice(0, 10);
  const topOutboundDestinations = [...outboundCounts.entries()].map(([url, clicks]) => ({ url, clicks })).sort((a, b) => b.clicks - a.clicks).slice(0, 10);
  const topAffiliateProducts = [...affiliateCounts.entries()].map(([slug, clicks]) => ({ slug, clicks })).sort((a, b) => b.clicks - a.clicks).slice(0, 10);

  return {
    periodName,
    uniqueVisitors: totalVisitorsCount,
    newVisitors: newCount,
    returningVisitors: returningCount,
    sessions: sessions.size,
    engagedVisitors: engagedCount,
    multiPageVisitors: multiPageCount,
    totalPageViews,
    softwareVisitors: softwareVisitors.size,
    comparisonVisitors: comparisonVisitors.size,
    categoryVisitors: categoryVisitors.size,
    guideVisitors: guideVisitors.size,
    recommendUsers: recommendUsers.size,
    meaningfulClickers: meaningfulCount,
    outboundClickers: outboundCount,
    affiliateClickers: affiliateCount,
    funnel,
    topLandingPages,
    topExitPages,
    topPages,
    topSoftware,
    topComparisons,
    topCategories,
    topGuides,
    topOutboundDestinations,
    topAffiliateProducts
  };
}

export async function generateAnalyticsReport() {
  const events = await getAllFirstPartyEvents();
  const legacyClicks = await getOutboundEvents();

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const todayEvents = filterEventsByDate(events, todayStr + "T00:00:00.000Z");
  const yesterdayEvents = filterEventsByDate(events, yesterdayStr + "T00:00:00.000Z", todayStr + "T00:00:00.000Z");
  const last7dEvents = filterEventsByDate(events, last7d);
  const last30dEvents = filterEventsByDate(events, last30d);

  const periods = [
    computePeriodMetrics("TODAY", todayEvents, events),
    computePeriodMetrics("YESTERDAY", yesterdayEvents, events),
    computePeriodMetrics("LAST 7 DAYS", last7dEvents, events),
    computePeriodMetrics("LAST 30 DAYS", last30dEvents, events),
    computePeriodMetrics("ALL TIME (First-Party Live)", events, events, legacyClicks)
  ];

  console.log("========================================================================================");
  console.log("                      MILOOSH REAL HUMAN USAGE & FUNNEL REPORT                          ");
  console.log("========================================================================================\n");

  for (const p of periods) {
    console.log(`----------------------------------------------------------------------------------------`);
    console.log(` PERIOD: ${p.periodName}`);
    console.log(`----------------------------------------------------------------------------------------`);
    console.log(`  - Unique Visitors:         ${p.uniqueVisitors.toString().padEnd(6)} |  - New vs Returning:     ${p.newVisitors} new / ${p.returningVisitors} ret`);
    console.log(`  - Sessions:                ${p.sessions.toString().padEnd(6)} |  - Total Page Views:     ${p.totalPageViews}`);
    console.log(`  - Engaged Visitors (>10s): ${p.engagedVisitors.toString().padEnd(6)} |  - Multi-Page Visitors:  ${p.multiPageVisitors}`);
    console.log(`  - Software Page Visitors:  ${p.softwareVisitors.toString().padEnd(6)} |  - Comparison Visitors:   ${p.comparisonVisitors}`);
    console.log(`  - Category Page Visitors:  ${p.categoryVisitors.toString().padEnd(6)} |  - Guide Page Visitors:    ${p.guideVisitors}`);
    console.log(`  - Recommend Tool Users:    ${p.recommendUsers.toString().padEnd(6)} |  - Meaningful Clickers:  ${p.meaningfulClickers}`);
    console.log(`  - Outbound Clickers:       ${p.outboundClickers.toString().padEnd(6)} |  - Affiliate Clickers:    ${p.affiliateClickers}\n`);

    console.log(`  CANONICAL HUMAN FUNNEL:`);
    p.funnel.forEach(f => {
      console.log(`    ${f.stage.padEnd(54)}: ${f.uniquePeople.toString().padStart(4)} people | ${f.pctOfTotalVisitors.padStart(6)} of visitors | ${f.conversionFromPrev.padStart(6)} step conversion`);
    });

    if (p.topLandingPages.length > 0) {
      console.log(`\n  Top Landing Pages:`);
      p.topLandingPages.forEach((item, i) => console.log(`    ${i + 1}. ${item.path} (${item.visits} visits)`));
    }
    if (p.topExitPages.length > 0) {
      console.log(`\n  Top Exit Pages:`);
      p.topExitPages.forEach((item, i) => console.log(`    ${i + 1}. ${item.path} (${item.exits} exits)`));
    }
    if (p.topPages.length > 0) {
      console.log(`\n  Top Pages:`);
      p.topPages.forEach((item, i) => console.log(`    ${i + 1}. ${item.path} (${item.views} views)`));
    }
    if (p.topSoftware.length > 0) {
      console.log(`\n  Top Software Pages:`);
      p.topSoftware.forEach((item, i) => console.log(`    ${i + 1}. ${item.slug} (${item.views} views)`));
    }
    if (p.topComparisons.length > 0) {
      console.log(`\n  Top Comparisons:`);
      p.topComparisons.forEach((item, i) => console.log(`    ${i + 1}. ${item.slug} (${item.views} views)`));
    }
    if (p.topCategories.length > 0) {
      console.log(`\n  Top Categories:`);
      p.topCategories.forEach((item, i) => console.log(`    ${i + 1}. ${item.slug} (${item.views} views)`));
    }
    if (p.topGuides.length > 0) {
      console.log(`\n  Top Guides:`);
      p.topGuides.forEach((item, i) => console.log(`    ${i + 1}. ${item.slug} (${item.views} views)`));
    }
    if (p.topOutboundDestinations.length > 0) {
      console.log(`\n  Top Outbound Destinations:`);
      p.topOutboundDestinations.forEach((item, i) => console.log(`    ${i + 1}. ${item.url} (${item.clicks} clicks)`));
    }
    if (p.topAffiliateProducts.length > 0) {
      console.log(`\n  Top Affiliate Products Clicked:`);
      p.topAffiliateProducts.forEach((item, i) => console.log(`    ${i + 1}. ${item.slug} (${item.clicks} clicks)`));
    }
    console.log("\n");
  }

  console.log("========================================================================================");
  console.log(" HISTORICAL DATA PROVENANCE:");
  console.log(" - First-Party Analytics Layer: Deployed live with zero PII, anonymous visitor/session IDs.");
  console.log(` - Legacy Outbound Click Log: ${legacyClicks.length} total events in Blob store.`);
  if (legacyClicks.some(c => c.softwareSlug === "pipedrive")) {
    console.log("   * Note: 2026-08-19 Pipedrive click recorded during controlled production verification test.");
  }
  console.log("========================================================================================\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateAnalyticsReport();
}
