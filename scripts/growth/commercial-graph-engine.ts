import { getAllSoftware } from "@/data/software";
import { getAllCategories } from "@/data/categories";
import { PUBLISHED_COMPARISONS } from "@/data/comparisons";
import { ACTIVE_PARTNERS, getActivePartner } from "@/data/affiliate/active-partners";
import { getAffiliateProgram } from "@/data/revenue/affiliate-programs";
import { getAllRoleGuides } from "@/data/guides/registry";
import { KNOWN_GSC_IMPRESSIONS } from "@/lib/growth-audit/comparison-graph";
import fs from "node:fs";
import path from "node:path";

export interface CommercialNode {
  slug: string;
  name: string;
  category: string;
  pageUrl: string;
  pricingModel: string;
  startingPrice: string;
  hasFreeTier: boolean;
  hasFreeTrial: boolean;
  lastVerifiedDate: string;
  isProtectedCohort: boolean;
  degree: number;
  inboundComparisons: number;
  inboundAlternatives: number;
  roleGuidesCount: number;
  roleGuides: string[];
  alternativesListed: string[];
  listedAsAlternativeBy: string[];
  affiliateStatus: "ACTIVE" | "PENDING" | "PROGRAM_EXISTS" | "OWNER_BLOCKED" | "REJECTED" | "UNKNOWN" | "NO_PROGRAM";
  affiliateNetwork: string | null;
  affiliateUrl: string | null;
  commissionModel: string | null;
  gscImpressions: number;
  gscClicks: number;
  avgPosition: number | null;
  queriesCount: number;
  monetizedComparisonsCount: number;
  dualMonetizedComparisonsCount: number;
  monetizationMultiplier: number;
  superlativeCount: number;
  superlativeFlags: string[];
}

export interface CommercialGraphSummary {
  totalProducts: number;
  totalCategories: number;
  totalComparisons: number;
  totalRoleGuides: number;
  activeAffiliatesCount: number;
  monetizedComparisonsTotal: number;
  dualMonetizedComparisonsTotal: number;
  nodes: CommercialNode[];
}

const PROTECTED_COHORT = new Set([
  "pipedrive", "airtable", "semrush", "freshdesk", "buffer",
  "ringcentral", "help-scout", "intercom", "front"
]);

const SUPERLATIVE_PATTERNS = [
  /\b(best-in-class|industry-leading|gold standard|exceptional|unmatched|revolutionary|game-changer|unrivaled)\b/i,
  /\b(outstanding|the benchmark for|the ultimate|best overall)\b/i
];

export function buildCommercialGraph(): CommercialGraphSummary {
  const software = getAllSoftware();
  const categories = getAllCategories();
  const roleGuides = getAllRoleGuides();

  // Load first click experiment data if present
  const experimentGsc: Record<string, { impressions: number; clicks: number; position: number; queries: string[] }> = {};
  const expPath = path.join(process.cwd(), "var/agents/first-click-experiment.json");
  if (fs.existsSync(expPath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(expPath, "utf-8"));
      if (parsed.targets) {
        for (const t of parsed.targets) {
          if (t.targetSlug) {
            experimentGsc[t.targetSlug] = {
              impressions: t.baselineImpressions ?? 0,
              clicks: t.baselineClicks ?? 0,
              position: t.baselineAveragePosition ?? 0,
              queries: t.trackedQueries ?? []
            };
          }
        }
      }
    } catch {}
  }

  const activeSet = new Set(ACTIVE_PARTNERS.map(p => p.slug as string));
  activeSet.add("shopify");
  activeSet.add("wix");

  // Compute graph in-degree
  const comparisonsBySlug = new Map<string, string[]>();
  for (const s of software) comparisonsBySlug.set(s.slug, []);

  for (const [a, b] of PUBLISHED_COMPARISONS) {
    comparisonsBySlug.get(a)?.push(b);
    comparisonsBySlug.get(b)?.push(a);
  }

  // Compute alternative references
  const listedAsAltBy = new Map<string, string[]>();
  for (const s of software) listedAsAltBy.set(s.slug, []);

  for (const s of software) {
    if (s.alternatives) {
      for (const alt of s.alternatives) {
        if (listedAsAltBy.has(alt.slug)) {
          listedAsAltBy.get(alt.slug)?.push(s.slug);
        }
      }
    }
  }

  let totalMonetizedComparisons = 0;
  let totalDualMonetizedComparisons = 0;

  for (const [a, b] of PUBLISHED_COMPARISONS) {
    const aActive = activeSet.has(a);
    const bActive = activeSet.has(b);
    if (aActive || bActive) totalMonetizedComparisons++;
    if (aActive && bActive) totalDualMonetizedComparisons++;
  }

  const nodes: CommercialNode[] = software.map(s => {
    const active = getActivePartner(s.slug);
    const prog = getAffiliateProgram(s.slug);
    const compNeighbors = comparisonsBySlug.get(s.slug) ?? [];
    
    // Count how many comparisons involving this product are monetized
    let monComps = 0;
    let dualComps = 0;
    for (const neighbor of compNeighbors) {
      const isNeighborActive = activeSet.has(neighbor);
      const isSelfActive = activeSet.has(s.slug);
      if (isSelfActive || isNeighborActive) monComps++;
      if (isSelfActive && isNeighborActive) dualComps++;
    }

    let affiliateStatus: CommercialNode["affiliateStatus"] = "UNKNOWN";
    if (active) {
      affiliateStatus = "ACTIVE";
    } else if (prog) {
      if (prog.programExists === "yes") {
        if (prog.notes?.toLowerCase().includes("pending")) affiliateStatus = "PENDING";
        else if (prog.notes?.toLowerCase().includes("owner action") || prog.notes?.toLowerCase().includes("blocked")) affiliateStatus = "OWNER_BLOCKED";
        else affiliateStatus = "PROGRAM_EXISTS";
      } else if (prog.programExists === "no") {
        affiliateStatus = "NO_PROGRAM";
      }
    }

    // Role guides
    const matchingGuides = roleGuides
      .filter(g => g.products.some(p => p.slug === s.slug))
      .map(g => g.slug);

    // GSC data
    const gscDirect = KNOWN_GSC_IMPRESSIONS[s.slug] ?? 0;
    const expData = experimentGsc[s.slug];
    const imp = Math.max(gscDirect, expData?.impressions ?? 0);
    const clicks = expData?.clicks ?? 0;
    const pos = expData?.position ?? null;
    const queriesCount = expData?.queries?.length ?? 0;

    // Superlatives check
    const flags: string[] = [];
    const textToCheck = [
      s.description,
      s.bestFor,
      ...(s.features ?? []),
      ...(s.pros ?? []),
      ...(s.cons ?? [])
    ].join(" ");

    for (const pattern of SUPERLATIVE_PATTERNS) {
      const match = textToCheck.match(pattern);
      if (match) {
        flags.push(match[0]);
      }
    }

    return {
      slug: s.slug,
      name: s.name,
      category: s.category,
      pageUrl: `https://miloosh.com/software/${s.slug}`,
      pricingModel: s.pricing?.model ?? "unknown",
      startingPrice: s.pricing?.startingPrice ?? "N/A",
      hasFreeTier: Boolean(s.pricing?.hasFreeTier),
      hasFreeTrial: Boolean(s.pricing?.freeTrial?.available),
      lastVerifiedDate: s.pricing?.lastVerified ?? "N/A",
      isProtectedCohort: PROTECTED_COHORT.has(s.slug),
      degree: compNeighbors.length,
      inboundComparisons: compNeighbors.length,
      inboundAlternatives: listedAsAltBy.get(s.slug)?.length ?? 0,
      roleGuidesCount: matchingGuides.length,
      roleGuides: matchingGuides,
      alternativesListed: s.alternatives?.map(a => a.slug) ?? [],
      listedAsAlternativeBy: listedAsAltBy.get(s.slug) ?? [],
      affiliateStatus,
      affiliateNetwork: prog?.networkName ?? null,
      affiliateUrl: active?.affiliateUrl ?? null,
      commissionModel: prog?.commissionModel ?? null,
      gscImpressions: imp,
      gscClicks: clicks,
      avgPosition: pos,
      queriesCount,
      monetizedComparisonsCount: monComps,
      dualMonetizedComparisonsCount: dualComps,
      monetizationMultiplier: compNeighbors.length > 0 ? Number((monComps / compNeighbors.length).toFixed(2)) : 0,
      superlativeCount: flags.length,
      superlativeFlags: flags
    };
  });

  return {
    totalProducts: software.length,
    totalCategories: categories.length,
    totalComparisons: PUBLISHED_COMPARISONS.length,
    totalRoleGuides: roleGuides.length,
    activeAffiliatesCount: ACTIVE_PARTNERS.length,
    monetizedComparisonsTotal: totalMonetizedComparisons,
    dualMonetizedComparisonsTotal: totalDualMonetizedComparisons,
    nodes
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const graph = buildCommercialGraph();
  const outPath = path.join(process.cwd(), "var/agents/commercial-graph.json");
  fs.writeFileSync(outPath, JSON.stringify(graph, null, 2));
  console.log(`✓ Built Miloosh Commercial Graph: ${graph.totalProducts} products, ${graph.totalComparisons} comparisons, ${graph.totalRoleGuides} role guides, ${graph.activeAffiliatesCount} active partners.`);
  console.log(`✓ Saved full graph data to ${outPath}`);
}
