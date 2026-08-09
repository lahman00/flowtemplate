import fs from "node:fs";
import { AGENTS_DIR, STATE_PATH } from "@/lib/agents/paths";

/**
 * Persisted swarm state — var/agents/state.json (gitignored, regenerable).
 * This is what lets the orchestrator (a) avoid re-running an agent inside
 * its own cooldown window and (b) tell "still open" findings apart from
 * ones that have quietly stopped appearing (which usually means the
 * underlying issue was fixed, not that the agent forgot about it).
 *
 * Deliberately NOT a database — a solo founder operating this system
 * should be able to `rm -rf var/agents` and have it rebuild cleanly on the
 * next run with no data loss beyond "we'll re-notice things we already
 * knew about."
 */

export type AgentSwarmState = {
  /** agentId -> ISO timestamp of that agent's last completed run. */
  lastRunAt: Record<string, string>;
  /** dedupeKey -> ISO timestamp first seen. Findings not in the latest run's key set are assumed resolved and dropped here automatically (see pruneResolvedKeys). */
  firstSeenAt: Record<string, string>;
  /** dedupeKeys a human has explicitly dismissed — these are suppressed from future reports even if an agent finds them again, until removed from this list. Empty by default; nothing writes to this today except a future manual edit or CLI flag. */
  dismissedKeys: string[];
  /** url -> ISO timestamp of the last successful IndexNow submission. The sole purpose of this map is Section C's explicit "do not repeatedly submit unchanged URLs" rule — a URL already in here is skipped on future runs. */
  indexNowSubmittedAt: Record<string, string>;
  /**
   * url -> last URL Inspection API result + when it was fetched. Google's
   * URL Inspection API is quota-limited (2,000 queries/day, 600/minute,
   * PER PROPERTY — not per agent, so every GSC-backed agent that inspects
   * URLs shares this one cache) — this is the mechanism that makes
   * "sample, don't repeatedly re-inspect everything" real rather than
   * aspirational. `result` is intentionally untyped here (a plain object,
   * not the real `UrlInspectionResult` type) so this file — part of
   * lib/agents/, the layer scripts/agents/* depends ON, never the
   * other way — doesn't need to import a type from scripts/agents/seo/;
   * callers cast it back to the real type themselves.
   */
  urlInspectionCache: Record<string, { checkedAt: string; result: Record<string, unknown> }>;
};

const EMPTY_STATE: AgentSwarmState = {
  lastRunAt: {},
  firstSeenAt: {},
  dismissedKeys: [],
  indexNowSubmittedAt: {},
  urlInspectionCache: {},
};

export function readState(): AgentSwarmState {
  try {
    const raw = fs.readFileSync(STATE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AgentSwarmState>;
    return {
      lastRunAt: parsed.lastRunAt ?? {},
      firstSeenAt: parsed.firstSeenAt ?? {},
      dismissedKeys: parsed.dismissedKeys ?? [],
      indexNowSubmittedAt: parsed.indexNowSubmittedAt ?? {},
      urlInspectionCache: parsed.urlInspectionCache ?? {},
    };
  } catch {
    return { ...EMPTY_STATE };
  }
}

export function writeState(state: AgentSwarmState): void {
  fs.mkdirSync(AGENTS_DIR, { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

/** Returns true if the agent last ran within `cooldownMs` of now. */
export function isWithinCooldown(state: AgentSwarmState, agentId: string, cooldownMs: number, now = Date.now()): boolean {
  const lastRun = state.lastRunAt[agentId];
  if (!lastRun) return false;
  return now - new Date(lastRun).getTime() < cooldownMs;
}

/** Merges this run's results into state: records run timestamps and first-seen timestamps for any new dedupeKey, and prunes firstSeenAt entries for keys that no longer appeared (treated as resolved). */
export function updateState(
  state: AgentSwarmState,
  agentIds: string[],
  currentDedupeKeys: string[],
  now = new Date().toISOString()
): AgentSwarmState {
  const lastRunAt = { ...state.lastRunAt };
  for (const id of agentIds) lastRunAt[id] = now;

  const currentKeySet = new Set(currentDedupeKeys);
  const firstSeenAt: Record<string, string> = {};
  for (const key of currentDedupeKeys) {
    firstSeenAt[key] = state.firstSeenAt[key] ?? now;
  }
  void currentKeySet; // pruning is implicit: only keys present this run survive into the new firstSeenAt map

  return {
    lastRunAt,
    firstSeenAt,
    dismissedKeys: state.dismissedKeys,
    indexNowSubmittedAt: state.indexNowSubmittedAt,
    urlInspectionCache: state.urlInspectionCache,
  };
}

export function isDismissed(state: AgentSwarmState, dedupeKey: string): boolean {
  return state.dismissedKeys.includes(dedupeKey);
}

/** URLs from `candidates` never submitted to IndexNow before, per state. */
export function unsubmittedToIndexNow(state: AgentSwarmState, candidates: string[]): string[] {
  return candidates.filter((url) => !state.indexNowSubmittedAt[url]);
}

/** Records a successful IndexNow submission so these URLs are skipped on future runs (Section C: "do not repeatedly submit unchanged URLs"). */
export function recordIndexNowSubmission(state: AgentSwarmState, urls: string[], now = new Date().toISOString()): AgentSwarmState {
  const indexNowSubmittedAt = { ...state.indexNowSubmittedAt };
  for (const url of urls) indexNowSubmittedAt[url] = now;
  return { ...state, indexNowSubmittedAt };
}

/** Default URL Inspection cooldown — a URL inspected within this window is served from cache rather than re-inspected. 7 days: index status rarely changes faster than that, and it keeps daily usage far below the 2,000/day quota even inspecting every URL in a much larger future catalog. */
export const DEFAULT_INSPECTION_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

/** True if `url` was inspected within `cooldownMs` and can be served from cache instead of a new API call. */
export function isInspectionCached(state: AgentSwarmState, url: string, cooldownMs = DEFAULT_INSPECTION_COOLDOWN_MS, now = Date.now()): boolean {
  const cached = state.urlInspectionCache[url];
  if (!cached) return false;
  return now - new Date(cached.checkedAt).getTime() < cooldownMs;
}

/** Splits `urls` into ones still fresh in cache vs. ones that genuinely need a new URL Inspection API call — the core "respect quotas, sample don't re-inspect everything" mechanism. */
export function partitionByInspectionCache(
  state: AgentSwarmState,
  urls: string[],
  cooldownMs = DEFAULT_INSPECTION_COOLDOWN_MS,
  now = Date.now()
): { cached: string[]; needsInspection: string[] } {
  const cached: string[] = [];
  const needsInspection: string[] = [];
  for (const url of urls) {
    (isInspectionCached(state, url, cooldownMs, now) ? cached : needsInspection).push(url);
  }
  return { cached, needsInspection };
}

export function getCachedInspection<T extends Record<string, unknown>>(state: AgentSwarmState, url: string): T | null {
  const cached = state.urlInspectionCache[url];
  return cached ? (cached.result as T) : null;
}

/** Records a fresh URL Inspection result. `result` is stored as-is (plain object) — see AgentSwarmState.urlInspectionCache's own doc comment for why this file doesn't import the real result type. */
export function recordInspection(state: AgentSwarmState, url: string, result: Record<string, unknown>, now = new Date().toISOString()): AgentSwarmState {
  const urlInspectionCache = { ...state.urlInspectionCache, [url]: { checkedAt: now, result } };
  return { ...state, urlInspectionCache };
}
