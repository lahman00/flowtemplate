import { getAllSoftware } from "@/data/software";
import { PUBLISHED_COMPARISONS } from "@/data/comparisons";
import { KNOWN_GSC_IMPRESSIONS } from "@/lib/growth-audit/comparison-graph";
import fs from "node:fs";
import path from "node:path";

export interface PortfolioGroup {
  name: string;
  network: string;
  commissionStructure: string;
  productsCovered: string[];
  productNames: string[];
  categoriesCovered: string[];
  totalGscImpressions: number;
  totalComparisonsCovered: number;
  approvalLikelihood: "HIGH" | "MEDIUM" | "LOW";
  ownerFriction: "LOW" | "MEDIUM" | "HIGH";
  strategicPriority: number;
  actionRequired: string;
}

export function analyzePortfolioPrograms(): PortfolioGroup[] {
  const software = getAllSoftware();
  const softwareMap = new Map(software.map(s => [s.slug, s]));

  const compCounts = new Map<string, number>();
  for (const s of software) compCounts.set(s.slug, 0);
  for (const [a, b] of PUBLISHED_COMPARISONS) {
    compCounts.set(a, (compCounts.get(a) ?? 0) + 1);
    compCounts.set(b, (compCounts.get(b) ?? 0) + 1);
  }

  const rawPortfolios = [
    {
      name: "Zoho Partner Program",
      network: "Direct (Zoho)",
      commissionStructure: "15% recurring commission on all Zoho subscriptions for 12 months",
      slugs: ["zoho-crm", "zoho-books", "zoho-projects", "zoho-desk"],
      approvalLikelihood: "HIGH" as const,
      ownerFriction: "LOW" as const,
      actionRequired: "Apply via https://www.zoho.com/affiliate.html with standard Miloosh publishing URL."
    },
    {
      name: "Atlassian Partner Program",
      network: "Direct / Impact",
      commissionStructure: "Standard tier revenue share per new cloud subscription",
      slugs: ["confluence", "trello", "jira", "bitbucket"],
      approvalLikelihood: "MEDIUM" as const,
      ownerFriction: "MEDIUM" as const,
      actionRequired: "Apply through Atlassian Developer/Partner portal; requires business entity verification."
    },
    {
      name: "Freshworks Affiliate Program",
      network: "PartnerStack / Direct",
      commissionStructure: "Up to $5 per lead + 15% recurring commission for 1 year",
      slugs: ["freshdesk", "freshsales", "freshservice", "freshchat"],
      approvalLikelihood: "HIGH" as const,
      ownerFriction: "LOW" as const,
      actionRequired: "Submit application via PartnerStack for Freshworks affiliate program."
    },
    {
      name: "Google Workspace Referral Program",
      network: "Direct (Google)",
      commissionStructure: "Up to $23 per user / $230 per domain on Business Standard tiers",
      slugs: ["google-workspace", "google-chat", "google-meet"],
      approvalLikelihood: "HIGH" as const,
      ownerFriction: "LOW" as const,
      actionRequired: "Enroll in Google Workspace Referral Program with official Miloosh domain."
    },
    {
      name: "Impact.com SaaS Multi-Program Portfolio",
      network: "Impact.com",
      commissionStructure: "20-30% recurring on HubSpot, Semrush, BigCommerce, LastPass, NordPass",
      slugs: ["hubspot", "semrush", "bigcommerce", "lastpass", "nordpass"],
      approvalLikelihood: "MEDIUM" as const,
      ownerFriction: "HIGH" as const,
      actionRequired: "Owner must submit W-8BEN/W-9 tax form in Impact.com dashboard to release pending and new partner offers."
    }
  ];

  const results: PortfolioGroup[] = rawPortfolios.map(p => {
    let totalImp = 0;
    let totalComps = 0;
    const cats = new Set<string>();
    const names: string[] = [];

    for (const slug of p.slugs) {
      const s = softwareMap.get(slug);
      if (s) {
        names.push(s.name);
        cats.add(s.category);
      }
      totalImp += KNOWN_GSC_IMPRESSIONS[slug] ?? 0;
      totalComps += compCounts.get(slug) ?? 0;
    }

    const priority = (p.slugs.length * 15) + (totalImp * 0.5) + (totalComps * 0.8) + (p.approvalLikelihood === "HIGH" ? 20 : 10) - (p.ownerFriction === "HIGH" ? 25 : 0);

    return {
      name: p.name,
      network: p.network,
      commissionStructure: p.commissionStructure,
      productsCovered: p.slugs,
      productNames: names,
      categoriesCovered: Array.from(cats),
      totalGscImpressions: totalImp,
      totalComparisonsCovered: totalComps,
      approvalLikelihood: p.approvalLikelihood,
      ownerFriction: p.ownerFriction,
      strategicPriority: Number(priority.toFixed(1)),
      actionRequired: p.actionRequired
    };
  });

  results.sort((a, b) => b.strategicPriority - a.strategicPriority);
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const portfolios = analyzePortfolioPrograms();
  const outPath = path.join(process.cwd(), "var/agents/portfolio-programs.json");
  fs.writeFileSync(outPath, JSON.stringify(portfolios, null, 2));
  console.log(`================================================================`);
  console.log(`           MILOOSH PORTFOLIO AFFILIATE OPPORTUNITIES             `);
  console.log(`================================================================\n`);
  portfolios.forEach((p, idx) => {
    console.log(`#${idx + 1}. [${p.name}] (Priority Score: ${p.strategicPriority})`);
    console.log(`    Network: ${p.network} | Commission: ${p.commissionStructure}`);
    console.log(`    Products: ${p.productNames.join(", ")} (${p.productsCovered.length} products)`);
    console.log(`    Categories: ${p.categoriesCovered.join(", ")}`);
    console.log(`    Coverage: ${p.totalComparisonsCovered} total comparisons | ${p.totalGscImpressions} GSC impressions`);
    console.log(`    Action: ${p.actionRequired}\n`);
  });
}
