export interface CalendarItem {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end?: Date | null;
  allDay?: boolean;
  url?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const utc = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
const dayOnly = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

const range = (i: CalendarItem) => {
  if (i.allDay) {
    const end = new Date(i.end ?? i.start);
    end.setDate(end.getDate() + 1);
    return [dayOnly(i.start), dayOnly(end)];
  }
  const end = i.end ?? new Date(i.start.getTime() + 2 * 3600 * 1000);
  return [utc(i.start), utc(end)];
};

export const googleCalendarUrl = (i: CalendarItem) => {
  const [s, e] = range(i);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: i.title,
    dates: `${s}/${e}`,
    details: [i.description, i.url].filter(Boolean).join("\n\n"),
    location: i.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
};

const esc = (s = "") => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");

export const buildIcs = (i: CalendarItem) => {
  const [s, e] = range(i);
  const dt = i.allDay ? ";VALUE=DATE" : "";
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Tukio//FR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@tukio.cd`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART${dt}:${s}`, `DTEND${dt}:${e}`,
    `SUMMARY:${esc(i.title)}`,
    i.description || i.url ? `DESCRIPTION:${esc([i.description, i.url].filter(Boolean).join("\n\n"))}` : "",
    i.location ? `LOCATION:${esc(i.location)}` : "",
    i.url ? `URL:${i.url}` : "",
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
};

export const downloadIcs = (i: CalendarItem) => {
  const blob = new Blob([buildIcs(i)], { type: "text/calendar;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${i.title.replace(/[^\w\-]+/g, "_").slice(0, 60) || "evenement"}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
