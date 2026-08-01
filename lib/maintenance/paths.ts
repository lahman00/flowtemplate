import path from "node:path";

/**
 * Every maintenance agent writes under this directory, gitignored (see
 * .gitignore `/var/`) — these are local, regenerable reports, never
 * committed. See docs/maintenance-system.md.
 */
export const MAINTENANCE_DIR = path.join(process.cwd(), "var", "maintenance");

export function reportJsonPath(agent: string): string {
  return path.join(MAINTENANCE_DIR, `${agent}.json`);
}

export function reportMarkdownPath(agent: string): string {
  return path.join(MAINTENANCE_DIR, `${agent}.md`);
}

/** Relative to the repo root — used anywhere a path is displayed (summary report, dashboard) so output doesn't leak the local machine's absolute directory structure. */
export function relativeReportPath(absolutePath: string): string {
  return path.relative(process.cwd(), absolutePath);
}

export const SUMMARY_JSON_PATH = path.join(MAINTENANCE_DIR, "latest-summary.json");
export const SUMMARY_MARKDOWN_PATH = path.join(MAINTENANCE_DIR, "latest-summary.md");
