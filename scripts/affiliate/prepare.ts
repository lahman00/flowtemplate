import "./_load-env";
import { buildApplicationPack } from "@/lib/revenue/application-pack";
import { getRankedApplicationCandidates } from "@/lib/revenue/affiliate-priority";

/**
 * Affiliate Revenue Engine, Phase 6 —
 *   npm run affiliate:prepare -- <slug> [<slug> ...]
 *   npm run affiliate:prepare -- --top --limit=10
 * (The directive's literal `affiliate:prepare:top` script name was
 * simplified to a `--top` flag on this single script rather than a
 * separate package.json entry — same behavior, one less script to keep
 * in sync.)
 */
function printPack(slug: string) {
  const pack = buildApplicationPack(slug);
  if (!pack) {
    console.log(`Unknown slug: ${slug}`);
    return;
  }
  console.log(`\n=== Application pack: ${pack.productName} (${pack.slug}) ===`);
  console.log(`Ready to apply: ${pack.readyToApply ? "yes" : "no — program not confirmed"}`);
  console.log(`Business: ${pack.businessName}`);
  console.log(`Website: ${pack.website}`);
  console.log(`Business email: ${pack.businessEmail}`);
  console.log(`LinkedIn: ${pack.linkedinUrl ?? "(missing — see owner action below)"}`);
  console.log(`Publisher classification: ${pack.classification}`);
  console.log(`\nDescription:\n${pack.description}`);
  console.log(`\nPromotion strategy:\n${pack.promotionStrategy}`);
  console.log(`\nApplication URL: ${pack.applicationUrl ?? "(unknown — see owner action below)"}`);
  if (pack.program) {
    console.log(`Network: ${pack.program.networkName ?? "unknown"} | Commission: ${pack.program.commissionModel ?? "unknown"}`);
  }
  if (pack.missingOwnerInputs.length > 0) {
    console.log(`\nOwner action needed:`);
    for (const item of pack.missingOwnerInputs) console.log(`  - ${item}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const topFlag = args.includes("--top");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 10;

  if (topFlag) {
    const slugs = (await getRankedApplicationCandidates()).slice(0, limit).map((c) => c.slug);
    console.log(`Preparing packs for the top ${slugs.length} ranked confirmed programs...`);
    for (const slug of slugs) printPack(slug);
    return;
  }

  const slugs = args.filter((a) => !a.startsWith("--"));
  if (slugs.length === 0) {
    console.log("Usage: npm run affiliate:prepare -- <slug> [<slug> ...]");
    console.log("   or: npm run affiliate:prepare -- --top --limit=10");
    process.exit(1);
  }
  for (const slug of slugs) printPack(slug);
}

main();
