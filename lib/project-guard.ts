import { execSync } from "node:child_process";
import packageJson from "../package.json";

/**
 * Project-identity guard (2026-08-22 decontamination mission). An
 * autonomous session in this same environment previously worked across
 * two unrelated repositories in one continuous conversation (Miloosh and
 * a separate project, Need Go Home) without a hard boundary check between
 * them. A full forensic sweep found zero contamination actually crossed
 * into Miloosh, but the absence of a guard was itself the real gap — nothing
 * stopped a future session from running a Miloosh-destined write, deploy,
 * or affiliate mutation from the wrong working directory.
 *
 * verifyProjectIdentity() proves, from evidence intrinsic to the current
 * working directory, that it actually IS the Miloosh repository before any
 * risky operation proceeds. It never trusts an assumption — every check
 * reads real, current state (git remote, package.json, the site's own
 * constants). Call it (or run the CLI) as the first step of any autonomous
 * mega-mission, destructive script, deployment, production migration,
 * analytics write, or affiliate-state mutation. It fails closed: if
 * identity cannot be proven, it throws rather than proceeding.
 */

export const EXPECTED_REPO_SLUG = "lahman00/miloosh";
export const EXPECTED_PACKAGE_NAME = "miloosh";
export const EXPECTED_DOMAIN = "miloosh.com";

/** Domains/markers that prove the CURRENT working directory is a known OTHER project, not Miloosh — a stronger signal than a merely-missing match. */
const KNOWN_OTHER_PROJECT_MARKERS = [/needgohome/i, /need-go-home/i, /\bngh\b/i];

export class ProjectIdentityError extends Error {
  constructor(message: string) {
    super(`Project identity guard failed: ${message}`);
    this.name = "ProjectIdentityError";
  }
}

export type ProjectIdentityReport = {
  repoSlug: string;
  packageName: string;
  siteUrlChecked: boolean;
  siteUrlDomain: string | null;
};

function getGitRemoteUrl(): string {
  try {
    return execSync("git remote get-url origin", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch (error) {
    throw new ProjectIdentityError(`could not read git remote — is this a git working directory? (${error instanceof Error ? error.message : String(error)})`);
  }
}

/**
 * Throws ProjectIdentityError unless every check that CAN run confirms
 * Miloosh, and no check finds evidence of a different known project.
 * SITE_URL is skipped (not failed) when it resolves to the literal
 * "[SENSITIVE]" string a local `vercel env pull` produces for
 * Sensitive-flagged vars — that is a known, legitimate local-dev state,
 * not evidence of the wrong project. git remote + package.json name are
 * both always resolvable and already sufficient proof on their own.
 */
export function verifyProjectIdentity(): ProjectIdentityReport {
  const remote = getGitRemoteUrl();
  if (KNOWN_OTHER_PROJECT_MARKERS.some((marker) => marker.test(remote))) {
    throw new ProjectIdentityError(`git remote "${remote}" matches a known OTHER project, not Miloosh. Refusing to proceed.`);
  }
  if (!remote.toLowerCase().includes(EXPECTED_REPO_SLUG)) {
    throw new ProjectIdentityError(`git remote is "${remote}", expected it to reference "${EXPECTED_REPO_SLUG}".`);
  }

  const packageName = (packageJson as { name?: string }).name ?? "";
  if (packageName !== EXPECTED_PACKAGE_NAME) {
    throw new ProjectIdentityError(`package.json name is "${packageName}", expected "${EXPECTED_PACKAGE_NAME}".`);
  }

  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  let siteUrlChecked = false;
  let siteUrlDomain: string | null = null;
  if (rawSiteUrl && rawSiteUrl !== "[SENSITIVE]") {
    siteUrlChecked = true;
    if (KNOWN_OTHER_PROJECT_MARKERS.some((marker) => marker.test(rawSiteUrl))) {
      throw new ProjectIdentityError(`NEXT_PUBLIC_SITE_URL "${rawSiteUrl}" matches a known OTHER project, not Miloosh.`);
    }
    try {
      siteUrlDomain = new URL(rawSiteUrl).hostname;
    } catch {
      throw new ProjectIdentityError(`NEXT_PUBLIC_SITE_URL "${rawSiteUrl}" is not a valid URL.`);
    }
    if (siteUrlDomain !== EXPECTED_DOMAIN && siteUrlDomain !== `www.${EXPECTED_DOMAIN}` && siteUrlDomain !== "localhost") {
      throw new ProjectIdentityError(`NEXT_PUBLIC_SITE_URL resolves to "${siteUrlDomain}", expected "${EXPECTED_DOMAIN}" (or localhost in dev).`);
    }
  }

  return { repoSlug: EXPECTED_REPO_SLUG, packageName, siteUrlChecked, siteUrlDomain };
}
