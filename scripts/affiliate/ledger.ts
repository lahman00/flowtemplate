import { CANONICAL_AFFILIATE_LEDGER, type AffiliateProgramRelationship, type CanonicalLedgerStatus } from "@/data/affiliate/canonical-ledger";
import { getAllSoftware } from "@/data/software";
import fs from "node:fs";
import path from "node:path";

export interface LedgerSummaryReport {
  timestamp: string;
  totalProgramRelationships: number;
  totalCatalogProducts: number;
  catalogProductsWithProgramRelationship: number;
  statusCounts: Record<CanonicalLedgerStatus, number>;
  activeProgramsCount: number;
  activeCatalogProductsCovered: number;
  pendingProgramsCount: number;
  pendingCatalogProductsCovered: number;
  readyProgramsCount: number;
  readyCatalogProductsCovered: number;
  rejectedProgramsCount: number;
  rejectedCatalogProductsCovered: number;
  formBlockedProgramsCount: number;
  formBlockedCatalogProductsCovered: number;
  ownerBlockedProgramsCount: number;
  ownerBlockedCatalogProductsCovered: number;
  holdProgramsCount: number;
  holdCatalogProductsCovered: number;
  noProgramCatalogProductsCount: number;
  unverifiedCatalogProductsCount: number;
  programsList: {
    active: AffiliateProgramRelationship[];
    pending: AffiliateProgramRelationship[];
    ready: AffiliateProgramRelationship[];
    rejected: AffiliateProgramRelationship[];
    formBlocked: AffiliateProgramRelationship[];
    ownerBlocked: AffiliateProgramRelationship[];
    hold: AffiliateProgramRelationship[];
  };
  noProgramSlugs: string[];
  unverifiedSlugs: string[];
}

export function computeLedgerSummary(): LedgerSummaryReport {
  const software = getAllSoftware();
  const catalogSlugs = new Set(software.map(s => s.slug));
  const ledger = CANONICAL_AFFILIATE_LEDGER;

  const statusCounts: Record<CanonicalLedgerStatus, number> = {
    ACTIVE: 0,
    APPROVED_NEEDS_LINK: 0,
    APPROVED_NEEDS_EDITORIAL_CONTENT: 0,
    PENDING_REVIEW: 0,
    READY_AND_VERIFIED: 0,
    BLOCKED_FORM_DEFECT: 0,
    OWNER_ACTION_REQUIRED: 0,
    REJECTED: 0,
    HOLD: 0,
    NO_REAL_PROGRAM_FOUND: 0,
    PROGRAM_NOT_VERIFIED: 0,
    PROGRAM_ENDED: 0,
    NOT_ELIGIBLE: 0
  };

  const coveredCatalogSlugs = new Set<string>();
  const activeSlugs = new Set<string>();
  const pendingSlugs = new Set<string>();
  const readySlugs = new Set<string>();
  const rejectedSlugs = new Set<string>();
  const formBlockedSlugs = new Set<string>();
  const ownerBlockedSlugs = new Set<string>();
  const holdSlugs = new Set<string>();

  for (const prog of ledger) {
    statusCounts[prog.status]++;

    for (const slug of prog.productSlugs) {
      if (catalogSlugs.has(slug)) {
        coveredCatalogSlugs.add(slug);

        if (prog.status === "ACTIVE") activeSlugs.add(slug);
        else if (prog.status === "PENDING_REVIEW") pendingSlugs.add(slug);
        else if (prog.status === "READY_AND_VERIFIED") readySlugs.add(slug);
        else if (prog.status === "REJECTED") rejectedSlugs.add(slug);
        else if (prog.status === "BLOCKED_FORM_DEFECT") formBlockedSlugs.add(slug);
        else if (prog.status === "OWNER_ACTION_REQUIRED") ownerBlockedSlugs.add(slug);
        else if (prog.status === "HOLD") holdSlugs.add(slug);
      }
    }
  }

  // Known verified no-program / FOSS / 404 endpoints
  const noProgramSlugsList = [
    "harvest", "time-doctor", "basecamp", "slite", "mattermost",
    "git", "postgresql", "mysql", "redis", "nginx", "docker", "kubernetes", "linux",
    "open-webui", "ollama", "vllm", "tgi", "lm-studio"
  ].filter(s => catalogSlugs.has(s));

  const noProgramSlugs = new Set(noProgramSlugsList);
  for (const s of noProgramSlugs) {
    coveredCatalogSlugs.add(s);
  }

  const unverifiedSlugs: string[] = [];
  for (const s of software) {
    if (!coveredCatalogSlugs.has(s.slug)) {
      unverifiedSlugs.push(s.slug);
    }
  }

  return {
    timestamp: new Date().toISOString(),
    totalProgramRelationships: ledger.length,
    totalCatalogProducts: software.length,
    catalogProductsWithProgramRelationship: coveredCatalogSlugs.size - noProgramSlugs.size,
    statusCounts,
    activeProgramsCount: statusCounts.ACTIVE,
    activeCatalogProductsCovered: activeSlugs.size,
    pendingProgramsCount: statusCounts.PENDING_REVIEW,
    pendingCatalogProductsCovered: pendingSlugs.size,
    readyProgramsCount: statusCounts.READY_AND_VERIFIED,
    readyCatalogProductsCovered: readySlugs.size,
    rejectedProgramsCount: statusCounts.REJECTED,
    rejectedCatalogProductsCovered: rejectedSlugs.size,
    formBlockedProgramsCount: statusCounts.BLOCKED_FORM_DEFECT,
    formBlockedCatalogProductsCovered: formBlockedSlugs.size,
    ownerBlockedProgramsCount: statusCounts.OWNER_ACTION_REQUIRED,
    ownerBlockedCatalogProductsCovered: ownerBlockedSlugs.size,
    holdProgramsCount: statusCounts.HOLD,
    holdCatalogProductsCovered: holdSlugs.size,
    noProgramCatalogProductsCount: noProgramSlugs.size,
    unverifiedCatalogProductsCount: unverifiedSlugs.length,
    programsList: {
      active: ledger.filter(p => p.status === "ACTIVE"),
      pending: ledger.filter(p => p.status === "PENDING_REVIEW"),
      ready: ledger.filter(p => p.status === "READY_AND_VERIFIED"),
      rejected: ledger.filter(p => p.status === "REJECTED"),
      formBlocked: ledger.filter(p => p.status === "BLOCKED_FORM_DEFECT"),
      ownerBlocked: ledger.filter(p => p.status === "OWNER_ACTION_REQUIRED"),
      hold: ledger.filter(p => p.status === "HOLD")
    },
    noProgramSlugs: noProgramSlugsList,
    unverifiedSlugs
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const summary = computeLedgerSummary();
  const outPath = path.join(process.cwd(), "var/agents/canonical-affiliate-ledger-summary.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));

  console.log(`================================================================`);
  console.log(`         MILOOSH CANONICAL AFFILIATE LEDGER SUMMARY             `);
  console.log(`================================================================\n`);
  console.log(`PROGRAM RELATIONSHIPS TOTAL:               ${summary.totalProgramRelationships}`);
  console.log(`CATALOG PRODUCTS TOTAL:                    ${summary.totalCatalogProducts}`);
  console.log(`PRODUCTS WITH SOME AFFILIATE RELATIONSHIP: ${summary.catalogProductsWithProgramRelationship}\n`);
  console.log(`PROGRAM BREAKDOWN BY STATUS (PROGRAMS vs PRODUCTS):`);
  console.log(` - ACTIVE PROGRAMS:           ${summary.activeProgramsCount} (covers ${summary.activeCatalogProductsCovered} catalog products)`);
  console.log(` - PENDING PROGRAMS:          ${summary.pendingProgramsCount} (covers ${summary.pendingCatalogProductsCovered} catalog products)`);
  console.log(` - READY PROGRAMS:            ${summary.readyProgramsCount} (covers ${summary.readyCatalogProductsCovered} catalog products)`);
  console.log(` - REJECTED PROGRAMS:         ${summary.rejectedProgramsCount} (covers ${summary.rejectedCatalogProductsCovered} catalog products)`);
  console.log(` - FORM-BLOCKED PROGRAMS:     ${summary.formBlockedProgramsCount} (covers ${summary.formBlockedCatalogProductsCovered} catalog products)`);
  console.log(` - OWNER-BLOCKED PROGRAMS:    ${summary.ownerBlockedProgramsCount} (covers ${summary.ownerBlockedCatalogProductsCovered} catalog products)`);
  console.log(` - HOLD PROGRAMS:             ${summary.holdProgramsCount} (covers ${summary.holdCatalogProductsCovered} catalog products)`);
  console.log(` - NO-PROGRAM PRODUCTS:       ${summary.noProgramCatalogProductsCount} catalog products`);
  console.log(` - UNVERIFIED PRODUCTS:       ${summary.unverifiedCatalogProductsCount} catalog products\n`);
  console.log(`================================================================`);
}
