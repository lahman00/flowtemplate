# Social publishing operations

## Production flow

Approved entries live in the private Vercel Blob object `social/queue.json`. Each channel stores its own `providerState` (attempt count, timestamps, provider ID/URL, verification and error), while the entry-level state remains a compatibility summary for the dashboard.

Vercel calls `/api/cron/social-publish` at `09:00`, `16:00`, `17:00`, and `18:00` UTC. These are health/catch-up, pre-slot, primary-slot, and retry checks. Eligibility and the one-per-business-day cap are enforced by the publisher in `America/New_York`; the number of cron calls does not determine whether a post is eligible.

## Failure and retry rules

- A successful provider is never called again for the same queue entry.
- A capped or excluded provider stays pending even if another provider succeeds.
- Provider failures are isolated and retain their own attempt/error state.
- Unknown network outcomes enter `UNKNOWN_OUTCOME` and are not retried automatically. Inspect the provider before a manual retry.
- Definite provider failures stop after three persisted publish cycles.
- Stale scheduled content is requeued for review rather than dumped live.

## Manual recovery

1. Inspect the internal social dashboard and the provider's Page before retrying.
2. Match by queue entry ID, exact copy, destination UTM `utm_content`, provider post ID, and business date.
3. If a live provider post exists, record its ID/URL instead of publishing again.
4. If it does not exist and the daily cap is clear, reset only that provider's state to pending; do not reset successful providers.

## LinkedIn

Company Page automation requires approved Community Management API access with `w_organization_social` plus the three `SOCIAL_LINKEDIN_*` environment values documented in `.env.example`. Without them the adapter returns `SETUP_REQUIRED`; use the prepared queue copy manually.
