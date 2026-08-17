import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { publishOneEntry, runPublishCycle, classifyScheduledEntries, GRACE_WINDOW_MS, MAX_CATCHUP_PER_RUN, MAX_REQUEUE_ATTEMPTS, REQUEUE_OFFSET_MS } from "@/lib/social/publish";
import { readQueue, addQueueEntries } from "@/lib/social/queue";
import { getSocialStrategy } from "@/lib/social/strategy";
import type { SocialAdapter } from "@/lib/social/channels/types";
import type { Channel, ChannelVariant, PublishResult, SocialQueueEntry } from "@/lib/social/types";

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

function fakeAdapter(channel: Channel, behavior: "publish" | "throw" | "fail"): SocialAdapter {
  return {
    channel,
    requiredEnv: [],
    charLimit: 1000,
    isConfigured: () => true,
    missingEnv: () => [],
    format: (t) => t,
    async publish(variant: ChannelVariant): Promise<PublishResult> {
      if (behavior === "throw") throw new Error(`${channel} adapter exploded`);
      if (behavior === "fail") return { channel, status: "FAILED", text: variant.text, link: "", postUrl: null, postId: null, verified: false, error: "simulated failure", contentHash: "x" };
      return { channel, status: "PUBLISHED", text: variant.text, link: "", postUrl: "https://example.com/post/1", postId: "1", verified: true, error: "", contentHash: "x" };
    },
  };
}

function fixtureEntry(channels: Partial<Record<Channel, ChannelVariant>>): SocialQueueEntry {
  const now = new Date().toISOString();
  return {
    id: "pub-1",
    pillar: "buyer_education",
    topic: "t",
    sourceSlugs: [],
    campaign: null,
    state: "SCHEDULED",
    createdAt: now,
    scheduledFor: now,
    channels,
    qaNotes: [],
    history: [],
  };
}

const blankVariant: ChannelVariant = { text: "hello", link: null, imageUrl: null, altText: null, hashtags: [], publishResult: null };

describe("publishOneEntry — failure isolation", () => {
  it("a channel adapter throwing does not stop the other channels from being attempted", async () => {
    const entry = fixtureEntry({ facebook: blankVariant, bluesky: blankVariant, mastodon: blankVariant });
    const adapters = {
      facebook: fakeAdapter("facebook", "throw"),
      bluesky: fakeAdapter("bluesky", "publish"),
      mastodon: fakeAdapter("mastodon", "fail"),
    } as Record<Channel, SocialAdapter>;

    const attempts = await publishOneEntry(entry, false, adapters);
    expect(attempts).toHaveLength(3);

    const byChannel = Object.fromEntries(attempts.map((a) => [a.channel, a.result.status]));
    expect(byChannel.facebook).toBe("FAILED"); // caught, not propagated
    expect(byChannel.bluesky).toBe("PUBLISHED"); // unaffected by facebook's exception
    expect(byChannel.mastodon).toBe("FAILED");
  });

  it("a throwing adapter's caught error is recorded in the result, not swallowed silently", async () => {
    const entry = fixtureEntry({ facebook: blankVariant });
    const adapters = { facebook: fakeAdapter("facebook", "throw") } as Record<Channel, SocialAdapter>;
    const attempts = await publishOneEntry(entry, false, adapters);
    expect(attempts[0]!.result.error).toContain("facebook adapter exploded");
  });
});

describe("runPublishCycle — dry-run safety", () => {
  it("a dry run never mutates queue state, even when every channel would succeed", async () => {
    await addQueueEntries([fixtureEntry({ bluesky: blankVariant })]);
    await runPublishCycle({ dryRun: true, now: new Date() });
    const after = await readQueue();
    expect(after[0]!.state).toBe("SCHEDULED"); // unchanged — a dry run is a preview only
  });

  it("respects the paused kill switch and attempts nothing", async () => {
    await addQueueEntries([fixtureEntry({ bluesky: blankVariant })]);
    const pausedStrategy = { ...getSocialStrategy(), paused: true };
    const summary = await runPublishCycle({ dryRun: true, now: new Date(), strategy: pausedStrategy });
    expect(summary.paused).toBe(true);
    expect(summary.entriesAttempted).toBe(0);
  });

  it("only picks up entries whose scheduledFor is in the past, not future-scheduled ones", async () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await addQueueEntries([{ ...fixtureEntry({ bluesky: blankVariant }), scheduledFor: future }]);
    const summary = await runPublishCycle({ dryRun: true, now: new Date() });
    expect(summary.entriesAttempted).toBe(0);
  });
});

/**
 * 2026-08-17 — overdue-backlog safety net. Before this, any SCHEDULED
 * entry with scheduledFor <= now would publish in full the moment the
 * kill switch is lifted, however overdue — a paused period (or a
 * forgotten schedule) would dump the entire stale backlog in one run.
 * See lib/social/publish.ts's header comment for the full policy.
 */
describe("classifyScheduledEntries — grace window", () => {
  const now = new Date("2026-08-17T12:00:00.000Z");

  it("an entry due within the grace window is on-time, not stale", () => {
    const scheduledFor = new Date(now.getTime() - GRACE_WINDOW_MS + 1000).toISOString();
    const { onTime, stale } = classifyScheduledEntries([{ ...fixtureEntry({ bluesky: blankVariant }), scheduledFor }], now);
    expect(onTime).toHaveLength(1);
    expect(stale).toHaveLength(0);
  });

  it("an entry overdue beyond the grace window is stale, not on-time", () => {
    const scheduledFor = new Date(now.getTime() - GRACE_WINDOW_MS - 1000).toISOString();
    const { onTime, stale } = classifyScheduledEntries([{ ...fixtureEntry({ bluesky: blankVariant }), scheduledFor }], now);
    expect(onTime).toHaveLength(0);
    expect(stale).toHaveLength(1);
  });

  it("a future-scheduled entry is neither on-time nor stale", () => {
    const scheduledFor = new Date(now.getTime() + 60_000).toISOString();
    const { onTime, stale } = classifyScheduledEntries([{ ...fixtureEntry({ bluesky: blankVariant }), scheduledFor }], now);
    expect(onTime).toHaveLength(0);
    expect(stale).toHaveLength(0);
  });

  it("stale entries are sorted oldest-first, so the longest-waiting ones claim catch-up slots first", () => {
    const older = { ...fixtureEntry({ bluesky: blankVariant }), id: "older", scheduledFor: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString() };
    const newer = { ...fixtureEntry({ bluesky: blankVariant }), id: "newer", scheduledFor: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() };
    const { stale } = classifyScheduledEntries([newer, older], now);
    expect(stale.map((e) => e.id)).toEqual(["older", "newer"]);
  });
});

describe("runPublishCycle — overdue backlog is never dumped", () => {
  it("does not auto-publish a stale entry as-is — it gets requeued to a fresh slot instead", async () => {
    const staleFor = new Date(Date.now() - GRACE_WINDOW_MS - 60_000).toISOString();
    await addQueueEntries([{ ...fixtureEntry({ bluesky: blankVariant }), scheduledFor: staleFor }]);

    const summary = await runPublishCycle({ dryRun: false, now: new Date() });

    expect(summary.entriesAttempted).toBe(0); // never went through the normal publish path
    expect(summary.results).toHaveLength(0);
    expect(summary.staleHandling.requeued).toHaveLength(1);

    const after = await readQueue();
    expect(after[0]!.state).toBe("SCHEDULED"); // still scheduled, not published or failed
    expect(new Date(after[0]!.scheduledFor!).getTime()).toBeGreaterThan(Date.now()); // pushed into the future
  });

  it("a very old backlog is bounded to MAX_CATCHUP_PER_RUN entries per run — the rest waits for a future run", async () => {
    const now = new Date();
    const staleEntries = Array.from({ length: MAX_CATCHUP_PER_RUN + 3 }, (_, i) => ({
      ...fixtureEntry({ bluesky: blankVariant }),
      id: `stale-${i}`,
      scheduledFor: new Date(now.getTime() - GRACE_WINDOW_MS - (i + 1) * 60_000).toISOString(),
    }));
    await addQueueEntries(staleEntries);

    const summary = await runPublishCycle({ dryRun: false, now });

    expect(summary.staleHandling.requeued.length).toBe(MAX_CATCHUP_PER_RUN);
    expect(summary.staleHandling.staleRemaining).toBe(3);
  });

  it("an entry requeued MAX_REQUEUE_ATTEMPTS times stops being auto-requeued and moves to FAILED for manual review", async () => {
    const now = new Date();
    const history = Array.from({ length: MAX_REQUEUE_ATTEMPTS }, (_, i) => ({ state: "SCHEDULED" as const, at: now.toISOString(), note: `stale-requeue: attempt ${i + 1}` }));
    await addQueueEntries([{ ...fixtureEntry({ bluesky: blankVariant }), scheduledFor: new Date(now.getTime() - GRACE_WINDOW_MS - 60_000).toISOString(), history }]);

    const summary = await runPublishCycle({ dryRun: false, now });

    expect(summary.staleHandling.requeued).toHaveLength(0);
    expect(summary.staleHandling.abandoned).toHaveLength(1);
    const after = await readQueue();
    expect(after[0]!.state).toBe("FAILED"); // surfaced for a human, not silently republished forever
  });

  it("a dry run previews stale handling without mutating the queue", async () => {
    const staleFor = new Date(Date.now() - GRACE_WINDOW_MS - 60_000).toISOString();
    await addQueueEntries([{ ...fixtureEntry({ bluesky: blankVariant }), scheduledFor: staleFor }]);

    const summary = await runPublishCycle({ dryRun: true, now: new Date() });
    expect(summary.staleHandling.requeued).toHaveLength(1); // reported in the preview

    const after = await readQueue();
    expect(after[0]!.scheduledFor).toBe(staleFor); // but nothing was actually persisted
    expect(after[0]!.state).toBe("SCHEDULED");
  });

  it("the requeued slot is REQUEUE_OFFSET_MS in the future, not an arbitrary date", async () => {
    const now = new Date();
    const staleFor = new Date(now.getTime() - GRACE_WINDOW_MS - 60_000).toISOString();
    await addQueueEntries([{ ...fixtureEntry({ bluesky: blankVariant }), scheduledFor: staleFor }]);

    const summary = await runPublishCycle({ dryRun: false, now });
    const newScheduledFor = new Date(summary.staleHandling.requeued[0]!.newScheduledFor).getTime();
    expect(newScheduledFor).toBe(now.getTime() + REQUEUE_OFFSET_MS);
  });
});
