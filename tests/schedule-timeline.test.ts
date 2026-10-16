import { describe, expect, it } from "vitest";
import { buildTimelineEntries, groupTimelineWindows, chinaClock } from "../src/utils/schedule-timeline";
import { schedule, type Track } from "../src/utils/conference";

describe("concurrent schedule windows", () => {
  const entries = [
    { id: "short", trackId: "a", date: "2026-10-16", timeSlot: "10:15-10:40" },
    { id: "long", trackId: "b", date: "2026-10-16", timeSlot: "10:15-11:00" },
    { id: "next", trackId: "a", date: "2026-10-16", timeSlot: "10:40-11:10" },
    { id: "tomorrow", trackId: "a", date: "2026-10-17", timeSlot: "10:15-11:00" },
  ];

  it("keeps ongoing sessions visible when another track changes sessions", () => {
    const windows = groupTimelineWindows(entries, "2026-10-16");
    expect(windows.map((window) => [window.start, window.end, window.entries.map((entry) => entry.id)]))
      .toEqual([
        ["10:15", "10:40", ["short", "long"]],
        ["10:40", "11:00", ["long", "next"]],
        ["11:00", "11:10", ["next"]],
      ]);
    expect(entries[0].id).toBe("short");
  });

  it("does not assign pending, malformed, or reversed times to a window", () => {
    expect(groupTimelineWindows([
      { id: "pending", date: "2026-10-16" },
      { id: "bad", date: "2026-10-16", timeSlot: "25:00-26:00" },
      { id: "backwards", date: "2026-10-16", timeSlot: "11:00-10:00" },
    ], "2026-10-16")).toEqual([]);
  });

  it("omits gaps and handles an empty day", () => {
    expect(groupTimelineWindows([
      entries[0], { id: "later", date: "2026-10-16", timeSlot: "12:00-13:00" },
    ], "2026-10-16").map((window) => window.start)).toEqual(["10:15", "12:00"]);
    expect(groupTimelineWindows(entries, "2026-10-18")).toEqual([]);
  });
});

describe("published program projection", () => {
  it("includes every published talk exactly once and the Spotlight roadshows", () => {
    const entries = buildTimelineEntries(schedule.tracks, schedule.activities);
    for (const talk of schedule.tracks.flatMap((track) => track.talks)) {
      expect(entries.filter((entry) => entry.id === talk.ref)).toHaveLength(1);
    }
    expect(entries.find((entry) => entry.slug === "spotlight-day-1-roadshow")?.trackId).toBe("spotlight-talks");
    expect(entries.find((entry) => entry.id === "SUMMIT-SPOTLIGHT-AWARDS")?.trackId).toBe("spotlight-talks");
    expect(entries.some((entry) => entry.trackId === "ws-rust-training" && !entry.timeSlot)).toBe(true);
  });

  it("uses a program window without inventing times for pending individual talks", () => {
    const tracks = [{
      id: "workshop", name: { en: "Workshop", zh: "工作坊" }, group: "workshops",
      sessions: [{ date: "2026-10-16", timeSlot: "14:00-17:30" }],
      talks: [{ ref: "pending", date: "2026-10-16", timePending: true },
        { ref: "draft", date: "2026-10-16", timeSlot: "14:00-15:00", draft: true }],
    }] as Track[];
    const entries = buildTimelineEntries(tracks, []);
    expect(entries.find((entry) => entry.id === "pending")?.timeSlot).toBeUndefined();
    expect(entries.find((entry) => entry.id === "draft")).toBeUndefined();
    const windows = groupTimelineWindows(entries, "2026-10-16");
    expect(windows[0].entries[0]).toMatchObject({ trackId: "workshop", timeSlot: "14:00-17:30", programWindow: true });
  });
});

describe("event-local clock", () => {
  it("uses China time across UTC date boundaries", () => {
    expect(chinaClock(new Date("2026-10-16T17:30:00Z"))).toEqual({ date: "2026-10-17", time: "01:30" });
    expect(chinaClock(new Date("2026-10-16T02:40:00Z"))).toEqual({ date: "2026-10-16", time: "10:40" });
  });
});
