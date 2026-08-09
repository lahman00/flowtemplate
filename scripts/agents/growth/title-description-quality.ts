import { getAllSoftware } from "@/data/software";
import { PUBLISHED_COMPARISONS, getComparisonSlug } from "@/data/comparisons";
import { getSoftware } from "@/data/software";
import { generateMetaDescription, META_DESCRIPTION_MAX_LENGTH } from "@/lib/generators";
import { generateComparisonMetaDescription } from "@/lib/comparison";
import { makeFinding } from "@/lib/agents/finding";
import type { AgentRunFn } from "@/types/agents";

/**
 * Page <title>s here are deliberately uniform templates ("Best {name}
 * Alternatives", "{A} vs {B}") — that's a real, intentional site pattern,
 * not a defect, so this agent doesn't flag "generic titles." What it does
 * check, using the real generator functions (never a reimplementation):
 * meta descriptions that get truncated mid-thought by
 * META_DESCRIPTION_MAX_LENGTH (reads clipped in a SERP snippet) or that
 * are thin enough to waste the available snippet space.
 *
 * Found by actually dry-running this agent, not assumed: every one of
 * 217 software pages' generated meta description was truncated — the
 * template `${description} Compare N real alternatives...` almost always
 * exceeds the 155-char budget. Reporting that as 217 separate per-page
 * findings would be exactly the noise the brief warns against ("do not
 * flood me with every agent's internal chatter" — Section L). When
 * truncation is systemic (above SYSTEMIC_RATE_THRESHOLD of pages), this
 * reports ONE finding pointing at the template itself; only when
 * truncation is rare/isolated does it make sense as a per-page finding
 * (then it's a genuine "this one product's description is unusually
 * long" issue, not a template bug).
 */

const MIN_HEALTHY_LENGTH = 50;
const SYSTEMIC_RATE_THRESHOLD = 0.2; // 20%+ of pages truncated = template-level problem, not per-page

function reportTruncation(
  agentId: string,
  pageType: "software" | "comparison",
  truncated: Array<{ location: string; label: string }>,
  total: number,
  templateFile: string
): ReturnType<typeof makeFinding>[] {
  if (truncated.length === 0) return [];

  const rate = truncated.length / total;
  if (rate >= SYSTEMIC_RATE_THRESHOLD) {
    const examples = truncated.slice(0, 5).map((t) => t.location);
    return [
      makeFinding({
        agentId,
        kind: "issue",
        severity: "warning",
        title: `Meta description template truncates ${(rate * 100).toFixed(0)}% of ${pageType} pages`,
        description: `${truncated.length} of ${total} ${pageType} pages have a generated meta description cut off at ${META_DESCRIPTION_MAX_LENGTH} characters, ending mid-sentence. This is a template-level pattern, not an isolated per-page issue — reported once rather than as ${truncated.length} separate findings.`,
        location: templateFile,
        evidence: [`${truncated.length}/${total} pages truncated (${(rate * 100).toFixed(1)}%)`, ...examples],
        confidence: 1,
        riskLevel: 3,
        recommendedAction: `Shorten ${templateFile}'s meta-description template so it fits within ${META_DESCRIPTION_MAX_LENGTH} characters for a typical entry, rather than relying on truncation.`,
        dedupeKey: `${agentId}:systemic-truncation:${pageType}`,
      }),
    ];
  }

  // Rare/isolated — worth a per-page finding each.
  return truncated.map((t) =>
    makeFinding({
      agentId,
      kind: "opportunity",
      severity: "info",
      title: `Meta description truncated: ${t.label}`,
      description: `The generated meta description for ${t.location} was cut off at ${META_DESCRIPTION_MAX_LENGTH} characters and ends mid-sentence. Unlike most pages of this type, this one is long enough to be clipped.`,
      location: t.location,
      evidence: [`Generated description length before truncation exceeds ${META_DESCRIPTION_MAX_LENGTH} chars`],
      confidence: 1,
      riskLevel: 2,
      recommendedAction: "Shorten the underlying description so the snippet ends on a complete thought.",
      dedupeKey: `${agentId}:truncated:${pageType}:${t.location}`,
    })
  );
}

export const run: AgentRunFn = async () => {
  const agentId = "growth-title-description-quality";
  const allSoftware = getAllSoftware();
  const findings = [];

  const truncatedSoftware = allSoftware
    .filter((s) => generateMetaDescription(s).endsWith("…"))
    .map((s) => ({ location: `/software/${s.slug}`, label: s.name }));
  findings.push(...reportTruncation(agentId, "software", truncatedSoftware, allSoftware.length, "lib/generators.ts (generateMetaDescription)"));

  for (const software of allSoftware) {
    const description = generateMetaDescription(software);
    if (!description.endsWith("…") && description.length < MIN_HEALTHY_LENGTH) {
      findings.push(
        makeFinding({
          agentId,
          kind: "opportunity",
          severity: "info",
          title: `Thin meta description: ${software.name}`,
          description: `The generated meta description for /software/${software.slug} is only ${description.length} characters — well under the ~${META_DESCRIPTION_MAX_LENGTH}-char budget search engines display.`,
          location: `/software/${software.slug}`,
          evidence: [`Description length: ${description.length} chars`],
          confidence: 0.9,
          riskLevel: 2,
          recommendedAction: "Consider a richer catalog description for this product — it directly lengthens the generated snippet.",
          dedupeKey: `${agentId}:thin:software:${software.slug}`,
        })
      );
    }
  }

  let comparisonsChecked = 0;
  const truncatedComparisons: Array<{ location: string; label: string }> = [];
  for (const [slugA, slugB] of PUBLISHED_COMPARISONS) {
    const a = getSoftware(slugA);
    const b = getSoftware(slugB);
    if (!a || !b) continue;
    comparisonsChecked += 1;
    if (generateComparisonMetaDescription(a, b).endsWith("…")) {
      const slug = getComparisonSlug(slugA, slugB);
      truncatedComparisons.push({ location: `/compare/${slug}`, label: `${a.name} vs ${b.name}` });
    }
  }
  findings.push(...reportTruncation(agentId, "comparison", truncatedComparisons, comparisonsChecked, "lib/comparison.ts (generateComparisonMetaDescription)"));

  return {
    summary: `Checked ${allSoftware.length} software + ${comparisonsChecked} comparison meta descriptions for truncation/thinness. ${findings.length} finding(s).`,
    findings,
  };
};
