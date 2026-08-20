import { getAllSoftware } from "@/data/software";
import { PUBLISHED_COMPARISONS } from "@/data/comparisons";
import { AFFILIATE_PROGRAMS } from "@/data/revenue/affiliate-programs";
import { ACTIVE_PARTNERS } from "@/data/affiliate/active-partners";
import { KNOWN_GSC_IMPRESSIONS } from "@/lib/growth-audit/comparison-graph";
import fs from "node:fs";
import path from "node:path";

export interface TopMoneyOpportunity {
  rank: number;
  slug: string;
  name: string;
  category: string;
  gscImpressions: number;
  programStatus: "ACTIVE" | "ELIGIBLE_READY_TO_APPLY" | "OWNER_BLOCKED" | "PENDING";
  network: string;
  commission: string;
  publishedComparisons: number;
  moneyScore: number;
  strategicAction: string;
}

export function rankTopMoneyOpportunities(): TopMoneyOpportunity[] {
  const software = getAllSoftware();
  const activeSlugs = new Set(ACTIVE_PARTNERS.map(p => p.slug as string));
  const progMap = new Map(AFFILIATE_PROGRAMS.map(p => [p.slug, p]));

  const compCounts = new Map<string, number>();
  for (const s of software) compCounts.set(s.slug, 0);
  for (const [a, b] of PUBLISHED_COMPARISONS) {
    compCounts.set(a, (compCounts.get(a) ?? 0) + 1);
    compCounts.set(b, (compCounts.get(b) ?? 0) + 1);
  }

  const list: TopMoneyOpportunity[] = [];

  for (const s of software) {
    const gscImp = KNOWN_GSC_IMPRESSIONS[s.slug] ?? 0;
    const comps = compCounts.get(s.slug) ?? 0;
    const isActive = activeSlugs.has(s.slug);
    const prog = progMap.get(s.slug);

    let status: TopMoneyOpportunity["programStatus"] = "ELIGIBLE_READY_TO_APPLY";
    const network = prog?.networkName ?? "Direct";
    const commission = prog?.commissionModel ?? "Standard industry SaaS referral (15-30%)";
    let action = "";

    if (isActive) {
      status = "ACTIVE";
      action = `Active partner (${comps} comparisons live). Maximize organic SERP discovery and ensure balanced alternative coverage.`;
    } else if (prog?.notes?.toLowerCase().includes("owner") || prog?.notes?.toLowerCase().includes("tax")) {
      status = "OWNER_BLOCKED";
      action = `Requires owner action (${prog.notes}). Submit tax/profile documents to unlock offer.`;
    } else if (prog?.programExists === "yes") {
      status = "ELIGIBLE_READY_TO_APPLY";
      action = `Apply to ${network} partner program (${commission}) to monetize ${comps} comparisons and ${gscImp} GSC impressions.`;
    } else {
      status = "ELIGIBLE_READY_TO_APPLY";
      action = `Explore direct vendor partner program to monetize ${comps} comparison routes.`;
    }

    // Money Score = (GSC * 2.0) + (Comps * 1.5) + (Active ? 25 : Eligible ? 15 : 5)
    const score = (gscImp * 2.0) + (comps * 1.5) + (isActive ? 25 : status === "ELIGIBLE_READY_TO_APPLY" ? 15 : 5);

    list.push({
      rank: 0,
      slug: s.slug,
      name: s.name,
      category: s.category,
      gscImpressions: gscImp,
      programStatus: status,
      network,
      commission,
      publishedComparisons: comps,
      moneyScore: Number(score.toFixed(1)),
      strategicAction: action
    });
  }

  list.sort((a, b) => b.moneyScore - a.moneyScore);
  list.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return list.slice(0, 20);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const top20 = rankTopMoneyOpportunities();
  const outPath = path.join(process.cwd(), "var/agents/top-money-opportunities.json");
  fs.writeFileSync(outPath, JSON.stringify(top20, null, 2));
  console.log(`================================================================`);
  console.log(`          TOP 20 REMAINING COMMERCIAL MONEY OPPORTUNITIES        `);
  console.log(`================================================================\n`);
  top20.forEach(op => {
    console.log(`#${String(op.rank).padStart(2)}. [${op.name}] (Score: ${op.moneyScore}) | GSC: ${op.gscImpressions} imp | Comps: ${op.publishedComparisons} | Status: ${op.programStatus}`);
    console.log(`     Network: ${op.network} | Commission: ${op.commission}`);
    console.log(`     Action:  ${op.strategicAction}\n`);
  });
}
