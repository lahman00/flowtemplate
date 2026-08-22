import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { executeSocialScheduleHealthAgent } from "@/scripts/maintenance/social-schedule-health";
import { addQueueEntries } from "@/lib/social/queue";
import type { ChannelVariant, SocialQueueEntry } from "@/lib/social/types";

/**
 * ROAD TO THE FIRST 1,000 REAL HUMANS mission (2026-08-22) Track A ask #7.
 * Proves the schedule-health checker actually distinguishes a healthy
 * runway from a critically thin one — the whole point of building it is
 * to make the schedule cron's silent-failure mode loud.
 */
const QUEUE_PATH = path.join(process.cwd(), "var", "agents", "social-queue.json");

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

const blankVariant: ChannelVariant = { text: "hello", link: "https://miloosh.com/software/notion", imageUrl: null, altText: null, hashtags: [], publishResult: null };

function entry(id: string, overrides: Partial<SocialQueueEntry>): SocialQueueEntry {
  const now = new Date().toISOString();
  return {
    id, pillar: "buyer_education", topic: `t-${id}`, sourceSlugs: [], campaign: null,
    state: "APPROVED_FOR_AUTO", createdAt: now, scheduledFor: null,
    channels: { facebook: { ...blankVariant } }, qaNotes: [], history: [],
    ...overrides,
  };
}

describe("Social schedule health checker", () => {
  it("reports healthy when the SCHEDULED runway comfortably exceeds the floor", async () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    await addQueueEntries([entry("a", { state: "SCHEDULED", scheduledFor: future })]);
    const report = await executeSocialScheduleHealthAgent();
    expect(report.issues).toEqual([]);
    expect(report.run.status).toBe("success");
  });

  it("flags critical when real backlog exists but the runway is critically thin", async () => {
    const soon = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
    await addQueueEntries([
      entry("a", { state: "SCHEDULED", scheduledFor: soon }),
      entry("b", {}), // APPROVED_FOR_AUTO
    ]);
    const report = await executeSocialScheduleHealthAgent();
    expect(report.issues.length).toBeGreaterThan(0);
    expect(report.issues[0]!.severity).toBe("critical");
    expect(report.run.status).toBe("failure"); // escalateCriticalToFailure
  });

  it("does not flag a thin runway when there is no backlog left to worry about", async () => {
    const soon = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
    await addQueueEntries([entry("a", { state: "SCHEDULED", scheduledFor: soon })]);
    const report = await executeSocialScheduleHealthAgent();
    expect(report.issues).toEqual([]);
  });
});
