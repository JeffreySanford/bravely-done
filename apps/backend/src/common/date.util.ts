/** UTC calendar day (midnight UTC) for `date` — the day boundary used
 * throughout the daily reward loop (First Brave Step, Today's Three). No
 * per-user timezone handling exists anywhere in this project yet; a UTC day
 * is the simplest deterministic boundary until that's actually designed. */
export function utcDayStart(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Whether `date` falls on the same UTC calendar day as `reference`. */
export function isSameUtcDay(date: Date | null | undefined, reference: Date): boolean {
  if (!date) {
    return false;
  }
  return utcDayStart(date).getTime() === utcDayStart(reference).getTime();
}
