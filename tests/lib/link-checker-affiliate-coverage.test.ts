import { describe, it, expect } from "vitest";
import { collectUrls } from "@/scripts/maintenance/links";
import { ACTIVE_PARTNERS } from "@/data/affiliate/active-partners";

/**
 * WAR MODE mission (2026-08-22) Phase 27 — real revenue-leak finding:
 * scripts/maintenance/links.ts's collectUrls() used to source affiliate
 * URLs only from getAffiliateActivation() (the env-var/config-file
 * activation mechanism) -- but none of the 14 real, revenue-generating
 * active partners use that mechanism; they're all activated through
 * data/affiliate/active-partners.ts. The result: the site's automated
 * link-health checker had zero live-URL-health coverage of any real
 * revenue-bearing affiliate link -- if one broke for real, nothing would
 * catch it. Fixed by sourcing from getSoftwareCtaUrl()/
 * shouldShowAffiliateDisclosure() instead, the same resolver every live
 * CTA actually calls. This test makes that coverage permanent.
 */
describe("Link health checker — affiliate URL coverage", () => {
  it("includes every real active partner's affiliate URL in the collected set", () => {
    const collected = collectUrls();
    const collectedUrls = new Set(collected.map((c) => c.url));

    const missing = ACTIVE_PARTNERS.filter((partner) => partner.affiliateUrl && !collectedUrls.has(partner.affiliateUrl));
    expect(missing.map((p) => p.slug)).toEqual([]);
  });

  it("tags every active partner's URL with kind 'affiliate', not silently as 'official'", () => {
    const collected = collectUrls();
    for (const partner of ACTIVE_PARTNERS) {
      if (!partner.affiliateUrl) continue;
      const entry = collected.find((c) => c.url === partner.affiliateUrl);
      expect(entry, `${partner.slug}'s affiliate URL was not collected at all`).toBeTruthy();
      expect(entry?.locations.some((l) => l.kind === "affiliate" && l.softwareSlug === partner.slug)).toBe(true);
    }
  });
});
