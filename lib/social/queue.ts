import fs from "node:fs";
import path from "node:path";
import { AGENTS_DIR } from "@/lib/agents/paths";
import { type QueueState, type SocialQueueEntry, isValidQueueTransition } from "@/lib/social/types";

/**
 * Content queue persistence — same storage strategy as
 * lib/revenue/affiliate-pipeline.ts (private Vercel Blob when
 * BLOB_READ_WRITE_TOKEN is set, so the deployed /internal/social
 * dashboard and the Vercel Cron publisher see the same real state; a
 * local-file fallback otherwise so tests and local dev never need
 * network access to a Blob store). Deliberately its own Blob pathname
 * (social/queue.json) — an entirely separate concern from the affiliate
 * pipeline, never sharing a store key.
 */

const BLOB_PATHNAME = "social/queue.json";
const LOCAL_FALLBACK_PATH = path.join(AGENTS_DIR, "social-queue.json");

function hasBlobToken(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function readLocalFallback(): SocialQueueEntry[] {
  try {
    return JSON.parse(fs.readFileSync(LOCAL_FALLBACK_PATH, "utf-8")) as SocialQueueEntry[];
  } catch {
    return [];
  }
}

function writeLocalFallback(entries: SocialQueueEntry[]): void {
  fs.mkdirSync(AGENTS_DIR, { recursive: true });
  fs.writeFileSync(LOCAL_FALLBACK_PATH, JSON.stringify(entries, null, 2));
}

export async function readQueue(): Promise<SocialQueueEntry[]> {
  if (!hasBlobToken()) return readLocalFallback();
  try {
    const { get } = await import("@vercel/blob");
    // useCache: false — same reasoning as affiliate-pipeline.ts: a read
    // immediately following a write must never see a stale CDN copy.
    const result = await get(BLOB_PATHNAME, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return [];
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as SocialQueueEntry[];
  } catch {
    return [];
  }
}

export async function writeQueue(entries: SocialQueueEntry[]): Promise<void> {
  if (!hasBlobToken()) {
    writeLocalFallback(entries);
    return;
  }
  const { put } = await import("@vercel/blob");
  await put(BLOB_PATHNAME, JSON.stringify(entries, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function getQueueEntry(id: string): Promise<SocialQueueEntry | undefined> {
  return (await readQueue()).find((e) => e.id === id);
}

export async function addQueueEntries(newEntries: SocialQueueEntry[]): Promise<void> {
  const entries = await readQueue();
  const existingIds = new Set(entries.map((e) => e.id));
  const toAdd = newEntries.filter((e) => !existingIds.has(e.id));
  await writeQueue([...entries, ...toAdd]);
}

/** Pure — no I/O. Shared by setQueueState (one entry, one read+write) and any caller batching many transitions into a single read+write, so a QA or scheduling pass over thousands of entries doesn't do one Blob round-trip per entry (see scripts/social/qa.ts and schedule.ts). */
export function applyQueueTransition(entry: SocialQueueEntry, state: QueueState, note?: string): SocialQueueEntry {
  if (!isValidQueueTransition(entry.state, state)) {
    throw new Error(`Invalid social queue transition for ${entry.id}: ${entry.state} -> ${state}`);
  }
  const now = new Date().toISOString();
  return { ...entry, state, history: [...entry.history, { state, at: now, note: note ?? null }] };
}

export async function setQueueState(id: string, state: QueueState, note?: string): Promise<SocialQueueEntry> {
  const entries = await readQueue();
  const index = entries.findIndex((e) => e.id === id);
  if (index < 0) throw new Error(`No queue entry ${id}`);
  const updated = applyQueueTransition(entries[index]!, state, note);
  entries[index] = updated;
  await writeQueue(entries);
  return updated;
}

/** Persist a full entry update (e.g. after drafting channel variants) without a state transition. */
export async function updateQueueEntry(id: string, patch: Partial<SocialQueueEntry>): Promise<SocialQueueEntry> {
  const entries = await readQueue();
  const index = entries.findIndex((e) => e.id === id);
  if (index < 0) throw new Error(`No queue entry ${id}`);
  const updated: SocialQueueEntry = { ...entries[index]!, ...patch };
  entries[index] = updated;
  await writeQueue(entries);
  return updated;
}

export function countByQueueState(entries: SocialQueueEntry[]): Record<QueueState, number> {
  const counts = { IDEA: 0, DRAFTED: 0, QA_READY: 0, APPROVED_FOR_AUTO: 0, SCHEDULED: 0, READY_FOR_MANUAL: 0, PUBLISHED: 0, FAILED: 0, SKIPPED: 0 };
  for (const e of entries) counts[e.state] += 1;
  return counts;
}

/** Topic-repeat check for the content engine's cooldown rule — most recent use of each topic key, across all states. */
export function lastUsedAtByTopic(entries: SocialQueueEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const e of entries) {
    const existing = map.get(e.topic);
    if (!existing || e.createdAt > existing) map.set(e.topic, e.createdAt);
  }
  return map;
}
