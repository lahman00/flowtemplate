import type { FaqItem, Software } from "@/data/software";
import { getSoftwareFaqItems } from "@/lib/faq";

export function generateTitle(software: Software): string {
  return `Best ${software.name} Alternatives`;
}

export function generateH1(software: Software): string {
  return `Best ${software.name} alternatives`;
}

/**
 * SERP snippets get cut off past ~155-160 chars — truncate at a word
 * boundary rather than mid-word. Exported so lib/comparison.ts's
 * generateComparisonMetaDescription can reuse the same cap and algorithm
 * instead of duplicating it.
 */
export const META_DESCRIPTION_MAX_LENGTH = 155;

export function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  const atWord = (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trimEnd();
  // A description that's one long comma-joined sentence (the norm for this
  // catalog — real vendor facts rarely land on an early period) can cut
  // right after a comma/semicolon/colon, reading as "...manage sales," — a
  // dangling list separator right before the ellipsis is more jarring than
  // ending on a plain word, so strip it.
  return `${atWord.replace(/[,;:]+$/, "")}…`;
}

/**
 * Prefers the product-specific description on its own — appending the
 * generic "Compare N alternatives" CTA only when it actually fits within
 * the SERP-safe budget. The old version always appended the CTA first and
 * truncated after, so on any description over ~90 chars (the majority) the
 * CTA text was silently sliced away and every page ended mid-sentence with
 * an ellipsis for zero benefit.
 */
export function generateMetaDescription(software: Software): string {
  const cta = `Compare ${software.alternatives.length} real alternatives to find the best fit for your team.`;
  const withCta = `${software.description} ${cta}`;
  if (withCta.length <= META_DESCRIPTION_MAX_LENGTH) return withCta;
  if (software.description.length <= META_DESCRIPTION_MAX_LENGTH) return software.description;
  return truncateAtWord(software.description, META_DESCRIPTION_MAX_LENGTH);
}

export function generateIntro(software: Software): string {
  return software.description;
}

/** A slightly richer overview combining what it is with who it's positioned for. */
export function generateOverview(software: Software): string {
  return `${software.description} ${software.bestFor}`;
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

function stripTrailingPeriod(text: string): string {
  return text.endsWith(".") ? text.slice(0, -1) : text;
}

/**
 * Data-driven "how to choose" guidance. Used to be fixed boilerplate,
 * identical on all 217 software pages regardless of which alternatives
 * they actually list — real Search Console data (Operation First Click,
 * 2026-08-14) showed the overwhelming majority of this site's real search
 * impressions are "[product] alternatives"/"[product] vs [competitor]"
 * queries, which this generic text did nothing to address. Now names each
 * real listed alternative and its own sourced `bestFor` field verbatim
 * (not spliced into a lowercased sentence — comparison.ts's
 * generateWhoShouldChoose hit exactly this bug before: some bestFor text
 * starts with the product's own name, e.g. "HubSpot positions...", and a
 * naive first-letter lowercase mangles it into "hubSpot positions...").
 */
export function generateChoosingGuide(software: Software): string {
  const platformsNote = software.platforms?.length
    ? ` Confirm it runs on the platforms you need (${software.platforms.join(", ")}) before switching.`
    : "";

  if (software.alternatives.length === 0) {
    return `Start with the workflow you need to improve. Compare ease of use, collaboration features, integrations, customization, and the effort required to migrate your existing data.${platformsNote}`;
  }

  const altSummary = software.alternatives.map((alt) => `${alt.name} (${stripTrailingPeriod(alt.bestFor)})`).join("; ");

  return `Before switching to ${software.name}, weigh it against its listed alternatives: ${altSummary}. Compare each against the workflow you actually run today — integrations, customization, and the effort required to migrate your existing data usually matter more than headline features.${platformsNote}`;
}

export function generateFaq(software: Software): FaqItem[] {
  if (software.faq && software.faq.length > 0) {
    return software.faq;
  }
  return getSoftwareFaqItems(software);
}
