import type { Metadata } from "next";
import { DollarSign } from "lucide-react";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { SectionHeading } from "@/components/SectionHeading";
import { buildMoneyMap, type MoneyMapBucket, type MoneyMapPage } from "@/lib/revenue/money-map";

/**
 * Phase 12 — internal Money Map. Not linked from the navbar, footer,
 * homepage, or sitemap; /internal/ is Basic-Auth gated by proxy.ts and
 * disallowed in app/robots.ts as defense in depth — same posture as
 * every other /internal/ dashboard. Reads real data at request time
 * (force-dynamic): a live Search Console fetch plus the real
 * Blob-backed outbound-click log, both of which change continuously.
 */
export const metadata: Metadata = {
  title: "Money Map",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const BUCKET_LABEL: Record<Exclude<MoneyMapBucket, null>, string> = {
  A: "A — Money now",
  B: "B — CTR opportunity",
  C: "C — Ranking strike zone",
  D: "D — Monetization gap",
  E: "E — Click optimization",
  F: "F — Build/expand",
};

const BUCKET_COLOR: Record<Exclude<MoneyMapBucket, null>, string> = {
  A: "border-emerald-500/30 text-emerald-300",
  B: "border-sky-500/30 text-sky-300",
  C: "border-amber-500/30 text-amber-300",
  D: "border-rose-500/30 text-rose-300",
  E: "border-violet-500/30 text-violet-300",
  F: "border-white/10 text-zinc-300",
};

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function RowGsc({ page }: { page: MoneyMapPage }) {
  if (page.gscAvailability === "unavailable") {
    return <span className="text-zinc-600">unavailable</span>;
  }
  if (!page.gsc) {
    return <span className="text-zinc-500">0 impr.</span>;
  }
  return (
    <span className="text-zinc-400">
      {page.gsc.impressions} impr · {page.gsc.clicks} clk · {fmtPct(page.gsc.ctr)} · pos {page.gsc.position.toFixed(1)}
    </span>
  );
}

export default async function MoneyMapPageRoute() {
  const data = await buildMoneyMap();

  const bucketCounts = data.pages.reduce(
    (acc, p) => {
      if (p.bucket) acc[p.bucket] = (acc[p.bucket] ?? 0) + 1;
      return acc;
    },
    {} as Record<Exclude<MoneyMapBucket, null>, number>
  );

  const top20 = data.pages.slice(0, 20);
  const unclassifiedCount = data.pages.filter((p) => p.bucket === null).length;

  return (
    <main className="flex-1 py-16 sm:py-20">
      <Container>
        <header className="max-w-3xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950">
            <DollarSign className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">Money Map</h1>
          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Internal only — not indexed, not linked from the site. Ranks every software and
            comparison page by a transparent Money Score built only from real, measured data
            where available. A component that isn&apos;t available is excluded from the score,
            never faked as neutral. See <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">lib/revenue/money-map.ts</code>{" "}
            for the exact formula.
          </p>
          <p className="mt-4 text-sm leading-6 text-zinc-500">
            Search Console: <strong className="text-zinc-300">{data.gscFetchAvailability}</strong> —{" "}
            {data.gscFetchNote}
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Outbound-click log: {data.totalOutboundEventsSitewide} real event(s) recorded
            sitewide. This is still very early — click-based conclusions (bucket E) will stay
            empty or near-empty until real volume accumulates.
          </p>
        </header>

        <section className="mt-12 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {(Object.keys(BUCKET_LABEL) as Array<Exclude<MoneyMapBucket, null>>).map((bucket) => (
            <Card key={bucket}>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{bucket}</p>
              <p className="mt-2 text-2xl font-bold text-white">{bucketCounts[bucket] ?? 0}</p>
              <p className="mt-1 text-xs text-zinc-500">{BUCKET_LABEL[bucket].split("— ")[1]}</p>
            </Card>
          ))}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Pages analyzed</p>
            <p className="mt-2 text-2xl font-bold text-white">{data.totalPagesAnalyzed}</p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Unclassified (no bucket met evidence threshold)
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{unclassifiedCount}</p>
          </Card>
        </section>

        <section className="mt-14">
          <SectionHeading
            title="Top 20 by Money Score"
            description="Highest realistic near-term revenue opportunity first. Score = weighted average of only the components that had real/derived/heuristic data for that page."
          />

          <Card className="mt-8 overflow-x-auto">
            <div className="min-w-[1100px]">
              <div className="grid grid-cols-[2.2fr_1fr_1.6fr_1fr_1.6fr_1fr_1.4fr_2fr] gap-4 border-b border-white/10 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <span>Page</span>
                <span>Type</span>
                <span>Products / coverage</span>
                <span>Score</span>
                <span>Search Console</span>
                <span>Outbound clicks</span>
                <span>Bucket</span>
                <span>Recommended action</span>
              </div>
              <div className="divide-y divide-white/10">
                {top20.map((page) => (
                  <div key={page.url} className="grid grid-cols-[2.2fr_1fr_1.6fr_1fr_1.6fr_1fr_1.4fr_2fr] gap-4 py-3 text-sm">
                    <span className="font-medium text-white">{page.url}</span>
                    <span className="text-zinc-400">{page.pageType}</span>
                    <span className="text-zinc-400">
                      {page.products.map((p) => p.name).join(" vs ")}
                      <br />
                      <span className="text-xs text-zinc-500">coverage: {page.monetizationCoverage}</span>
                    </span>
                    <span className="text-zinc-300">{page.moneyScore}/100</span>
                    <span>
                      <RowGsc page={page} />
                    </span>
                    <span className="text-zinc-400">
                      {page.clicks.totalClicks} ({page.clicks.affiliateClicks} affiliate)
                    </span>
                    <span>
                      {page.bucket ? (
                        <Badge className={BUCKET_COLOR[page.bucket]}>{BUCKET_LABEL[page.bucket]}</Badge>
                      ) : (
                        <Badge className="border-white/10 text-zinc-500">unclassified</Badge>
                      )}
                    </span>
                    <span className="text-xs leading-5 text-zinc-500">{page.recommendedAction}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section className="mt-14">
          <SectionHeading
            title="Score formula"
            description="Every component is 0-10, weighted, then rescaled to 0-100. A missing component is excluded from the average, not defaulted."
          />
          <Card className="mt-8">
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>Search visibility (weight 3) — real, from live Search Console impressions.</li>
              <li>Ranking proximity (weight 2) — real, from live Search Console average position.</li>
              <li>CTR opportunity gap (weight 1.5) — real CTR vs. a heuristic expected-CTR-by-position curve.</li>
              <li>Commercial intent (weight 2) — derived from stored pricing model (software pages) or a heuristic that comparison pages carry stronger buying intent.</li>
              <li>Monetization readiness (weight 2.5) — real, from the canonical affiliate registry.</li>
              <li>Real outbound-click evidence (weight 1, deliberately low) — real, but sitewide click history is still very young; treat as a weak early signal.</li>
            </ul>
          </Card>
        </section>
      </Container>
    </main>
  );
}
