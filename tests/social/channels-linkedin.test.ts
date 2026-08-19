import { afterEach, describe, expect, it, vi } from "vitest";
import { linkedinAdapter, reconcileBufferLinkedInPost } from "@/lib/social/channels/linkedin";
import { resetLocalLinkedInDeliveryClaimsForTests } from "@/lib/social/linkedin-delivery-claims";
import type { ChannelVariant } from "@/lib/social/types";

const variant: ChannelVariant = { text: "Miro or Lucidchart?", link: "https://miloosh.com/compare/miro-vs-lucidchart", imageUrl: null, altText: null, hashtags: [], publishResult: null };
const keys = ["LINKEDIN_TRANSPORT", "MAKE_LINKEDIN_WEBHOOK_URL", "MAKE_LINKEDIN_WEBHOOK_SECRET", "SOCIAL_LINKEDIN_ACCESS_TOKEN", "SOCIAL_LINKEDIN_ORGANIZATION_ID", "SOCIAL_LINKEDIN_VERSION", "SOCIAL_LINKEDIN_BUFFER_API_KEY", "SOCIAL_LINKEDIN_BUFFER_CHANNEL_ID"] as const;

afterEach(() => {
  vi.restoreAllMocks();
  resetLocalLinkedInDeliveryClaimsForTests();
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

  it("selects Buffer in dry-run without calling Buffer or mutating provider state", async () => {
    process.env.LINKEDIN_TRANSPORT = "buffer";
    process.env.SOCIAL_LINKEDIN_BUFFER_CHANNEL_ID = "channel-1";
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const result = await linkedinAdapter.publish(variant, { dryRun: true, entryId: "entry-1" });
    expect(result).toMatchObject({ status: "DRY_RUN", transport: "buffer", targetId: "channel-1", bufferPostId: null, linkedinPostId: null });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("uses Buffer shareNow and preserves the stable queue identity as source", async () => {
    process.env.LINKEDIN_TRANSPORT = "buffer";
    process.env.SOCIAL_LINKEDIN_BUFFER_API_KEY = "secret";
    process.env.SOCIAL_LINKEDIN_BUFFER_CHANNEL_ID = "channel-1";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { createPost: { post: { id: "buffer-7", status: "buffer", sentAt: null } } } }), { status: 200 }));
    const result = await linkedinAdapter.publish(variant, { dryRun: false, entryId: "entry-1" });
    expect(result).toMatchObject({ status: "PENDING_CONFIRMATION", transport: "buffer", bufferPostId: "buffer-7", linkedinPostId: null, postId: null });
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer secret");
    const request = JSON.parse(String(init?.body));
    expect(request.variables.input).toMatchObject({ channelId: "channel-1", schedulingType: "automatic", mode: "shareNow", source: "miloosh:linkedin:entry-1" });
    expect(request.variables.input.assets).toEqual([]);
  });

  it("attaches a trusted public card URL as a Buffer image asset", async () => {
    process.env.LINKEDIN_TRANSPORT = "buffer";
    process.env.SOCIAL_LINKEDIN_BUFFER_API_KEY = "secret";
    process.env.SOCIAL_LINKEDIN_BUFFER_CHANNEL_ID = "channel-1";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { createPost: { post: { id: "buffer-image", status: "buffer", sentAt: null } } } }), { status: 200 }));
    const imageUrl = "https://miloosh.com/api/social/card?size=linkedin&kind=research&headline=Verified";
    await linkedinAdapter.publish({ ...variant, imageUrl, altText: "Miloosh research card" }, { dryRun: false, entryId: "entry-image" });
    const request = JSON.parse(String(fetchMock.mock.calls[0]![1]?.body));
    expect(request.variables.input.assets).toEqual([{ image: { url: imageUrl } }]);
  });

  it("allows only one Buffer mutation for concurrent attempts with the same stable identity", async () => {
    process.env.LINKEDIN_TRANSPORT = "buffer";
    process.env.SOCIAL_LINKEDIN_BUFFER_API_KEY = "secret";
    process.env.SOCIAL_LINKEDIN_BUFFER_CHANNEL_ID = "channel-1";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { createPost: { post: { id: "buffer-once", status: "buffer", sentAt: null } } } }), { status: 200 }));

    const [first, second] = await Promise.all([
      linkedinAdapter.publish(variant, { dryRun: false, entryId: "same-entry" }),
      linkedinAdapter.publish(variant, { dryRun: false, entryId: "same-entry" }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect([first.status, second.status].sort()).toEqual(["DUPLICATE_SKIPPED", "PENDING_CONFIRMATION"]);
  });

  it("reconciles a Buffer post as sent without inventing a LinkedIn post ID", async () => {
    process.env.SOCIAL_LINKEDIN_BUFFER_API_KEY = "secret";
    process.env.SOCIAL_LINKEDIN_BUFFER_CHANNEL_ID = "channel-1";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { post: { id: "buffer-7", status: "sent", sentAt: "2026-08-30T17:00:10Z" } } }), { status: 200 }));
    const result = await reconcileBufferLinkedInPost("buffer-7", variant.text, variant.link!);
    expect(result).toMatchObject({ status: "PUBLISHED", verified: true, bufferPostId: "buffer-7", linkedinPostId: null, postId: null });
  });

  it("does not retry an ambiguous Buffer network outcome", async () => {
    process.env.LINKEDIN_TRANSPORT = "buffer";
    process.env.SOCIAL_LINKEDIN_BUFFER_API_KEY = "secret";
    process.env.SOCIAL_LINKEDIN_BUFFER_CHANNEL_ID = "channel-1";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("timed out"));
    const result = await linkedinAdapter.publish(variant, { dryRun: false, entryId: "entry-1" });
    const retry = await linkedinAdapter.publish(variant, { dryRun: false, entryId: "entry-1" });
    expect(result.status).toBe("FAILED");
    expect(result.error).toContain("unknown publication outcome");
    expect(retry.status).toBe("DUPLICATE_SKIPPED");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
