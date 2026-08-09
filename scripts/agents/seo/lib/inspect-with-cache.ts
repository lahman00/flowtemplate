import { readState, writeState, partitionByInspectionCache, getCachedInspection, recordInspection } from "@/lib/agents/state";
import type { GoogleSearchConsoleClient, UrlInspectionResult } from "@/scripts/agents/seo/lib/google-search-console-client";

/**
 * Shared quota-respecting inspection helper: given a list of URLs, serves
 * already-cached results from var/agents/state.json (see
 * DEFAULT_INSPECTION_COOLDOWN_MS) and only calls the real URL Inspection
 * API for genuinely new/expired ones — then persists every fresh result
 * back to the same shared cache. Every indexation-workflow agent
 * (comparator, canonical-consistency, crawl-recency) calls this instead
 * of each independently inspecting the same sample, which would burn
 * quota three times over for identical URLs in a single swarm run.
 */
export async function inspectSampleWithCache(
  client: GoogleSearchConsoleClient,
  urls: string[]
): Promise<{ results: Map<string, UrlInspectionResult>; cachedCount: number; freshCount: number }> {
  let state = readState();
  const { cached, needsInspection } = partitionByInspectionCache(state, urls);

  const results = new Map<string, UrlInspectionResult>();
  for (const url of cached) {
    const c = getCachedInspection<UrlInspectionResult>(state, url);
    if (c) results.set(url, c);
  }

  for (const url of needsInspection) {
    const result = await client.inspectUrl(url);
    results.set(url, result);
    state = recordInspection(state, url, result as unknown as Record<string, unknown>);
  }
  writeState(state);

  return { results, cachedCount: cached.length, freshCount: needsInspection.length };
}
