import { describe, expect, it } from "vitest";
import { groupScheduleDays } from "../src/utils/preview-schedule-days";

 describe("schedule day grouping", () => {
  it("groups both conference days and sorts sessions without changing source order", () => {
    const talks = [
      { id: "late", date: "2026-10-17", timeSlot: "11:25-12:25" },
      { id: "first-day", date: "2026-10-16", timeSlot: "15:00-16:00" },
      { id: "early", date: "2026-10-17", timeSlot: "10:15-11:15" },
    ];
    const groups = groupScheduleDays(talks);
    expect(groups[0].talks.map((talk) => talk.id)).toEqual(["first-day"]);
    expect(groups[1].talks.map((talk) => talk.id)).toEqual(["early", "late"]);
    expect(talks[0].id).toBe("late");
  });

  it("leaves Day 1 empty and defaults to Day 2 for a one-day workshop", () => {
    const groups = groupScheduleDays([{ date: "2026-10-17", timeSlot: "10:15-11:15" }]);
    expect(groups[0].talks).toEqual([]);
    expect(groups.find((group) => group.talks.length)?.date).toBe("2026-10-17");
  });

  it("retains undated sessions and sessions outside the configured dates", () => {
    const talks = [{ date: "2026-10-18" }, { timeSlot: "10:00-11:00" }, {}];
    const groups = groupScheduleDays(talks);
    expect(groups.find((group) => group.date === "2026-10-18")?.talks).toHaveLength(1);
    expect(groups.find((group) => group.date === "unscheduled")?.talks).toHaveLength(2);
    expect(groups.flatMap((group) => group.talks)).toHaveLength(3);
  });
});
