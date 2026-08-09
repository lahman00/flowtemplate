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
};

const EMPTY_STATE: AgentSwarmState = {
  lastRunAt: {},
  firstSeenAt: {},
  dismissedKeys: [],
};

export function readState(): AgentSwarmState {
  try {
    const raw = fs.readFileSync(STATE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AgentSwarmState>;
    return {
      lastRunAt: parsed.lastRunAt ?? {},
      firstSeenAt: parsed.firstSeenAt ?? {},
      dismissedKeys: parsed.dismissedKeys ?? [],
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

  return { lastRunAt, firstSeenAt, dismissedKeys: state.dismissedKeys };
}

export function isDismissed(state: AgentSwarmState, dedupeKey: string): boolean {
  return state.dismissedKeys.includes(dedupeKey);
}
