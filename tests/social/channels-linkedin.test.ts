import { afterEach, describe, expect, it, vi } from "vitest";
import { linkedinAdapter } from "@/lib/social/channels/linkedin";
import type { ChannelVariant } from "@/lib/social/types";

const variant: ChannelVariant = { text: "Miro or Lucidchart?", link: "https://miloosh.com/compare/miro-vs-lucidchart", imageUrl: null, altText: null, hashtags: [], publishResult: null };
const keys = ["LINKEDIN_TRANSPORT", "MAKE_LINKEDIN_WEBHOOK_URL", "MAKE_LINKEDIN_WEBHOOK_SECRET", "SOCIAL_LINKEDIN_ACCESS_TOKEN", "SOCIAL_LINKEDIN_ORGANIZATION_ID", "SOCIAL_LINKEDIN_VERSION"] as const;

afterEach(() => {
  vi.restoreAllMocks();
  for (const key of keys) delete process.env[key];
});

describe("linkedinAdapter", () => {
  it("fails closed when Community Management credentials are absent", async () => {
    const result = await linkedinAdapter.publish(variant, { dryRun: false });
    expect(result.status).toBe("SETUP_REQUIRED");
    expect(result.error).toContain("w_organization_social");
  });

  it("posts as the configured organization with the required version headers", async () => {
    process.env.LINKEDIN_TRANSPORT = "direct";
    process.env.SOCIAL_LINKEDIN_ACCESS_TOKEN = "secret";
    process.env.SOCIAL_LINKEDIN_ORGANIZATION_ID = "123";
    process.env.SOCIAL_LINKEDIN_VERSION = "202607";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 201, headers: { "x-restli-id": "urn:li:share:456" } }));
    const result = await linkedinAdapter.publish(variant, { dryRun: false });
    expect(result.status).toBe("PUBLISHED");
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init?.headers as Record<string, string>)["Linkedin-Version"]).toBe("202607");
    expect(JSON.parse(String(init?.body)).author).toBe("urn:li:organization:123");
  });

  it("does not claim success when the provider omits the post identity", async () => {
    process.env.SOCIAL_LINKEDIN_ACCESS_TOKEN = "secret";
    process.env.SOCIAL_LINKEDIN_ORGANIZATION_ID = "123";
    process.env.SOCIAL_LINKEDIN_VERSION = "202607";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 201 }));
    expect((await linkedinAdapter.publish(variant, { dryRun: false })).status).toBe("FAILED");
  });

  it("selects Make without calling it during a dry run", async () => {
    process.env.LINKEDIN_TRANSPORT = "make";
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const result = await linkedinAdapter.publish(variant, { dryRun: true, entryId: "entry-1", scheduledAt: "2026-08-30T17:00:00.000Z" });
    expect(result.status).toBe("DRY_RUN");
    expect(result.transport).toBe("make");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("records a confirmed Make publication and sends stable identity", async () => {
    process.env.LINKEDIN_TRANSPORT = "make";
    process.env.MAKE_LINKEDIN_WEBHOOK_URL = "https://hook.example.test/linkedin";
    process.env.MAKE_LINKEDIN_WEBHOOK_SECRET = "bridge-secret";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ status: "published", executionId: "make-7", linkedinPostId: "urn:li:share:9", linkedinPostUrl: "https://linkedin.example/post/9" }), { status: 200 }));
    const options = { dryRun: false, entryId: "entry-1", scheduledAt: "2026-08-30T17:00:00.000Z" };
    const first = await linkedinAdapter.publish(variant, options);
    await linkedinAdapter.publish(variant, options);
    expect(first.status).toBe("PUBLISHED");
    expect(first.transport).toBe("make");
    expect(first.executionId).toBe("make-7");
    expect(first.postId).toBe("urn:li:share:9");
    const payloads = fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)));
    expect(payloads[0].idempotencyKey).toBe("linkedin:entry-1");
    expect(payloads[1].idempotencyKey).toBe(payloads[0].idempotencyKey);
    expect((fetchMock.mock.calls[0]![1]?.headers as Record<string, string>)["Authorization"]).toBe("Bearer bridge-secret");
  });

  it("keeps accepted Make work pending until a LinkedIn ID is confirmed", async () => {
    process.env.LINKEDIN_TRANSPORT = "make";
    process.env.MAKE_LINKEDIN_WEBHOOK_URL = "https://hook.example.test/linkedin";
    process.env.MAKE_LINKEDIN_WEBHOOK_SECRET = "bridge-secret";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ status: "accepted", executionId: "make-8" }), { status: 202 }));
    const result = await linkedinAdapter.publish(variant, { dryRun: false, entryId: "entry-1" });
    expect(result.status).toBe("PENDING_CONFIRMATION");
    expect(result.executionId).toBe("make-8");
  });

  it("maps an ambiguous Make timeout to the existing unknown-outcome signal", async () => {
    process.env.LINKEDIN_TRANSPORT = "make";
    process.env.MAKE_LINKEDIN_WEBHOOK_URL = "https://hook.example.test/linkedin";
    process.env.MAKE_LINKEDIN_WEBHOOK_SECRET = "bridge-secret";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("timed out"));
    const result = await linkedinAdapter.publish(variant, { dryRun: false, entryId: "entry-1" });
    expect(result.status).toBe("FAILED");
    expect(result.error).toContain("unknown publication outcome");
  });
});
