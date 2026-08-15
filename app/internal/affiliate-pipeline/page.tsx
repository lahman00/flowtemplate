import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { SectionHeading } from "@/components/SectionHeading";
import { CopyButton } from "@/components/CopyButton";
import { getRankedApplicationCandidates } from "@/lib/revenue/affiliate-priority";
import { buildApplicationPack, APPLICANT_LINKEDIN_URL } from "@/lib/revenue/application-pack";
import { countByPipelineStatus, readAffiliatePipeline } from "@/lib/revenue/affiliate-pipeline";
import {
  markSubmittedAction,
  markRejectedAction,
  markNeedsOwnerActionAction,
  markApprovedWithUrlAction,
} from "@/lib/revenue/affiliate-pipeline-actions";
import { readNetworkStatuses } from "@/lib/revenue/affiliate-network-status";

/**
 * Affiliate Revenue Engine, Phase 7 / Completion Pass — owner application
 * queue. Backed by a private Vercel Blob store (lib/revenue/affiliate-
 * pipeline.ts), not a gitignored local file — status changes made here
 * (or via `npm run affiliate:status`) persist across deployments and are
 * visible from this same protected page in production, unlike every
 * other /internal/* dashboard's var/agents/*.json reports.
 */
export const metadata: Metadata = {
  title: "Affiliate Pipeline",
  robots: { index: false, follow: false },
};

/**
 * Forces per-request rendering — without this, `next build` would
 * statically prerender this page once and freeze whatever the Blob store
 * held at build time, so a "Mark submitted" click (or a real approval)
 * would never show up without a full redeploy. Matches the same real
 * fix already applied to /internal/growth and /internal/maintenance for
 * the same reason.
 */
export const dynamic = "force-dynamic";

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
  waiting_on_network: "Waiting on network approval",
};

const NETWORK_STATUS_LABEL: Record<string, string> = {
  not_applied: "Not applied",
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

function statusTone(status: string): string {
  if (["earning", "activated", "affiliate_link_received", "approved"].includes(status)) return "border-emerald-500/30 text-emerald-300";
  if (["pending_review", "submitted", "application_in_progress", "waiting_on_network"].includes(status)) return "border-amber-500/30 text-amber-300";
  if (["rejected", "no_program", "program_closed", "needs_owner_action"].includes(status)) return "border-red-500/30 text-red-300";
  return "border-white/10 text-zinc-400";
}

export default async function AffiliatePipelinePage() {
  /**
   * Blob-operations incident (2026-08-15): this used to be 2 separate
   * calls, each internally re-fetching the pipeline — and worse,
   * getRankedApplicationCandidates() used to call getPipelineEntry() (its
   * own full Blob read) once per software product, ~217 reads for one
   * page load. Fetching once here and passing the same array into both
   * functions below brings this page down to ~2 total Blob reads
   * (pipeline + network statuses), matching what a single dashboard load
   * should actually cost.
   */
  const pipelineEntries = await readAffiliatePipeline();
  const ranked = await getRankedApplicationCandidates(pipelineEntries);
  const statusCounts = await countByPipelineStatus(pipelineEntries);
  const networkStatuses = await readNetworkStatuses();

  /**
   * PartnerStack Application Sprint (2026-08-14) — a dedicated queue for
   * the confirmed PartnerStack-network programs, derived from the same
   * stored data as everything else (not a hardcoded slug list) so it
   * stays correct if more PartnerStack programs get added later. This is
   * the workflow the owner actually uses: Open application -> apply on
   * PartnerStack directly -> Mark submitted -> the next program surfaces
   * automatically on the next render (no client-side state needed, since
   * this page is force-dynamic and re-reads real Blob state every time).
   */
  const partnerStackPrograms = ranked.filter((r) => {
    if (r.slug === "pipedrive") return false; // separate, already-submitted application — preserved on its own, never re-added here
    const pack = buildApplicationPack(r.slug);
    return pack?.program?.networkName === "PartnerStack" && r.readyToApply; // readyToApply also excludes blocked programs (e.g. Notion, closed to new affiliates) even though their networkName is PartnerStack
  });
  const psRemaining = partnerStackPrograms.filter((r) => r.pipelineStatus === "ready_to_apply");
  const psOwnerAction = partnerStackPrograms.filter((r) => r.pipelineStatus === "needs_owner_action");
  const psDone = partnerStackPrograms.filter((r) => r.pipelineStatus !== "ready_to_apply" && r.pipelineStatus !== "needs_owner_action");
  const psCurrent = psRemaining[0];
  const psNext = psRemaining[1];

  const notYetStarted = (r: (typeof ranked)[number]) =>
    r.pipelineStatus === "unresearched" || r.pipelineStatus === "verified" || r.pipelineStatus === "ready_to_apply";
  const partnerStackSlugs = new Set(partnerStackPrograms.map((r) => r.slug));
  const ready = ranked.filter((r) => notYetStarted(r) && r.readyToApply && !partnerStackSlugs.has(r.slug));
  const waiting = ranked.filter((r) =>
    ["submitted", "pending_review", "application_in_progress", "waiting_on_network"].includes(r.pipelineStatus)
  );
  const blocked = ranked.filter(
    (r) => ["needs_owner_action", "rejected", "program_closed"].includes(r.pipelineStatus) || (notYetStarted(r) && !r.readyToApply)
  );
  const approvedPrograms = ranked.filter((r) => ["approved", "affiliate_link_received", "activated", "earning"].includes(r.pipelineStatus));

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
            Use the buttons below, or{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">npm run affiliate:status -- &lt;slug&gt; &lt;status&gt;</code>{" "}
            for any other transition.
          </p>
          {!APPLICANT_LINKEDIN_URL ? (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
              Owner action needed: the Miloosh LinkedIn company-page URL is not recorded anywhere yet. Every
              prepared application pack below is missing it until it is provided once.
            </p>
          ) : null}
        </header>

        <section className="mt-12">
          <SectionHeading
            eyebrow="PartnerStack Application Sprint"
            title={`${psDone.length + psOwnerAction.length}/${partnerStackPrograms.length} processed`}
            description="PartnerStack's Network Profile is approved. Every program below is confirmed, has a verified direct application URL, and needs only a login + click on PartnerStack itself — there's no bulk-apply mechanism on PartnerStack's side (investigated 2026-08-14: bulk actions exist only for program owners approving applicants, not for partners applying). Open the application, apply on PartnerStack, then Mark submitted — the next program surfaces automatically."
          />

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <Card><p className="text-xs uppercase tracking-wider text-zinc-500">Remaining</p><p className="mt-2 text-2xl font-bold text-white">{psRemaining.length}</p></Card>
            <Card><p className="text-xs uppercase tracking-wider text-zinc-500">Submitted / pending</p><p className="mt-2 text-2xl font-bold text-white">{psDone.length}</p></Card>
            <Card><p className="text-xs uppercase tracking-wider text-zinc-500">Needs owner action</p><p className="mt-2 text-2xl font-bold text-white">{psOwnerAction.length}</p></Card>
            <Card><p className="text-xs uppercase tracking-wider text-zinc-500">Total in sprint</p><p className="mt-2 text-2xl font-bold text-white">{partnerStackPrograms.length}</p></Card>
          </div>

          {psCurrent ? (
            (() => {
              const pack = buildApplicationPack(psCurrent.slug)!;
              return (
                <Card className="mt-6 border-white/20 bg-white/[0.05]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Badge className="border-white/30 text-white">Current</Badge>
                      <h3 className="text-xl font-semibold text-white">{psCurrent.name}</h3>
                      <span className="text-sm text-zinc-500">Priority {psCurrent.totalScore}/100</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{pack.program?.commissionModel ?? "Commission model not recorded."}</p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    <a
                      href={pack.applicationUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
                    >
                      Open application ↗
                    </a>
                    <CopyButton value={pack.description} label="Copy description" />
                    <CopyButton value={pack.promotionStrategy} label="Copy promotion strategy" />
                    <CopyButton value={pack.website} label="Copy website" />
                    <CopyButton value={pack.businessEmail} label="Copy email" />
                    {pack.linkedinUrl ? <CopyButton value={pack.linkedinUrl} label="Copy LinkedIn" /> : null}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <form action={markSubmittedAction.bind(null, psCurrent.slug)}>
                      <button type="submit" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400">
                        Mark submitted → next
                      </button>
                    </form>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-emerald-300 hover:text-emerald-200">Mark approved instead</summary>
                      <form action={markApprovedWithUrlAction.bind(null, psCurrent.slug)} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          type="url"
                          name="affiliateUrl"
                          placeholder="Real affiliate/referral URL — e.g. https://…partnerlinks.io/…"
                          className="min-w-[280px] flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                          required
                        />
                        <input
                          type="text"
                          name="notes"
                          placeholder="Optional notes"
                          className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600 sm:w-48"
                        />
                        <button type="submit" className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400">
                          Save & mark approved → next
                        </button>
                      </form>
                    </details>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-zinc-400 hover:text-white">Needs owner action instead</summary>
                      <form action={markNeedsOwnerActionAction.bind(null, psCurrent.slug)} className="mt-3 flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          name="reason"
                          placeholder="e.g. CAPTCHA, requires accepting a legal agreement, needs a personal name…"
                          className="min-w-[280px] flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                          required
                        />
                        <button type="submit" className="rounded-lg border border-amber-500/30 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/10">
                          Record blocker → next
                        </button>
                      </form>
                    </details>
                  </div>
                </Card>
              );
            })()
          ) : (
            <Card className="mt-6">
              <p className="text-sm text-zinc-300">
                {partnerStackPrograms.length === 0
                  ? "No confirmed PartnerStack programs recorded yet."
                  : "All PartnerStack programs processed — nothing left in this sprint."}
              </p>
            </Card>
          )}

          {psNext ? (
            <Card className="mt-4">
              <div className="flex items-center gap-3">
                <Badge>Next</Badge>
                <span className="font-medium text-white">{psNext.name}</span>
                <span className="text-sm text-zinc-500">Priority {psNext.totalScore}/100</span>
              </div>
            </Card>
          ) : null}

          <details className="mt-6">
            <summary className="cursor-pointer text-sm text-zinc-400 hover:text-white">Full sprint queue ({partnerStackPrograms.length})</summary>
            <div className="mt-4 grid gap-2">
              {partnerStackPrograms.map((r) => (
                <div key={r.slug} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm">
                  <span className="text-white">{r.name}</span>
                  <Badge className={statusTone(r.pipelineStatus)}>{STATUS_LABEL[r.pipelineStatus]}</Badge>
                </div>
              ))}
            </div>
          </details>
        </section>

        <section className="mt-14 grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
          <Card>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Confirmed programs</p>
            <p className="mt-2 text-3xl font-bold text-white">{ranked.length}</p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Submitted / pending</p>
            <p className="mt-2 text-3xl font-bold text-white">{statusCounts.submitted + statusCounts.pending_review}</p>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Waiting on network</p>
            <p className="mt-2 text-3xl font-bold text-white">{statusCounts.waiting_on_network}</p>
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
            description="Non-PartnerStack programs — the 12 PartnerStack ones have their own sprint above. Ranked by the priority model — availability, category value, commercial/buying intent, real GSC traffic where recorded, approval friction, and a recurring-commission bonus. Excludes programs with a known blocker (closed to new affiliates, doesn't fit Miloosh's model, or no confirmed application URL) — see the full ranked list at the bottom for those."
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
                      <form action={markSubmittedAction.bind(null, r.slug)}>
                        <button
                          type="submit"
                          className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
                        >
                          Mark submitted
                        </button>
                      </form>
                      <details className="text-xs">
                        <summary className="cursor-pointer text-emerald-300 hover:text-emerald-200">Already approved?</summary>
                        <form action={markApprovedWithUrlAction.bind(null, r.slug)} className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            type="url"
                            name="affiliateUrl"
                            placeholder="Real affiliate/referral URL"
                            className="min-w-[240px] flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                            required
                          />
                          <button type="submit" className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400">
                            Save & mark approved
                          </button>
                        </form>
                      </details>
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
          <SectionHeading
            eyebrow="Waiting"
            title="Submitted, awaiting a decision"
            description="Some of these are waiting on the vendor's own review; others are waiting on a network-level approval (e.g. PartnerStack) that gates several programs at once — see Affiliate networks below."
          />
          <div className="mt-8 grid gap-4">
            {waiting.length === 0 ? (
              <Card><p className="text-sm text-zinc-500">Nothing waiting right now.</p></Card>
            ) : (
              waiting.map((r) => (
                <Card key={r.slug} className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-white">{r.name}</span>
                    <Badge className={statusTone(r.pipelineStatus)}>{STATUS_LABEL[r.pipelineStatus]}</Badge>
                  </div>
                  {r.pipelineStatus === "waiting_on_network" ? (
                    <span className="text-sm text-zinc-500">Will move to Ready once the network approves.</span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <details className="text-xs">
                        <summary className="cursor-pointer rounded-lg border border-emerald-500/30 px-3 py-1.5 font-semibold text-emerald-300 transition hover:bg-emerald-500/10">
                          Mark approved
                        </summary>
                        <form action={markApprovedWithUrlAction.bind(null, r.slug)} className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            type="url"
                            name="affiliateUrl"
                            placeholder="Real affiliate/referral URL"
                            className="min-w-[240px] flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
                            required
                          />
                          <button type="submit" className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400">
                            Save
                          </button>
                        </form>
                      </details>
                      <form action={markRejectedAction.bind(null, r.slug)}>
                        <button
                          type="submit"
                          className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
                        >
                          Mark rejected
                        </button>
                      </form>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </section>

        <section className="mt-14">
          <SectionHeading
            eyebrow="Approved / Active"
            title="Successful partnerships"
            description="Every program with a real, recorded affiliate URL — this is the live source of truth for what's actually earning or ready to earn."
          />
          <div className="mt-8 grid gap-4">
            {approvedPrograms.length === 0 ? (
              <Card><p className="text-sm text-zinc-500">No approved programs yet.</p></Card>
            ) : (
              approvedPrograms.map((r) => (
                <Card key={r.slug} className="border-emerald-500/20 bg-emerald-500/[0.03]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-white">{r.name}</h3>
                      <Badge className={statusTone(r.pipelineStatus)}>{STATUS_LABEL[r.pipelineStatus]}</Badge>
                    </div>
                    {r.approvedAt ? <span className="text-sm text-zinc-500">Approved {r.approvedAt.slice(0, 10)}</span> : null}
                  </div>

                  {r.affiliateUrl ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                      <code className="max-w-full truncate rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-300">{r.affiliateUrl}</code>
                      <CopyButton value={r.affiliateUrl} label="Copy affiliate link" />
                      <a
                        href={r.affiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
                      >
                        Open affiliate link ↗
                      </a>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-amber-300">Approved, but no affiliate URL recorded yet — this program&apos;s CTA won&apos;t activate on the site until one is added.</p>
                  )}

                  {r.pipelineNotes ? <p className="mt-3 text-xs text-zinc-500">{r.pipelineNotes}</p> : null}
                </Card>
              ))
            )}
          </div>
        </section>

        <section className="mt-14">
          <SectionHeading eyebrow="Networks" title="Affiliate network relationships" description="Network-level status — separate from individual program applications, but several programs are gated behind these." />
          <div className="mt-8 grid gap-4">
            {networkStatuses.length === 0 ? (
              <Card><p className="text-sm text-zinc-500">No network-level relationships recorded yet.</p></Card>
            ) : (
              networkStatuses.map((n) => (
                <Card key={n.network} className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-white">{n.network}</span>
                    <Badge className={statusTone(n.status)}>{NETWORK_STATUS_LABEL[n.status]}</Badge>
                  </div>
                  <span className="text-sm text-zinc-500">
                    {n.submittedAt ? `Submitted ${n.submittedAt.slice(0, 10)}` : null}
                    {n.notes ? ` — ${n.notes}` : null}
                  </span>
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
                <Card key={r.slug}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-white">{r.name}</span>
                    <Badge className={statusTone(r.pipelineStatus)}>{STATUS_LABEL[r.pipelineStatus]}</Badge>
                  </div>
                  {r.blockReason ? <p className="mt-2 text-sm text-zinc-400">{r.blockReason}</p> : null}
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
