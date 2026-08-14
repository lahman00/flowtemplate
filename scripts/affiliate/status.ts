import { setPipelineStatus, getPipelineEntry, type AffiliatePipelineStatus } from "@/lib/revenue/affiliate-pipeline";
import { getSoftware } from "@/data/software";

/**
 * Affiliate Revenue Engine, Phase 14 — status management CLI.
 *   npm run affiliate:status -- <slug> <status> [--note="..."] [--affiliateUrl=...] [--trackingId=...] [--ownerActionRequired="..."]
 *   npm run affiliate:status -- <slug>              (prints current status + history)
 */
const VALID_STATUSES = [
  "unresearched", "program_found", "verified", "ready_to_apply", "application_in_progress",
  "submitted", "pending_review", "approved", "rejected", "affiliate_link_received", "activated",
  "earning", "no_program", "program_closed", "needs_owner_action", "needs_more_research",
];

function parseFlag(args: string[], name: string): string | undefined {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : undefined;
}

function main() {
  const args = process.argv.slice(2);
  const positional = args.filter((a) => !a.startsWith("--"));
  const [slug, status] = positional;

  if (!slug) {
    console.log("Usage: npm run affiliate:status -- <slug> [<status>] [--note=\"...\"] [--affiliateUrl=...] [--trackingId=...] [--ownerActionRequired=\"...\"]");
    console.log(`Valid statuses: ${VALID_STATUSES.join(", ")}`);
    process.exit(1);
  }

  if (!getSoftware(slug)) {
    console.log(`Unknown slug: ${slug}`);
    process.exit(1);
  }

  if (!status) {
    const entry = getPipelineEntry(slug);
    if (!entry) {
      console.log(`${slug}: unresearched (no pipeline entry yet)`);
      return;
    }
    console.log(`${slug}: ${entry.status}`);
    if (entry.notes) console.log(`  notes: ${entry.notes}`);
    if (entry.affiliateUrl) console.log(`  affiliateUrl: ${entry.affiliateUrl}`);
    console.log(`  history:`);
    for (const h of entry.history) console.log(`    ${h.at}  ${h.status}${h.note ? `  (${h.note})` : ""}`);
    return;
  }

  if (!VALID_STATUSES.includes(status)) {
    console.log(`Invalid status "${status}". Valid: ${VALID_STATUSES.join(", ")}`);
    process.exit(1);
  }

  try {
    const updated = setPipelineStatus(slug, status as AffiliatePipelineStatus, {
      note: parseFlag(args, "note"),
      affiliateUrl: parseFlag(args, "affiliateUrl"),
      trackingId: parseFlag(args, "trackingId"),
      ownerActionRequired: parseFlag(args, "ownerActionRequired"),
    });
    console.log(`${slug} -> ${updated.status}`);
  } catch (e) {
    console.log(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

main();
