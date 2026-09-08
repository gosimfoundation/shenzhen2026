export const conferenceDays = [
  { date: "2026-10-16", label: "Day 1", en: "Oct 16", zh: "10 月 16 日" },
  { date: "2026-10-17", label: "Day 2", en: "Oct 17", zh: "10 月 17 日" },
];

type ScheduledTalk = { date?: string; timeSlot?: string };

export function groupScheduleDays<T extends ScheduledTalk>(talks: T[]) {
  const dates = [...conferenceDays.map((day) => day.date),
    ...new Set(talks.flatMap((talk) => talk.date && !conferenceDays.some((day) => day.date === talk.date) ? [talk.date] : [])),
    "unscheduled"];
  return dates.map((date) => ({
    date,
    talks: talks.filter((talk) => (talk.date || "unscheduled") === date)
      .sort((a, b) => (a.timeSlot || "99:99").localeCompare(b.timeSlot || "99:99")),
  }));
}
