/**
 * BLOCKED — shared adapter interface for the three growth agents that all
 * need the same missing capability: automated, scheduled access to
 * external web content (competitor sites, software-launch feeds,
 * community/directory listings) that this deployment cannot fetch on its
 * own schedule. Registered in lib/agents/registry.ts with
 * `enabled: false`, `run: null` for each of:
 *   - growth-emerging-tool-discovery
 *   - growth-competitor-gap-discovery
 *   - growth-distribution-opportunity-discovery
 *
 * Important distinction from a missing API key: Claude Code itself has
 * WebSearch/WebFetch tools available INTERACTIVELY in a chat session —
 * that's a real, usable capability for a human-directed one-off research
 * task ("find new project-management tools launched this quarter"). What
 * it is NOT is a capability a deterministic, unattended `npm run
 * agents:weekly` script can call on a schedule — there is no server-side
 * credential or scheduled-job equivalent of those tools in this
 * environment. So these three agents are correctly BLOCKED for automated
 * runs, not because no capability exists at all, but because the
 * capability that exists isn't the automatable kind this registry
 * entry's `trigger: "scheduled"` requires.
 *
 * Required to unblock for automation: a real competitor/backlink/
 * directory monitoring API (e.g. a crawling service) with credentials
 * configured via env vars, or a defined recurring on-demand workflow
 * where a human explicitly triggers this kind of research each time.
 */

export type ExternalMonitoringFinding = {
  source: string;
  title: string;
  url: string;
  discoveredAt: string;
};

export type ExternalMonitoringAdapter = {
  isConfigured(): boolean;
  search(query: string): Promise<ExternalMonitoringFinding[]>;
};

export const externalMonitoringAdapter: ExternalMonitoringAdapter = {
  isConfigured() {
    return false;
  },
  async search() {
    throw new Error("External monitoring adapter is not configured for automated runs in this deployment — see scripts/agents/growth/external-monitoring-adapter.ts header.");
  },
};
