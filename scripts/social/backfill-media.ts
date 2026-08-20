import "./_load-env";
import { readQueue, writeQueue } from "@/lib/social/queue";
import { IMAGE_KIND_BY_PILLAR, buildCardImageUrlFor } from "@/lib/social/content-engine";
import { recoverHeadlineAndBody, queueHashExcludingFacebookImage } from "@/lib/social/media-backfill";

/**
 * One-off (but re-runnable/idempotent) backfill for the historical bug
 * where every queue entry generated before 2026-08-17 has
 * channels.facebook.imageUrl: null, even for pillars that now render a
 * card (IMAGE_KIND_BY_PILLAR). Those entries predate the card pipeline
 * going live, so the card was simply never built for them at draft time.
 *
 * Only ever touches channels.facebook.imageUrl / altText on unpublished
 * entries whose pillar is card-eligible. Everything else on the entry —
 * id, state, scheduledFor, text, link, topic, pillar, other channels,
 * history — is left byte-identical. Never touches PUBLISHED entries:
 * those already happened, with or without an image, and rewriting their
 * metadata now would misrepresent what was actually posted.
 *
 * Headline/body for the card are recovered from the ALREADY-COMMITTED
 * facebook.text (not regenerated from source data), so the image matches
 * the exact wording already approved/scheduled — never invents new
 * copy. facebook.text is deterministically `${headline}\n\n${body}\n\n<CTA>`
 * (see content-engine.ts renderForChannel's "facebook" case), so
 * splitting on "\n\n" and dropping the last segment recovers both
 * cleanly; validated against 2457/2458 real entries before writing this.
 *
 * Usage: npx tsx --env-file=.env.local scripts/social/backfill-media.ts [--dry-run]
 */

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const queue = await readQueue();
  const before = queueHashExcludingFacebookImage(queue);

  let eligible = 0;
  let alreadyHadImage = 0;
  let textOnlyPillar = 0;
  let publishedSkipped = 0;
  let backfilled = 0;
  const unparseable: string[] = [];

  const updated = queue.map((entry) => {
    const fb = entry.channels.facebook;
    if (!fb) return entry;

    if (fb.imageUrl) {
      alreadyHadImage++;
      return entry;
    }
    if (!IMAGE_KIND_BY_PILLAR[entry.pillar]) {
      textOnlyPillar++;
      return entry;
    }
    if (entry.state === "PUBLISHED") {
      publishedSkipped++;
      return entry;
    }

    eligible++;
    const recovered = recoverHeadlineAndBody(fb.text);
    if (!recovered) {
      unparseable.push(entry.id);
      return entry;
    }

    const imageUrl = buildCardImageUrlFor(entry.pillar, "facebook", recovered.headline, recovered.body);
    if (!imageUrl) {
      unparseable.push(entry.id);
      return entry;
    }

    backfilled++;
    return {
      ...entry,
      channels: {
        ...entry.channels,
        facebook: { ...fb, imageUrl, altText: `Miloosh card: ${recovered.headline}` },
      },
    };
  });

  const after = queueHashExcludingFacebookImage(updated);

  console.log(`Total entries: ${queue.length}`);
  console.log(`Already had imageUrl: ${alreadyHadImage}`);
  console.log(`Text-only pillar (no card kind): ${textOnlyPillar}`);
  console.log(`Published (skipped, history preserved): ${publishedSkipped}`);
  console.log(`Eligible for backfill: ${eligible}`);
  console.log(`Backfilled: ${backfilled}`);
  console.log(`Unparseable (left untouched): ${unparseable.length}`, unparseable.slice(0, 10));
  console.log(`Queue hash before (excl. facebook image fields): ${before}`);
  console.log(`Queue hash after  (excl. facebook image fields): ${after}`);
  console.log(`Non-image fields identical: ${before === after}`);

  if (dryRun) {
    console.log("\n--dry-run: not writing.");
    return;
  }

  await writeQueue(updated);
  console.log(`\nWrote ${backfilled} backfilled entries to the queue.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
