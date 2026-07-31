const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Formats a "YYYY-MM-DD" string as "Month D, YYYY" without going through Date/timezone parsing. */
export function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const monthName = MONTHS[month - 1] ?? "";
  return `${monthName} ${day}, ${year}`;
}
