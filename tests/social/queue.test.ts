import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { readQueue, addQueueEntries, setQueueState, updateQueueEntry, countByQueueState, applyQueueTransition } from "@/lib/social/queue";
import type { SocialQueueEntry } from "@/lib/social/types";

const QUEUE_PATH = path.join(process.cwd(), "var", "agents", "social-queue.json");

// Same isolation discipline as tests/lib/affiliate-pipeline.test.ts: force
// the local-file fallback (never touch the real Blob store from a test
// run) and back up/restore any real local file that happens to exist.
let realBackup: string | null = null;
let realBlobToken: string | undefined;

beforeAll(() => {
  realBackup = fs.existsSync(QUEUE_PATH) ? fs.readFileSync(QUEUE_PATH, "utf-8") : null;
  realBlobToken = process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_READ_WRITE_TOKEN;
});

beforeEach(() => {
  fs.rmSync(QUEUE_PATH, { force: true });
});

afterAll(() => {
  if (realBackup !== null) {
    fs.mkdirSync(path.dirname(QUEUE_PATH), { recursive: true });
    fs.writeFileSync(QUEUE_PATH, realBackup);
  } else {
    fs.rmSync(QUEUE_PATH, { force: true });
  }
  if (realBlobToken !== undefined) process.env.BLOB_READ_WRITE_TOKEN = realBlobToken;
});

function fixtureEntry(overrides: Partial<SocialQueueEntry> = {}): SocialQueueEntry {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? "fixture-1",
    pillar: "buyer_education",
    topic: "test-topic",
    sourceSlugs: [],
    campaign: null,
    state: "IDEA",
    createdAt: now,
    scheduledFor: null,
    channels: {},
    qaNotes: [],
    history: [{ state: "IDEA", at: now, note: null }],
    ...overrides,
  };
}

describe("social queue state machine", () => {
  it("starts empty", async () => {
    expect(await readQueue()).toEqual([]);
  });

  it("addQueueEntries persists new entries and never duplicates by id", async () => {
    const entry = fixtureEntry();
    await addQueueEntries([entry]);
    await addQueueEntries([entry]); // re-add the same id
    const all = await readQueue();
    expect(all).toHaveLength(1);
  });

  it("allows the documented lifecycle path", async () => {
    await addQueueEntries([fixtureEntry()]);
    await setQueueState("fixture-1", "DRAFTED");
    await setQueueState("fixture-1", "QA_READY");
    await setQueueState("fixture-1", "APPROVED_FOR_AUTO");
    await setQueueState("fixture-1", "SCHEDULED");
    const updated = await setQueueState("fixture-1", "PUBLISHED");
    expect(updated.state).toBe("PUBLISHED");
  });

  it("rejects an invalid transition (skipping states)", async () => {
    await addQueueEntries([fixtureEntry()]);
    await expect(setQueueState("fixture-1", "SCHEDULED")).rejects.toThrow(/Invalid social queue transition/);
  });

  it("PUBLISHED has no outgoing transition — it's terminal", async () => {
    await addQueueEntries([fixtureEntry({ state: "PUBLISHED", history: [{ state: "PUBLISHED", at: new Date().toISOString(), note: null }] })]);
    await expect(setQueueState("fixture-1", "SCHEDULED")).rejects.toThrow();
    await expect(setQueueState("fixture-1", "FAILED")).rejects.toThrow();
  });

  it("FAILED can be retried back to SCHEDULED", async () => {
    await addQueueEntries([fixtureEntry({ state: "FAILED", history: [{ state: "FAILED", at: new Date().toISOString(), note: null }] })]);
    const retried = await setQueueState("fixture-1", "SCHEDULED", "retrying");
    expect(retried.state).toBe("SCHEDULED");
  });

  it("appends every transition to history without rewriting prior entries", async () => {
    await addQueueEntries([fixtureEntry()]);
    await setQueueState("fixture-1", "DRAFTED", "first");
    await setQueueState("fixture-1", "QA_READY", "second");
    const entries = await readQueue();
    const entry = entries.find((e) => e.id === "fixture-1")!;
    expect(entry.history.map((h) => h.note)).toEqual([null, "first", "second"]);
  });

  it("updateQueueEntry patches fields without touching state or history", async () => {
    await addQueueEntries([fixtureEntry()]);
    const updated = await updateQueueEntry("fixture-1", { campaign: "spring-launch" });
    expect(updated.campaign).toBe("spring-launch");
    expect(updated.state).toBe("IDEA");
    expect(updated.history).toHaveLength(1);
  });

  it("countByQueueState tallies real entries and zero-initializes every state", async () => {
    await addQueueEntries([fixtureEntry({ id: "a" }), fixtureEntry({ id: "b" })]);
    const counts = countByQueueState(await readQueue());
    expect(counts.IDEA).toBe(2);
    expect(counts.PUBLISHED).toBe(0);
  });

  it("applyQueueTransition is pure — does not read or write the store", () => {
    const entry = fixtureEntry();
    const updated = applyQueueTransition(entry, "DRAFTED", "note");
    expect(updated.state).toBe("DRAFTED");
    expect(entry.state).toBe("IDEA"); // original untouched
  });

  it("applyQueueTransition rejects the same invalid jumps as setQueueState", () => {
    const entry = fixtureEntry();
    expect(() => applyQueueTransition(entry, "SCHEDULED")).toThrow(/Invalid social queue transition/);
  });
});
