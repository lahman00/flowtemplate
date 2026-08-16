/**
 * Same pattern as scripts/affiliate/_load-env.ts — CLI scripts run via
 * `tsx`, not Next.js, so they need this to see .env.local (real Blob
 * token, real channel credentials) instead of silently falling back to
 * local-file/dry-run-only behavior.
 */
try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local — modules fall back to their own safe defaults.
}
