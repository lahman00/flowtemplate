import path from "node:path";

/**
 * Every growth/QA agent run writes under this directory, gitignored (see
 * .gitignore `/var/`) — regenerable reports, never committed. Mirrors
 * lib/maintenance/paths.ts's convention deliberately, one level namespaced
 * so the two systems' output never collides on disk.
 */
export const AGENTS_DIR = path.join(process.cwd(), "var", "agents");

export const LATEST_REPORT_JSON_PATH = path.join(AGENTS_DIR, "latest-report.json");
export const LATEST_REPORT_MARKDOWN_PATH = path.join(AGENTS_DIR, "latest-report.md");
export const STATE_PATH = path.join(AGENTS_DIR, "state.json");

/** Relative to the repo root — used anywhere a path is displayed so output doesn't leak the local machine's absolute directory structure. */
export function relativeAgentsPath(absolutePath: string): string {
  return path.relative(process.cwd(), absolutePath);
}
