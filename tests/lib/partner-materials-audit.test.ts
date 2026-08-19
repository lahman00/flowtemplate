import { describe, expect, it } from "vitest";
import { PARTNER_MATERIAL_AUDIT } from "@/data/affiliate/partner-materials-audit";

describe("partner materials audit", () => {
  it("has one record per company and no duplicate known affiliate URL", () => {
    const slugs = PARTNER_MATERIAL_AUDIT.map((record) => record.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const urls = PARTNER_MATERIAL_AUDIT.map((record) => record.affiliateUrl).filter((url) => url !== "UNKNOWN");
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("never marks a company ready without an evidence-backed URL", () => {
    for (const record of PARTNER_MATERIAL_AUDIT.filter((item) => item.readiness === "READY NOW")) {
      expect(record.affiliateUrl).not.toBe("UNKNOWN");
      expect(record.evidence.length).toBeGreaterThan(0);
    }
  });

  it("covers every company explicitly required by the audit brief", () => {
    const required = ["iconosquare", "carepatron", "ruby", "mindstudio", "miro", "8fig", "pagecloud", "rocketreach", "flatpay", "hubstaff", "closely", "pipedrive", "getresponse", "volza", "todoist"];
    const slugs = new Set(PARTNER_MATERIAL_AUDIT.map((record) => record.slug));
    for (const slug of required) expect(slugs.has(slug)).toBe(true);
  });

  it("keeps rejected, pending, and missing-link states distinct", () => {
    expect(PARTNER_MATERIAL_AUDIT.find((record) => record.slug === "hubspot")?.readiness).toBe("REJECTED");
    expect(PARTNER_MATERIAL_AUDIT.find((record) => record.slug === "clickup")?.readiness).toBe("PENDING APPROVAL");
    expect(PARTNER_MATERIAL_AUDIT.find((record) => record.slug === "brevo")?.readiness).toBe("APPROVED BUT NEEDS LINK");
  });
});
