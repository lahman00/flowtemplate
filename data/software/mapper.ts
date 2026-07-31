import type { AlternativeRaw, SoftwareRaw } from "@/data/software/schema";
import type { Alternative, Software } from "@/data/software/types";

function mapAlternative(raw: AlternativeRaw): Alternative {
  return {
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    bestFor: raw.best_for,
    strengths: raw.strengths,
  };
}

export function mapSoftware(raw: SoftwareRaw): Software {
  return {
    name: raw.name,
    slug: raw.slug,
    category: raw.category,
    description: raw.description,
    website: raw.website,
    logo: raw.logo,
    founded: raw.founded,
    company: raw.company,
    pricing: raw.pricing
      ? {
          model: raw.pricing.model,
          startingPrice: raw.pricing.starting_price,
          hasFreeTier: raw.pricing.has_free_tier,
        }
      : undefined,
    platforms: raw.platforms,
    bestFor: raw.best_for,
    pros: raw.pros,
    cons: raw.cons,
    features: raw.features,
    alternatives: raw.alternatives.map(mapAlternative),
    faq: raw.faq,
    tags: raw.tags,
    sources: raw.sources,
    accessedAt: raw.accessed_at,
    affiliateUrl: raw.affiliate_url,
    sponsored: raw.sponsored,
    featured: raw.featured,
  };
}
