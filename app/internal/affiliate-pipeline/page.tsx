import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { SectionHeading } from "@/components/SectionHeading";
import { CopyButton } from "@/components/CopyButton";
import { getRankedApplicationCandidates, getAllPriorities, type AffiliatePriorityBreakdown } from "@/lib/revenue/affiliate-priority";
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
 * Affiliate Revenue Engine — owner application queue. Backed by a private
 * Vercel Blob store (lib/revenue/affiliate-pipeline.ts), not a gitignored
 * local file — status changes made here (or via `npm run affiliate:status`)
 * persist across deployments and are visible from this same protected page
 * in production.
 *
 * Work-queue reorganization (2026-08-15): the page used to group programs
 * primarily by internal status/network sprint. This rewrite leads with a
 * single "Apply Next" queue — the one thing the owner actually needs on
 * open — then Submitted / Approved / Blocked / Closed below it. This is a
 * UI/ordering change only: every section below still reads the exact same
 * pipeline data as before, nothing here writes to it except the same
 * pre-existing Mark submitted / Mark approved / Needs owner action forms.
 */
export const metadata: Metadata = {
  title: "Affiliate Pipeline",
  robots: { index: false, follow: false },
};

/**
 * Forces per-request rendering — without this, `next build` would
 * statically prerender this page once and freeze whatever the Blob store
 * held at build time.
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

function statusTone(status: string): string {
  if (["earning", "activated", "affiliate_link_received", "approved"].includes(status)) return "border-emerald-500/30 text-emerald-300";
  if (["pending_review", "submitted", "application_in_progress", "waiting_on_network"].includes(status)) return "border-amber-500/30 text-amber-300";
  if (["rejected", "no_program", "program_closed", "needs_owner_action"].includes(status)) return "border-red-500/30 text-red-300";
  return "border-white/10 text-zinc-400";
}

function formatDate(iso: string | null): string | null {
  return iso ? iso.slice(0, 10) : null;
}

type Breakdown = AffiliatePriorityBreakdown;

/**
 * Owner-directed application sequence (2026-08-15) — deliberately NOT
 * re-derived from the priority score every render. PartnerStack is frozen
 * on Support Ticket #120795, so every PartnerStack-network program is
 * excluded here regardless of score; programs needing a brand-new account
 * on a different network (CJ, Awin, Rewardful, Dub, FirstPromoter, direct)
 * are left for the Blocked section rather than queued, since the real
 * bottleneck is "which account do I need to create next," not raw score.
 * HubSpot is deliberately absent — its application was already submitted
 * via Impact.com on 2026-08-15, so it lives in the Submitted section.
 */
const APPLY_NEXT_SEQUENCE = ["wix", "shopify", "squarespace", "semrush"];

/** Statuses meaning "hasn't actually been applied to yet" — used both to build Apply Next and to auto-drop an entry from it the moment its real status moves on, so this list self-corrects without a code change. */
const NOT_YET_APPLIED_STATUSES = new Set(["unresearched", "program_found", "verified", "ready_to_apply", "needs_owner_action"]);

/**
 * UI-only classification, NOT a pipeline/data change — data/revenue/
 * affiliate-programs.ts's bigcommerce entry still says programExists:
 * "yes" (correcting that file is out of scope for this ordering-only
 * pass). Directly confirmed 2026-08-15 via bigcommerce.com/affiliates/:
 * "As of May 17, 2025, BigCommerce will be discontinuing its Affiliate
 * program" — real and verified, just not yet written back to the
 * research file itself.
 */
const KNOWN_CLOSED_SLUGS: Record<string, string> = {
  bigcommerce: "BigCommerce's affiliate program was discontinued May 17, 2025, per the vendor's own official page (bigcommerce.com/affiliates/).",
};

function networkGroupLabel(networkName: string | null | undefined, slug: string): string {
  if (slug === "constant-contact") return "Broken / needs re-verification";
  if (networkName === "PartnerStack") return "PartnerStack — waiting for Support Ticket #120795";
  if (networkName === "Impact") return "Impact.com account required";
  if (networkName === "Commission Junction") return "Commission Junction (CJ) account required";
  if (networkName === "Awin") return "Awin account required";
  if (networkName === "Rewardful") return "Rewardful account required";
  if (networkName === "Dub") return "Dub account required";
  if (networkName === "FirstPromoter") return "FirstPromoter account required";
  return "Direct vendor account required";
}

const NETWORK_GROUP_ORDER = [
  "PartnerStack — waiting for Support Ticket #120795",
  "Impact.com account required",
  "Commission Junction (CJ) account required",
  "Awin account required",
  "Rewardful account required",
  "Dub account required",
  "FirstPromoter account required",
  "Direct vendor account required",
  "Broken / needs re-verification",
];

function CopySet({ pack }: { pack: NonNullable<ReturnType<typeof buildApplicationPack>> }) {
  return (
    <>
      <CopyButton value={pack.description} label="Copy description" />
      <CopyButton value={pack.promotionStrategy} label="Copy promotion strategy" />
      <CopyButton value={pack.audienceDescription} label="Copy audience description" />
      <CopyButton value={pack.promotedSoftwareSummary} label="Copy software summary" />
      <CopyButton
        value={Object.entries(pack.commonAnswers).map(([q, a]) => `${q}\n${a}`).join("\n\n")}
        label="Copy common answers"
      />
      <CopyButton value={pack.website} label="Copy website" />
      <CopyButton value={pack.businessEmail} label="Copy email" />
      {pack.linkedinUrl ? <CopyButton value={pack.linkedinUrl} label="Copy LinkedIn" /> : null}
    </>
  );
}

export default async function AffiliatePipelinePage() {
  const pipelineEntries = await readAffiliatePipeline();
  const ranked = await getRankedApplicationCandidates(pipelineEntries);
  const allPriorities = await getAllPriorities(pipelineEntries);
  const statusCounts = await countByPipelineStatus(pipelineEntries);
  const networkStatuses = await readNetworkStatuses();

  // ---- APPLY NEXT ----
  const applyNextQueue = APPLY_NEXT_SEQUENCE
    .map((slug) => ranked.find((r) => r.slug === slug))
    .filter((r): r is Breakdown => r !== undefined)
    .filter((r) => NOT_YET_APPLIED_STATUSES.has(r.pipelineStatus));
  const applyNextSlugs = new Set(applyNextQueue.map((r) => r.slug));
  const current = applyNextQueue[0];
  const upcoming = applyNextQueue.slice(1);

  // ---- SUBMITTED — WAITING FOR DECISION ----
  const submittedPrograms = ranked
    .filter((r) => ["submitted", "pending_review", "application_in_progress", "waiting_on_network"].includes(r.pipelineStatus))
    .sort((a, b) => (a.submittedAt ?? "9999").localeCompare(b.submittedAt ?? "9999"));

  // ---- APPROVED / ACTIVE ----
  const approvedPrograms = ranked.filter((r) => ["approved", "affiliate_link_received", "activated", "earning"].includes(r.pipelineStatus));
  const affiliateUrlCounts = new Map<string, number>();
  for (const r of approvedPrograms) {
    if (r.affiliateUrl) affiliateUrlCounts.set(r.affiliateUrl, (affiliateUrlCounts.get(r.affiliateUrl) ?? 0) + 1);
  }
  const isDuplicateAffiliateUrl = (r: Breakdown) => Boolean(r.affiliateUrl) && (affiliateUrlCounts.get(r.affiliateUrl!) ?? 0) > 1;

  // ---- CLOSED / NOT ACTIONABLE ----
  type ClosedEntry = Breakdown & { closedReason: string };
  const closedFromRanked: ClosedEntry[] = ranked
    .filter((r) => KNOWN_CLOSED_SLUGS[r.slug])
    .map((r) => ({ ...r, closedReason: KNOWN_CLOSED_SLUGS[r.slug] }));
  const closedFromUnconfirmed: ClosedEntry[] = allPriorities
    .filter((r) => r.programExists !== "yes" && !KNOWN_CLOSED_SLUGS[r.slug] && pipelineEntries.some((e) => e.slug === r.slug))
    .map((r) => ({ ...r, closedReason: r.blockReason ?? r.pipelineNotes ?? "Program status could not be confirmed." }));
  const closedPrograms = [...closedFromRanked, ...closedFromUnconfirmed];
  const closedSlugs = new Set(closedPrograms.map((r) => r.slug));

  // ---- BLOCKED / OWNER ACTION ----
  const blockedPrograms = ranked.filter(
    (r) => r.pipelineStatus === "needs_owner_action" && !applyNextSlugs.has(r.slug) && !closedSlugs.has(r.slug)
  );
  const blockedGroups = new Map<string, Breakdown[]>();
  for (const r of blockedPrograms) {
    const pack = buildApplicationPack(r.slug);
    const label = networkGroupLabel(pack?.program?.networkName, r.slug);
    if (!blockedGroups.has(label)) blockedGroups.set(label, []);
    blockedGroups.get(label)!.push(r);
  }
  const orderedBlockedGroups = NETWORK_GROUP_ORDER.filter((label) => blockedGroups.has(label)).map(
    (label) => [label, blockedGroups.get(label)!] as const
  );

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
            Internal only — not indexed, not linked from the site. Organized as a work queue: what to apply to now, what
            comes next, what&apos;s already submitted, what&apos;s approved, and what&apos;s blocked and why. See{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">lib/revenue/affiliate-priority.ts</code> for the
            scoring model, or{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">npm run affiliate:status -- &lt;slug&gt; &lt;status&gt;</code>{" "}
            for any transition not covered by a button below.
          </p>
          {!APPLICANT_LINKEDIN_URL ? (
            <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
              Owner action needed: the Miloosh LinkedIn company-page URL is not recorded anywhere yet. Every prepared
              application pack below is missing it until it is provided once.
            </p>
          ) : null}
        </header>

        {/* Compact progress/queue summary */}
        <section className="mt-10 grid gap-4 sm:grid-cols-5">
          <Card><p className="text-xs uppercase tracking-wider text-zinc-500">Apply next</p><p className="mt-2 text-2xl font-bold text-white">{applyNextQueue.length}</p></Card>
          <Card><p className="text-xs uppercase tracking-wider text-zinc-500">Submitted</p><p className="mt-2 text-2xl font-bold text-white">{submittedPrograms.length}</p></Card>
          <Card><p className="text-xs uppercase tracking-wider text-zinc-500">Approved</p><p className="mt-2 text-2xl font-bold text-white">{approvedPrograms.length}</p></Card>
          <Card><p className="text-xs uppercase tracking-wider text-zinc-500">Blocked</p><p className="mt-2 text-2xl font-bold text-white">{blockedPrograms.length}</p></Card>
          <Card><p className="text-xs uppercase tracking-wider text-zinc-500">Closed</p><p className="mt-2 text-2xl font-bold text-white">{closedPrograms.length}</p></Card>
        </section>

        {/* ============ 1. APPLY NEXT ============ */}
        <section className="mt-14">
          <SectionHeading
            eyebrow="Apply Next"
            title={current ? `Next: ${current.name}` : "Nothing queued right now"}
            description="The exact recommended sequence — batched by network to minimize owner work, not raw priority score. PartnerStack programs are excluded while Support Ticket #120795 is open."
          />

          {current ? (
            (() => {
              const pack = buildApplicationPack(current.slug)!;
              const eligibilityWarning = pack.program?.countryRestrictions;
              return (
                <Card className="mt-6 border-white/20 bg-white/[0.05]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Badge className="border-white/30 text-white">Current — apply now</Badge>
                      <h3 className="text-xl font-semibold text-white">{current.name}</h3>
                      <Badge>{pack.program?.networkName ?? "network unknown"}</Badge>
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    <span className="font-medium text-zinc-300">Commission: </span>
                    {pack.program?.commissionModel ?? "Commission model not recorded."}
                  </p>
                  {pack.program?.cookieDuration ? (
                    <p className="mt-1 text-xs text-zinc-500">Cookie/attribution: {pack.program.cookieDuration}</p>
                  ) : null}

                  {eligibilityWarning ? (
                    <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-200">
                      <span className="font-semibold">Eligibility check required: </span>
                      {eligibilityWarning} Miloosh currently meeting this requirement has not been verified — confirm before applying.
                    </p>
                  ) : null}

                  <p className="mt-3 text-sm text-zinc-400">
                    <span className="font-medium text-zinc-300">Exact action required: </span>
                    {current.ownerActionRequired ?? current.pipelineNotes ?? "Create the network account (if needed), then apply."}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                    {pack.applicationUrl ? (
                      <a
                        href={pack.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
                      >
                        Open application ↗
                      </a>
                    ) : (
                      <span className="text-zinc-500">No confirmed application URL yet.</span>
                    )}
                    <CopySet pack={pack} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <form action={markSubmittedAction.bind(null, current.slug)}>
                      <button type="submit" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400">
                        Mark submitted → next
                      </button>
                    </form>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-emerald-300 hover:text-emerald-200">Mark approved instead</summary>
                      <form action={markApprovedWithUrlAction.bind(null, current.slug)} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <input
                          type="url"
                          name="affiliateUrl"
                          placeholder="Real affiliate/referral URL"
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
                      <form action={markNeedsOwnerActionAction.bind(null, current.slug)} className="mt-3 flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          name="reason"
                          placeholder="e.g. CAPTCHA, requires accepting a legal agreement…"
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
            <Card className="mt-6"><p className="text-sm text-zinc-300">Nothing actionable queued right now — check Blocked below.</p></Card>
          )}

          {upcoming.length > 0 ? (
            <div className="mt-4 grid gap-2">
              {upcoming.map((r, i) => {
                const pack = buildApplicationPack(r.slug);
                const eligibilityFlag = pack?.program?.countryRestrictions;
                return (
                  <Card key={r.slug} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 text-xs font-semibold text-zinc-400">
                        {i + 2}
                      </span>
                      <span className="font-medium text-white">{r.name}</span>
                      <Badge>{pack?.program?.networkName ?? "network unknown"}</Badge>
                      {eligibilityFlag ? <span className="text-xs text-amber-300">eligibility check required</span> : null}
                    </div>
                    {pack?.applicationUrl ? (
                      <a
                        href={pack.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-white underline decoration-white/30 underline-offset-4 hover:decoration-white"
                      >
                        Open application ↗
                      </a>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          ) : null}
        </section>

        {/* ============ 2. SUBMITTED — WAITING FOR DECISION ============ */}
        <section className="mt-14">
          <SectionHeading
            eyebrow="Submitted"
            title="Waiting for a decision"
            description="Applications already sent — waiting on the vendor's own review, or (for PartnerStack ones) on the network gate itself."
          />
          <div className="mt-8 grid gap-4">
            {submittedPrograms.length === 0 ? (
              <Card><p className="text-sm text-zinc-500">Nothing submitted right now.</p></Card>
            ) : (
              submittedPrograms.map((r) => {
                const pack = buildApplicationPack(r.slug);
                const submittedDate = formatDate(r.submittedAt);
                return (
                  <Card key={r.slug} className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-white">{r.name}</span>
                      <Badge>{pack?.program?.networkName ?? "network unknown"}</Badge>
                      <Badge className={statusTone(r.pipelineStatus)}>{STATUS_LABEL[r.pipelineStatus]}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-zinc-500">
                        {submittedDate ? `Submitted ${submittedDate}` : "Submission date not recorded"}
                      </span>
                      {r.pipelineStatus !== "waiting_on_network" ? (
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
                      ) : null}
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </section>

        {/* ============ 3. APPROVED / ACTIVE ============ */}
        <section className="mt-14">
          <SectionHeading
            eyebrow="Approved / Active"
            title="Successful partnerships"
            description="Every program with a real, recorded affiliate URL — the live source of truth for what's actually earning or ready to earn."
          />
          <div className="mt-8 grid gap-4">
            {approvedPrograms.length === 0 ? (
              <Card><p className="text-sm text-zinc-500">No approved programs yet.</p></Card>
            ) : (
              approvedPrograms.map((r) => {
                const duplicate = isDuplicateAffiliateUrl(r);
                return (
                  <Card
                    key={r.slug}
                    className={duplicate ? "border-red-500/30 bg-red-500/[0.03]" : "border-emerald-500/20 bg-emerald-500/[0.03]"}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-white">{r.name}</h3>
                        <Badge className={statusTone(r.pipelineStatus)}>{STATUS_LABEL[r.pipelineStatus]}</Badge>
                      </div>
                      {r.approvedAt ? <span className="text-sm text-zinc-500">Approved {formatDate(r.approvedAt)}</span> : null}
                    </div>

                    {duplicate ? (
                      <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        ⚠ Data error: this affiliate URL is also recorded for another approved program — the two can&apos;t both be
                        real. <span className="font-mono text-xs">{r.affiliateUrl}</span> is not being shown as a usable link
                        until this is corrected. Do not use it.
                      </p>
                    ) : r.affiliateUrl ? (
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
                      <p className="mt-3 text-sm text-amber-300">Approved, but no affiliate URL recorded yet.</p>
                    )}

                    {r.pipelineNotes ? <p className="mt-3 text-xs text-zinc-500">{r.pipelineNotes}</p> : null}
                  </Card>
                );
              })
            )}
          </div>
        </section>

        {/* ============ 4. BLOCKED / OWNER ACTION ============ */}
        <section className="mt-14">
          <SectionHeading
            eyebrow="Blocked"
            title="Needs owner attention before it can move"
            description="Grouped by blocker — batching by network means one account often unlocks several programs at once."
          />
          <div className="mt-8 grid gap-6">
            {orderedBlockedGroups.length === 0 ? (
              <Card><p className="text-sm text-zinc-500">Nothing blocked right now.</p></Card>
            ) : (
              orderedBlockedGroups.map(([label, programs]) => (
                <div key={label}>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                    {label} <span className="text-zinc-600">({programs.length})</span>
                  </h3>
                  <div className="mt-3 grid gap-2">
                    {programs.map((r) => (
                      <Card key={r.slug} className="py-3">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium text-white">{r.name}</span>
                          <Badge className={statusTone(r.pipelineStatus)}>{STATUS_LABEL[r.pipelineStatus]}</Badge>
                        </div>
                        {r.ownerActionRequired ?? r.blockReason ? (
                          <p className="mt-2 text-sm text-zinc-400">{r.ownerActionRequired ?? r.blockReason}</p>
                        ) : null}
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {networkStatuses.length > 0 ? (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-zinc-400 hover:text-white">Raw network-level status records</summary>
              <div className="mt-4 grid gap-2">
                {networkStatuses.map((n) => (
                  <Card key={n.network} className="flex flex-wrap items-center justify-between gap-4 py-3">
                    <span className="font-medium text-white">{n.network}</span>
                    <span className="text-sm text-zinc-500">
                      {n.status}
                      {n.notes ? ` — ${n.notes}` : null}
                    </span>
                  </Card>
                ))}
              </div>
            </details>
          ) : null}
        </section>

        {/* ============ 5. CLOSED / NOT ACTIONABLE ============ */}
        <section className="mt-14">
          <SectionHeading eyebrow="Closed" title="Not actionable" description="Verified closed, discontinued, or unconfirmed — nothing to do here." />
          <div className="mt-8 grid gap-4">
            {closedPrograms.length === 0 ? (
              <Card><p className="text-sm text-zinc-500">Nothing closed right now.</p></Card>
            ) : (
              closedPrograms.map((r) => (
                <Card key={r.slug}>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-white">{r.name}</span>
                    <Badge className="border-white/10 text-zinc-500">Closed</Badge>
                  </div>
                  <p className="mt-2 text-sm text-zinc-500">{r.closedReason}</p>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* ---- Rejected (kept, rarely used) ---- */}
        {(() => {
          const rejected = ranked.filter((r) => r.pipelineStatus === "rejected");
          if (rejected.length === 0) return null;
          return (
            <section className="mt-14">
              <SectionHeading eyebrow="Rejected" title="Turned down — may be worth reapplying later" />
              <div className="mt-8 grid gap-2">
                {rejected.map((r) => (
                  <Card key={r.slug} className="flex items-center justify-between gap-4 py-3">
                    <span className="font-medium text-white">{r.name}</span>
                    {r.rejectedAt ? <span className="text-xs text-zinc-500">Rejected {formatDate(r.rejectedAt)}</span> : null}
                  </Card>
                ))}
              </div>
            </section>
          );
        })()}

        {/* Full ranked list — kept for debugging/audit, tucked away below the fold */}
        <details className="mt-14">
          <summary className="cursor-pointer text-sm text-zinc-400 hover:text-white">
            Full ranked list — every confirmed program, unfiltered ({ranked.length})
          </summary>
          <Card className="mt-4 overflow-x-auto">
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
        </details>

        <p className="mt-8 text-xs text-zinc-600">
          {ranked.length} products have a confirmed official affiliate program · {statusCounts.needs_owner_action} need owner
          action · {statusCounts.approved + statusCounts.activated + statusCounts.earning} approved/earning
        </p>
      </Container>
    </main>
  );
}
