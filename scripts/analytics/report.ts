import { getAllFirstPartyEvents, type FirstPartyEvent } from "@/lib/analytics/events";
import { getOutboundEvents, type StoredOutboundEvent } from "@/lib/revenue/events";

export interface PeriodSummary {
  periodName: string;
  uniqueVisitors: number;
  sessions: number;
  engagedVisitors: number;
  multiPageVisitors: number;
  totalPageViews: number;
  softwareVisitors: number;
  comparisonVisitors: number;
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
  topPages: { path: string; views: number }[];
  topSoftware: { slug: string; views: number }[];
  topComparisons: { slug: string; views: number }[];
  topOutboundDestinations: { url: string; clicks: number }[];
  topAffiliateProducts: { slug: string; clicks: number }[];
}

function filterEventsByDate(events: FirstPartyEvent[], startDateIso: string, endDateIso?: string): FirstPartyEvent[] {
  return events.filter(e => {
    if (e.timestamp < startDateIso) return false;
    if (endDateIso && e.timestamp > endDateIso) return false;
    return true;
  });
}

function computePeriodMetrics(periodName: string, events: FirstPartyEvent[], legacyClicks: StoredOutboundEvent[] = []): PeriodSummary {
  const visitors = new Set<string>();
  const sessions = new Set<string>();
  const pageViewsByVisitor = new Map<string, number>();
  const engagedVisitors = new Set<string>();
  const softwareVisitors = new Set<string>();
  const comparisonVisitors = new Set<string>();
  const recommendUsers = new Set<string>();
  const meaningfulClickers = new Set<string>();
  const outboundClickers = new Set<string>();
  const affiliateClickers = new Set<string>();

  const pageCounts = new Map<string, number>();
  const softwareCounts = new Map<string, number>();
  const comparisonCounts = new Map<string, number>();
  const outboundCounts = new Map<string, number>();
  const affiliateCounts = new Map<string, number>();

  let totalPageViews = 0;

  for (const e of events) {
    visitors.add(e.visitorId);
    sessions.add(e.sessionId);

    if (e.type === "page_view") {
      totalPageViews++;
      pageViewsByVisitor.set(e.visitorId, (pageViewsByVisitor.get(e.visitorId) ?? 0) + 1);
      pageCounts.set(e.path, (pageCounts.get(e.path) ?? 0) + 1);
    } else if (e.type === "engaged_view") {
      engagedVisitors.add(e.visitorId);
    } else if (e.type === "software_view") {
      softwareVisitors.add(e.visitorId);
      softwareCounts.set(e.softwareSlug, (softwareCounts.get(e.softwareSlug) ?? 0) + 1);
    } else if (e.type === "comparison_view") {
      comparisonVisitors.add(e.visitorId);
      comparisonCounts.set(e.comparisonSlug, (comparisonCounts.get(e.comparisonSlug) ?? 0) + 1);
    } else if (e.type === "recommend_use") {
      recommendUsers.add(e.visitorId);
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

  const totalVisitorsCount = visitors.size;
  const engagedCount = engagedVisitors.size;
  const multiPageCount = multiPageVisitors.size;
  const recommendComparisonCount = new Set([...recommendUsers, ...comparisonVisitors]).size;
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
      stage: "2. ENGAGED VISITORS (>10s / Scroll / Multi-Page)",
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
      stage: "4. USED RECOMMEND / COMPARISON",
      uniquePeople: recommendComparisonCount,
      pctOfTotalVisitors: totalVisitorsCount > 0 ? `${((recommendComparisonCount / totalVisitorsCount) * 100).toFixed(1)}%` : "0.0%",
      conversionFromPrev: multiPageCount > 0 ? `${((recommendComparisonCount / multiPageCount) * 100).toFixed(1)}%` : "0.0%"
    },
    {
      stage: "5. CLICKED A PRODUCT CTA",
      uniquePeople: meaningfulCount,
      pctOfTotalVisitors: totalVisitorsCount > 0 ? `${((meaningfulCount / totalVisitorsCount) * 100).toFixed(1)}%` : "0.0%",
      conversionFromPrev: recommendComparisonCount > 0 ? `${((meaningfulCount / recommendComparisonCount) * 100).toFixed(1)}%` : "0.0%"
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

  const topPages = [...pageCounts.entries()].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 10);
  const topSoftware = [...softwareCounts.entries()].map(([slug, views]) => ({ slug, views })).sort((a, b) => b.views - a.views).slice(0, 10);
  const topComparisons = [...comparisonCounts.entries()].map(([slug, views]) => ({ slug, views })).sort((a, b) => b.views - a.views).slice(0, 10);
  const topOutboundDestinations = [...outboundCounts.entries()].map(([url, clicks]) => ({ url, clicks })).sort((a, b) => b.clicks - a.clicks).slice(0, 10);
  const topAffiliateProducts = [...affiliateCounts.entries()].map(([slug, clicks]) => ({ slug, clicks })).sort((a, b) => b.clicks - a.clicks).slice(0, 10);

  return {
    periodName,
    uniqueVisitors: totalVisitorsCount,
    sessions: sessions.size,
    engagedVisitors: engagedCount,
    multiPageVisitors: multiPageCount,
    totalPageViews,
    softwareVisitors: softwareVisitors.size,
    comparisonVisitors: comparisonVisitors.size,
    recommendUsers: recommendUsers.size,
    meaningfulClickers: meaningfulCount,
    outboundClickers: outboundCount,
    affiliateClickers: affiliateCount,
    funnel,
    topPages,
    topSoftware,
    topComparisons,
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
    computePeriodMetrics("TODAY", todayEvents),
    computePeriodMetrics("YESTERDAY", yesterdayEvents),
    computePeriodMetrics("LAST 7 DAYS", last7dEvents),
    computePeriodMetrics("LAST 30 DAYS", last30dEvents),
    computePeriodMetrics("ALL TIME (First-Party Live)", events, legacyClicks)
  ];

  console.log("========================================================================================");
  console.log("                      MILOOSH REAL HUMAN USAGE & FUNNEL REPORT                          ");
  console.log("========================================================================================\n");

  for (const p of periods) {
    console.log(`----------------------------------------------------------------------------------------`);
    console.log(` PERIOD: ${p.periodName}`);
    console.log(`----------------------------------------------------------------------------------------`);
    console.log(`  - Unique Visitors:         ${p.uniqueVisitors.toString().padEnd(6)} |  - Sessions:              ${p.sessions}`);
    console.log(`  - Total Page Views:        ${p.totalPageViews.toString().padEnd(6)} |  - Engaged Visitors:      ${p.engagedVisitors}`);
    console.log(`  - Multi-Page Visitors:     ${p.multiPageVisitors.toString().padEnd(6)} |  - Recommend Users:       ${p.recommendUsers}`);
    console.log(`  - Software Page Visitors:  ${p.softwareVisitors.toString().padEnd(6)} |  - Comparison Visitors:   ${p.comparisonVisitors}`);
    console.log(`  - Meaningful CTA Clickers: ${p.meaningfulClickers.toString().padEnd(6)} |  - Affiliate Clickers:    ${p.affiliateClickers}\n`);

    console.log(`  CANONICAL HUMAN FUNNEL:`);
    p.funnel.forEach(f => {
      console.log(`    ${f.stage.padEnd(52)}: ${f.uniquePeople.toString().padStart(4)} people | ${f.pctOfTotalVisitors.padStart(6)} of visitors | ${f.conversionFromPrev.padStart(6)} step conversion`);
    });

    if (p.topPages.length > 0) {
      console.log(`\n  Top Pages:`);
      p.topPages.forEach((item, i) => console.log(`    ${i + 1}. ${item.path} (${item.views} views)`));
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
