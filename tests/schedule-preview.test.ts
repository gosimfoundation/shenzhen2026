import { describe, expect, it } from "vitest";
import { schedule as schedulePreview, speakersEn, speakersZh } from "../src/utils/conference";

const talks = schedulePreview.tracks.flatMap((track) => track.talks);
const englishSpeakerIds = new Set(speakersEn.speakers.map((speaker) => speaker.id));
const chineseSpeakerIds = new Set(speakersZh.speakers.map((speaker) => speaker.id));

describe("published schedule relationships", () => {
  it("shows the keynote plenary first and includes DHH's summit fireside chat", () => {
    expect(schedulePreview.tracks[0]).toMatchObject({
      id: "special-keynote",
      name: {
        en: "Keynote Plenary",
        zh: "Keynote 全体大会",
      },
    });

    const dhhTrackIds = schedulePreview.tracks
      .filter((track) => track.talks.some((talk) => talk.speakers.includes("dhh")))
      .map((track) => track.id);
    expect(dhhTrackIds).toEqual(["special-keynote", "agentic-ai-summit"]);
    expect(talks.find((talk) => talk.ref === "SUMMIT-FIRESIDE-CHAT")).toMatchObject({
      speakers: ["dhh", "xudong-ren"],
      date: "2026-10-17",
      timeSlot: "11:05-12:00",
    });

    expect(speakersEn.categories[1]).toMatchObject({
      id: "special-keynote",
      group: "tracks",
    });
    expect(speakersEn.speakers.find((speaker) => speaker.id === "dhh")?.tags)
      .toEqual(["special-keynote", "sz26-agentic-ai-summit"]);
    expect(speakersZh.speakers.find((speaker) => speaker.id === "dhh")?.tags)
      .toEqual(["special-keynote", "sz26-agentic-ai-summit"]);
  });

  it("gives every accepted talk bilingual page content, a stable route, and a speaker", () => {
    expect(talks.length).toBeGreaterThan(0);
    expect(new Set(talks.map((talk) => talk.ref)).size).toBe(talks.length);
    expect(new Set(talks.map((talk) => talk.slug)).size).toBe(talks.length);

    for (const talk of talks) {
      expect(talk.title.en.trim()).not.toBe("");
      expect(talk.title.zh.trim()).not.toBe("");
      // Organizer-supplied agendas can publish before an abstract is submitted.
      if (!talk.manual) expect(talk.originalAbstract.trim()).not.toBe("");
      expect(["en", "zh"]).toContain(talk.originalAbstractLanguage);
      expect(talk.overview.en.trim()).not.toBe("");
      expect(talk.overview.zh.trim()).not.toBe("");
      expect(talk.overview.zh).toMatch(/[\u3400-\u9fff]/u);
      expect(talk.slug).toMatch(/^[\p{Letter}\p{Number}_-]+$/u);
      if (!talk.manual) expect(talk.slug).toMatch(/^p-\d+-/);
      if ("type" in talk && ["check-in", "break", "pending", "ama"].includes(talk.type)) {
        expect(talk.speakers).toEqual([]);
      } else {
        expect(talk.speakers.length).toBeGreaterThan(0);
      }
    }
  });

  it("links every talk speaker to both language versions of the profile", () => {
    for (const talk of talks) {
      for (const speakerId of talk.speakers) {
        expect(englishSpeakerIds.has(speakerId), `${talk.ref}: ${speakerId} EN`).toBe(true);
        expect(chineseSpeakerIds.has(speakerId), `${talk.ref}: ${speakerId} ZH`).toBe(true);
      }
    }
  });

  it("replaces the manual ROCm entry with Wei Cai's accepted CFP proposal", () => {
    const rocmTalks = talks.filter((talk) => talk.ref === "P-177");
    expect(rocmTalks).toHaveLength(1);
    expect(talks.some((talk) => talk.ref === "VLLM-INSIDE-ROCM-10")).toBe(false);
    expect(rocmTalks[0]).toMatchObject({
      speakers: ["wei-cai"],
      date: "2026-10-17",
      timeSlot: "16:10-16:40",
    });
    expect(speakersEn.speakers.filter((speaker) => speaker.id === "wei-cai")).toHaveLength(1);
    expect(speakersZh.speakers.find((speaker) => speaker.id === "wei-cai")?.name).toBe("蔡薇");
  });

  it("keeps all three confirmed presenters on both Google Cloud sessions", () => {
    const workshop = schedulePreview.tracks.find((track) => track.id === "ws-google-cloud")!;
    const confirmedSpeakers = ["xin-tan", "jie-wang", "peace-he"];
    expect(workshop.talks).toHaveLength(2);
    for (const talk of workshop.talks) {
      expect(talk.speakers).toEqual(confirmedSpeakers);
    }
  });

  it("provides all current workshops to the homepage program section", () => {
    expect(
      schedulePreview.tracks
        .filter((track) => track.id.startsWith("ws-"))
        .map((track) => track.id),
    ).toEqual([
      "ws-ai-education",
      "ws-dora",
      "ws-vllm",
      "ws-google-cloud",
      "ws-kvcdn",
      "ws-gaussdb",
      "ws-ascend",
      "ws-cann",
      "ws-rust-training",
    ]);
  });

  it("checks confirmed talk times and explicitly marks sessions awaiting rescheduling", () => {
    const slots = talks.flatMap((talk) => {
      expect(talk.date, talk.ref).toMatch(/^2026-10-\d{2}$/);
      const track = schedulePreview.tracks.find((track) => track.talks.includes(talk))!;
      const window = track.sessions?.find((session) => session.date === talk.date)?.timeSlot;
      if (!talk.timeSlot) {
        expect(talk.timePending, talk.ref).toBe(true);
        expect(talk.programOrder, talk.ref).toBeTypeOf("number");
        expect(track.notice?.en).toContain("Times for some individual sessions will be announced");
        expect(track.notice?.zh).toContain("具体时间待重新安排");
        expect(window, talk.ref).toMatch(/^\d{2}:\d{2}-\d{2}:\d{2}$/);
        return [];
      }
      expect(talk.timePending, talk.ref).not.toBe(true);
      expect(talk.timeSlot, talk.ref).toMatch(/^\d{2}:\d{2}-\d{2}:\d{2}$/);
      const [start, end] = talk.timeSlot.split("-");
      const [windowStart, windowEnd] = window!.split("-");
      // Off-site lunch and pre-program check-in do not extend the room's program window.
      const offsiteBreak = talk.type === "break" && talk.room && talk.room.en !== track.room?.en;
      if (talk.type !== "check-in" && !offsiteBreak) expect(start >= windowStart && end <= windowEnd, talk.ref).toBe(true);
      return [{ ...talk, start, end }];
    });
    for (let i = 0; i < slots.length; i++) {
      for (const other of slots.slice(i + 1)) {
        const talk = slots[i];
        if (talk.date !== other.date || talk.start >= other.end || other.start >= talk.end) continue;
        expect(talk.speakers.filter((id) => other.speakers.includes(id)), `${talk.ref} overlaps ${other.ref}`).toEqual([]);
      }
    }
  });

  it("uses the organizer's latest activity times", () => {
    const activities = schedulePreview.activities;
    expect(activities.every((activity) => !activity.draft)).toBe(true);
    expect(activities.find((activity) => activity.id === "closed-door-meeting-2")?.sessions).toEqual([
      { date: "2026-10-16", timeSlot: "13:30-17:30" },
    ]);
    expect(activities.find((activity) => activity.id === "cruise-dinner")?.sessions).toEqual([
      { date: "2026-10-16", timeSlot: "18:00-21:00" },
    ]);
  });
});
