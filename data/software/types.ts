export type Alternative = {
  name: string;
  slug: string;
  description: string;
  bestFor: string;
  strengths: string[];
};

export type Pricing = {
  model?: "free" | "freemium" | "paid" | "open_source" | "unknown";
  startingPrice?: string;
  hasFreeTier?: boolean;
};

export type FaqItem = {
  question: string;
  answer: string;
};

/** Sprint 6 Phase 5 — vendor link blocks. All optional; none populated today. */
export type VendorLinks = {
  pricing?: string;
  docs?: string;
  support?: string;
  integrations?: string;
  status?: string;
  community?: string;
};

export type Software = {
  name: string;
  slug: string;
  category: string;
  description: string;
  website: string;
  logo?: string;
  founded?: number;
  company?: string;
  pricing?: Pricing;
  platforms?: string[];
  bestFor: string;
  pros?: string[];
  cons?: string[];
  features: string[];
  alternatives: Alternative[];
  faq?: FaqItem[];
  tags?: string[];
  sources: string[];
  /** Date sources[] was fetched/verified, YYYY-MM-DD. */
  accessedAt: string;
  /** Phase 5 — monetization-ready architecture. Never fabricated; see docs/monetization.md. */
  affiliateUrl?: string;
  sponsored?: boolean;
  featured?: boolean;
  links?: VendorLinks;
};
