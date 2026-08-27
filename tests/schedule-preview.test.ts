import { describe, expect, it } from "vitest";
import schedulePreview from "../src/json/SchedulePreview.json";
import speakersEn from "../src/json/SpeakersCleaned.json";
import speakersZh from "../src/json/SpeakersZh.json";

const talks = schedulePreview.tracks.flatMap((track) => track.talks);
const englishSpeakerIds = new Set(speakersEn.speakers.map((speaker) => speaker.id));
const chineseSpeakerIds = new Set(speakersZh.speakers.map((speaker) => speaker.id));

describe("temporary schedule relationships", () => {
  it("gives every accepted talk bilingual page content, a stable route, and a speaker", () => {
    expect(talks).toHaveLength(57);
    expect(new Set(talks.map((talk) => talk.ref)).size).toBe(talks.length);
    expect(new Set(talks.map((talk) => talk.slug)).size).toBe(talks.length);

    for (const talk of talks) {
      expect(talk.title.en.trim()).not.toBe("");
      expect(talk.title.zh.trim()).not.toBe("");
      expect(talk.originalAbstract.trim()).not.toBe("");
      expect(["en", "zh"]).toContain(talk.originalAbstractLanguage);
      expect(talk.overview.en.trim()).not.toBe("");
      expect(talk.overview.zh.trim()).not.toBe("");
      expect(talk.overview.zh).toMatch(/[\u3400-\u9fff]/u);
      expect(talk.slug).toMatch(/^p-\d+-/);
      expect(talk.speakers.length).toBeGreaterThan(0);
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
});
