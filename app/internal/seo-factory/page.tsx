import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { readLatestSeoFactoryRun, readSeoExperimentBaselines, readSeoExperiments } from "@/lib/seo-factory/store";

export const metadata: Metadata = { title: "SEO Factory", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SeoFactoryPage() {
  const [run, experiments, baselines] = await Promise.all([readLatestSeoFactoryRun(), readSeoExperiments(), readSeoExperimentBaselines()]);
  return (
    <main className="flex-1 py-16 sm:py-20">
      <Container>
        <header className="max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Level 0 — Analyze only</p>
          <h1 className="mt-3 text-4xl font-bold text-white sm:text-5xl">SEO Factory</h1>
          <p className="mt-5 text-zinc-400">Real GSC demand joined to inventory, internal links, Money Map, and affiliate readiness. Mass publication is hard-disabled.</p>
        </header>

        {!run ? <Card className="mt-10"><p className="text-zinc-400">No successful production run yet. The factory fails closed when GSC or durable storage is unavailable.</p></Card> : (
          <>
            <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["GSC query/page rows", run.gscRowsAnalyzed], ["Inventory pages", run.pagesAnalyzed], ["Ranked actions", run.opportunities.length], ["Experiments / baselines", `${experiments.length} / ${baselines.length}`],
              ].map(([label, value]) => <Card key={String(label)}><p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p><p className="mt-2 text-3xl font-bold text-white">{value}</p></Card>)}
            </section>
            <Card className="mt-6">
              <p className="text-sm text-zinc-300">Run <code>{run.id}</code> · {run.window.startDate} to {run.window.endDate} · generated {run.generatedAt}</p>
              <p className="mt-2 text-sm text-zinc-400">Comparisons with visibility: {run.comparisonDiagnosis.pagesWithVisibility}/{run.inventory.comparisons}; {run.comparisonDiagnosis.impressions} impressions, {run.comparisonDiagnosis.clicks} clicks.</p>
            </Card>
            <section className="mt-10">
              <h2 className="text-2xl font-bold text-white">Top 100 evidence-backed actions</h2>
              <div className="mt-5 space-y-4">
                {run.opportunities.map((item, index) => (
                  <Card key={item.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><p className="text-xs font-semibold text-emerald-400">#{index + 1} · {item.action} · {item.intent}</p><h3 className="mt-1 text-lg font-semibold text-white">{item.query}</h3><p className="mt-1 text-sm text-zinc-500">{item.existingUrl ?? "No canonical inventory URL"}</p></div>
                      <p className="text-2xl font-bold text-white">{item.opportunityScore}</p>
                    </div>
                    <p className="mt-4 text-sm text-zinc-300">{item.recommendation}</p>
                    <p className="mt-3 text-xs text-zinc-500">{item.gsc.impressions} impressions · {item.gsc.clicks} clicks · {(item.gsc.ctr * 100).toFixed(2)}% CTR · position {item.gsc.position.toFixed(1)} · affiliate {item.affiliateStatus} · cannibalization {item.cannibalizationRisk}</p>
                  </Card>
                ))}
              </div>
            </section>
          </>
        )}
      </Container>
    </main>
  );
}
