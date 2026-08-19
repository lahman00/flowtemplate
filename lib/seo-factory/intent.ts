import type { Software } from "@/data/software";
import type { SeoIntent } from "@/lib/seo-factory/types";

export function normalizeQuery(query: string): string {
  return query.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

export function softwareEntitiesForQuery(query: string, software: Software[]): Software[] {
  const normalized = ` ${normalizeQuery(query)} `;
  return software.filter((item) => {
    const names = [item.slug.replace(/-/g, " "), normalizeQuery(item.name)].filter((value) => value.length > 1);
    return names.some((name) => normalized.includes(` ${name} `));
  });
}

export function classifySeoIntent(query: string, entities: Software[]): SeoIntent {
  const q = normalizeQuery(query);
  if (/\b(vs|versus|compare|comparison)\b/.test(q) && entities.length >= 2) return "COMPARISON";
  if (/\b(alternative|alternatives|competitor|competitors)\b/.test(q)) return "ALTERNATIVES";
  if (/\b(pricing|price|cost|plans?|billing)\b/.test(q)) return "PRICING";
  if (/\b(migrate|migration|switch|move|transfer)\b/.test(q) && entities.length >= 1) return "MIGRATION";
  if (/\b(integration|integrate|connector|connect)\b/.test(q) && entities.length >= 1) return "INTEGRATION";
  if (/\b(review|reviews)\b/.test(q) && entities.length >= 1) return "REVIEW";
  if (/\b(is|does|worth|should i|good for)\b/.test(q) && entities.length >= 1) return "DECISION";
  if (/\b(how to|help|support|docs|documentation|login)\b/.test(q)) return "SUPPORT_HOW_TO";
  if (/\b(best|top)\b/.test(q) && /\b(software|tools?|platforms?|apps?)\b/.test(q)) return "CATEGORY";
  if (/\b(for small business|for enterprise|for startups?|for teams?|use case)\b/.test(q)) return "USE_CASE";
  if (entities.length === 1 && q === normalizeQuery(entities[0]!.name)) return "SOFTWARE_BRAND";
  if (entities.length >= 1) return "FEATURE";
  return "UNKNOWN";
}
