import fs from "node:fs";
import path from "node:path";
import { getAllSoftware } from "@/data/software";
import { getAffiliateProgram } from "@/data/revenue/affiliate-programs";
import { getRevenueScores } from "@/lib/revenue/scoring";
import { getRevenueTier } from "@/lib/revenue/tiers";

/**
 * Sprint 9 Task 5 — lets an approved affiliate URL go live with a config
 * change, not a code change. Two supply mechanisms, checked in order:
 *
 * 1. Env vars `NEXT_PUBLIC_AFFILIATE_URL_<SLUG>` / `NEXT_PUBLIC_AFFILIATE_ID_<SLUG>`
 *    — the primary mechanism, works on any host that lets you set env vars.
 * 2. `config/affiliate-credentials.json` (gitignored, never committed) — a
 *    local fallback for self-hosted setups that prefer a mounted config
 *    file over env vars. See config/affiliate-credentials.example.json.
 *
 * Either way, a value is only ever honored for a software entry whose
 * Phase 1 research (data/revenue/affiliate-programs.ts) confirms
 * `programExists: "yes"` — Sprint 9's rule is "use only confirmed official
 * affiliate programs," enforced here in code, not just in docs. Setting an
 * env var for a product with no confirmed program is silently ignored.
 */

export type AffiliateActivationSource = "env" | "config-file" | "none";

export type AffiliateActivation = {
  slug: string;
  affiliateId: string | null;
  affiliateUrl: string | null;
  isActive: boolean;
  source: AffiliateActivationSource;
};

type CredentialsFile = Record<string, { affiliateId?: string; affiliateUrl?: string }>;

const CONFIG_FILE_PATH = path.join(process.cwd(), "config", "affiliate-credentials.json");

function envVarName(slug: string, field: "ID" | "URL"): string {
  return `NEXT_PUBLIC_AFFILIATE_${field}_${slug.toUpperCase().replace(/-/g, "_")}`;
}

let cachedCredentialsFile: CredentialsFile | null = null;

function loadCredentialsFile(): CredentialsFile {
  if (cachedCredentialsFile) {
    return cachedCredentialsFile;
  }

  try {
    const contents = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
    cachedCredentialsFile = JSON.parse(contents) as CredentialsFile;
  } catch {
    // No local config file — that's the default, expected state. Env vars
    // remain available as the primary activation mechanism.
    cachedCredentialsFile = {};
  }

  return cachedCredentialsFile;
}

function hasConfirmedProgram(slug: string): boolean {
  return getAffiliateProgram(slug)?.programExists === "yes";
}

/** Resolves activation for one software slug. Always safe to call — returns an inactive result for anything without a confirmed program, even if a value happens to be set. */
export function getAffiliateActivation(slug: string): AffiliateActivation {
  if (!hasConfirmedProgram(slug)) {
    return { slug, affiliateId: null, affiliateUrl: null, isActive: false, source: "none" };
  }

  const envId = process.env[envVarName(slug, "ID")]?.trim() || null;
  const envUrl = process.env[envVarName(slug, "URL")]?.trim() || null;

  if (envUrl) {
    return { slug, affiliateId: envId, affiliateUrl: envUrl, isActive: true, source: "env" };
  }

  const fileEntry = loadCredentialsFile()[slug];
  const fileUrl = fileEntry?.affiliateUrl?.trim() || null;
  const fileId = fileEntry?.affiliateId?.trim() || null;

  if (fileUrl) {
    return { slug, affiliateId: fileId, affiliateUrl: fileUrl, isActive: true, source: "config-file" };
  }

  return { slug, affiliateId: envId ?? fileId, affiliateUrl: null, isActive: false, source: "none" };
}

/** Tier A is computed from the live scoring model, not hardcoded, so this can't drift if the dataset changes. */
export function getTierASlugs(): string[] {
  return getRevenueScores(getAllSoftware())
    .filter((score) => getRevenueTier(score.totalScore) === "A")
    .map((score) => score.slug);
}

export function getTierAActivationStatus(): AffiliateActivation[] {
  return getTierASlugs().map(getAffiliateActivation);
}
