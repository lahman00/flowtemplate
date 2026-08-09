import type { Metadata } from "next";
import { TrendingUp } from "lucide-react";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { ButtonLink } from "@/components/ButtonLink";
import { SectionHeading } from "@/components/SectionHeading";
import { readLatestSwarmReport } from "@/lib/agents/report-io";
import { AGENT_REGISTRY } from "@/lib/agents/registry";
import { impactBucket } from "@/lib/agents/scoring";
import type { AgentOutcomeStatus, QaVerdict } from "@/types/agents";

/**
 * Private growth/QA swarm dashboard — reads only the local, gitignored
 * var/agents/latest-report.json written by `npm run agents:*`. Same
 * posture as /internal/maintenance: noindex/nofollow, disallowed in
 * app/robots.ts's /internal/ rule, not linked from the public site. See
 * docs/agents-architecture.md.
 */
export const metadata: Metadata = {
  title: "Growth/QA Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<AgentOutcomeStatus, string> = {
  success: "border-emerald-500/30 text-emerald-300",
  warning: "border-amber-500/30 text-amber-300",
  failure: "border-red-500/30 text-red-300",
  blocked: "border-white/10 text-zinc-500",
  skipped: "border-white/10 text-zinc-400",
};

const QA_VERDICT_STYLE: Record<QaVerdict, string> = {
  PASS: "border-emerald-500/30 text-emerald-300",
  WARN: "border-amber-500/30 text-amber-300",
  FAIL: "border-red-500/30 text-red-300",
};

function EmptyState() {
  return (
    <main className="flex flex-1 items-center justify-center py-24">
      <Container size="narrow" className="flex flex-col items-center text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
          <TrendingUp className="h-6 w-6" strokeWidth={2} />
        </span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">No swarm report yet</h1>
        <p className="mt-4 max-w-md text-zinc-400">
          This dashboard reads <code className="rounded bg-white/10 px-1.5 py-0.5">var/agents/latest-report.json</code>,
          which doesn&apos;t exist yet. Run the swarm locally to generate one:
        </p>
        <pre className="mt-6 w-full max-w-md overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm text-zinc-300">
          npm run agents:daily
        </pre>
        <p className="mt-4 max-w-md text-sm text-zinc-500">
          Every agent is read-only — inspect, analyze, score, report. Nothing here publishes a change
          automatically.
        </p>
      </Container>
    </main>
  );
}

export default function GrowthDashboardPage() {
  const report = readLatestSwarmReport();

  if (!report) {
    return <EmptyState />;
  }

  const topOpportunities = report.findings
    .filter((f) => f.kind === "opportunity")
    .sort((a, b) => (b.estimatedImpact ?? 0) - (a.estimatedImpact ?? 0))
    .slice(0, 15);

  const blockedAgents = AGENT_REGISTRY.filter((a) => !a.enabled);

  const findingsByDomain = new Map<string, number>();
  for (const f of report.findings) {
    const domain = AGENT_REGISTRY.find((a) => a.id === f.agentId)?.domain ?? "unknown";
    findingsByDomain.set(domain, (findingsByDomain.get(domain) ?? 0) + 1);
  }

  return (
    <main className="flex-1 py-16 sm:py-20">
      <Container>
        <header className="max-w-3xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950">
            <TrendingUp className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <div className="mt-5 flex items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Growth/QA dashboard</h1>
            <Badge className="border-amber-500/30 text-amber-300">Internal only</Badge>
          </div>
          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Not indexed, not linked from the site. Mode: <strong className="text-white">{report.mode.toUpperCase()}</strong>,
            generated {report.generatedAt} by{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">npm run agents:{report.mode}</code>. Every
            agent below is read-only — inspection, analysis, and scoring only. See{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">docs/agents-architecture.md</code>.
          </p>
        </header>

        {/* Summary stats */}
        <section className="mt-12">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Card className="text-center">
              <p className="text-2xl font-bold text-white">{report.summary.agentsInvoked}</p>
              <p className="mt-1 text-xs text-zinc-500">Agents invoked</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-white">{report.summary.opportunitiesFound}</p>
              <p className="mt-1 text-xs text-zinc-500">Opportunities</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-white">{report.summary.criticalIssues}</p>
              <p className="mt-1 text-xs text-zinc-500">Critical issues</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-white">{report.summary.estimatedHighImpactOpportunities}</p>
              <p className="mt-1 text-xs text-zinc-500">High-impact</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-white">{report.duplicatesMerged}</p>
              <p className="mt-1 text-xs text-zinc-500">Duplicates merged</p>
            </Card>
            <Card className="text-center">
              <Badge className={QA_VERDICT_STYLE[report.qaOverall]}>{report.qaOverall}</Badge>
              <p className="mt-2 text-xs text-zinc-500">QA overall</p>
            </Card>
          </div>
        </section>

        {/* Top opportunities */}
        <section className="mt-14">
          <SectionHeading
            title="Top opportunities"
            description="Sorted by estimated impact (lib/agents/scoring.ts) — a ranking aid, not a revenue forecast."
          />
          {topOpportunities.length === 0 ? (
            <Card className="mt-6">
              <p className="text-sm text-zinc-400">None right now.</p>
            </Card>
          ) : (
            <div className="mt-6 space-y-3">
              {topOpportunities.map((f) => (
                <Card key={f.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{f.title}</p>
                    <Badge
                      className={
                        impactBucket(f.estimatedImpact ?? 0) === "high"
                          ? "border-emerald-500/30 text-emerald-300"
                          : impactBucket(f.estimatedImpact ?? 0) === "medium"
                            ? "border-amber-500/30 text-amber-300"
                            : "border-white/10 text-zinc-400"
                      }
                    >
                      {f.estimatedImpact}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{f.description}</p>
                  {f.recommendedAction ? <p className="mt-2 text-xs text-zinc-500">→ {f.recommendedAction}</p> : null}
                  {f.location ? <p className="mt-1 text-xs text-zinc-600">{f.location}</p> : null}
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* QA checks */}
        <section className="mt-14">
          <SectionHeading title="QA checks" description="Every QA-domain agent's PASS/WARN/FAIL verdict." />
          <Card className="mt-6 overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[2fr_1fr_4fr] gap-4 border-b border-white/10 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <span>Agent</span>
                <span>Verdict</span>
                <span>Detail</span>
              </div>
              <div className="divide-y divide-white/10">
                {report.qaResults.map((q) => (
                  <div key={q.agentId} className="grid grid-cols-[2fr_1fr_4fr] gap-4 py-3 text-sm">
                    <span className="font-medium text-white">{q.agentId}</span>
                    <span>
                      <Badge className={QA_VERDICT_STYLE[q.verdict]}>{q.verdict}</Badge>
                    </span>
                    <span className="text-zinc-400">{q.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* Agent status */}
        <section className="mt-14">
          <SectionHeading title="Agent status" description="Every agent this run attempted, including skipped/blocked." />
          <Card className="mt-6 overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-[2fr_1fr_1fr_3fr] gap-4 border-b border-white/10 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <span>Agent</span>
                <span>Status</span>
                <span>Duration</span>
                <span>Summary</span>
              </div>
              <div className="divide-y divide-white/10">
                {report.agentResults.map((r) => (
                  <div key={r.agentId} className="grid grid-cols-[2fr_1fr_1fr_3fr] gap-4 py-3 text-sm">
                    <span className="font-medium text-white">{r.agentId}</span>
                    <span>
                      <Badge className={STATUS_STYLE[r.status]}>{r.status}</Badge>
                    </span>
                    <span className="text-zinc-400">{r.durationMs}ms</span>
                    <span className="text-zinc-500">{r.summary}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* Findings by domain */}
        <section className="mt-14">
          <SectionHeading title="Findings by domain" />
          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {Array.from(findingsByDomain.entries()).map(([domain, count]) => (
              <Card key={domain} className="text-center">
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">{domain}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Blocked agents */}
        <section className="mt-14">
          <SectionHeading
            title="Blocked agents"
            description="Specified, registered, and honestly not running — see each blockedReason."
          />
          <div className="mt-6 space-y-3">
            {blockedAgents.map((a) => (
              <Card key={a.id}>
                <p className="text-sm font-semibold text-white">{a.name}</p>
                <p className="mt-1 text-sm text-zinc-500">{a.blockedReason}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 border-t border-white/10 pt-10 text-center">
          <p className="text-sm text-zinc-500">
            Full detailed report lives at <code className="rounded bg-white/10 px-1.5 py-0.5">var/agents/latest-report.md</code> (gitignored, local only).
          </p>
          <ButtonLink href="/internal/maintenance" variant="secondary" className="mt-6">
            View maintenance dashboard
          </ButtonLink>
        </section>
      </Container>
    </main>
  );
}
