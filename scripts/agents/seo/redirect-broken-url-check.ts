import { getAllSoftware } from "@/data/software";
import { getAllCategories } from "@/data/categories";
import { PUBLISHED_COMPARISONS, getComparisonSlug } from "@/data/comparisons";
import { LEGAL_PAGES } from "@/lib/legal";
import { SITE_URL } from "@/lib/site";
import { checkUrlsWithConcurrency } from "@/lib/maintenance/http";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * The other maintenance agents read data/ directly; this one is the
 * exception — it actually fetches Miloosh's own rendered pages (not
 * vendor URLs) to catch problems that only show up in the served HTTP
 * response: a 404, an unexpected redirect, a 500. Reuses
 * lib/maintenance/http.ts's checker (same bounded-concurrency, redirect
 * following, bot-detection retry) rather than reimplementing fetch logic.
 *
 * Cost control: this deployment has ~1358 real URLs (217 software + 18
 * category + 1107 comparison + statics). Checking all of them on every
 * run would be slow and mostly redundant — these are statically generated
 * pages sharing a handful of templates, so a template-level regression
 * shows up on any sampled page from that template. Checks: every category
 * (only 18, cheap, and each is a distinct page), every static/legal page,
 * and an evenly-spaced deterministic sample of software and comparison
 * pages (so a broken template is caught regardless of which page in that
 * set happens to be sampled, and re-runs sample the same URLs — stable,
 * not random — so results are comparable run over run).
 */

const SOFTWARE_SAMPLE_SIZE = 20;
const COMPARISON_SAMPLE_SIZE = 20;

function evenSample<T>(items: T[], size: number): T[] {
  if (items.length <= size) return items;
  const step = items.length / size;
  const sample: T[] = [];
  for (let i = 0; i < size; i++) {
    sample.push(items[Math.floor(i * step)]);
  }
  return sample;
}

function buildSampleUrls(): { url: string; label: string }[] {
  const software = getAllSoftware();
  const categories = getAllCategories();

  const staticUrls = ["/", "/about", "/contact", "/recommend", "/compare"];
  const legalUrls = LEGAL_PAGES.map((p) => p.href);
  const categoryUrls = categories.map((c) => `/category/${c.slug}`);
  const softwareUrls = evenSample(software, SOFTWARE_SAMPLE_SIZE).map((s) => `/software/${s.slug}`);
  const comparisonUrls = evenSample([...PUBLISHED_COMPARISONS], COMPARISON_SAMPLE_SIZE).map(([a, b]) => `/compare/${getComparisonSlug(a, b)}`);

  const all = [...staticUrls, ...legalUrls, ...categoryUrls, ...softwareUrls, ...comparisonUrls];
  return all.map((path) => ({ url: `${SITE_URL}${path}`, label: path }));
}

export const run: AgentRunFn = async () => {
  const agentId = "seo-redirect-broken-url-check";
  const samples = buildSampleUrls();
  const results = await checkUrlsWithConcurrency(
    samples.map((s) => s.url),
    6
  );

  const findings = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const label = samples[i].label;
    if (result.outcome === "ok") continue;

    const critical = result.outcome === "not_found" || result.outcome === "server_error" || result.outcome === "connection_failure" || result.outcome === "invalid_url" || result.outcome === "timeout";

    findings.push(
      makeFinding({
        agentId,
        kind: "issue",
        severity: critical ? "critical" : "warning",
        title: `Own page returned ${result.outcome}: ${label}`,
        description: `Sampled internal route ${label} did not return a clean 200. Outcome: ${result.outcome}${result.httpStatus ? ` (HTTP ${result.httpStatus})` : ""}.`,
        location: label,
        evidence: [`${result.finalUrl ?? samples[i].url} — ${result.outcome}${result.httpStatus ? ` HTTP ${result.httpStatus}` : ""}`],
        confidence: 1,
        riskLevel: 1,
        recommendedAction: critical ? "Investigate immediately — a real visitor hitting this route sees a broken page." : "Review — may be a redirect worth resolving to a direct link.",
        dedupeKey: `${agentId}:${label}`,
      })
    );
  }

  return {
    summary: `Checked ${samples.length} sampled internal routes against ${SITE_URL}. ${findings.length} not clean 200s.`,
    findings,
  };
};
