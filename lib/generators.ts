import type { FaqItem, Software } from "@/data/software";
import { getSoftwareFaqItems } from "@/lib/faq";

export function generateTitle(software: Software): string {
  return `Best ${software.name} Alternatives`;
}

export function generateH1(software: Software): string {
  return `Best ${software.name} alternatives`;
}

export function generateMetaDescription(software: Software): string {
  return `${software.description} Compare ${software.alternatives.length} real alternatives to find the best fit for your team.`;
}

export function generateIntro(software: Software): string {
  return software.description;
}

/** A slightly richer overview combining what it is with who it's positioned for. */
export function generateOverview(software: Software): string {
  return `${software.description} ${software.bestFor}`;
}

/** Grounded in the vendor's own stated positioning — never an independent editorial claim. */
export function generateWhoShouldUseIt(software: Software): string {
  return `${software.name} is worth a closer look if this matches your situation: ${software.bestFor.charAt(0).toLowerCase()}${software.bestFor.slice(1)}`;
}

/**
 * Deliberately doesn't assert specific product weaknesses — we have no
 * sourced "cons" data (see docs/content-engine.md). Instead this points to
 * the real alternatives already on the page as the honest next step.
 */
export function generateWhoShouldntUseIt(software: Software): string {
  const alternativeNames = software.alternatives.map((alt) => alt.name).join(", ");
  return `If ${software.name}'s feature set above doesn't cover what you need, one of the alternatives compared here — ${alternativeNames} — may be a closer fit.`;
}

export function generateComparisonIntro(software: Software): string {
  return `See how the top ${software.name} alternatives compare on use case fit and core strengths.`;
}

/** Generic, honest migration guidance — no product-specific claims we haven't verified. */
export function generateMigrationTips(software: Software): string {
  return `Most teams start by exporting their existing ${software.name} data, then importing it into the new tool while running both in parallel until the switch is complete. Check each alternative's own import tools before committing to a full migration.`;
}

/** Data-driven "how to choose" guidance, grounded in whatever platforms/features this entry actually has. */
export function generateChoosingGuide(software: Software): string {
  const platformsNote = software.platforms?.length
    ? ` Confirm it runs on the platforms you need (${software.platforms.join(", ")}) before switching.`
    : "";

  return `Start with the workflow you need to improve. Compare ease of use, collaboration features, integrations, customization, and the effort required to migrate your existing data.${platformsNote}`;
}

export function generateFaq(software: Software): FaqItem[] {
  if (software.faq && software.faq.length > 0) {
    return software.faq;
  }
  return getSoftwareFaqItems(software);
}
