import type { Activity, LocalizedText, Track } from "./conference";

export interface TimelineEntry {
  id: string;
  trackId: string;
  title: LocalizedText;
  date?: string;
  timeSlot?: string;
  room?: LocalizedText;
  speakers: string[];
  slug?: string;
  url?: LocalizedText;
  programWindow?: boolean;
}

export function buildTimelineEntries(tracks: Track[], activities: Activity[]): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  const spotlight = activities.find((activity) => activity.id === "spotlight-talks" && !activity.draft);
  for (const track of tracks) {
    const talks = track.talks.filter((talk) => !talk.draft);
    entries.push(...talks.map((talk) => ({
      id: talk.ref,
      trackId: spotlight && talk.ref === "SUMMIT-SPOTLIGHT-AWARDS" ? spotlight.id : track.id,
      title: talk.title || track.name,
      date: talk.date,
      timeSlot: talk.timePending ? undefined : talk.timeSlot,
      room: talk.room || track.room,
      speakers: talk.speakers || [],
      slug: talk.slug,
    })));
    // A program window is useful when no individual session times are published.
    for (const [index, session] of (track.sessions || []).entries()) {
      if (talks.some((talk) => talk.date === session.date && !talk.timePending && parseTimeSlot(talk.timeSlot))) continue;
      entries.push({
        id: `${track.id}-window-${index}`, trackId: track.id,
        title: track.name, date: session.date, timeSlot: session.timeSlot,
        room: track.room, speakers: [], programWindow: true,
      });
    }
  }
  if (spotlight) {
    const program = spotlight.program?.length ? spotlight.program : spotlight.sessions;
    entries.push(...program.map((session, index) => ({
      id: session.slug || `${spotlight.id}-${index}`, trackId: spotlight.id,
      title: session.title || spotlight.name, date: session.date,
      timeSlot: session.timeSlot, room: spotlight.room, speakers: [],
      slug: session.slug, url: session.url,
    })));
  }
  return entries;
}

export function parseTimeSlot(timeSlot?: string): [string, string] | undefined {
  const match = timeSlot?.match(/^([01]\d|2[0-3]):([0-5]\d)\s*[-–]\s*([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return;
  const start = `${match[1]}:${match[2]}`;
  const end = `${match[3]}:${match[4]}`;
  return start < end ? [start, end] : undefined;
}

export function groupTimelineWindows<T extends { date?: string; timeSlot?: string }>(entries: T[], date: string) {
  const timed = entries.flatMap((entry) => {
    const range = parseTimeSlot(entry.timeSlot);
    return entry.date === date && range ? [{ entry, start: range[0], end: range[1] }] : [];
  });
  const boundaries = [...new Set(timed.flatMap(({ start, end }) => [start, end]))].sort();
  return boundaries.slice(0, -1).flatMap((start, index) => {
    const end = boundaries[index + 1];
    const concurrent = timed.filter((item) => item.start < end && item.end > start).map((item) => item.entry);
    return concurrent.length ? [{ start, end, entries: concurrent }] : [];
  });
}

export function chinaClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)!.value;
  return { date: `${part("year")}-${part("month")}-${part("day")}`, time: `${part("hour")}:${part("minute")}` };
}
