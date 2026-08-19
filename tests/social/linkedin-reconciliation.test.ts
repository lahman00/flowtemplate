import fs from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/social/make/linkedin-result/route";
import { addQueueEntries, readQueue } from "@/lib/social/queue";
import type { SocialQueueEntry } from "@/lib/social/types";

const queuePath = path.join(process.cwd(), "var", "agents", "social-queue.json");
let backup: string | null = null;
let blobToken: string | undefined;

const entry = (): SocialQueueEntry => ({
  id: "make-entry-1", pillar: "software_decisions", topic: "make-linkedin", sourceSlugs: ["miro-vs-lucidchart"], campaign: null, state: "SCHEDULED", createdAt: "2026-08-19T00:00:00.000Z", scheduledFor: "2026-08-30T17:00:00.000Z", qaNotes: [], history: [],
  channels: {
    linkedin: { text: "LinkedIn text", link: "https://miloosh.com/compare/miro-vs-lucidchart", imageUrl: null, altText: null, hashtags: [], publishResult: null, providerState: { status: "PENDING_CONFIRMATION", attempts: 1, lastAttemptAt: "2026-08-30T17:00:00.000Z", publishedAt: null, postId: null, postUrl: null, contentHash: "hash", verified: false, error: "awaiting", transport: "make", executionId: "exec-1" } },
    facebook: { text: "Facebook text", link: null, imageUrl: null, altText: null, hashtags: [], publishResult: null },
  },
});

function request(body: object, secret = "callback-secret") {
  return new NextRequest("https://miloosh.com/api/social/make/linkedin-result", { method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
}

beforeAll(() => {
  backup = fs.existsSync(queuePath) ? fs.readFileSync(queuePath, "utf8") : null;
  blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_READ_WRITE_TOKEN;
});
beforeEach(() => {
  fs.rmSync(queuePath, { force: true });
  process.env.MAKE_LINKEDIN_WEBHOOK_SECRET = "callback-secret";
});
afterAll(() => {
  if (backup === null) fs.rmSync(queuePath, { force: true }); else { fs.mkdirSync(path.dirname(queuePath), { recursive: true }); fs.writeFileSync(queuePath, backup); }
  if (blobToken) process.env.BLOB_READ_WRITE_TOKEN = blobToken;
  delete process.env.MAKE_LINKEDIN_WEBHOOK_SECRET;
});

describe("Make LinkedIn result callback", () => {
  it("rejects the wrong callback secret", async () => {
    expect((await POST(request({}, "wrong"))).status).toBe(401);
  });

  it("rejects an unknown queue post ID", async () => {
    const response = await POST(request({ postId: "missing", idempotencyKey: "linkedin:missing", status: "published", linkedinPostId: "urn:li:share:1" }));
    expect(response.status).toBe(404);
  });

  it("persists Make and LinkedIn identity without touching Facebook", async () => {
    await addQueueEntries([entry()]);
    const facebookBefore = (await readQueue())[0]!.channels.facebook;
    const response = await POST(request({ postId: "make-entry-1", idempotencyKey: "linkedin:make-entry-1", status: "published", executionId: "exec-1", linkedinPostId: "urn:li:share:99", linkedinPostUrl: "https://linkedin.example/99" }));
    expect(response.status).toBe(200);
    const updated = (await readQueue())[0]!;
    expect(updated.channels.linkedin?.providerState?.status).toBe("PUBLISHED");
    expect(updated.channels.linkedin?.providerState?.executionId).toBe("exec-1");
    expect(updated.channels.linkedin?.providerState?.postId).toBe("urn:li:share:99");
    expect(updated.channels.facebook).toEqual(facebookBefore);
  });

  it("treats an identical duplicate callback as harmless", async () => {
    await addQueueEntries([entry()]);
    const payload = { postId: "make-entry-1", idempotencyKey: "linkedin:make-entry-1", status: "published" as const, executionId: "exec-1", linkedinPostId: "urn:li:share:99" };
    expect((await POST(request(payload))).status).toBe(200);
    const second = await POST(request(payload));
    expect(second.status).toBe(200);
    expect((await second.json()).duplicate).toBe(true);
  });
});
