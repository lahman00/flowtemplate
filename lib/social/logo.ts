import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Facebook Image + Canonical Logo Lock mission (2026-08-21) — the single
 * canonical Miloosh logo mark (large white geometric outlined "M" with a
 * smaller dark-gray downward M/chevron inside), already the live site logo
 * at public/logo-icon.png (see components/Navbar.tsx, components/Footer.tsx).
 * Loaded once per request as a base64 data URI so Satori (next/og's
 * ImageResponse renderer, used by every social-card generator) can embed
 * the real asset directly — never regenerated, approximated, or redrawn.
 * Same fs-read pattern as lib/social/fonts.ts's loadInterFonts().
 */

const LOGO_ASPECT_RATIO = 399 / 356; // public/logo-icon.png's real pixel dimensions

let cached: Promise<string> | null = null;

export function loadCanonicalLogoDataUri(): Promise<string> {
  if (!cached) {
    cached = readFile(join(process.cwd(), "public", "logo-icon.png")).then(
      (buffer) => `data:image/png;base64,${buffer.toString("base64")}`
    );
  }
  return cached;
}

export function logoWidthForHeight(height: number): number {
  return Math.round(height * LOGO_ASPECT_RATIO);
}
