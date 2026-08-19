import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/social/buffer/verify/route";

afterEach(() => {
  vi.restoreAllMocks();
  for (const key of ["CRON_SECRET", "LINKEDIN_TRANSPORT", "SOCIAL_LINKEDIN_BUFFER_API_KEY", "SOCIAL_LINKEDIN_BUFFER_CHANNEL_ID"]) delete process.env[key];
});

describe("Buffer LinkedIn verification route", () => {
  it("rejects unauthenticated requests without calling Buffer", async () => {
    process.env.CRON_SECRET = "cron-secret";
    const fetchMock = vi.spyOn(globalThis, "fetch");
    expect((await GET(new Request("https://miloosh.com/api/social/buffer/verify"))).status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns only non-secret channel metadata", async () => {
    Object.assign(process.env, { CRON_SECRET: "cron-secret", LINKEDIN_TRANSPORT: "buffer", SOCIAL_LINKEDIN_BUFFER_API_KEY: "api-secret", SOCIAL_LINKEDIN_BUFFER_CHANNEL_ID: "channel-1" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { channel: { id: "channel-1", name: "Miloosh", displayName: "Miloosh", descriptor: "LinkedIn Page", service: "linkedin", type: "page", isDisconnected: false, isLocked: false } } }), { status: 200 }));
    const response = await GET(new Request("https://miloosh.com/api/social/buffer/verify", { headers: { Authorization: "Bearer cron-secret" } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ transport: "buffer", bufferAuthenticated: true, target: "company_page", channel: { id: "channel-1", name: "Miloosh", displayName: "Miloosh", descriptor: "LinkedIn Page", service: "linkedin", type: "page", isDisconnected: false, isLocked: false } });
  });

  it("rejects a personal LinkedIn profile target", async () => {
    Object.assign(process.env, { CRON_SECRET: "cron-secret", LINKEDIN_TRANSPORT: "buffer", SOCIAL_LINKEDIN_BUFFER_API_KEY: "api-secret", SOCIAL_LINKEDIN_BUFFER_CHANNEL_ID: "channel-1" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ data: { channel: { id: "channel-1", name: "Eyal", displayName: "Eyal", descriptor: "LinkedIn Profile", service: "linkedin", type: "profile", isDisconnected: false, isLocked: false } } }), { status: 200 }));
    const response = await GET(new Request("https://miloosh.com/api/social/buffer/verify", { headers: { Authorization: "Bearer cron-secret" } }));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "Configured Buffer channel is not a LinkedIn Company Page." });
  });
});
