import schedule from "../json/Schedule.json";

export const conferenceDays = schedule.days;

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
