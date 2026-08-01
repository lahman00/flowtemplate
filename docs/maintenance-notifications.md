# Maintenance notifications

`lib/maintenance/notifications.ts` is a small, provider-neutral
abstraction so `npm run maintenance` can optionally ping somewhere when it
finishes. It is **off by default** and only ever called from the very end
of `scripts/maintenance/run-all.ts` — never from `npm run build`,
`npm run validate:data`, `npm run lint`, or any individual agent. No real
webhook URL, bot token, or credential exists anywhere in this repository.

## Providers

| `MAINTENANCE_NOTIFY_PROVIDER` | Required variables | What it does |
|---|---|---|
| *(unset)* / anything else | — | No-op. This is the default. |
| `email-webhook` | `MAINTENANCE_EMAIL_WEBHOOK_URL` | POSTs the full payload (see below) as JSON to the URL. This project doesn't send email directly — point it at a webhook that turns a POST into an email (a Zapier/Make automation, a small serverless function you control, etc.). |
| `slack-webhook` | `MAINTENANCE_SLACK_WEBHOOK_URL` | POSTs `{ "text": "<headline>" }` to a Slack [Incoming Webhook](https://api.slack.com/messaging/webhooks) URL. |
| `telegram-bot` | `MAINTENANCE_TELEGRAM_BOT_TOKEN`, `MAINTENANCE_TELEGRAM_CHAT_ID` | Calls the Telegram Bot API's `sendMessage` endpoint directly (no extra dependency). |

Setting `MAINTENANCE_NOTIFY_PROVIDER` alone isn't enough — that provider's
own required variable(s) must also be set, or `getNotificationConfig()`
falls back to `{ provider: "none" }` and the run stays silent. This is the
same convention `lib/analytics.ts` already uses for site analytics.

## Payload

```ts
type MaintenanceNotificationPayload = {
  generatedAt: string;
  totalCritical: number;
  totalWarning: number;
  totalInfo: number;
  headline: string; // e.g. "Miloosh maintenance: 2 critical, 37 warning, 45 info"
};
```

`email-webhook` receives the full object as its POST body. `slack-webhook`
and `telegram-bot` only send `headline` as a single line of text — enough
to know whether to go look at the report, not a replacement for reading
`var/maintenance/latest-summary.md` or `/internal/maintenance`.

## Guarantees

- **Disabled by default.** No environment in this repository (local,
  build, or the GitHub Actions workflow) sets any of these variables.
- **Never runs during build, lint, or validate:data.** The only call site
  is the last few lines of `scripts/maintenance/run-all.ts`, after every
  report has already been written to `var/maintenance/`.
- **Never sends secrets in the payload.** The payload above is entirely
  aggregate counts and a one-line summary — no URLs, tokens, or per-agent
  detail that could leak anything sensitive.
- **A failed send never fails the run.** `sendMaintenanceNotification()`
  catches its own errors and returns `{ sent: false, reason }`;
  `run-all.ts` logs the outcome and moves on either way.

## Turning one on for real

1. Pick a provider and get a real webhook URL or bot token/chat ID from
   that provider directly (Slack's Incoming Webhooks app, a Telegram bot
   via [@BotFather](https://core.telegram.org/bots#botfather), or your own
   email-forwarding webhook).
2. Set `MAINTENANCE_NOTIFY_PROVIDER` and that provider's required
   variable(s) in `.env` locally, or as repository/environment secrets if
   you want the GitHub Actions workflow
   (`.github/workflows/maintenance.yml`) to notify too — that workflow
   would need `env:` entries added to its "Run maintenance agents" step
   referencing `secrets.MAINTENANCE_SLACK_WEBHOOK_URL` (etc.); this isn't
   wired up today, since Sprint 12 asked for the abstraction to be
   prepared, not turned on.
3. Run `npm run maintenance` and confirm the final log line says
   "Notification sent." rather than "Notification not sent."
