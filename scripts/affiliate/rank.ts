import "./_load-env";
import { getRankedApplicationCandidates, getAllPriorities } from "@/lib/revenue/affiliate-priority";

/**
 * Affiliate Revenue Engine, Phase 5 — `npm run affiliate:rank`.
 * Prints every confirmed ("yes") program ranked by the priority score in
 * lib/revenue/affiliate-priority.ts, with every component score shown so
 * the ranking is auditable, not a black box. Pass --all to also see
 * unresolved/no-program products (useful for spotting research gaps).
 */
async function main() {
  const showAll = process.argv.includes("--all");
  const rows = showAll ? await getAllPriorities() : await getRankedApplicationCandidates();

  console.log(
    showAll
      ? `All ${rows.length} products, ranked by affiliate priority score:`
      : `${rows.length} products with a confirmed affiliate program, ranked by priority score:`
  );
  console.log("");

  rows.forEach((r, i) => {
    console.log(`${String(i + 1).padStart(3)}. ${r.name} (${r.slug}) — score ${r.totalScore}/100`);
    console.log(
      `     program=${r.programExists} pipeline=${r.pipelineStatus} | availability=${r.affiliateAvailabilityScore}/10 category=${r.categoryValueScore}/10 commercialIntent=${r.commercialIntentScore}/10 buyingIntent=${r.buyingIntentScore}/10`
    );
    console.log(
      `     traffic=${r.trafficOpportunityScore}/10 (${r.trafficDataSource}) approvalFriction=${r.approvalFrictionScore}/10 recurringBonus=+${r.recurringBonus}`
    );
  });

  console.log("");
  console.log("Score model: weighted sum of real component signals (never multiplied — see lib/revenue/affiliate-priority.ts header for why). No dollar amount is predicted.");
}

main();
