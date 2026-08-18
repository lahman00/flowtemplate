/**
 * IANA-timezone-aware local-time → UTC conversion, dependency-free (uses
 * the Intl.DateTimeFormat timeZone resolution already built into the
 * Node/Edge runtimes this project targets — no new package). Built to
 * replace scripts/social/schedule.ts's previous hardcoded POST_HOUR_UTC
 * constant, which assumed a single fixed UTC offset year-round and never
 * actually read social-strategy.json's own `timezone` field (that field
 * existed in the schema but nothing consumed it until now).
 *
 * DST correctness: resolves the real UTC offset for the target calendar
 * date rather than assuming a fixed one, so the same local clock time
 * (e.g. 13:00) maps to a different UTC instant across a DST transition
 * automatically. The one-shot correction below (compute a naive guess,
 * then correct using the offset observed at that guess) is exact for any
 * local target time that falls after roughly 3am local on the transition
 * day itself — true for every realistic posting-time target, including
 * this project's 13:00.
 */

/** The real UTC offset of `timeZone`, in minutes, as observed at `instant` (e.g. -240 for EDT, -300 for EST). */
function getUtcOffsetMinutes(instant: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" });
  const part = dtf.formatToParts(instant).find((p) => p.type === "timeZoneName")?.value ?? "GMT+0";
  const match = part.match(/GMT([+-]\d+)(?::(\d+))?/);
  if (!match) return 0;
  const hours = parseInt(match[1]!, 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  return hours * 60 + (hours < 0 ? -minutes : minutes);
}

/**
 * Returns the UTC instant corresponding to `hour:minute` local clock time
 * in `timeZone`, on the same calendar day as `date` (the calendar day is
 * read from `date` via its UTC getters — callers pass a Date already
 * anchored to the intended day, at any UTC time-of-day).
 */
export function localTimeToUtc(date: Date, hour: number, minute: number, timeZone: string): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const naiveUtc = new Date(Date.UTC(year, month, day, hour, minute, 0, 0));
  const offsetMinutes = getUtcOffsetMinutes(naiveUtc, timeZone);
  return new Date(naiveUtc.getTime() - offsetMinutes * 60_000);
}
