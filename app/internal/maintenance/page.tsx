import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ButtonLink } from "@/components/ButtonLink";
import { SectionHeading } from "@/components/SectionHeading";
import { readLatestSummary, readAgentReport } from "@/lib/maintenance/report-io";
import type { LinkCheckResult } from "@/lib/maintenance/http";
import type { FreshnessScore } from "@/scripts/maintenance/freshness";
import type { ComparisonCandidate } from "@/scripts/maintenance/comparisons";
import type { RunStatus } from "@/types/maintenance";

/**
 * Sprint 12 Phase 9 — private maintenance dashboard. Reads only the local,
 * gitignored var/maintenance/*.json reports written by `npm run
 * maintenance` — never calls a network or reads an env var directly.
 * Noindex/nofollow, disallowed in app/robots.ts (already covers
 * /internal/ as a whole), not linked from anywhere on the public site —
 * same posture as /internal/revenue, /internal/outbound-clicks, and
 * /internal/recommendations.
 */
export const metadata: Metadata = {
  title: "Maintenance Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<RunStatus, string> = {
  success: "border-emerald-500/30 text-emerald-300",
  warning: "border-amber-500/30 text-amber-300",
  failure: "border-red-500/30 text-red-300",
  skipped: "border-white/10 text-zinc-400",
};

function EmptyState() {
  return (
    <main className="flex flex-1 items-center justify-center py-24">
      <Container size="narrow" className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
          <Wrench className="h-6 w-6" strokeWidth={2} />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          No maintenance report yet
        </h1>
        <p className="mt-4 max-w-md text-zinc-400">
          This dashboard reads <code className="rounded bg-white/10 px-1.5 py-0.5">var/maintenance/latest-summary.json</code>,
          which doesn&apos;t exist yet. Run the maintenance suite locally to generate one:
        </p>
        <pre className="mt-6 w-full max-w-md overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm text-zinc-300">
          npm run maintenance
        </pre>
        <p className="mt-4 max-w-md text-sm text-zinc-500">
          This never publishes anything automatically — it only writes local report files for this
          dashboard and for a human to review.
        </p>
      </Container>
    </main>
  );
}

export default function MaintenanceDashboardPage() {
  const summary = readLatestSummary();

  if (!summary) {
    return <EmptyState />;
  }

  const linksReport = readAgentReport<{ totalUrlsChecked: number; byOutcome: Record<string, number>; results: Array<LinkCheckResult & { locations: Array<{ softwareSlug: string; kind: string; fieldLabel: string }> }> }>("links");
  const freshnessReport = readAgentReport<{ averageScore: number; rankings: FreshnessScore[] }>("freshness");
  const seoReport = readAgentReport<{ pagesChecked: number; sitemapEntryCount: number; checkedCategories: string[] }>("seo");
  const recommendationsReport = readAgentReport<{ totalFixtures: number; passed: number; failed: number; results: Array<{ name: string; description: string; passed: boolean; failures: string[] }> }>("recommendations");
  const comparisonsReport = readAgentReport<{ totalCandidates: number; topCandidates: ComparisonCandidate[] }>("comparisons");
  const affiliateReport = readAgentReport<{ confirmedNotActivated: string[]; unresolved: string[]; highTierNoProgram: string[]; staleResearch: string[] }>("affiliate");

  const criticalIssues = [linksReport, freshnessReport, seoReport, recommendationsReport, comparisonsReport, affiliateReport]
    .flatMap((report) => report?.issues ?? [])
    .filter((issue) => issue.severity === "critical");

  return (
    <main className="flex-1 py-16 sm:py-20">
      <Container>
        <header className="max-w-3xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950">
            <Wrench className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div className="mt-5 flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Maintenance dashboard
            </h1>
            <Badge className="border-amber-500/30 text-amber-300">Internal only</Badge>
          </div>
          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Not indexed, not linked from the site. Generated {summary.generatedAt} by{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">npm run maintenance</code>. This
            system never publishes a factual change automatically and never pushes product-data
            changes to main — every item below is for a human to review. See{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">docs/maintenance-system.md</code>.
          </p>
        </header>

        {/* Agent status */}
        <section className="mt-12">
          <SectionHeading title="Agent status" />
          <Card className="mt-6 overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b border-white/10 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <span>Agent</span>
                <span>Status</span>
                <span>Critical</span>
                <span>Warning</span>
                <span>Info</span>
                <span>Duration</span>
              </div>
              <div className="divide-y divide-white/10">
                {summary.agents.map((agent) => (
                  <div key={agent.agent} className="grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-4 py-3 text-sm">
                    <span className="font-medium text-white">{agent.agent}</span>
                    <span>
                      <Badge className={STATUS_STYLE[agent.status]}>{agent.status}</Badge>
                    </span>
                    <span className="text-zinc-400">{agent.criticalCount}</span>
                    <span className="text-zinc-400">{agent.warningCount}</span>
                    <span className="text-zinc-400">{agent.infoCount}</span>
                    <span className="text-zinc-400">{agent.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* Critical issues */}
        <section className="mt-14">
          <SectionHeading
            title="Critical issues"
            description="Every critical-severity finding across all agents, in one place."
          />
          {criticalIssues.length === 0 ? (
            <Card className="mt-6">
              <p className="text-sm text-zinc-400">None right now.</p>
            </Card>
          ) : (
            <div className="mt-6 space-y-3">
              {criticalIssues.map((issue) => (
                <Card key={issue.id} className="border-red-500/20 bg-red-500/[0.03]">
                  <p className="text-sm font-semibold text-white">{issue.title}</p>
                  <p className="mt-1 text-sm text-zinc-400">{issue.description}</p>
                  {issue.location ? <p className="mt-1 text-xs text-zinc-600">{issue.location}</p> : null}
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Link health */}
        <section className="mt-14">
          <SectionHeading title="Link health" description={linksReport?.summary ?? "No report available."} />
          {linksReport?.data ? (
            <Card className="mt-6 overflow-x-auto">
              <div className="min-w-[520px] text-sm">
                {Object.entries(linksReport.data.byOutcome).map(([outcome, count]) => (
                  <div key={outcome} className="flex items-center justify-between border-b border-white/10 py-2 last:border-0">
                    <span className="text-zinc-400">{outcome}</span>
                    <span className="text-white">{count}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </section>

        {/* Freshness ranking */}
        <section className="mt-14">
          <SectionHeading
            title="Freshness ranking"
            description="Documentation recency and completeness — not a claim about factual accuracy."
          />
          {freshnessReport?.data ? (
            <Card className="mt-6 overflow-x-auto">
              <div className="min-w-[520px]">
                <div className="grid grid-cols-[2fr_1fr_3fr] gap-4 border-b border-white/10 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <span>Software</span>
                  <span>Score</span>
                  <span>Top deductions</span>
                </div>
                <div className="divide-y divide-white/10">
                  {freshnessReport.data.rankings.slice(0, 10).map((s) => (
                    <div key={s.slug} className="grid grid-cols-[2fr_1fr_3fr] gap-4 py-3 text-sm">
                      <span className="font-medium text-white">{s.name}</span>
                      <span className="text-zinc-400">{s.score}/100</span>
                      <span className="text-zinc-500">
                        {s.factors.slice(0, 2).map((f) => f.label).join(", ") || "none"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-xs text-zinc-600">
                Average: {freshnessReport.data.averageScore}/100. Showing 10 lowest-scoring of{" "}
                {freshnessReport.data.rankings.length}.
              </p>
            </Card>
          ) : null}
        </section>

        {/* SEO issues */}
        <section className="mt-14">
          <SectionHeading title="SEO integrity" description={seoReport?.summary ?? "No report available."} />
          <Card className="mt-6">
            <p className="text-sm text-zinc-400">
              {seoReport?.issues.length ? `${seoReport.issues.length} issue(s) — see critical issues above and var/maintenance/seo.md.` : "No issues found."}
            </p>
          </Card>
        </section>

        {/* Recommendation regressions */}
        <section className="mt-14">
          <SectionHeading
            title="Recommendation regressions"
            description={recommendationsReport?.summary ?? "No report available."}
          />
          {recommendationsReport?.data ? (
            <Card className="mt-6 overflow-x-auto">
              <div className="min-w-[480px]">
                <div className="grid grid-cols-[3fr_1fr] gap-4 border-b border-white/10 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <span>Fixture</span>
                  <span>Result</span>
                </div>
                <div className="divide-y divide-white/10">
                  {recommendationsReport.data.results.map((r) => (
                    <div key={r.name} className="grid grid-cols-[3fr_1fr] gap-4 py-3 text-sm">
                      <span className="text-zinc-300">{r.name}</span>
                      <span className={r.passed ? "text-emerald-400" : "text-red-400"}>
                        {r.passed ? "pass" : "FAIL"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ) : null}
        </section>

        {/* Comparison opportunities */}
        <section className="mt-14">
          <SectionHeading
            title="Comparison opportunities"
            description={comparisonsReport?.summary ?? "No report available."}
          />
          {comparisonsReport?.data ? (
            <Card className="mt-6 overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-[2fr_1fr_3fr] gap-4 border-b border-white/10 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <span>Pair</span>
                  <span>Priority</span>
                  <span>Why</span>
                </div>
                <div className="divide-y divide-white/10">
                  {comparisonsReport.data.topCandidates.slice(0, 10).map((c) => (
                    <div key={`${c.slugA}-${c.slugB}`} className="grid grid-cols-[2fr_1fr_3fr] gap-4 py-3 text-sm">
                      <span className="text-zinc-300">
                        {c.nameA} vs {c.nameB}
                      </span>
                      <span className="text-zinc-400">{c.priority}</span>
                      <span className="text-zinc-500">{c.reasons[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-xs text-zinc-600">
                Showing 10 of {comparisonsReport.data.totalCandidates} candidates. Nothing published
                automatically.
              </p>
            </Card>
          ) : null}
        </section>

        {/* Affiliate opportunities */}
        <section className="mt-14">
          <SectionHeading
            title="Affiliate opportunities"
            description={affiliateReport?.summary ?? "No report available."}
          />
          {affiliateReport?.data ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <Card>
                <p className="text-sm font-semibold text-white">Confirmed, not activated</p>
                <p className="mt-2 text-sm text-zinc-400">
                  {affiliateReport.data.confirmedNotActivated.join(", ") || "None."}
                </p>
              </Card>
              <Card>
                <p className="text-sm font-semibold text-white">Unresolved</p>
                <p className="mt-2 text-sm text-zinc-400">{affiliateReport.data.unresolved.join(", ") || "None."}</p>
              </Card>
              <Card>
                <p className="text-sm font-semibold text-white">High tier, no confirmed program</p>
                <p className="mt-2 text-sm text-zinc-400">
                  {affiliateReport.data.highTierNoProgram.join(", ") || "None."}
                </p>
              </Card>
              <Card>
                <p className="text-sm font-semibold text-white">Stale research</p>
                <p className="mt-2 text-sm text-zinc-400">
                  {affiliateReport.data.staleResearch.join(", ") || "None — all research is current."}
                </p>
              </Card>
            </div>
          ) : null}
        </section>

        {/* Required human actions */}
        <section className="mt-14">
          <SectionHeading
            title="Required human actions"
            description="Nothing here is applied automatically — every action needs a person."
          />
          <div className="mt-6 space-y-3">
            {summary.recommendedHumanActions.map((action, index) => (
              <Card key={index}>
                <p className="text-sm text-zinc-300">{action}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-white/10 pt-10 text-center">
          <p className="text-sm text-zinc-500">
            Full detailed reports live under <code className="rounded bg-white/10 px-1.5 py-0.5">var/maintenance/</code> (gitignored, local only).
          </p>
          <ButtonLink href="/internal/revenue" variant="secondary" className="mt-6">
            View revenue dashboard
          </ButtonLink>
        </section>
      </Container>
    </main>
  );
}
