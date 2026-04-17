/**
 * Returns true if an event should still be visible (not yet past).
 * - If end_date is set: visible while end_date >= now
 * - Otherwise: visible while date is today or later
 */
export const isEventActive = (date: string, endDate?: string | null): boolean => {
  const now = new Date();
  if (endDate) return new Date(endDate).getTime() >= now.getTime();
  const start = new Date(date);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return start.getTime() >= startOfToday.getTime();
};

/** ISO of the start of today, useful for Supabase `.gte("date", ...)` queries */
export const startOfTodayISO = (): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};
