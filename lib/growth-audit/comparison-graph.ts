import { getAllSoftware, type Software } from "@/data/software";
import { PUBLISHED_COMPARISONS } from "@/data/comparisons";
import { ACTIVE_PARTNER_SLUGS } from "@/data/affiliate/active-partners";
import { AFFILIATE_PROGRAMS } from "@/data/revenue/affiliate-programs";
import type { GraphNodeDegree, MissingComparisonCandidate } from "./types";

export const KNOWN_GSC_IMPRESSIONS: Record<string, number> = {
  "clickup": 65, "confluence": 62, "ecwid": 47, "pipedrive": 24, "help-scout": 23,
  "coda": 20, "ringcentral": 19, "sprout-social": 17, "mulesoft": 14, "lastpass": 8,
  "adobe-analytics": 7, "segment": 7, "postmark": 6, "shortcut": 3, "gitlab": 2,
  "postman": 2, "docker": 1, "vercel": 1
};

export function computeGraphNodeDegrees(software: Software[] = getAllSoftware()): GraphNodeDegree[] {
  const degreeMap = new Map<string, number>();
  for (const s of software) degreeMap.set(s.slug, 0);

  for (const [a, b] of PUBLISHED_COMPARISONS) {
    if (degreeMap.has(a)) degreeMap.set(a, (degreeMap.get(a) ?? 0) + 1);
    if (degreeMap.has(b)) degreeMap.set(b, (degreeMap.get(b) ?? 0) + 1);
  }

  const activeSet = new Set<string>(ACTIVE_PARTNER_SLUGS);
  const progMap = new Map(AFFILIATE_PROGRAMS.map((p) => [p.slug, p.programExists]));

  return software.map((s) => ({
    slug: s.slug,
    name: s.name,
    category: s.category,
    degree: degreeMap.get(s.slug) ?? 0,
    isActiveAffiliate: activeSet.has(s.slug),
    affiliateProgramStatus: (progMap.get(s.slug) ?? "unresearched") as "yes" | "no" | "unknown" | "unresearched",
  })).sort((a, b) => b.degree - a.degree || a.name.localeCompare(b.name));
}

export function findMissingComparisonOpportunities(
  software: Software[] = getAllSoftware(),
  gscImpressions: Record<string, number> = KNOWN_GSC_IMPRESSIONS
): MissingComparisonCandidate[] {
  const publishedPairs = new Set<string>();
  for (const [a, b] of PUBLISHED_COMPARISONS) {
    publishedPairs.add(`${a}:${b}`);
    publishedPairs.add(`${b}:${a}`);
  }

  const degrees = computeGraphNodeDegrees(software);
  const degreeBySlug = new Map(degrees.map((d) => [d.slug, d.degree]));
  const activeSet = new Set<string>(ACTIVE_PARTNER_SLUGS);
  const progMap = new Map(AFFILIATE_PROGRAMS.map((p) => [p.slug, p.programExists]));

  const relatedCrossCategories = [
    ["project-management", "productivity"],
    ["project-management", "crm"],
    ["crm", "marketing"],
    ["communication", "customer-support"],
    ["customer-support", "crm"],
    ["analytics", "marketing"],
    ["ai", "productivity"],
    ["ai", "marketing"],
    ["automation", "developer-tools"],
    ["accounting", "field-service-management"],
    ["property-management", "accounting"],
    ["field-service-management", "crm"]
  ];

  const candidates: MissingComparisonCandidate[] = [];

  for (let i = 0; i < software.length; i++) {
    for (let j = i + 1; j < software.length; j++) {
      const s1 = software[i]!;
      const s2 = software[j]!;
      if (publishedPairs.has(`${s1.slug}:${s2.slug}`)) continue;

      const sameCat = s1.category === s2.category;
      let crossCatRelevant = false;
      if (!sameCat) {
        crossCatRelevant = relatedCrossCategories.some(([c1, c2]) =>
          (s1.category === c1 && s2.category === c2) || (s1.category === c2 && s2.category === c1)
        );
      }

      if (!sameCat && !crossCatRelevant) continue;

      const s1Active = activeSet.has(s1.slug);
      const s2Active = activeSet.has(s2.slug);
      const s1Prog = progMap.get(s1.slug) === "yes";
      const s2Prog = progMap.get(s2.slug) === "yes";

      const imp1 = gscImpressions[s1.slug] ?? 0;
      const imp2 = gscImpressions[s2.slug] ?? 0;
      const maxImp = Math.max(imp1, imp2);

      let demandScore = 2;
      if (maxImp >= 500) demandScore = 30;
      else if (maxImp >= 200) demandScore = 25;
      else if (maxImp >= 100) demandScore = 20;
      else if (maxImp >= 50) demandScore = 15;
      else if (maxImp > 0) demandScore = 10;

      let affiliateScore = 2;
      if (s1Active && s2Active) affiliateScore = 30;
      else if ((s1Active && imp2 >= 100) || (s2Active && imp1 >= 100)) affiliateScore = 28;
      else if (s1Active || s2Active) affiliateScore = 22;
      else if (s1Prog && s2Prog) affiliateScore = 18;
      else if (s1Prog || s2Prog) affiliateScore = 12;

      const categoryScore = sameCat ? 20 : 10;

      const minDeg = Math.min(degreeBySlug.get(s1.slug) ?? 0, degreeBySlug.get(s2.slug) ?? 0);
      let isolationScore = 4;
      if (minDeg === 0) isolationScore = 20;
      else if (minDeg === 1) isolationScore = 16;
      else if (minDeg <= 3) isolationScore = 12;
      else if (minDeg <= 6) isolationScore = 8;

      const totalScore = demandScore + affiliateScore + categoryScore + isolationScore;

      let reason = "Topological coverage";
      if (minDeg === 0) reason = "Connects isolated 0-degree product";
      else if ((s1Active && imp2 >= 100) || (s2Active && imp1 >= 100)) reason = "Direct money bridge from high-GSC traffic to active affiliate";
      else if (s1Active && s2Active) reason = "Dual-monetized comparison pair";
      else if (s1Active || s2Active) reason = "Single-monetized active partner expansion";
      else if (sameCat && (s1Prog || s2Prog)) reason = "Intra-category commercial comparison";

      candidates.push({
        pair: `${s1.slug}-vs-${s2.slug}`,
        slugA: s1.slug,
        slugB: s2.slug,
        nameA: s1.name,
        nameB: s2.name,
        categoryA: s1.category,
        categoryB: s2.category,
        sameCategory: sameCat,
        score: totalScore,
        demandScore,
        affiliateScore,
        categoryScore,
        isolationScore,
        minDegree: minDeg,
        isDualMonetized: s1Active && s2Active,
        isSingleMonetized: s1Active || s2Active,
        gscImpressionsA: imp1,
        gscImpressionsB: imp2,
        reason,
      });
    }
  }

  return candidates.sort((a, b) => b.score - a.score || a.minDegree - b.minDegree || a.pair.localeCompare(b.pair));
}
