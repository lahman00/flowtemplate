import { describe, it, expect } from "vitest";
import { getSoftwareCtaUrl, getSoftwareCtaRel, shouldShowAffiliateDisclosure } from "@/lib/affiliate";
import { getSoftware } from "@/data/software";

/**
 * Regression coverage for ElevenLabs' affiliate activation (2026-08-17).
 * ElevenLabs was approved via PartnerStack days earlier (2026-08-14) and
 * its real affiliate URL was already recorded in the affiliate pipeline,
 * but never actually wired into data/software/elevenlabs.json — meaning
 * it was NOT live on the site despite the pipeline saying "approved".
 * This confirms the existing, already-verified URL was reused as-is
 * (never overwritten with something new just because an onboarding
 * email arrived) and is now genuinely live.
 */

const KNOWN_ELEVENLABS_AFFILIATE_URL = "https://try.elevenlabs.io/gkp73pehjgtl";

describe("ElevenLabs affiliate link (real, static data/software/elevenlabs.json entry)", () => {
  it("the software page CTA resolves to the existing, already-verified affiliate URL — not a new/different one", () => {
    const elevenlabs = getSoftware("elevenlabs")!;
    expect(getSoftwareCtaUrl(elevenlabs)).toBe(KNOWN_ELEVENLABS_AFFILIATE_URL);
  });

  it("uses rel=sponsored now that it's live", () => {
    const elevenlabs = getSoftware("elevenlabs")!;
    expect(getSoftwareCtaRel(elevenlabs)).toContain("sponsored");
  });

  it("shows the affiliate disclosure note", () => {
    const elevenlabs = getSoftware("elevenlabs")!;
    expect(shouldShowAffiliateDisclosure(elevenlabs)).toBe(true);
  });

  it("the official website and sources are untouched by activation", () => {
    const elevenlabs = getSoftware("elevenlabs")!;
    expect(elevenlabs.website).toBe("https://elevenlabs.io/");
    for (const source of elevenlabs.sources) {
      expect(source).not.toContain("try.elevenlabs.io/gkp73pehjgtl");
    }
  });
});
