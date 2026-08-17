import type { Metadata } from "next";
import { Share2 } from "lucide-react";
import { Container } from "@/components/Container";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";
import { SectionHeading } from "@/components/SectionHeading";
import { readQueue, countByQueueState } from "@/lib/social/queue";
import { getAllChannelHealth } from "@/lib/social/channels/registry";
import { getSocialStrategy } from "@/lib/social/strategy";
import { getInboundSocialEvents, summarizeInboundByChannel } from "@/lib/social/attribution";
import { isOutboundTrackingEnabled } from "@/lib/revenue/events";
import { PILLAR_LABELS, type Channel, type ChannelHealthStatus } from "@/lib/social/types";

export const metadata: Metadata = {
  title: "Social",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const HEALTH_COLOR: Record<ChannelHealthStatus, string> = {
  CONNECTED: "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300",
  READY: "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300",
  NEEDS_OWNER_AUTH: "border-amber-500/30 bg-amber-500/[0.06] text-amber-300",
  API_COST_BLOCK: "border-amber-500/30 bg-amber-500/[0.06] text-amber-300",
  DISABLED: "border-white/10 bg-white/5 text-zinc-400",
  ERROR: "border-red-500/30 bg-red-500/[0.06] text-red-300",
};

const SETUP_PACK: Partial<Record<Channel, { steps: string[] }>> = {
  x: {
    steps: [
      "Create a developer account at console.x.com. The old Free/Basic ($200/mo)/Pro tier structure is gone — X moved to unified pay-per-use pricing in early 2026, no free tier exists anymore (re-verified 2026-08-17).",
      "Attach a billing method. A post containing a link costs $0.20/request vs $0.015 for plain text — a 13x premium, and nearly every Miloosh post links back to the site. Estimated cost at ~15 posts/day: roughly $90-120/month. GO recommendation stands at this volume, but it's a real recurring spend the owner must approve — not something to enable without that approval.",
      "Confirm media/image-upload billing in the console before attaching images — the public pricing page doesn't itemize raw image-upload cost separately (unverified as of 2026-08-17).",
      "Create an app in the console; generate API Key, API Secret, Access Token, and Access Token Secret (OAuth 1.0a — a bearer-only app-level token is not sufficient for posting).",
      "Set SOCIAL_X_API_KEY, SOCIAL_X_API_SECRET, SOCIAL_X_ACCESS_TOKEN, SOCIAL_X_ACCESS_TOKEN_SECRET as environment variables.",
      "Flip enabledChannels.x to true in data/social/social-strategy.json once ready.",
    ],
  },
  threads: {
    steps: [
      "In Meta App Dashboard, add the Threads use case to an app and submit for App Review (threads_basic, threads_content_publish scopes).",
      "Until approved, only invited Threads Tester accounts can authorize the app — real production posting isn't possible before approval.",
      "Once approved, set SOCIAL_THREADS_USER_ID and SOCIAL_THREADS_ACCESS_TOKEN as environment variables.",
      "Flip enabledChannels.threads to true in data/social/social-strategy.json.",
    ],
  },
  facebook: {
    steps: [
      "Ignore \"Facebook Login for Business\" and its \"not associated with a business portfolio\" error — that config is only for system-user tokens, not needed here (verified against current Meta docs, 2026-08-17). Business Portfolio association is NOT required to post to a Page you already administer.",
      "In the Miloosh app dashboard, confirm you have an Admin role on the app (App Dashboard -> App Roles -> Roles).",
      "Go to Graph API Explorer (developers.facebook.com/tools/explorer), select the Miloosh app.",
      "Click \"Generate Access Token,\" check pages_show_list, pages_read_engagement, pages_manage_posts. Log in as yourself.",
      "Switch the token dropdown from \"User Token\" to the Miloosh Facebook Page — returns a short-lived Page access token directly, no portfolio involved. (If this step is inconsistent, re-confirm your account is still an Admin on the Page itself: Page Settings -> Page access.)",
      "Exchange for a long-lived token (App ID/Secret from Settings -> Basic): GET /oauth/access_token?grant_type=fb_exchange_token&client_id=...&client_secret=...&fb_exchange_token=<short-lived token> -> long-lived user token (~60 days), then GET /{user-id}/accounts?access_token=<long-lived token> -> a Page token that doesn't expire under normal conditions.",
      "Set SOCIAL_FACEBOOK_PAGE_ID and SOCIAL_FACEBOOK_PAGE_ACCESS_TOKEN (the never-expiring Page token from the previous step) as environment variables.",
      "No Meta App Review is required for this — you're the only Page admin and app role holder, which qualifies for Standard Access.",
      "Safe to keep Miloosh's Page in the same Business Portfolio as Need Go Home if that's ever needed later — Meta scopes assets/roles per-asset, not shared across the whole portfolio.",
    ],
  },
  bluesky: {
    steps: [
      "Create (or use an existing) Bluesky account for Miloosh.",
      "Settings -> App Passwords -> generate a new app password (no app review needed).",
      "Set SOCIAL_BLUESKY_HANDLE and SOCIAL_BLUESKY_APP_PASSWORD as environment variables.",
    ],
  },
  mastodon: {
    steps: [
      "Create (or use an existing) Mastodon account on an instance that permits automated/promotional posts — confirm the instance's own rules first.",
      "In that account's Preferences -> Development, create an application with write:statuses scope and copy the access token.",
      "Set SOCIAL_MASTODON_BASE_URL (e.g. https://mastodon.social) and SOCIAL_MASTODON_ACCESS_TOKEN as environment variables.",
    ],
  },
  linkedin: {
    steps: [
      "No self-serve path exists for company-page posting (confirmed 2026-08-16: LinkedIn's only self-serve product, \"Share on LinkedIn\", posts to a personal profile, not a Page).",
      "To automate this, apply for LinkedIn's Community Management API partner program (learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review) — requires legal-entity verification, Page-admin app association, and a Standard Tier review with a screencast. No guaranteed timeline or published price.",
      "Until then: the dashboard still drafts a ready-to-paste LinkedIn variant for every queue entry — copy it and post manually.",
    ],
  },
  reddit: {
    steps: [
      "Not automated by design (policy decision, not a technical gap) — Reddit's own spam classifier and per-subreddit rules make scheduled brand posting unsafe.",
      "If Miloosh wants a Reddit presence: a real person should build genuine account history, then post selectively and manually in specific, rule-checked subreddits.",
    ],
  },
};

export default async function SocialDashboardPage() {
  const [queue, strategy, health, inboundEvents] = await Promise.all([
    readQueue(),
    Promise.resolve(getSocialStrategy()),
    Promise.resolve(getAllChannelHealth()),
    getInboundSocialEvents(),
  ]);
  const trackingEnabled = isOutboundTrackingEnabled();
  const inboundByChannel = summarizeInboundByChannel(inboundEvents);

  const counts = countByQueueState(queue);
  const today = new Date().toISOString().slice(0, 10);

  const scheduled = queue.filter((e) => e.state === "SCHEDULED").sort((a, b) => (a.scheduledFor ?? "").localeCompare(b.scheduledFor ?? ""));
  const todayPosts = scheduled.filter((e) => (e.scheduledFor ?? "").slice(0, 10) === today);
  const nextPosts = scheduled.slice(0, 10);
  const recentPublished = queue
    .filter((e) => e.state === "PUBLISHED")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 10);
  const failed = queue.filter((e) => e.state === "FAILED");

  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const calendarEntries = scheduled.filter((e) => e.scheduledFor && new Date(e.scheduledFor) <= in30Days);
  const calendarByDay = new Map<string, number>();
  for (const e of calendarEntries) {
    const day = (e.scheduledFor ?? "").slice(0, 10);
    calendarByDay.set(day, (calendarByDay.get(day) ?? 0) + 1);
  }

  const needsSetup = (Object.entries(health) as [Channel, { status: ChannelHealthStatus; detail: string }][]).filter(
    ([, h]) => h.status === "NEEDS_OWNER_AUTH" || h.status === "API_COST_BLOCK"
  );

  return (
    <main className="flex-1 py-16 sm:py-20">
      <Container>
        <header className="max-w-3xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-zinc-950">
            <Share2 className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">Social</h1>
          <p className="mt-6 text-lg leading-8 text-zinc-400">
            Internal only. Real state from the content queue and channel registry — nothing on this page is simulated. Kill switch:{" "}
            <strong className="text-white">{strategy.paused ? "PAUSED" : "active"}</strong> (
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">data/social/social-strategy.json</code>, <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">paused</code>).
          </p>
        </header>

        {/* TODAY */}
        <section className="mt-12">
          <SectionHeading eyebrow="Today" title={`${todayPosts.length} post${todayPosts.length === 1 ? "" : "s"} scheduled today`} />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {todayPosts.length === 0 ? (
              <Card>
                <p className="text-sm text-zinc-400">Nothing scheduled for today.</p>
              </Card>
            ) : (
              todayPosts.map((e) => (
                <Card key={e.id}>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">{PILLAR_LABELS[e.pillar]}</p>
                  <p className="mt-1 text-sm text-white">{e.topic}</p>
                  <p className="mt-1 text-xs text-zinc-500">{e.scheduledFor} — {Object.keys(e.channels).join(", ")}</p>
                </Card>
              ))
            )}
          </div>
        </section>

        {/* NEXT POSTS + QUEUE */}
        <section className="mt-16 grid gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Next posts" title="Upcoming schedule" />
            <Card className="mt-6">
              {nextPosts.length === 0 ? (
                <p className="text-sm text-zinc-400">No entries scheduled — run <code className="rounded bg-white/10 px-1 py-0.5">npm run social:generate</code>, then <code className="rounded bg-white/10 px-1 py-0.5">social:qa</code>, then <code className="rounded bg-white/10 px-1 py-0.5">social:schedule</code>.</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {nextPosts.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <span className="text-zinc-300">{e.topic}</span>
                      <span className="shrink-0 text-xs text-zinc-500">{e.scheduledFor}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div>
            <SectionHeading eyebrow="Content queue" title="By state" />
            <Card className="mt-6">
              <ul className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(counts).map(([state, count]) => (
                  <li key={state} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2">
                    <span className="text-zinc-400">{state}</span>
                    <span className="font-semibold text-white">{count}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        {/* CHANNEL HEALTH */}
        <section className="mt-16">
          <SectionHeading eyebrow="Channel health" title="Every channel this system understands" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(Object.entries(health) as [Channel, { status: ChannelHealthStatus; detail: string }][]).map(([channel, h]) => (
              <Card key={channel}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold capitalize text-white">{channel}</p>
                  <Badge className={HEALTH_COLOR[h.status]}>{h.status.replace(/_/g, " ")}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{h.detail}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* RECENT + FAILED */}
        <section className="mt-16 grid gap-8 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Recent posts" title="Last published" />
            <Card className="mt-6">
              {recentPublished.length === 0 ? (
                <p className="text-sm text-zinc-400">Nothing published yet.</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {recentPublished.map((e) => (
                    <li key={e.id} className="py-3 text-sm text-zinc-300">
                      <p>{e.topic}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {Object.entries(e.channels)
                          .map(([ch, v]) => `${ch}:${v?.publishResult?.status ?? "?"}`)
                          .join("  ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div>
            <SectionHeading eyebrow="Failed posts" title="Needs attention" />
            <Card className={`mt-6 ${failed.length ? "border-red-500/20 bg-red-500/[0.03]" : ""}`}>
              {failed.length === 0 ? (
                <p className="text-sm text-zinc-400">No failed entries.</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {failed.map((e) => (
                    <li key={e.id} className="py-3 text-sm text-zinc-300">
                      <p>{e.topic}</p>
                      <p className="mt-1 text-xs text-red-300/80">
                        {Object.entries(e.channels)
                          .filter(([, v]) => v?.publishResult?.error)
                          .map(([ch, v]) => `${ch}: ${v?.publishResult?.error}`)
                          .join(" | ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </section>

        {/* SOCIAL ANALYTICS */}
        <section className="mt-16">
          <SectionHeading eyebrow="Analytics" title="Inbound click-through, by channel" />
          <Card className="mt-6">
            {!trackingEnabled ? (
              <div>
                <Badge className="border-white/10 bg-white/5 text-zinc-400">NOT CONNECTED</Badge>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  Capture code exists (<code className="rounded bg-white/10 px-1 py-0.5">components/SocialLandingCapture.tsx</code> reads UTM params on landing, posts to{" "}
                  <code className="rounded bg-white/10 px-1 py-0.5">/api/social/landing</code>) but <code className="rounded bg-white/10 px-1 py-0.5">NEXT_PUBLIC_REVENUE_TRACKING_ENABLED</code> is unset, so it&apos;s a no-op — same gate as outbound
                  affiliate-click tracking. Set it to <code className="rounded bg-white/10 px-1 py-0.5">true</code> (see docs/revenue.md for the privacy-policy prerequisite) to turn this on.
                </p>
              </div>
            ) : inboundByChannel.length === 0 ? (
              <div>
                <Badge className="border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300">REAL — 0 so far</Badge>
                <p className="mt-3 text-sm leading-6 text-zinc-400">Tracking is on and measuring for real; no UTM-tagged social landing has been recorded yet. Not fabricated, not estimated — genuinely zero to date.</p>
              </div>
            ) : (
              <div>
                <Badge className="border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300">REAL</Badge>
                <ul className="mt-4 divide-y divide-white/5">
                  {inboundByChannel.map((row) => (
                    <li key={row.channel} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <span className="capitalize text-zinc-300">{row.channel}</span>
                      <span className="text-xs text-zinc-500">
                        {row.distinctContent} post{row.distinctContent === 1 ? "" : "s"} drove traffic
                      </span>
                      <span className="font-semibold text-white">{row.landings} landing{row.landings === 1 ? "" : "s"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-4 border-t border-white/5 pt-4 text-xs leading-5 text-zinc-500">
              <Badge className="border-white/10 bg-white/5 text-zinc-400">NOT AVAILABLE</Badge>{" "}
              Impressions and follower-growth counts require each platform&apos;s own API (Bluesky/Mastodon expose these; Facebook/LinkedIn/X need additional scopes not yet requested) — no per-channel adapter for this exists yet, so nothing is shown rather than estimated. Run{" "}
              <code className="rounded bg-white/10 px-1 py-0.5">npm run social:report</code> for publish outcomes by channel and pillar.
            </p>
          </Card>
        </section>

        {/* 30-DAY CALENDAR */}
        <section className="mt-16">
          <SectionHeading eyebrow="30-day calendar" title={`${calendarEntries.length} posts scheduled in the next 30 days`} />
          <Card className="mt-6">
            {calendarByDay.size === 0 ? (
              <p className="text-sm text-zinc-400">Nothing scheduled yet.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                {[...calendarByDay.entries()].sort().map(([day, count]) => (
                  <li key={day} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2">
                    <span className="text-zinc-400">{day}</span>
                    <span className="font-semibold text-white">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* CAMPAIGNS */}
        <section className="mt-16">
          <SectionHeading eyebrow="Campaigns" title="Owner-set priorities" />
          <Card className="mt-6">
            {strategy.campaignPriorities.length === 0 ? (
              <p className="text-sm text-zinc-400">
                None set. Add entries to <code className="rounded bg-white/10 px-1 py-0.5">campaignPriorities</code> in{" "}
                <code className="rounded bg-white/10 px-1 py-0.5">data/social/social-strategy.json</code> — e.g. &quot;push the new CRM comparison this week&quot; — this is the config layer a strategist edits without touching channel code.
              </p>
            ) : (
              <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-300">
                {strategy.campaignPriorities.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* ACCOUNT SETUP REQUIRED */}
        <section className="mt-16">
          <SectionHeading eyebrow="Account setup required" title="Exact next steps, per channel" />
          <div className="mt-6 space-y-4">
            {needsSetup.length === 0 ? (
              <Card>
                <p className="text-sm text-zinc-400">Every enabled channel is connected.</p>
              </Card>
            ) : (
              needsSetup.map(([channel, h]) => (
                <Card key={channel}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold capitalize text-white">{channel}</p>
                    <Badge className={HEALTH_COLOR[h.status]}>{h.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-6 text-zinc-400">
                    {(SETUP_PACK[channel]?.steps ?? [h.detail]).map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </Card>
              ))
            )}
          </div>
        </section>
      </Container>
    </main>
  );
}
