import "./_load-env";
import { createHash } from "node:crypto";
import { readQueue, countByQueueState } from "@/lib/social/queue";
import { isKnownPublicMilooshPath, linkedinPublishIssues, prepareLinkedInVariant } from "@/lib/social/linkedin-readiness";
import type { Channel, SocialQueueEntry } from "@/lib/social/types";

type VariantRecord = { entry: SocialQueueEntry; channel: Channel; text: string; link: string | null };

function normalize(text: string): string {
  return text.toLowerCase().replace(/https?:\/\/\S+/g, "<url>").replace(/\d+(?:[.,]\d+)?/g, "<n>").replace(/[^a-z0-9<>]+/g, " ").trim();
}

function templateFingerprint(record: VariantRecord): string {
  let value = normalize(record.text);
  for (const slug of record.entry.sourceSlugs.flatMap((item) => item.split("-vs-"))) {
    const words = slug.replace(/-/g, " ");
    if (words.length > 2) value = value.replaceAll(words, "<source>");
  }
  return value;
}

function duplicatePairCount(values: string[]): number {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.values()].reduce((sum, count) => sum + (count > 1 ? (count * (count - 1)) / 2 : 0), 0);
}

function main(): void {
  readQueue().then((queue) => {
    const variants: VariantRecord[] = queue.flatMap((entry) => (Object.entries(entry.channels) as [Channel, SocialQueueEntry["channels"][Channel]][]).flatMap(([channel, variant]) => variant ? [{ entry, channel, text: variant.text, link: variant.link }] : []));
    const exactKeys = variants.map((item) => `${item.channel}\0${normalize(item.text)}\0${item.link ?? ""}`);
    const templateKeys = variants.map((item) => `${item.channel}\0${templateFingerprint(item)}`);
    const exactPairs = duplicatePairCount(exactKeys);
    const templatePairs = duplicatePairCount(templateKeys);
    const hookKeys = variants.map((item) => `${item.channel}\0${normalize(item.text).split(" ").slice(0, 6).join(" ")}`);
    const ctaKeys = variants.map((item) => `${item.channel}\0${normalize(item.text).split(/(?<=[.!?])\s+/).at(-1) ?? ""}`);
    const links = variants.map((item) => item.link).filter((link): link is string => Boolean(link));
    const linkCounts = new Map<string, number>();
    for (const link of links) linkCounts.set(link, (linkCounts.get(link) ?? 0) + 1);

    const malformedUrls = new Set<string>();
    const deadMilooshRoutes = new Set<string>();
    const repeatedUrlOccurrences = links.length - new Set(links).size;
    for (const item of variants) {
      if (!item.link) continue;
      try {
        const url = new URL(item.link);
        if (url.origin === "https://miloosh.com" && !isKnownPublicMilooshPath(url.pathname)) deadMilooshRoutes.add(`${item.entry.id}:${item.channel}`);
      } catch {
        malformedUrls.add(`${item.entry.id}:${item.channel}`);
      }
    }

    const matches = (pattern: RegExp) => variants.filter((item) => pattern.test(item.text)).length;
    const linkedIn = queue.flatMap((entry) => {
      const variant = prepareLinkedInVariant(entry);
      return variant ? [{ entry, variant, issues: linkedinPublishIssues(entry, variant) }] : [];
    });
    const publishedCount = queue.filter((entry) => entry.state === "PUBLISHED").length;
    const result = {
      queue: { count: queue.length, hash: createHash("sha256").update(JSON.stringify(queue)).digest("hex"), states: countByQueueState(queue), publishedCount },
      population: { entries: queue.length, variants: variants.length, linkedinVariants: linkedIn.length },
      duplicates: {
        exactPairs,
        nearTemplatePairs: Math.max(0, templatePairs - exactPairs),
        repeatedHookPairs: duplicatePairCount(hookKeys),
        repeatedCtaPairs: duplicatePairCount(ctaKeys),
        repeatedUrlOccurrences,
        distinctRepeatedUrls: [...linkCounts.values()].filter((count) => count > 1).length,
      },
      integrity: {
        malformedUrls: malformedUrls.size,
        deadMilooshRoutes: deadMilooshRoutes.size,
        placeholders: matches(/\b(?:todo|tbd|placeholder|lorem ipsum|fixme)\b/i),
        debugOrInternalCopy: matches(/\b(?:debug|localhost|127\.0\.0\.1|\/internal\/)\b/i),
        brokenFormatting: variants.filter((item) => /\r|\n{4,}|\t/.test(item.text) || item.text.trim() !== item.text).length,
        excessiveHashtags: queue.flatMap((entry) => Object.values(entry.channels).filter(Boolean)).filter((variant) => variant!.hashtags.length > 3).length,
        excessiveEmojis: variants.filter((item) => (item.text.match(/\p{Extended_Pictographic}/gu) ?? []).length > 2).length,
        aiTemplateLanguage: matches(/in today's fast-paced|unlock the power of|game-changer|let's dive in|look no further|revolutioniz/i),
        unsupportedAffiliateClaims: matches(/\b(?:guaranteed savings?|lowest price|best price|\d+% commission|exclusive affiliate discount)\b/i),
        brevoAffiliateClaims: matches(/\bbrevo\b.*\b(?:affiliate|commission|partner payout|exclusive discount)\b/i),
        miroAffiliateClaims: matches(/\bmiro\b.*\b(?:affiliate|commission|partner payout|exclusive discount)\b/i),
        staleBranding: variants.filter((item) => /Need Go Home|NeeGoHome/i.test(item.text) || /\b(?:Milosh|MiLoosh|Milloosh|Mylosh)\b/.test(item.text)).length,
        inappropriatePromotion: matches(/\b(?:buy now|act now|limited time|don't miss out|must-have|guaranteed results?)\b/i),
      },
      linkedin: {
        variantsWithBlockingIssues: linkedIn.filter((item) => item.issues.length > 0).length,
        scheduledWithBlockingIssues: linkedIn.filter((item) => item.entry.state === "SCHEDULED" && item.issues.length > 0).length,
        originalMediaPresent: linkedIn.filter((item) => Boolean(item.entry.channels.linkedin?.imageUrl)).length,
        deterministicMediaAvailable: linkedIn.filter((item) => Boolean(item.variant.imageUrl)).length,
        scheduledMediaAvailable: linkedIn.filter((item) => item.entry.state === "SCHEDULED" && Boolean(item.variant.imageUrl)).length,
        untrustedMedia: linkedIn.filter((item) => item.variant.imageUrl && !item.variant.imageUrl.startsWith("https://miloosh.com/api/social/card?")).length,
      },
      definitions: {
        exactDuplicate: "same channel + normalized full text + destination URL",
        nearDuplicate: "same channel + identical normalized template after numbers and source slugs are replaced, excluding exact pairs",
        hook: "same channel + identical first six normalized tokens",
        cta: "same channel + identical normalized final sentence",
      },
    };
    console.log(JSON.stringify(result, null, 2));
  }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

main();
