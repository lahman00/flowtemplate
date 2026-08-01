/**
 * Sprint 12 Phase 11 — provider-neutral notification abstraction for the
 * maintenance system. Off by default, env-var only, no real credentials
 * anywhere in this repo. See .env.example and
 * docs/maintenance-notifications.md.
 *
 * This module is only ever called from the very end of
 * scripts/maintenance/run-all.ts (`npm run maintenance`) — never from
 * `npm run build`, `npm run validate:data`, `npm run lint`, or any
 * agent's own logic. Even there, sendMaintenanceNotification() returns
 * immediately with `sent: false` unless a provider is actually
 * configured, so in every environment where these env vars are unset
 * (which is every environment today, including CI), this is a pure no-op.
 */

export type NotificationProvider = "none" | "email-webhook" | "slack-webhook" | "telegram-bot";

export type NotificationConfig =
  | { provider: "none" }
  | { provider: "email-webhook"; webhookUrl: string }
  | { provider: "slack-webhook"; webhookUrl: string }
  | { provider: "telegram-bot"; botToken: string; chatId: string };

/**
 * Reads MAINTENANCE_NOTIFY_PROVIDER plus that provider's required
 * variable(s). Same convention as lib/analytics.ts: setting the provider
 * alone isn't enough — the provider's own required value(s) must also be
 * present, or this falls back to "none".
 */
export function getNotificationConfig(): NotificationConfig {
  const provider = (process.env.MAINTENANCE_NOTIFY_PROVIDER ?? "none").toLowerCase();

  switch (provider) {
    case "email-webhook": {
      const webhookUrl = process.env.MAINTENANCE_EMAIL_WEBHOOK_URL;
      return webhookUrl ? { provider: "email-webhook", webhookUrl } : { provider: "none" };
    }
    case "slack-webhook": {
      const webhookUrl = process.env.MAINTENANCE_SLACK_WEBHOOK_URL;
      return webhookUrl ? { provider: "slack-webhook", webhookUrl } : { provider: "none" };
    }
    case "telegram-bot": {
      const botToken = process.env.MAINTENANCE_TELEGRAM_BOT_TOKEN;
      const chatId = process.env.MAINTENANCE_TELEGRAM_CHAT_ID;
      return botToken && chatId ? { provider: "telegram-bot", botToken, chatId } : { provider: "none" };
    }
    default:
      return { provider: "none" };
  }
}

export function isNotificationsEnabled(): boolean {
  return getNotificationConfig().provider !== "none";
}

export type MaintenanceNotificationPayload = {
  generatedAt: string;
  totalCritical: number;
  totalWarning: number;
  totalInfo: number;
  /** One-line summary suitable for a chat message or email subject. */
  headline: string;
};

export type NotificationResult = { sent: boolean; reason?: string };

/**
 * Sends a maintenance-run notification if a provider is configured;
 * otherwise a no-op. Every branch here is a real, minimal implementation
 * (a plain webhook POST), not a stub — but none of them fire without a
 * real env var this repository never sets.
 */
export async function sendMaintenanceNotification(payload: MaintenanceNotificationPayload): Promise<NotificationResult> {
  const config = getNotificationConfig();

  if (config.provider === "none") {
    return { sent: false, reason: "No notification provider configured (MAINTENANCE_NOTIFY_PROVIDER unset or invalid)." };
  }

  try {
    switch (config.provider) {
      case "slack-webhook": {
        await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: payload.headline }),
        });
        return { sent: true };
      }
      case "email-webhook": {
        await fetch(config.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        return { sent: true };
      }
      case "telegram-bot": {
        await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: config.chatId, text: payload.headline }),
        });
        return { sent: true };
      }
    }
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : String(error) };
  }
}
