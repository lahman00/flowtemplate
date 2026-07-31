import type { Software } from "@/data/software";

/**
 * Phase 5 (Sprint 4) — monetization-ready architecture. Everything here is
 * real, functioning logic; none of it is switched on by fake data. No
 * entry in data/software currently sets sponsored or featured — see
 * docs/monetization.md. Affiliate-link mechanics (CTA URL, tracking
 * params, disclosure) live in lib/affiliate.ts.
 */

export function isSponsored(software: Software): boolean {
  return software.sponsored === true;
}

export function isFeatured(software: Software): boolean {
  return software.featured === true;
}
