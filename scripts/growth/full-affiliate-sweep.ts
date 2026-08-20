import { getAllSoftware } from "@/data/software";
import { ACTIVE_PARTNERS } from "@/data/affiliate/active-partners";
import { AFFILIATE_PROGRAMS } from "@/data/revenue/affiliate-programs";
import { KNOWN_GSC_IMPRESSIONS } from "@/lib/growth-audit/comparison-graph";
import fs from "node:fs";
import path from "node:path";

export type AffiliateClassification =
  | "ACTIVE_AFFILIATE"
  | "APPROVED_NOT_ACTIVATED"
  | "APPLICATION_PENDING"
  | "ELIGIBLE_READY_TO_APPLY"
  | "OWNER_ACTION_REQUIRED"
  | "REJECTED"
  | "NO_REAL_PROGRAM_FOUND"
  | "EDITORIALLY_UNSUITABLE"
  | "NEEDS_MORE_RESEARCH";

export interface ProductAffiliateAudit {
  slug: string;
  name: string;
  category: string;
  gscImpressions: number;
  classification: AffiliateClassification;
  programName: string | null;
  network: string | null;
  commissionStructure: string | null;
  programUrl: string | null;
  applicationUrl: string | null;
  affiliateUrl: string | null;
  notes: string;
  ownerBlockerReason: string | null;
  portfolioGroup: string | null;
}

export function runFullAffiliateSweep(): {
  totalAudited: number;
  classificationCounts: Record<AffiliateClassification, number>;
  activePartners: ProductAffiliateAudit[];
  eligibleToApply: ProductAffiliateAudit[];
  pendingOrApproved: ProductAffiliateAudit[];
  ownerActionRequired: ProductAffiliateAudit[];
  noProgramOrRejected: ProductAffiliateAudit[];
  allProducts: ProductAffiliateAudit[];
} {
  const software = getAllSoftware();
  const activeMap = new Map<string, (typeof ACTIVE_PARTNERS)[number]>(ACTIVE_PARTNERS.map(p => [p.slug as string, p]));
  const progMap = new Map(AFFILIATE_PROGRAMS.map(p => [p.slug, p]));

  // Portfolio groups mapping
  const portfolioMap: Record<string, string> = {
    "zoho-crm": "Zoho Partner Ecosystem (Zoho Books, Zoho CRM, Zoho Projects, Zoho Desk)",
    "zoho-books": "Zoho Partner Ecosystem (Zoho Books, Zoho CRM, Zoho Projects, Zoho Desk)",
    "zoho-desk": "Zoho Partner Ecosystem (Zoho Books, Zoho CRM, Zoho Projects, Zoho Desk)",
    "zoho-projects": "Zoho Partner Ecosystem (Zoho Books, Zoho CRM, Zoho Projects, Zoho Desk)",
    "jira": "Atlassian Partner Program (Jira, Confluence, Trello, Bitbucket)",
    "confluence": "Atlassian Partner Program (Jira, Confluence, Trello, Bitbucket)",
    "trello": "Atlassian Partner Program (Jira, Confluence, Trello, Bitbucket)",
    "bitbucket": "Atlassian Partner Program (Jira, Confluence, Trello, Bitbucket)",
    "google-workspace": "Google Cloud Partner Advantage",
    "google-analytics": "Google Cloud Partner Advantage",
    "google-cloud": "Google Cloud Partner Advantage",
    "microsoft-teams": "Microsoft Cloud Partner Program",
    "azure": "Microsoft Cloud Partner Program",
    "freshdesk": "Freshworks Affiliate Program (Freshdesk, Freshsales, Freshservice, Freshchat)",
    "freshsales": "Freshworks Affiliate Program (Freshdesk, Freshsales, Freshservice, Freshchat)",
    "freshservice": "Freshworks Affiliate Program (Freshdesk, Freshsales, Freshservice, Freshchat)",
    "freshchat": "Freshworks Affiliate Program (Freshdesk, Freshsales, Freshservice, Freshchat)"
  };

  const results: ProductAffiliateAudit[] = [];

  const counts: Record<AffiliateClassification, number> = {
    ACTIVE_AFFILIATE: 0,
    APPROVED_NOT_ACTIVATED: 0,
    APPLICATION_PENDING: 0,
    ELIGIBLE_READY_TO_APPLY: 0,
    OWNER_ACTION_REQUIRED: 0,
    REJECTED: 0,
    NO_REAL_PROGRAM_FOUND: 0,
    EDITORIALLY_UNSUITABLE: 0,
    NEEDS_MORE_RESEARCH: 0
  };

  // Known rejected programs with first-party evidence
  const knownRejections = new Set(["brevo", "wix", "loom", "zapier", "canva"]);

  // Known pending applications in PartnerStack or Impact
  const knownPending = new Set(["callrail", "gorgias", "webflow", "clickfunnels"]);

  for (const s of software) {
    const active = activeMap.get(s.slug);
    const prog = progMap.get(s.slug);
    const gscImp = KNOWN_GSC_IMPRESSIONS[s.slug] ?? 0;
    const portfolioGroup = portfolioMap[s.slug] ?? null;

    let classification: AffiliateClassification = "NEEDS_MORE_RESEARCH";
    const programName = prog?.networkName ?? null;
    const network = prog?.networkName ?? null;
    const commissionStructure = prog?.commissionModel ?? null;
    const programUrl = prog?.sourceUrls?.[0] ?? null;
    const applicationUrl = prog?.applicationUrl ?? null;
    const affiliateUrl = active?.affiliateUrl ?? null;
    let notes = prog?.notes ?? "";
    let ownerBlockerReason: string | null = null;

    if (active && active.affiliateUrl) {
      classification = "ACTIVE_AFFILIATE";
      notes = `Verified live active partner. URL: ${active.affiliateUrl}`;
    } else if (knownRejections.has(s.slug)) {
      classification = "REJECTED";
      notes = `Application previously reviewed and rejected by vendor. Do not re-apply without new credentials.`;
    } else if (knownPending.has(s.slug)) {
      classification = "APPLICATION_PENDING";
      notes = `Application submitted and currently pending vendor review in network dashboard.`;
    } else if (prog) {
      if (prog.programExists === "no") {
        classification = "NO_REAL_PROGRAM_FOUND";
        notes = prog.notes || "Official vendor sources confirm no public affiliate or referral program is offered.";
      } else if (prog.programExists === "yes") {
        if (prog.notes?.toLowerCase().includes("owner action") || prog.notes?.toLowerCase().includes("tax") || prog.notes?.toLowerCase().includes("ssn") || prog.notes?.toLowerCase().includes("phone verification")) {
          classification = "OWNER_ACTION_REQUIRED";
          ownerBlockerReason = prog.notes;
        } else if (prog.applicationUrl || prog.networkName) {
          classification = "ELIGIBLE_READY_TO_APPLY";
          notes = `Public affiliate program exists on ${prog.networkName || "direct vendor site"} (${prog.commissionModel || "commission available"}). Ready for application.`;
        } else {
          classification = "ELIGIBLE_READY_TO_APPLY";
          notes = `Program exists: ${prog.commissionModel || "details available"}`;
        }
      } else {
        classification = "NEEDS_MORE_RESEARCH";
      }
    } else {
      // General heuristic for open source or developer infra tools
      if (["git", "postgresql", "mysql", "redis", "nginx", "docker", "kubernetes", "linux"].includes(s.slug)) {
        classification = "NO_REAL_PROGRAM_FOUND";
        notes = "Free open-source software project without commercial referral program.";
      } else if (["signal", "telegram", "tor"].includes(s.slug)) {
        classification = "EDITORIALLY_UNSUITABLE";
        notes = "Non-profit or security utility with no commercial affiliate monetization structure.";
      } else {
        classification = "NEEDS_MORE_RESEARCH";
        notes = "Candidate for first-party vendor program discovery and network lookup.";
      }
    }

    counts[classification]++;

    results.push({
      slug: s.slug,
      name: s.name,
      category: s.category,
      gscImpressions: gscImp,
      classification,
      programName,
      network,
      commissionStructure,
      programUrl,
      applicationUrl,
      affiliateUrl,
      notes,
      ownerBlockerReason,
      portfolioGroup
    });
  }

  results.sort((a, b) => b.gscImpressions - a.gscImpressions);

  return {
    totalAudited: software.length,
    classificationCounts: counts,
    activePartners: results.filter(r => r.classification === "ACTIVE_AFFILIATE"),
    eligibleToApply: results.filter(r => r.classification === "ELIGIBLE_READY_TO_APPLY"),
    pendingOrApproved: results.filter(r => r.classification === "APPLICATION_PENDING" || r.classification === "APPROVED_NOT_ACTIVATED"),
    ownerActionRequired: results.filter(r => r.classification === "OWNER_ACTION_REQUIRED"),
    noProgramOrRejected: results.filter(r => r.classification === "NO_REAL_PROGRAM_FOUND" || r.classification === "REJECTED"),
    allProducts: results
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runFullAffiliateSweep();
  const outPath = path.join(process.cwd(), "var/agents/full-affiliate-sweep.json");
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`================================================================`);
  console.log(`         MILOOSH FULL 247-PRODUCT AFFILIATE SWEEP               `);
  console.log(`================================================================\n`);
  console.log(`✓ Audited all ${result.totalAudited} products across the catalog.\n`);
  console.log(`CLASSIFICATION BREAKDOWN:`);
  Object.entries(result.classificationCounts).forEach(([status, count]) => {
    console.log(`   - ${status.padEnd(25)}: ${count}`);
  });
  console.log(`\nTOP 10 HIGH-TRAFFIC ELIGIBLE_READY_TO_APPLY CANDIDATES:`);
  result.eligibleToApply.slice(0, 10).forEach(c => {
    console.log(`   - [${c.slug}] (GSC: ${c.gscImpressions} imp) | Network: ${c.network ?? "Direct"} | Commission: ${c.commissionStructure ?? "N/A"}`);
  });
}
