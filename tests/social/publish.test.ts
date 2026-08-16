import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { publishOneEntry, runPublishCycle } from "@/lib/social/publish";
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
