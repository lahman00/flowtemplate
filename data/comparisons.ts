/**
 * The exact, curated set of comparison pages this site publishes — not
 * every possible pair of the 34 software entries (that would be 561
 * combinations). Each pair here was chosen because it's a genuinely
 * common, materially different comparison, and both sides already have
 * real sourced data in data/software/*.json.
 *
 * This is the single source of truth for /compare: generateStaticParams,
 * the sitemap, the /compare index page, and related-comparison links all
 * read from this list — a new comparison is published by adding one line
 * here, not by editing multiple files.
 */
export const PUBLISHED_COMPARISONS: ReadonlyArray<readonly [string, string]> = [
  ["notion", "clickup"],
  ["notion", "coda"],
  ["notion", "confluence"],
  ["slack", "microsoft-teams"],
  ["slack", "discord"],
  ["clickup", "asana"],
  ["clickup", "monday"],
  ["clickup", "trello"],
  ["asana", "monday"],
  ["asana", "trello"],
  ["trello", "monday"],
  ["jira", "linear"],
  ["jira", "asana"],
  ["airtable", "notion"],
  ["todoist", "asana"],
  ["obsidian", "evernote"],
  ["zoom", "microsoft-teams"],
  ["miro", "lucidchart"],
  ["zapier", "make"],
  ["hubspot", "pipedrive"],
];

export function getComparisonSlug(slugA: string, slugB: string): string {
  return `${slugA}-vs-${slugB}`;
}

export function getPublishedComparisonSlugs(): string[] {
  return PUBLISHED_COMPARISONS.map(([a, b]) => getComparisonSlug(a, b));
}

/** Whether this exact ordered pair is one of the published comparisons. */
export function isPublishedComparison(slugA: string, slugB: string): boolean {
  return PUBLISHED_COMPARISONS.some(([a, b]) => a === slugA && b === slugB);
}

/** All published comparisons involving a given software, in either position. */
export function getComparisonsInvolving(slug: string): Array<[string, string]> {
  return PUBLISHED_COMPARISONS.filter(([a, b]) => a === slug || b === slug).map(
    ([a, b]) => [a, b] as [string, string]
  );
}
