import "./_load-env";
import { readQueue, writeQueue, applyQueueTransition } from "@/lib/social/queue";
import { runQaGates, qaPassed } from "@/lib/social/qa-gates";

/**
 * Runs Phase 11 QA gates on every DRAFTED entry. Passing entries move to
 * QA_READY then APPROVED_FOR_AUTO in-memory; failing entries stay
 * DRAFTED with notes. Reads the queue ONCE and writes it ONCE at the
 * end — an earlier version called setQueueState() per entry, which is
 * one Blob read + one Blob write per transition; at a couple thousand
 * entries that's several thousand sequential network round trips and
 * took long enough to time out a 120s shell command. Same structural
 * fix as the affiliate pipeline's earlier N+1-read incident this
 * session: batch the I/O, keep the mutation logic pure in-memory.
 *
 * Usage: npx tsx --env-file=.env.local scripts/social/qa.ts
 */
async function main() {
  const queue = await readQueue();
  let passedCount = 0;
  let failedCount = 0;

  const updated = queue.map((entry) => {
    if (entry.state !== "DRAFTED") return entry;

    const findings = runQaGates(entry, queue);
    const passed = qaPassed(findings);
    const notes = findings.map((f) => `[${f.severity}]${f.channel ? ` (${f.channel})` : ""} ${f.message}`);

    if (passed) {
      passedCount += 1;
      const readyEntry = applyQueueTransition(entry, "QA_READY", notes.length ? notes.join(" | ") : "All QA gates passed.");
      return applyQueueTransition(readyEntry, "APPROVED_FOR_AUTO", "Auto-approved: sourced from real Miloosh data, no QA errors.");
    }

    failedCount += 1;
    if (failedCount <= 20) {
      console.log(`FAILED [${entry.pillar}] ${entry.topic}:`);
      for (const note of notes) console.log(`  ${note}`);
    }
    return { ...entry, qaNotes: notes };
  });

  await writeQueue(updated);

  console.log(`\nQA complete: ${passedCount} approved, ${failedCount} failed (left in DRAFTED for review${failedCount > 20 ? "; only first 20 printed above" : ""}).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
