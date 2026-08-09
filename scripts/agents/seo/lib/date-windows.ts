/** Shared date-window math for the two Search Console agents that compare a recent period against the one before it (ranking movement, winner/loser) — Search Console data has roughly a 2-3 day processing delay, so windows end 3 days before "today" rather than today itself. */
export type DateWindow = { startDate: string; endDate: string };

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function recentAndPriorWindows(windowDays = 28, processingDelayDays = 3, now = new Date()): { recent: DateWindow; prior: DateWindow } {
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() - processingDelayDays);

  const recentStart = new Date(end);
  recentStart.setUTCDate(recentStart.getUTCDate() - (windowDays - 1));

  const priorEnd = new Date(recentStart);
  priorEnd.setUTCDate(priorEnd.getUTCDate() - 1);
  const priorStart = new Date(priorEnd);
  priorStart.setUTCDate(priorStart.getUTCDate() - (windowDays - 1));

  return {
    recent: { startDate: toIsoDate(recentStart), endDate: toIsoDate(end) },
    prior: { startDate: toIsoDate(priorStart), endDate: toIsoDate(priorEnd) },
  };
}
