# Growth/QA agent swarm — architecture

This documents the multi-agent growth, SEO, content-quality, and QA system
built on top of (not instead of) the existing maintenance system (see
`docs/maintenance-system.md`, still the source of truth for the six
original agents). Operational, not theoretical — if you need to run this,
add an agent, or debug a result, this page should be enough on its own.

## Why this exists

Miloosh already had six working, real maintenance agents
(`scripts/maintenance/*.ts`) that read `data/` and report findings. This
system generalizes that pattern into a proper registry + orchestrator so
many more narrow, specialist checks can run side by side, be prioritized
against each other, and stop duplicating work — while keeping the same
core discipline the maintenance system already had: every agent is
read-only, nothing publishes a change automatically, and every claim is
backed by real, checkable evidence.

## What "agent" means here

**Every agent in this registry is deterministic TypeScript, not a live LLM
call.** This deployment has no wired-up LLM API (no `ANTHROPIC_API_KEY` or
equivalent anywhere in the codebase or environment), so building agents
that pretend to make real-time model calls would either silently fail or
have to be faked — neither is acceptable. Where the brief asked for
"semantic judgment," this system uses deterministic heuristics instead
(word-overlap similarity, keyword lists, frequency clustering) and is
explicit in each agent's own file about that choice. Where a capability
genuinely requires an LLM or an external API this environment doesn't have
credentials for, the agent is registered as `enabled: false` with a
`blockedReason` and a specified adapter interface (see "Blocked agents"
below) — never a faked result.

`AgentSwarmSummary.llmApiCallsMade` in every report is always `0` for this
reason, and that's accurate, not a bug.

## Architecture

```
types/agents.ts              shared types: AgentDefinition, Finding,
                              AgentRunResult, AgentSwarmReport, etc.
lib/agents/
  registry.ts                 the single source of truth — 44 entries
  orchestrator.ts              runSwarm(mode) — the Growth Orchestrator
  scoring.ts                   computeImpactScore() — the priority formula
  dedupe.ts                    dedupeFindings() — cross-agent dedup
  state.ts                     var/agents/state.json — cooldowns, first-seen
  paths.ts                     var/agents/ path helpers
  report-io.ts                 write/read var/agents/latest-report.{json,md}
  finding.ts                   makeFinding() — shared Finding constructor
scripts/agents/
  run.ts                       CLI entrypoint (npm run agents:*)
  wrappers/maintenance-wrapper.ts   adapts the 6 existing agents, unchanged
  seo/, growth/, content/, qa/  one file per new agent (see tables below)
app/internal/growth/page.tsx   dashboard — reads the latest report only
tests/agents/                  vitest suite — see "Testing" below
```

### The state model — why it's 3 types, not 10

The original brief named ten entities: Opportunity, Finding, Incident,
Proposal, Task, Verification, Metric, AgentRun, Approval, Artifact. This
implementation collapses them into **`AgentDefinition`, `AgentRunResult`,
`Finding`** plus a `AgentSwarmReport`/`AgentSwarmSummary` wrapper. The
reasoning (also in `types/agents.ts`'s own doc comment): nothing in this
system performs an irreversible action — every agent inspects, analyzes,
and reports. A full `Approval` ledger or mutable `Task` board would be
process theater with nothing behind it yet. Each concern from the fuller
model still exists, just as a field:

| Brief entity | Where it lives here |
|---|---|
| Opportunity / Incident | `Finding.kind` (`"opportunity"` / `"issue"` / `"regression"`) |
| Proposal / Task | `Finding.recommendedAction` + `requiresApproval` |
| Verification | `Finding.confidence` + `evidence`, `AgentDefinition.verificationAgent` |
| Approval | `Finding.requiresApproval` + `riskLevel` |
| Artifact | `Finding.artifactsReferenced` (paths, not files — nothing is ever attached) |
| Metric | `AgentSwarmSummary` (aggregate counts per run, not a persisted timeseries) |
| AgentRun | `AgentRunResult` |

If a future agent ever needs to take a real mutating action, add a real
`Approval` record type at that point — don't build the ledger
speculatively for actions that don't exist yet.

## The orchestrator (`lib/agents/orchestrator.ts`)

`runSwarm(mode, registry = AGENT_REGISTRY)`:

1. **Resolve** which agents are enabled and included in `mode`
   (`resolveAgentsForMode`).
2. **Order** them into dependency "waves" via `topologicalWaves` — agents
   in the same wave run in parallel (`Promise.all`); a `CircularDependencyError`
   is thrown if the registry ever has a cycle (covered by
   `tests/agents/registry.test.ts`).
3. **Run** each agent with a per-agent timeout (`Promise.race`-style via
   `runWithTimeout`) and its own retry policy. A thrown exception, a
   timeout, or **malformed output** (a finding missing required fields, a
   confidence out of `[0,1]`, etc. — validated by `validateFindingShape`)
   is caught and turned into a `"failure"` status; it never crashes the
   swarm or silently corrupts the report.
4. **Dedup** all findings across every agent (`dedupeFindings`) — two
   agents reporting the exact same `dedupeKey` collapse into the
   higher-confidence one. This is the direct answer to "don't let ten
   agents recommend the same title change."
5. **Score** every surviving finding centrally via
   `computeImpactScore` (see "Scoring" below) — an individual agent never
   sets its own `estimatedImpact`; that's the orchestrator's job, so every
   finding is judged by the same formula regardless of source.
6. **Roll up** QA-domain agents into a `PASS`/`WARN`/`FAIL` per check and
   one `qaOverall` verdict (`FAIL` if any QA check fails, else `WARN` if
   any warns, else `PASS`). An agent whose mode doesn't include this run
   is `skipped` and deliberately excluded from `qaOverall` — "not in
   scope for this mode" isn't a health signal (this was a real bug found
   and fixed while dry-running QUICK mode: every run showed `WARN` purely
   because weekly-only agents were marked skipped-as-warn).
7. **Persist** run timestamps into `var/agents/state.json` and write the
   full report to `var/agents/latest-report.{json,md}`.

### Safety mechanisms, explicitly

- **Infinite-loop prevention**: agents are one-shot pure async functions
  with no self-invocation; the only loop risk is a dependency cycle in the
  registry, caught by `topologicalWaves`'s cycle detection before any
  agent runs.
- **Malformed output never reaches a report**: `validateFindingShape`
  drops bad findings and marks the run `"failure"` if *nothing* valid came
  out.
- **Partial swarm failure is isolated**: one agent throwing never stops
  siblings in the same wave, or later waves, from completing.
- **Blocked agents never fake a result**: `runAgent` short-circuits to a
  `"blocked"` status with the registry's `blockedReason` before ever
  calling `agent.run` — a disabled agent's `run` function (if one exists
  at all) is never invoked, verified in `tests/agents/orchestrator.test.ts`.
- **Repeated-suggestion suppression**: `lib/agents/state.ts` tracks
  `dismissedKeys` — a `dedupeKey` a human has explicitly dismissed is
  filtered out of every future report until removed from that list. (No
  UI writes to this yet; it's a real, wired mechanism waiting for a "dismiss"
  action to call it.)

## Scoring (`lib/agents/scoring.ts`)

```
estimatedImpact (0-100) = round(100 × weighted average of:
  confidence       (weight 0.25)  the finding's own confidence, as-is
  severityUrgency  (weight 0.20)  critical=1.0, warning=0.6, info=0.3
  commercialValue  (weight 0.20)  related software's revenue score ÷ 100
                                  (lib/revenue/scoring.ts), or 0.5 if the
                                  finding isn't about a specific product
  actionability    (weight 0.15)  1 − riskLevel/4 — cheaper-to-act-on
                                  findings score higher
  searchSignal     (weight 0.20)  ALWAYS 0.5 — a documented placeholder.
                                  This deployment has no Search Console
                                  data (see "Blocked agents"); rather than
                                  hide that gap, it's a literal constant,
                                  clearly commented in the code.
)
```

Weights sum to 1.0. This is a **ranking aid for a human**, not a revenue
forecast — treat scores as coarse buckets (`impactBucket()`: high ≥65,
medium ≥40, low otherwise), not a league table. Once
`seo-search-console-signals` is unblocked, `searchSignal` should become a
real 0-1 normalized impressions/position signal — that's the intended
extension point, not a rewrite.

## Deduplication (`lib/agents/dedupe.ts`)

Findings are duplicates when they share a `dedupeKey` (each agent builds
its own, usually `${agentId}:${something-specific}`). The higher-confidence
finding wins; ties break by severity (critical > warning > info). This is
cross-agent by design — two different agents that happen to converge on
the same `dedupeKey` collapse into one finding, same as two runs of the
same agent.

## Operation modes

| Mode | What runs | Command |
|---|---|---|
| QUICK | Fail-fast production health: typecheck, lint, validate:data, smoke checks, GA4 regression checks, critical routes | `npm run agents:quick` |
| DAILY | QUICK + build verification + `maint-seo` + `maint-recommendations` + live sitemap/robots validation | `npm run agents:daily` |
| WEEKLY | DAILY + the full growth/content/link-health/freshness/comparison/affiliate swarm | `npm run agents:weekly` |
| FULL | Every enabled, runnable agent regardless of mode list — a genuine full audit | `npm run agents:full` |

No new scheduling infrastructure was built — `.github/workflows/maintenance.yml`
already exists and demonstrates the pattern (cron + `continue-on-error` on
the agent step, blocking on lint/build/validate). Wiring `agents:daily`
into that same workflow (or a sibling one) is a one-line addition when
wanted; it wasn't done automatically here since that changes what CI does
on every push, which felt like a decision worth a deliberate step rather
than a silent side effect of this task.

### A local-testing gotcha, found by actually dry-running this

`SITE_URL` (`lib/site.ts`) defaults to `http://localhost:3000` when
`NEXT_PUBLIC_SITE_URL` isn't set. Every live-HTTP QA/SEO agent hits that
URL. If you run `npm run agents:quick` locally with an unrelated dev
server already on port 3000 (this happened during development of this
system — a different local project was running there), every smoke check
fails with confusing "missing expected content" errors that have nothing
to do with Miloosh. **Set `NEXT_PUBLIC_SITE_URL=https://miloosh.com`** (or
your own local Miloosh dev server's real port) before running these modes
locally. In CI/production this should already be set correctly via the
normal env var.

## Inspecting results

- `var/agents/latest-report.json` / `.md` — full machine/human report
  (gitignored, regenerated every run).
- `/internal/growth` — dashboard reading that same file. Noindex/nofollow,
  disallowed via `app/robots.ts`'s existing `/internal/` rule, not linked
  from the public site (same posture as `/internal/maintenance`,
  `/internal/revenue`, `/internal/outbound-clicks`, `/internal/recommendations`).
  Links to and from `/internal/maintenance`. **Also gated behind HTTP Basic
  Auth** (`middleware.ts`, matches `/internal/:path*`) — see "Access
  control" below. This is new as of the production-exposure review that
  shipped alongside this system; the other four `/internal/` pages picked
  up the same gate as a side effect of matching the whole prefix, since
  gating only the two newest pages while leaving the pre-existing revenue/
  outbound-click dashboards open made no sense.
- CLI output (`npm run agents:*`) prints a summary and the top 10
  opportunities by impact directly to the terminal.

## Access control

A production-exposure review (post-implementation, before deploy) audited
`/internal/growth` and `/internal/maintenance` as an unauthenticated
visitor would see them. Findings:

- **No secrets, API keys, env vars, credentials, tokens, or account IDs
  are rendered on either page.** `maint-affiliate`'s activation-status
  check (`lib/revenue/affiliate-manager.ts`) was already designed to
  expose only `{slug, programExists, isActive: boolean}` — never the real
  affiliate URL/ID; that guarantee holds through this system's wrapper
  unchanged.
- **One real gap, found and fixed**: `qa-typescript-verification` /
  `qa-lint-verification` / `qa-data-validation` / `qa-build-verification`
  (`scripts/agents/qa/shell-check.ts`) capture raw `tsc`/`eslint`/`npm`
  output on failure, which routinely includes the full absolute
  filesystem path (`/Users/<name>/<project>/lib/foo.ts:12:3` — every
  file reference is resolved from `cwd`). Neither dashboard page actually
  renders a finding's `evidence` field today, so this was latent, not
  live — but the next person to add an evidence column to the dashboard
  would have shipped exactly that leak. Fixed by stripping the repo-root
  prefix from any captured shell output before it's ever captured
  (`sanitizeOutput` in `shell-check.ts`), so only repo-relative paths
  (already public — this repo is public on GitHub) can appear even in a
  future failure.
- **Repo-relative file paths** (e.g. `lib/generators.ts` as a finding's
  `location`) do appear in some findings. Not treated as an exposure:
  this repository is public on GitHub, so its own file layout is already
  fully visible to anyone regardless of this dashboard.
- **Real business-operational detail is genuinely visible**: which
  affiliate programs are confirmed-but-not-activated, revenue-tier
  classification per product, content-strategy gaps (thin categories,
  cannibalization risk, stale-content flags). None of this is a
  credential, but it's real competitive/operational information that
  wasn't previously assembled in one place — and the review's own brief
  asked "does this dashboard contain information that should not be
  public," not narrowly "does it contain secrets."

Given that last point, both dashboards are now gated behind **HTTP Basic
Auth via `middleware.ts`**, matching `/internal/:path*` (the same prefix
`app/robots.ts` already disallows). Deliberately the smallest mechanism
available — no new dependency, no login page, no session/cookie/database,
~40 lines: check the `Authorization` header against
`INTERNAL_DASHBOARD_USER`/`INTERNAL_DASHBOARD_PASSWORD`, return 401
otherwise. **Fails closed**: if either env var is unset, every
`/internal/` request gets 401, never an open fallback. This necessarily
also gates the four pre-existing `/internal/` pages
(`/internal/revenue`, `/internal/outbound-clicks`, `/internal/recommendations`,
in addition to `/internal/maintenance`) — gating only the two pages this
task added while leaving the others open would have been inconsistent
with no real justification. Read-only confirmation: neither dashboard has
a POST handler, a Server Action, or any client-side mutation — every
`/internal/*` page is a plain Server Component reading a local file, so
this system was already incapable of triggering a mutation, agent
execution, external outreach, deployment, or paid API usage through a GET
request; Basic Auth adds access control on top of behavior that was
already read-only.

## Cost control

- Deterministic code for everything deterministic: URL checks, duplicate
  detection, frequency clustering, schema/shape validation — no agent
  reaches for a heuristic where a real computation is available.
- `qa-typescript-verification` / `qa-lint-verification` / `qa-data-validation`
  / `qa-build-verification` wrap the real `npx tsc` / `npm run lint` /
  `npm run validate:data` / `npm run build` commands rather than
  reimplementing any of those checks — those commands are the actual
  source of truth.
- `seo-redirect-broken-url-check` samples (not fully crawls) ~80 of
  Miloosh's ~1,400 pages — every category, every static/legal page, and a
  stable, deterministic sample of software/comparison pages, since these
  are statically generated pages sharing a handful of templates; a
  template regression shows up on any sampled page from that template.
- `growth-freshness-revenue-priority` reuses `scoreSoftware()` (exported
  from `scripts/maintenance/freshness.ts` specifically for this) instead
  of re-running the whole `maint-freshness` agent a second time in the
  same swarm run.
- No agent re-derives another agent's already-computed result — see
  "Blocked agents," several of which explicitly depend on another blocked
  agent (`seo-search-console-signals`) rather than each separately
  pretending to have their own Search Console access.

## The full registry

44 entries: **30 enabled/runnable, 14 honestly blocked** (specified, with a
real adapter interface, `enabled: false`, `run: null` — never a faked
result). Most blocked entries are genuinely IMPLEMENTED and unit-tested
(Google Search Console via a real service-account JWT auth flow + REST
client; Bing Webmaster via a real API-key client; IndexNow submission is
fully real and needs no credential at all, held disabled only pending one
live end-to-end verification post-deploy) — blocked means "no credential
configured," not "no code exists." `lib/agents/registry.ts` is the actual
source of truth; this table is generated from it and may drift if the
registry changes without this doc being updated — when in doubt, read the
registry.

### seo (7)

| id | enabled | modes | risk | single responsibility |
|---|---|---|---|---|
| `maint-seo` | yes | daily, weekly, full | L0 | Catch structural SEO regressions in the codebase itself. |
| `seo-redirect-broken-url-check` | yes | daily, weekly, full | L0 | Catch broken or unexpectedly-redirecting internal routes on the live site. |
| `seo-category-coverage-depth` | yes | weekly, full | L2 | Identify categories too thin to be a strong landing page. |
| `seo-search-console-signals` | **blocked** | weekly, full | L0 | Feed real per-URL indexing state into the swarm — DISCOVERED/CRAWLED/INDEXED are different states from 'in the sitemap.' |
| `seo-indexnow-submit` | **blocked** | weekly, full | L1 | Notify IndexNow-participating search engines (Bing, Yandex, Seznam.cz, Naver — not Google, which doesn't participate) of new URLs. |
| `seo-bing-webmaster-signals` | **blocked** | weekly, full | L0 | Feed real Bing-side query performance into the swarm, cross-checkable against the Google Search Console CTR agent. |
| `seo-search-console-ranking-movement` | **blocked** | weekly, full | L1 | Detect real, significant ranking movement per query. |

### growth (18)

| id | enabled | modes | risk | single responsibility |
|---|---|---|---|---|
| `maint-comparisons` | yes | weekly, full | L2 | Suggest new comparison-page candidates. |
| `maint-affiliate` | yes | weekly, full | L1 | Surface affiliate-program follow-up opportunities. |
| `growth-title-description-quality` | yes | weekly, full | L2 | Catch clipped or thin generated meta descriptions. |
| `growth-internal-link-opportunity` | yes | weekly, full | L2 | Prioritize which pages most need more internal links, by business value. |
| `growth-cannibalization-detector` | yes | weekly, full | L2 | Detect same-category pages targeting overlapping buyer intent. |
| `growth-category-opportunity` | yes | weekly, full | L3 | Surface tag clusters that outgrow the current category taxonomy. |
| `growth-freshness-revenue-priority` | yes | weekly, full | L1 | Triage stale documentation by business value, not just age. |
| `growth-best-for-persona-opportunity` | yes | weekly, full | L3 | Surface persona-based content-format opportunities backed by existing editorial text. |
| `growth-search-demand-discovery` | **blocked** | weekly, full | L0 | Discover real search-demand signal for new content targets. |
| `growth-longtail-query-discovery` | **blocked** | weekly, full | L0 | Discover real long-tail query opportunities. |
| `growth-commercial-intent-keyword-discovery` | **blocked** | weekly, full | L0 | Discover real commercial-intent keyword opportunities. |
| `growth-emerging-tool-discovery` | **blocked** | weekly, full | L0 | Discover new software products worth researching and adding. |
| `growth-competitor-gap-discovery` | **blocked** | weekly, full | L0 | Discover comparison-page gaps relative to competitors. |
| `growth-distribution-opportunity-discovery` | **blocked** | weekly, full | L1 | Discover legitimate distribution/listing opportunities. |
| `growth-backlink-opportunity-discovery` | **blocked** | weekly, full | L1 | Discover legitimate backlink opportunities. |
| `growth-search-console-ctr-opportunity` | **blocked** | weekly, full | L2 | Detect real impression-vs-click gaps worth a title/description rewrite. |
| `growth-search-console-winner-loser` | **blocked** | weekly, full | L1 | Detect real, significant traffic movement per page. |
| `growth-search-console-content-opportunity` | **blocked** | weekly, full | L3 | Detect real content gaps backed by actual query impressions. |

### content (3)

| id | enabled | modes | risk | single responsibility |
|---|---|---|---|---|
| `maint-freshness` | yes | weekly, full | L0 | Flag software entries whose documentation is stale or thin. |
| `content-duplicate-description-detector` | yes | weekly, full | L1 | Catch duplicated or interchangeable body-copy descriptions. |
| `content-templated-repetition-detector` | yes | weekly, full | L1 | Catch boilerplate phrasing masquerading as product-specific claims. |

### qa (16)

| id | enabled | modes | risk | single responsibility |
|---|---|---|---|---|
| `maint-links` | yes | weekly, full | L0 | Detect broken/unreachable outbound URLs. |
| `maint-recommendations` | yes | daily, weekly, full | L0 | Catch behavioral regressions in the recommendation engine. |
| `qa-typescript-verification` | yes | quick, daily, weekly, full | L0 | Confirm the codebase typechecks cleanly. |
| `qa-lint-verification` | yes | quick, daily, weekly, full | L0 | Confirm the codebase passes lint cleanly. |
| `qa-data-validation` | yes | quick, daily, weekly, full | L0 | Confirm data/software, data/categories, data/comparisons pass validation. |
| `qa-build-verification` | yes | daily, weekly, full | L0 | Confirm the codebase produces a clean production build. |
| `qa-homepage-smoke` | yes | quick, daily, weekly, full | L0 | Confirm the homepage template renders correctly in production. |
| `qa-software-template-smoke` | yes | quick, daily, weekly, full | L0 | Confirm the software page template renders correctly in production. |
| `qa-category-template-smoke` | yes | quick, daily, weekly, full | L0 | Confirm the category page template renders correctly in production. |
| `qa-comparison-template-smoke` | yes | quick, daily, weekly, full | L0 | Confirm the comparison page template renders correctly in production. |
| `qa-sitemap-live-validation` | yes | daily, weekly, full | L0 | Confirm the deployed sitemap matches the current dataset. |
| `qa-robots-live-validation` | yes | daily, weekly, full | L0 | Confirm the deployed robots.txt matches the intended policy. |
| `qa-production-deployment-smoke` | yes | quick, daily, weekly, full | L0 | Fail fast if production itself is down. |
| `qa-critical-route-availability` | yes | quick, daily, weekly, full | L0 | Confirm core navigation routes are reachable. |
| `qa-ga4-consent-static-check` | yes | quick, daily, weekly, full | L0 | Catch a GA4 consent-gating regression visible in server-rendered HTML. |
| `qa-ga4-consent-code-audit` | yes | quick, daily, weekly, full | L0 | Catch a GA4 consent-gating regression at the source-code level. |

Two brief items were deliberately **not** built as separate agents:
"Alternative-keyword discovery" and "'X vs Y' opportunity discovery" are
already exactly what `maint-comparisons` does (direct-alternative and
same-category candidate scoring) — a second agent would just relabel the
same computation. "Growth experiment prioritization" is the orchestrator's
own scoring/ranking step (see "Scoring" above), not a standalone agent.


## Blocked agents — real, specified, honestly not running

Every blocked agent has a file under `scripts/agents/{domain}/` defining
the exact adapter interface it would use once unblocked, and states
precisely what credential/API is missing. None of them fake a result.

| Missing capability | Blocks | Adapter file | Status |
|---|---|---|---|
| Google Search Console API credentials (`GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT` + `GOOGLE_SEARCH_CONSOLE_PROPERTY`) | `seo-search-console-signals`, `growth-search-console-ctr-opportunity`, `seo-search-console-ranking-movement`, `growth-search-console-winner-loser`, `growth-search-console-content-opportunity`, and (via dependency) `growth-longtail-query-discovery`, `growth-high-impression-low-ctr-detector`* | `scripts/agents/seo/lib/google-service-account-auth.ts`, `google-search-console-client.ts` | **Real, unit-tested** (real RSA JWT signing verified with `node:crypto`, real REST client — `tests/agents/google-search-console.test.ts`, `tests/agents/search-console-agents.test.ts`). Owner must create a GCP service account with the Search Console API enabled, add its email as a Search Console user (read access) on the property, and provide the JSON key. |
| Bing Webmaster Tools API key (`BING_WEBMASTER_API_KEY` + `BING_WEBMASTER_SITE_URL`) | `seo-bing-webmaster-signals` | `scripts/agents/seo/lib/bing-webmaster-client.ts` | **Real, unit-tested.** Simple API-key auth (no OAuth) — owner verifies the site in Bing Webmaster Tools (often a one-click import from an already-verified GSC property) and generates a key from Settings → API Access. |
| — (no credential needed) | `seo-indexnow-submit` | `scripts/agents/seo/lib/indexnow-client.ts` | **Real, unit-tested, and needs no account at all** — the key is self-issued (`public/64571916632587e2f714c221fb8ccc42.txt`, already committed and deployed). Held disabled pending one live end-to-end verification (per this task's own "test before enabling" instruction), not a credential gap. |
| Keyword-volume API (Keyword Planner/Ahrefs/SEMrush-class) | `growth-search-demand-discovery`, `growth-commercial-intent-keyword-discovery` | `scripts/agents/growth/keyword-demand-adapter.ts` | Interface only — no free/official option exists (see the Phase 2 inventory in the session report); would require a paid subscription, not purchased without explicit approval. |
| Automated external web monitoring (no scheduled-job equivalent of the interactive WebSearch/WebFetch tools exists here) | `growth-emerging-tool-discovery`, `growth-competitor-gap-discovery`, `growth-distribution-opportunity-discovery` | `scripts/agents/growth/external-monitoring-adapter.ts` | Interface only. |
| Backlink-data API (Ahrefs/Moz/Semrush-class) | `growth-backlink-opportunity-discovery` | `scripts/agents/growth/backlink-adapter.ts` | Interface only — no free/official option exists; paid, not purchased without explicit approval. |

\* `growth-longtail-query-discovery` and `growth-high-impression-low-ctr-detector` in the dependency list above are historical references from before Phase 2's CTR agent was renamed to `growth-search-console-ctr-opportunity`; `growth-longtail-query-discovery` itself remains a real gap not yet built (Search Console query data alone doesn't distinguish "long-tail" — that needs a length/specificity heuristic on top, not yet implemented).

### Turning on a blocked agent

For the three genuinely credential-gated groups above (Search Console, Bing, keyword/backlink APIs):

1. Obtain the real credential/API key.
2. For Search Console/Bing, the client code is already real — just set
   the env vars it reads (see the table above). For keyword/backlink
   agents, implement the adapter's `isConfigured()`/fetch methods for
   real in its file first.
3. Set `enabled: true` and import + assign the real `run` function for
   that agent in `lib/agents/registry.ts` (deliberately not imported
   while disabled — see the comment above the imports in that file).
4. The unit tests already cover the logic; add a live smoke test only if
   you want extra confidence beyond what's already tested.
5. Run `npm run agents:full` once and read the result before trusting it
   in a scheduled run.

For `seo-indexnow-submit` specifically (no credential needed): confirm
`https://miloosh.com/64571916632587e2f714c221fb8ccc42.txt` returns the
key as plain text, then run one live submission and check the response
status before flipping `enabled: true`.

## GA4 coverage gap — what's actually automated vs. what was manually verified

`qa-ga4-consent-static-check` and `qa-ga4-consent-code-audit` cover real,
meaningful regressions: the real `gtag.js` script appearing in
server-rendered HTML (which would mean the client-only consent gate was
bypassed), and the consent source files being removed or
`components/Analytics.tsx` no longer delegating to them. **What they
cannot cover**: every `next/script` in this app uses
`strategy="afterInteractive"`, which Next.js injects client-side after
hydration — never as literal text in server-rendered HTML, regardless of
consent state. So the actual grant → exactly-one-script,
decline → stays-absent, and no-duplication-on-SPA-navigation behavior
requires a real browser executing JavaScript against localStorage. That
flow was manually verified against production (miloosh.com) earlier this
session — see the GA4 activation work's own verification log — and is not
re-automated here. If this ever needs to be a real regression test rather
than a periodic manual check, it would need a headless-browser dependency
(Playwright/Puppeteer) this repo doesn't currently have; that's a
deliberate scope boundary, not an oversight — adding a browser automation
dependency is a bigger decision than this task's remit.

## Testing the agent system itself (`tests/agents/`)

No test runner existed in this repo before this system (`vitest` was
added as a new devDependency specifically for this — see
`vitest.config.mts`). 38 tests across 5 files:

- **`registry.test.ts`** — no duplicate agent ids, no duplicate
  `singleResponsibility` strings (a proxy for two agents doing the same
  job), every enabled agent has a `run` function and every disabled one
  doesn't, every `dependencies`/`verificationAgent` reference resolves to
  a real entry, circular-dependency detection (both a real cycle and a
  legitimate diamond dependency), sane `timeoutMs`/`retryPolicy`.
- **`dedupe.test.ts`** — the "ten agents recommend the same fix" scenario
  collapses to one finding, confidence/severity tie-breaking, stability
  under repeated dedup.
- **`scoring.test.ts`** — score bounds, monotonicity (higher confidence /
  critical severity / lower risk never scores lower), determinism, real
  and fake software-slug resolution.
- **`orchestrator.test.ts`** — malformed output handling (dropped, and an
  all-malformed agent is marked `failure`), a hanging agent times out
  without blocking the swarm, one agent throwing doesn't stop its
  siblings (partial swarm failure), retry-until-`maxAttempts`, duplicate
  findings across two different agents merge, every finding gets scored,
  mode filtering (an out-of-mode agent is `skipped` and its `run` is never
  called), a disabled agent is `blocked` and its `run` is never called
  even if one exists, and repeated runs of a side-effect-free registry
  produce identical findings (dry-run safety / unchanged-site behavior).
- **`ga4-regression.test.ts`** — runs the real
  `qa-ga4-consent-code-audit` agent against this actual repository and
  asserts zero findings — a genuine regression guard, not a mock.

Run with `npm test` (`vitest run`). These use small, fully fake
`AgentDefinition` fixtures — not the real 40-agent registry — so they run
in well under a second and never touch the network or the real dataset,
except `ga4-regression.test.ts` and the registry tests, which
deliberately do read this actual repository (that's the point).

## How to add another agent

1. Pick a domain (`seo` / `growth` / `content` / `qa`) and write one file
   under `scripts/agents/<domain>/<name>.ts` exporting an `AgentRunFn`
   (see any existing file for the shape — `async (ctx) => ({ summary,
   findings })`).
2. Build findings with `makeFinding()` (`lib/agents/finding.ts`) — don't
   construct the `Finding` object by hand, it fills in sensible defaults
   (`estimatedImpact: null`, `requiresApproval` from `riskLevel`, etc.).
3. Give every finding a `dedupeKey` specific enough that two *different*
   real observations never collide, but stable enough that the *same*
   observation across runs produces the same key (usually
   `${agentId}:${slug-or-path}`).
4. Add one entry to `lib/agents/registry.ts` with the full metadata (copy
   a similar existing entry as a template) and import your `run` function.
5. If the capability genuinely can't run in this environment yet (missing
   credential), set `enabled: false`, `run: null`, and write a real
   `blockedReason` instead — don't half-implement it.
6. Add or extend a test in `tests/agents/` if the logic is non-trivial.
7. Run `npm run agents:full` and check `/internal/growth` (or the printed
   CLI summary) for sane output before considering it done.

## How to disable an agent

Set `enabled: false` in its `lib/agents/registry.ts` entry
(`resolveAgentsForMode` requires both `enabled: true` and a non-null `run`
before including an agent in a mode). Keep `run` pointing at the real
function if the code still works but you want it off temporarily (e.g. a
noisy heuristic while you tune its threshold) — it just won't be called
while `enabled: false`. Also set `run: null` and add a real
`blockedReason` when the agent genuinely cannot function (missing
credential) — that's a different, more permanent statement than
"temporarily off," and the dashboard/report text differs accordingly
(`status: "blocked"` with the reason shown, vs. simply absent from the run).
