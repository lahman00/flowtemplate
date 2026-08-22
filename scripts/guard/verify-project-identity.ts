import "../social/_load-env";
import { verifyProjectIdentity, ProjectIdentityError } from "@/lib/project-guard";

/**
 * CLI entry point for the project-identity guard (see lib/project-guard.ts
 * for the full rationale). Run this as the FIRST step of any autonomous
 * mega-mission, destructive script, deployment, production migration,
 * analytics write, or affiliate-state mutation:
 *
 *   npx tsx --env-file=.env.local scripts/guard/verify-project-identity.ts
 *
 * Exits 0 with a confirmation line on success, exits 1 with the exact
 * reason on failure. Never edits, commits, or deploys anything itself.
 */
try {
  const report = verifyProjectIdentity();
  console.log(`Project identity confirmed: ${report.repoSlug} (package.json name "${report.packageName}")${report.siteUrlChecked ? `, NEXT_PUBLIC_SITE_URL -> ${report.siteUrlDomain}` : ", NEXT_PUBLIC_SITE_URL not checked (redacted or unset locally — git remote + package.json name already confirm identity)"}.`);
  process.exit(0);
} catch (error) {
  if (error instanceof ProjectIdentityError) {
    console.error(error.message);
  } else {
    console.error("Project identity guard crashed unexpectedly:", error);
  }
  process.exit(1);
}
