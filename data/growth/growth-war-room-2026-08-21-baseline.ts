/**
 * Growth War Room mission (2026-08-21) — Phase 28 baseline.
 *
 * Persisted BEFORE evaluating whether this mission's second content-depth
 * batch (new data/seo/alternative-guides.ts entries for salesforce/tidio/
 * lastpass/confluence/mulesoft) moved anything. Same source and honesty
 * caveats as the prior mission's data/growth/traffic-mission-2026-08-21-
 * baseline.ts — this is a DIFFERENT, later batch from the same-day cached
 * seo-factory run (id 2026-08-20T15-29-51-686Z-6d30c550, GSC window
 * 2026-07-21..2026-08-17), kept as its own file rather than appended to
 * the prior mission's committed baseline, which stays immutable/historical.
 */

export type GrowthWarRoomBaselineRow = {
  slug: string;
  query: string;
  targetUrl: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
  intent: string;
  affiliateStatusAtCapture: string;
  opportunityScoreAtCapture: number;
};

export const GROWTH_WAR_ROOM_BASELINE = {
  capturedAt: "2026-08-21",
  sourceRunId: "2026-08-20T15-29-51-686Z-6d30c550",
  sourceRunGeneratedAt: "2026-08-20T15:29:51.686Z",
  gscWindow: { startDate: "2026-07-21", endDate: "2026-08-17" },
  scope: "Real Search Analytics rows for the 5 software pages whose /software/{slug} content was changed in this mission's second content-depth batch (new AlternativeDecisionGuide entries), pulled from the same cached seo-factory opportunity list as the prior mission's baseline — no fresh API call was possible from this environment (see app/api/growth/gsc-query/route.ts's module header for why).",
  changedRoutes: [
    "/software/salesforce",
    "/software/tidio",
    "/software/lastpass",
    "/software/confluence",
    "/software/mulesoft",
  ],
  rows: [
    { slug: "salesforce", query: "salesforce alternatives", targetUrl: "/software/salesforce", impressions: 246, clicks: 0, ctr: 0, position: 76.78, intent: "ALTERNATIVES", affiliateStatusAtCapture: "NONE", opportunityScoreAtCapture: 72 },
    { slug: "tidio", query: "tidio alternative", targetUrl: "/software/tidio", impressions: 175, clicks: 0, ctr: 0, position: 87.67, intent: "ALTERNATIVES", affiliateStatusAtCapture: "VIABLE", opportunityScoreAtCapture: 73 },
    { slug: "lastpass", query: "alternatives to lastpass", targetUrl: "/software/lastpass", impressions: 133, clicks: 0, ctr: 0, position: 72.12, intent: "ALTERNATIVES", affiliateStatusAtCapture: "VIABLE", opportunityScoreAtCapture: 73 },
    { slug: "confluence", query: "confluence alternatives", targetUrl: "/software/confluence", impressions: 133, clicks: 0, ctr: 0, position: 70.53, intent: "ALTERNATIVES", affiliateStatusAtCapture: "NONE", opportunityScoreAtCapture: 72 },
    { slug: "mulesoft", query: "mulesoft alternative", targetUrl: "/software/mulesoft", impressions: 159, clicks: 0, ctr: 0, position: 83.74, intent: "ALTERNATIVES", affiliateStatusAtCapture: "NONE", opportunityScoreAtCapture: 67 },
  ] satisfies GrowthWarRoomBaselineRow[],
  reevaluationNotes:
    "Compare against a fresh pull of these exact 5 query+page rows no sooner than ~2-3 weeks after deployment. Once app/api/growth/gsc-query/route.ts is authenticated and called by a privileged process, prefer that over re-reading this cached seo-factory snapshot, which will itself grow stale.",
};
