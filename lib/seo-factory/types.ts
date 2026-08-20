export const SEO_INTENTS = ["SOFTWARE_BRAND", "PRICING", "COMPARISON", "ALTERNATIVES", "REVIEW", "FEATURE", "INTEGRATION", "MIGRATION", "USE_CASE", "CATEGORY", "DECISION", "SUPPORT_HOW_TO", "UNKNOWN"] as const;
export type SeoIntent = (typeof SEO_INTENTS)[number];

export const SEO_ACTIONS = ["CREATE", "IMPROVE", "MERGE", "REDIRECT", "INTERNAL_LINK", "META_TEST", "REFRESH", "MONETIZE", "WAIT", "IGNORE"] as const;
export type SeoAction = (typeof SEO_ACTIONS)[number];

export type SignalKind = "real" | "derived" | "heuristic" | "unavailable";
export type OpportunityState = "DISCOVERED" | "ANALYZED" | "APPROVED" | "BLOCKED" | "IMPLEMENTED" | "DEPLOYED" | "MEASURING" | "WON" | "LOST" | "DISMISSED";

export type ScoreComponent = {
  name: string;
  value: number | null;
  weight: number;
  kind: SignalKind;
  source: string;
  confidence: "high" | "medium" | "low";
};

export type SeoOpportunity = {
  id: string;
  query: string;
  intent: SeoIntent;
  action: SeoAction;
  targetUrl: string | null;
  existingUrl: string | null;
  relatedSoftware: string[];
  category: string | null;
  gsc: { impressions: number; clicks: number; ctr: number; position: number };
  affiliateStatus: "ACTIVE" | "VIABLE" | "NONE" | "UNKNOWN";
  moneyScore: number | null;
  opportunityScore: number;
  scoreComponents: ScoreComponent[];
  cannibalizationRisk: "none" | "possible" | "confirmed";
  canonicalWinner: string | null;
  recommendation: string;
  evidence: string[];
  confidence: "high" | "medium" | "low";
  state: OpportunityState;
  publicationEligible: false;
};

export type SeoFactoryRun = {
  schemaVersion: 1;
  id: string;
  generatedAt: string;
  window: { startDate: string; endDate: string };
  autonomyLevel: 0;
  massPublishingEnabled: false;
  gscRowsAnalyzed: number;
  pagesAnalyzed: number;
  inventory: { software: number; comparisons: number; categories: number; total: number };
  comparisonDiagnosis: { pagesWithVisibility: number; impressions: number; clicks: number; medianPosition: number | null };
  actionCounts: Record<SeoAction, number>;
  intentCounts: Record<SeoIntent, number>;
  leaveAloneCount: number;
  opportunities: SeoOpportunity[];
  errors: string[];
};

export type SeoExperiment = {
  id: string;
  page: string;
  intervention: string;
  recordedAt: string;
  reason: string;
  baseline: { impressions: number; clicks: number; ctr: number; position: number };
  measurementWindowDays: number;
  result: null | { measuredAt: string; impressions: number; clicks: number; ctr: number; position: number };
  decision: "MEASURING" | "WON" | "LOST" | "INCONCLUSIVE";
  baselineId?: string;
  queryCluster?: string[];
  diagnosis?: string;
  exactChange?: string;
  evidenceSources?: string[];
  internalLinksChanged?: string[];
  deploymentTimestamp?: string;
  affiliateStatusAtT0?: string;
  checkpoints?: Array<{ days: 7 | 14 | 28; dueAt: string; kind: "DIRECTIONAL" | "PRIMARY"; measuredAt: null }>;
};

/** Immutable pre-intervention evidence captured before editorial review. */
export type SeoExperimentBaseline = {
  schemaVersion: 1;
  id: string;
  capturedAt: string;
  runId: string;
  page: string;
  queryCluster: string[];
  window: { startDate: string; endDate: string };
  query: { impressions: number; clicks: number; ctr: number; position: number };
  pageAggregate: { impressions: number; clicks: number; ctr: number; position: number };
};
