import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { POST } from "@/app/api/analytics/event/route";
import { getAllFirstPartyEvents } from "@/lib/analytics/events";

/**
 * Analytics Zero-Drop Production Proof Mega Mission (2026-08-21) — Phase
 * 13 (adversarial) and Phase 16 (regression) coverage for the actual
 * route handler, not just the classification/storage functions in
 * isolation — this is what proves the whole request path end-to-end
 * (minus the real network hop), the same discipline that found the real
 * production bug (x-vercel-sc-headers) in the first place.
 */

const HUMAN_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

function post(body: unknown, headers: Record<string, string> = {}): Promise<Response> {
  return POST(
    new Request("https://miloosh.com/api/analytics/event", {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": HUMAN_UA, ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }) as never
  );
}

describe("POST /api/analytics/event — end-to-end route behavior", () => {
  const localStorePath = path.join(process.cwd(), "var", "first-party-analytics.json");

  beforeEach(() => {
    try {
      if (fs.existsSync(localStorePath)) fs.unlinkSync(localStorePath);
    } catch {
      // ignore
    }
  });

  afterEach(() => {
    try {
      if (fs.existsSync(localStorePath)) fs.unlinkSync(localStorePath);
    } catch {
      // ignore
    }
  });

  it("stores a real/unknown-human event and classifies it REAL_OR_UNKNOWN_HUMAN", async () => {
    const res = await post({ type: "page_view", path: "/", visitorId: "v_1", sessionId: "s_1" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ recorded: true, classification: "REAL_OR_UNKNOWN_HUMAN" });
    const stored = await getAllFirstPartyEvents();
    expect(stored.some((e) => e.visitorId === "v_1" && e.isTest !== true)).toBe(true);
  });

  it("stores a synthetic QA event (isTest:true) — never silently drops it — and classifies it SYNTHETIC_QA", async () => {
    const res = await post({ type: "page_view", path: "/recommend", visitorId: "v_qa", sessionId: "s_qa", isTest: true });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ recorded: true, classification: "SYNTHETIC_QA" });
    const stored = await getAllFirstPartyEvents();
    const found = stored.find((e) => e.visitorId === "v_qa");
    expect(found?.isTest).toBe(true);
  });

  it("attaches qaRun only alongside isTest:true, and re-sanitizes it server-side", async () => {
    const res = await post({ type: "page_view", path: "/recommend", visitorId: "v_qa2", sessionId: "s_qa2", isTest: true, qaRun: "run-<script>alert(1)</script>-42" });
    expect(res.status).toBe(200);
    const stored = await getAllFirstPartyEvents();
    const found = stored.find((e) => e.visitorId === "v_qa2");
    expect(found?.qaRun).toBe("run-scriptalert1script-42");
  });

  it("never stores qaRun on a real/unknown-human event, even if the client sends one", async () => {
    const res = await post({ type: "page_view", path: "/", visitorId: "v_spoof", sessionId: "s_spoof", isTest: false, qaRun: "should-not-appear" });
    expect(res.status).toBe(200);
    const stored = await getAllFirstPartyEvents();
    const found = stored.find((e) => e.visitorId === "v_spoof");
    expect(found?.qaRun).toBeUndefined();
  });

  it("rejects a bot user-agent as BOT, and never stores the event", async () => {
    const res = await post({ type: "page_view", path: "/", visitorId: "v_bot", sessionId: "s_bot" }, { "user-agent": "Googlebot/2.1" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ recorded: false, classification: "BOT" });
    const stored = await getAllFirstPartyEvents();
    expect(stored.some((e) => e.visitorId === "v_bot")).toBe(false);
  });

  it("no longer treats x-vercel-sc-headers as a rejection reason (the real 2026-08-21 production bug)", async () => {
    const res = await post({ type: "page_view", path: "/", visitorId: "v_platform", sessionId: "s_platform" }, { "x-vercel-sc-headers": "1" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ recorded: true, classification: "REAL_OR_UNKNOWN_HUMAN" });
  });

  it("rejects Vercel cron traffic as INTERNAL_INFRA, and never stores the event", async () => {
    const res = await post({ type: "page_view", path: "/", visitorId: "v_cron", sessionId: "s_cron" }, { "x-vercel-cron": "1" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ recorded: false, classification: "INTERNAL_INFRA" });
    const stored = await getAllFirstPartyEvents();
    expect(stored.some((e) => e.visitorId === "v_cron")).toBe(false);
  });

  it("rejects missing visitorId", async () => {
    const res = await post({ type: "page_view", path: "/", sessionId: "s_1" });
    expect(res.status).toBe(400);
    expect((await res.json()).classification).toBe("REJECTED_VALIDATION");
  });

  it("rejects missing sessionId", async () => {
    const res = await post({ type: "page_view", path: "/", visitorId: "v_1" });
    expect(res.status).toBe(400);
    expect((await res.json()).classification).toBe("REJECTED_VALIDATION");
  });

  it("rejects an invalid/unknown event type", async () => {
    const res = await post({ type: "totally_made_up_event", path: "/", visitorId: "v_1", sessionId: "s_1" });
    expect(res.status).toBe(400);
    expect((await res.json()).classification).toBe("REJECTED_VALIDATION");
  });

  it("rejects malformed JSON without crashing", async () => {
    const res = await post("{not valid json");
    expect(res.status).toBe(400);
    expect((await res.json()).classification).toBe("REJECTED_VALIDATION");
  });

  it("rejects an oversized payload without crashing", async () => {
    const res = await post({ type: "page_view", path: "/", visitorId: "v_1", sessionId: "s_1", junk: "x".repeat(20000) });
    expect(res.status).toBe(413);
    expect((await res.json()).classification).toBe("REJECTED_VALIDATION");
  });

  it("never crashes and never stores when storage itself fails", async () => {
    const events = await import("@/lib/analytics/events");
    const spy = vi.spyOn(events, "recordFirstPartyEvent").mockResolvedValue(false);
    const res = await post({ type: "page_view", path: "/", visitorId: "v_fail", sessionId: "s_fail" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ recorded: false, classification: "FAILED_STORAGE" });
    spy.mockRestore();
  });
});
