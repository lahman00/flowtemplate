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
};
