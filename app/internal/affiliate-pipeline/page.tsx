import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { SectionHeading } from "@/components/SectionHeading";
import { CopyButton } from "@/components/CopyButton";
import { getRankedApplicationCandidates } from "@/lib/revenue/affiliate-priority";
import { buildApplicationPack, APPLICANT_LINKEDIN_URL } from "@/lib/revenue/application-pack";
import { countByPipelineStatus } from "@/lib/revenue/affiliate-pipeline";

/**
 * Affiliate Revenue Engine, Phase 7 — owner application queue. Read-only by
 * design: status changes go through `npm run affiliate:status -- <slug>
 * <status>` (see scripts/affiliate/status.ts), not a button here, because
 * var/agents/affiliate-pipeline.json is gitignored local state — the same
 * pattern every other /internal/* dashboard already uses (maintenance,
 * growth, outbound-clicks). On Vercel's production filesystem that file
 * won't exist between requests, so this page's pipeline-status column will
 * correctly read "unresearched" for everything until the owner's local
 * machine (or a future real datastore) is the one serving the page. The
 * ranking/program data below it comes from the git-tracked research file
 * and is always real in production.
 */
export const metadata: Metadata = {
  title: "Affiliate Pipeline",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  unresearched: "Unresearched",
  program_found: "Program found",
  verified: "Verified",
  ready_to_apply: "Ready to apply",
  application_in_progress: "Application in progress",
  submitted: "Submitted",
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  affiliate_link_received: "Link received",
  activated: "Activated",
  earning: "Earning",
  no_program: "No program",
  program_closed: "Program closed",
  needs_owner_action: "Needs owner action",
  needs_more_research: "Needs more research",
};

function statusTone(status: string): string {
  if (["earning", "activated", "affiliate_link_received", "approved"].includes(status)) return "border-emerald-500/30 text-emerald-300";
  if (["pending_review", "submitted", "application_in_progress"].includes(status)) return "border-amber-500/30 text-amber-300";
  if (["rejected", "no_program", "program_closed", "needs_owner_action"].includes(status)) return "border-red-500/30 text-red-300";
  return "border-white/10 text-zinc-400";
}

export default function AffiliatePipelinePage() {
  const ranked = getRankedApplicationCandidates();
  const statusCounts = countByPipelineStatus();

  const ready = ranked.filter((r) => r.pipelineStatus === "unresearched" || r.pipelineStatus === "verified" || r.pipelineStatus === "ready_to_apply");
  const waiting = ranked.filter((r) => ["submitted", "pending_review", "application_in_progress"].includes(r.pipelineStatus));
  const blocked = ranked.filter((r) => ["needs_owner_action", "rejected", "program_closed"].includes(r.pipelineStatus));

  return (
    <main className="flex-1 py-16 sm:py-20">
      <Container>
        <header className="max-w-3xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950">
            <Wallet className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Affiliate pipeline
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Internal only — not indexed, not linked from the site. {ranked.length} products have a
            confirmed official affiliate program, ranked by real signals (see{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">lib/revenue/affiliate-priority.ts</code>).
            Change an application&apos;s status with{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">npm run affiliate:status -- &lt;slug&gt; &lt;status&gt;</code>.
          </p>
          {!APPLICANT_LINKEDIN_URL ? (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
              Owner action needed: the Miloosh LinkedIn company-page URL is not recorded anywhere yet. Every
              prepared application pack below is missing it until it is provided once.
            </p>
          ) : null}
        </header>

        <section className="mt-12 grid gap-6 sm:grid-cols-4">
          <Card>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Confirmed programs</p>
            <p className="mt-2 text-3xl font-bold text-white">{ranked.length}</p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Submitted / pending</p>
            <p className="mt-2 text-3xl font-bold text-white">{statusCounts.submitted + statusCounts.pending_review}</p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Approved / earning</p>
            <p className="mt-2 text-3xl font-bold text-white">{statusCounts.approved + statusCounts.activated + statusCounts.earning}</p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Needs owner action</p>
            <p className="mt-2 text-3xl font-bold text-white">{statusCounts.needs_owner_action}</p>
          </Card>
        </section>

        <section className="mt-14">
          <SectionHeading
            eyebrow="Ready now"
            title="Highest-priority applications not yet started"
            description="Ranked by the priority model — availability, category value, commercial/buying intent, real GSC traffic where recorded, approval friction, and a recurring-commission bonus."
          />
          <div className="mt-8 grid gap-4">
            {ready.length === 0 ? (
              <Card><p className="text-sm text-zinc-500">Nothing in this bucket right now.</p></Card>
            ) : (
              ready.map((r) => {
                const pack = buildApplicationPack(r.slug);
                return (
                  <Card key={r.slug}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">{r.name}</h3>
                        <Badge>{pack?.program?.networkName ?? pack?.program?.type ?? "network unknown"}</Badge>
                        <Badge className={statusTone(r.pipelineStatus)}>{STATUS_LABEL[r.pipelineStatus]}</Badge>
                      </div>
                      <span className="text-sm text-zinc-400">Priority {r.totalScore}/100</span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                      {pack?.program?.commissionModel ?? "Commission model not recorded."}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                      {pack?.applicationUrl ? (
                        <a
                          href={pack.applicationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
                        >
                          Open application ↗
                        </a>
                      ) : (
                        <span className="text-zinc-500">No confirmed application URL yet.</span>
                      )}
                      {pack ? <CopyButton value={pack.description} label="Copy description" /> : null}
                      {pack ? <CopyButton value={pack.promotionStrategy} label="Copy promotion strategy" /> : null}
                      {pack ? <CopyButton value={pack.website} label="Copy website" /> : null}
                      {pack ? <CopyButton value={pack.businessEmail} label="Copy email" /> : null}
                      {pack?.linkedinUrl ? <CopyButton value={pack.linkedinUrl} label="Copy LinkedIn" /> : null}
                    </div>

                    {pack && pack.missingOwnerInputs.length > 0 ? (
                      <p className="mt-3 text-xs text-amber-300">{pack.missingOwnerInputs.join(" ")}</p>
                    ) : null}

                    <p className="mt-3 text-xs text-zinc-600">
                      Estimated owner time: 1-3 min once the application URL is confirmed.
                    </p>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-14">
          <SectionHeading eyebrow="Waiting" title="Submitted, awaiting the vendor" />
          <div className="mt-8 grid gap-4">
            {waiting.length === 0 ? (
              <Card><p className="text-sm text-zinc-500">Nothing waiting right now.</p></Card>
            ) : (
              waiting.map((r) => (
                <Card key={r.slug} className="flex items-center justify-between gap-4">
                  <span className="font-medium text-white">{r.name}</span>
                  <Badge className={statusTone(r.pipelineStatus)}>{STATUS_LABEL[r.pipelineStatus]}</Badge>
                </Card>
              ))
            )}
          </div>
        </section>

        <section className="mt-14">
          <SectionHeading eyebrow="Blocked" title="Needs owner attention before it can move" />
          <div className="mt-8 grid gap-4">
            {blocked.length === 0 ? (
              <Card><p className="text-sm text-zinc-500">Nothing blocked right now.</p></Card>
            ) : (
              blocked.map((r) => (
                <Card key={r.slug} className="flex items-center justify-between gap-4">
                  <span className="font-medium text-white">{r.name}</span>
                  <Badge className={statusTone(r.pipelineStatus)}>{STATUS_LABEL[r.pipelineStatus]}</Badge>
                </Card>
              ))
            )}
          </div>
        </section>

        <section className="mt-14">
          <SectionHeading
            title="Full ranked list"
            description="Every product with a confirmed program, most valuable first."
          />
          <Card className="mt-8 overflow-x-auto">
            <div className="min-w-[960px]">
              <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_1fr_1fr] gap-4 border-b border-white/10 pb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <span>Software</span>
                <span>Network</span>
                <span>Status</span>
                <span>Score</span>
                <span>Traffic</span>
                <span>Approval ease</span>
                <span>Recurring</span>
              </div>
              <div className="divide-y divide-white/10">
                {ranked.map((r) => {
                  const pack = buildApplicationPack(r.slug);
                  return (
                    <div key={r.slug} className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr_1fr_1fr] gap-4 py-3 text-sm">
                      <span className="font-medium text-white">{r.name}</span>
                      <span className="text-zinc-400">{pack?.program?.networkName ?? pack?.program?.type ?? "unknown"}</span>
                      <span>
                        <Badge className={statusTone(r.pipelineStatus)}>{STATUS_LABEL[r.pipelineStatus]}</Badge>
                      </span>
                      <span className="text-zinc-300">{r.totalScore}/100</span>
                      <span className="text-zinc-400">
                        {r.trafficDataSource === "real-gsc-cohort" ? `${r.trafficOpportunityScore}/10 (real)` : "no data"}
                      </span>
                      <span className="text-zinc-400">{r.approvalFrictionScore}/10</span>
                      <span className="text-zinc-400">{r.recurringBonus > 0 ? "yes" : "no"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </section>
      </Container>
    </main>
  );
}
