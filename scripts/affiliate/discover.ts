import { getAllSoftware, getSoftware } from "@/data/software";
import { AFFILIATE_PROGRAMS } from "@/data/revenue/affiliate-programs";

/**
 * Affiliate Revenue Engine, Phase 3 — `npm run affiliate:discover -- <slug>`
 * (or `--unresearched` for a batch). Real HTTP requests to a vendor's own
 * domain — never a guess, never auto-confirms anything. Tries the common
 * paths real B2B SaaS affiliate/partner programs actually live at, reports
 * which returned real content, and greps that content for known network
 * names and commission-related terms so a human (or an agent session) has
 * concrete evidence to read before writing programExists: "yes" into
 * data/revenue/affiliate-programs.ts. This script never writes to that
 * file itself — confirming a program still requires actually reading the
 * fetched page, exactly like the original Sprint 8 research.
 */

const CANDIDATE_PATHS = ["/affiliates", "/affiliate", "/affiliate-program", "/partners", "/partner-program", "/referral", "/referral-program", "/affiliates/", "/affiliate-program/"];

const NETWORK_SIGNATURES = ["partnerstack", "impact.com", "impactradius", "awin", "cj.com", "commission junction", "shareasale", "rewardful", "firstpromoter", "tapfiliate", "post affiliate pro"];

const COMMISSION_SIGNALS = ["commission", "cookie", "affiliate program", "referral program", "% commission", "recurring commission", "payout"];

type PathResult = {
  url: string;
  status: number | "error";
  matchedNetworks: string[];
  matchedCommissionSignals: string[];
  bodySnippet: string | null;
};

async function fetchCandidate(url: string): Promise<PathResult> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; MilooshAffiliateDiscovery/1.0; +https://miloosh.com)" },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return { url, status: res.status, matchedNetworks: [], matchedCommissionSignals: [], bodySnippet: null };
    }
    const body = (await res.text()).toLowerCase();
    const matchedNetworks = NETWORK_SIGNATURES.filter((sig) => body.includes(sig));
    const matchedCommissionSignals = COMMISSION_SIGNALS.filter((sig) => body.includes(sig));
    return {
      url,
      status: res.status,
      matchedNetworks,
      matchedCommissionSignals,
      bodySnippet: matchedCommissionSignals.length > 0 || matchedNetworks.length > 0 ? body.slice(0, 400).replace(/\s+/g, " ") : null,
    };
  } catch (e) {
    return { url, status: "error", matchedNetworks: [], matchedCommissionSignals: [], bodySnippet: e instanceof Error ? e.message.slice(0, 100) : null };
  }
}

async function discoverForSlug(slug: string): Promise<void> {
  const software = getSoftware(slug);
  if (!software) {
    console.log(`Unknown slug: ${slug}`);
    return;
  }
  const existing = AFFILIATE_PROGRAMS.find((p) => p.slug === slug);
  console.log(`\n=== ${software.name} (${slug}) ===`);
  console.log(`website: ${software.website}`);
  if (existing) {
    console.log(`already researched: programExists=${existing.programExists}, lastVerifiedAt=${existing.lastVerifiedAt}`);
  }

  let origin: string;
  try {
    origin = new URL(software.website).origin;
  } catch {
    console.log("  invalid website URL, skipping");
    return;
  }

  const results = await Promise.all(CANDIDATE_PATHS.map((p) => fetchCandidate(`${origin}${p}`)));
  const hits = results.filter((r) => typeof r.status === "number" && r.status < 400);

  if (hits.length === 0) {
    console.log("  no candidate affiliate/partner path returned a real page — check the vendor's own footer/help center manually, or programExists may genuinely be 'no'.");
    return;
  }

  for (const hit of hits) {
    console.log(`  ${hit.status} ${hit.url}`);
    if (hit.matchedNetworks.length > 0) console.log(`    network signals: ${hit.matchedNetworks.join(", ")}`);
    if (hit.matchedCommissionSignals.length > 0) console.log(`    commission signals: ${hit.matchedCommissionSignals.join(", ")}`);
    if (hit.bodySnippet) console.log(`    snippet: ${hit.bodySnippet}`);
  }
  console.log("  (evidence only — read the real page before writing programExists: \"yes\" to data/revenue/affiliate-programs.ts)");
}

async function main() {
  const args = process.argv.slice(2);
  const unresearchedFlag = args.includes("--unresearched");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 20;

  let slugs: string[];
  if (unresearchedFlag) {
    const researched = new Set(AFFILIATE_PROGRAMS.map((p) => p.slug));
    slugs = getAllSoftware()
      .map((s) => s.slug)
      .filter((s) => !researched.has(s))
      .slice(0, limit);
    console.log(`Discovering ${slugs.length} unresearched products (of ${getAllSoftware().length - researched.size} total unresearched, limit=${limit})...`);
  } else {
    slugs = args.filter((a) => !a.startsWith("--"));
    if (slugs.length === 0) {
      console.log("Usage: npm run affiliate:discover -- <slug> [<slug> ...]");
      console.log("   or: npm run affiliate:discover -- --unresearched [--limit=20]");
      process.exit(1);
    }
  }

  for (const slug of slugs) {
    await discoverForSlug(slug);
  }
}

main();
