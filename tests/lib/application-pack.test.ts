import { describe, it, expect } from "vitest";
import { buildApplicationPack, BUSINESS_DESCRIPTION, PROMOTION_STRATEGY, APPLICANT_LINKEDIN_URL } from "@/lib/revenue/application-pack";

describe("application pack generator", () => {
  it("returns null for an unknown slug", () => {
    expect(buildApplicationPack("not-a-real-product")).toBeNull();
  });

  it("uses the owner's exact verbatim description and promotion strategy, never a paraphrase", () => {
    const pack = buildApplicationPack("clickup")!;
    expect(pack.description).toBe(BUSINESS_DESCRIPTION);
    expect(pack.promotionStrategy).toBe(PROMOTION_STRATEGY);
    expect(pack.description).toContain("independent software research and comparison platform");
    expect(pack.promotionStrategy).toContain("clearly disclosed affiliate links");
  });

  it("marks readyToApply true only for a confirmed ('yes') program", () => {
    const clickup = buildApplicationPack("clickup")!; // confirmed
    expect(clickup.readyToApply).toBe(true);

    const trello = buildApplicationPack("trello")!; // confirmed 'no' program
    expect(trello.readyToApply).toBe(false);
  });

  it("uses the real, owner-provided LinkedIn URL — never a fabricated one", () => {
    const pack = buildApplicationPack("clickup")!;
    expect(pack.linkedinUrl).toBe(APPLICANT_LINKEDIN_URL);
    expect(pack.linkedinUrl).toBe("https://www.linkedin.com/company/141163964/");
    expect(pack.missingOwnerInputs.some((m) => m.includes("LinkedIn"))).toBe(false);
  });

  it("uses the real business identity fields, not invented ones", () => {
    const pack = buildApplicationPack("clickup")!;
    expect(pack.businessName).toBe("Miloosh");
    expect(pack.website).toBe("https://miloosh.com");
    expect(pack.businessEmail).toBe("hello@miloosh.com");
  });
});
