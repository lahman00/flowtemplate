import { createHash } from "node:crypto";
import { getAllSoftware } from "@/data/software";
import { classifySeoIntent, normalizeQuery, softwareEntitiesForQuery } from "@/lib/seo-factory/intent";
import { recordSeoExperimentBaselines } from "@/lib/seo-factory/store";
import type { SeoExperimentBaseline, SeoFactoryRun } from "@/lib/seo-factory/types";
import { GoogleSearchConsoleClient, type SearchAnalyticsRow } from "@/scripts/agents/seo/lib/google-search-console-client";

const EXTRA_CANDIDATES = ["intercom", "front"];

function aggregate(rows: SearchAnalyticsRow[]) {
  const impressions = rows.reduce((sum, row) => sum + row.impressions, 0);
  const clicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  return { impressions, clicks, ctr: impressions ? clicks / impressions : 0, position: impressions ? rows.reduce((sum, row) => sum + row.position * row.impressions, 0) / impressions : 0 };
}

export async function captureExecutionBaselines(run: SeoFactoryRun): Promise<SeoExperimentBaseline[]> {
  const client = GoogleSearchConsoleClient.fromEnv();
  if (!client) throw new Error("Cannot freeze baseline without Google Search Console credentials.");
  const software = getAllSoftware();
  const extras = EXTRA_CANDIDATES.map((slug) => {
    const candidate = run.opportunities.find((item) => item.relatedSoftware.includes(slug));
    if (!candidate) throw new Error(`Fresh SEO Factory run did not contain required candidate: ${slug}`);
    return candidate;
  });
  const candidates = [...new Map([...run.opportunities.slice(0, 10), ...extras].map((item) => [item.targetUrl, item])).values()];
  const rows = await client.queryAllSearchAnalytics({ ...run.window, dimensions: ["query", "page"], rowLimit: 25_000 }, 25_000);
  const capturedAt = new Date().toISOString();
  const baselines = candidates.map((candidate): SeoExperimentBaseline => {
    if (!candidate.targetUrl) throw new Error(`Candidate ${candidate.id} has no canonical target URL.`);
    const pageRows = rows.filter((row) => new URL(row.keys[1] ?? "", "https://miloosh.com").pathname.replace(/\/$/, "") === candidate.targetUrl);
    const clusterRows = pageRows.filter((row) => {
      const query = row.keys[0] ?? "";
      const entities = softwareEntitiesForQuery(query, software);
      return classifySeoIntent(query, entities) === candidate.intent && candidate.relatedSoftware.some((slug) => entities.some((entity) => entity.slug === slug));
    });
    if (!clusterRows.length) throw new Error(`No live GSC query cluster found for ${candidate.targetUrl}.`);
    return {
      schemaVersion: 1,
      id: `baseline-${createHash("sha256").update(`${run.id}|${candidate.targetUrl}`).digest("hex").slice(0, 20)}`,
      capturedAt,
      runId: run.id,
      page: candidate.targetUrl,
      queryCluster: [...new Set(clusterRows.map((row) => normalizeQuery(row.keys[0] ?? "")))].sort(),
      window: run.window,
      query: aggregate(clusterRows),
      pageAggregate: aggregate(pageRows),
    };
  });
  const result = await recordSeoExperimentBaselines(baselines);
  if (!result.recorded) throw new Error("Baseline batch already exists; immutable records were not overwritten.");
  return baselines;
}
