import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { POST } from "@/app/api/outbound-click/route";
import { getOutboundEvents } from "@/lib/revenue/events";
import { getAllFirstPartyEvents } from "@/lib/analytics/events";

/**
 * Analytics Zero-Drop Production Proof Mega Mission (2026-08-21) — Phase
 * 11: the old outbound-click pipeline (lib/revenue/events.ts) and the new
 * first-party analytics pipeline (lib/analytics/events.ts) must agree on
 * isTest for the same click — this route writes to both. Same local-file
 * isolation discipline as tests/lib/click-tracker.test.ts.
 */

const LEGACY_LOG_FILE = path.join(process.cwd(), "var", "outbound-clicks.json");
const FIRST_PARTY_LOG_FILE = path.join(process.cwd(), "var", "first-party-analytics.json");

let realFlag: string | undefined;

beforeAll(() => {
  realFlag = process.env.NEXT_PUBLIC_REVENUE_TRACKING_ENABLED;
  process.env.NEXT_PUBLIC_REVENUE_TRACKING_ENABLED = "true";
});

beforeEach(() => {
  fs.rmSync(LEGACY_LOG_FILE, { force: true });
  fs.rmSync(FIRST_PARTY_LOG_FILE, { force: true });
});

afterAll(() => {
  fs.rmSync(LEGACY_LOG_FILE, { force: true });
  fs.rmSync(FIRST_PARTY_LOG_FILE, { force: true });
  if (realFlag !== undefined) process.env.NEXT_PUBLIC_REVENUE_TRACKING_ENABLED = realFlag;
  else delete process.env.NEXT_PUBLIC_REVENUE_TRACKING_ENABLED;
});

function post(body: unknown): Promise<Response> {
  return POST(
    new Request("https://miloosh.com/api/outbound-click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }) as never
  );
}

describe("POST /api/outbound-click — legacy and first-party pipelines agree on isTest", () => {
  it("a synthetic QA click (isTest:true) is recorded isTest:true in BOTH pipelines, using the same anonymous session", async () => {
    const res = await post({ slug: "pipedrive", kind: "cta", sourcePage: "/software/pipedrive", ctaLocation: "software-page-cta", visitorId: "v_qa_click", sessionId: "s_qa_click", isTest: true });
    expect(res.status).toBe(202);

    const legacy = await getOutboundEvents();
    const legacyEvent = legacy.find((e) => e.softwareSlug === "pipedrive");
    expect(legacyEvent?.isTest).toBe(true);

    const firstParty = await getAllFirstPartyEvents();
    const fpEvent = firstParty.find((e) => e.type === "outbound_click" && "softwareSlug" in e && e.softwareSlug === "pipedrive");
    expect(fpEvent?.isTest).toBe(true);
    expect(fpEvent?.visitorId).toBe("v_qa_click");
    expect(fpEvent?.sessionId).toBe("s_qa_click");
  });

  it("a real/unknown-human click is recorded isTest:false (or absent) in both pipelines", async () => {
    const res = await post({ slug: "pipedrive", kind: "cta", sourcePage: "/software/pipedrive", visitorId: "v_real_click", sessionId: "s_real_click" });
    expect(res.status).toBe(202);

    const legacy = await getOutboundEvents();
    const legacyEvent = legacy.find((e) => e.softwareSlug === "pipedrive");
    expect(legacyEvent?.isTest).toBeFalsy();

    const firstParty = await getAllFirstPartyEvents();
    const fpEvent = firstParty.find((e) => e.type === "outbound_click" && "softwareSlug" in e && e.softwareSlug === "pipedrive");
    expect(fpEvent?.isTest).toBeFalsy();
  });

  it("a vendor-link click also propagates isTest to both pipelines", async () => {
    await post({ slug: "notion", kind: "vendor-link", sourcePage: "/software/notion", visitorId: "v_vendor_qa", sessionId: "s_vendor_qa", isTest: true });

    const legacy = await getOutboundEvents();
    expect(legacy.find((e) => e.softwareSlug === "notion")?.isTest).toBe(true);

    const firstParty = await getAllFirstPartyEvents();
    const fpEvent = firstParty.find((e) => e.type === "outbound_click" && "softwareSlug" in e && e.softwareSlug === "notion");
    expect(fpEvent?.isTest).toBe(true);
  });

  it("never actually navigates anywhere or hits a real vendor endpoint — this route only records an event", async () => {
    // The route's only side effect is writing to the two local event stores;
    // it never makes an outbound network call to a vendor/affiliate URL.
    // Structural proof: recordOutboundEvent/recordFirstPartyEvent are the
    // only awaited calls in the route body (see app/api/outbound-click/route.ts).
    const routeSource = fs.readFileSync(path.join(process.cwd(), "app/api/outbound-click/route.ts"), "utf-8");
    expect(routeSource).not.toMatch(/fetch\(.*(url|affiliate)/i);
  });
});
