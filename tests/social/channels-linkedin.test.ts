import { afterEach, describe, expect, it, vi } from "vitest";
import { linkedinAdapter } from "@/lib/social/channels/linkedin";
import type { ChannelVariant } from "@/lib/social/types";

const variant: ChannelVariant = { text: "Miro or Lucidchart?", link: "https://miloosh.com/compare/miro-vs-lucidchart", imageUrl: null, altText: null, hashtags: [], publishResult: null };
const keys = ["SOCIAL_LINKEDIN_ACCESS_TOKEN", "SOCIAL_LINKEDIN_ORGANIZATION_ID", "SOCIAL_LINKEDIN_VERSION"] as const;

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
});
