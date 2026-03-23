/**
 * Returns a human-readable countdown string for an event date.
 * e.g. "J-3", "Demain", "Aujourd'hui", "En cours", null (past)
 */
export function getCountdown(dateStr: string, endDateStr?: string | null): string | null {
  const now = new Date();
  const eventDate = new Date(dateStr);

  // Strip time for day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

  const diffMs = eventDay.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 1) return `J-${diffDays}`;
  if (diffDays === 1) return "Demain";
  if (diffDays === 0) return "Aujourd'hui";

  // Event is in the past — check if still ongoing via end_date
  if (endDateStr) {
    const endDate = new Date(endDateStr);
    if (now <= endDate) return "En cours";
  }

  return null; // past event
}
