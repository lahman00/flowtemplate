/**
 * CLI scripts run via `tsx`, not Next.js, so they don't get Next's
 * automatic .env.local loading — without this, `npm run affiliate:status`
 * run from the owner's own machine would silently fall back to the local
 * JSON file instead of the real Blob store, splitting the pipeline into
 * two inconsistent copies. Imported first (side-effect only) by any CLI
 * script that touches lib/revenue/affiliate-pipeline.ts.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (e.g. CI, or BLOB_READ_WRITE_TOKEN not pulled yet) — the pipeline module falls back to the local JSON file on its own.
}
