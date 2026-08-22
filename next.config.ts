import type { NextConfig } from "next";

/**
 * Real Human Funnel -> Commercial Conversion Mission (2026-08-22), Phase 17:
 * found while auditing the social queue for dead landing destinations —
 * 13 comparison routes removed in the same mission's comparison-graph
 * purification (forced/non-substitute pairs; see the commit for the full
 * reasoning) still have real referrers: one already-published, verified,
 * LIVE Facebook post (sentry-vs-snyk) that would otherwise 404 for anyone
 * who clicks it, plus several not-yet-published queue entries. 3 more
 * (elastic-vs-postmark, postmark-vs-workos, mulesoft-vs-postmark) were a
 * pre-existing bug unrelated to this mission — queue entries referencing
 * comparisons that were never actually published — caught by the same
 * audit. Each redirects to the first-named product's own software page
 * (still a real, on-topic, useful destination) rather than a hard 404.
 * Both slug orderings included since a URL could exist either way.
 */
const REMOVED_COMPARISON_REDIRECTS: Array<[string, string]> = [
  ["notion-vs-otter-ai", "notion"],
  ["otter-ai-vs-notion", "notion"],
  ["superhuman-vs-front", "superhuman"],
  ["front-vs-superhuman", "superhuman"],
  ["algolia-vs-supabase", "algolia"],
  ["supabase-vs-algolia", "algolia"],
  ["datadog-vs-snyk", "datadog"],
  ["snyk-vs-datadog", "datadog"],
  ["elastic-vs-supabase", "elastic"],
  ["supabase-vs-elastic", "elastic"],
  ["sentry-vs-snyk", "sentry"],
  ["snyk-vs-sentry", "sentry"],
  ["volza-vs-semrush", "volza"],
  ["semrush-vs-volza", "volza"],
  ["volza-vs-ahrefs", "volza"],
  ["ahrefs-vs-volza", "volza"],
  ["whatconverts-vs-mixpanel", "whatconverts"],
  ["mixpanel-vs-whatconverts", "whatconverts"],
  ["miro-vs-notion", "miro"],
  ["notion-vs-miro", "miro"],
  ["whimsical-vs-notion", "whimsical"],
  ["notion-vs-whimsical", "whimsical"],
  ["lucidchart-vs-notion", "lucidchart"],
  ["notion-vs-lucidchart", "lucidchart"],
  ["wave-vs-harvest", "wave"],
  ["harvest-vs-wave", "wave"],
  ["elastic-vs-postmark", "elastic"],
  ["postmark-vs-elastic", "elastic"],
  ["postmark-vs-workos", "postmark"],
  ["workos-vs-postmark", "postmark"],
  ["mulesoft-vs-postmark", "mulesoft"],
  ["postmark-vs-mulesoft", "mulesoft"],
];

const nextConfig: NextConfig = {
  async redirects() {
    return REMOVED_COMPARISON_REDIRECTS.map(([comparisonSlug, softwareSlug]) => ({
      source: `/compare/${comparisonSlug}`,
      destination: `/software/${softwareSlug}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
