import { describe, expect, it } from "vitest";
import speakers from "../src/json/SpeakersCleaned.json";
import speakersCanonical from "../src/json/Speakers.json";
import speakersZh from "../src/json/SpeakersZh.json";
import speakerOverrides from "../src/json/SpeakerOverrides.json";
import invitedSpeakers from "../src/json/InvitedSpeakers.json";
import schedule from "../src/json/SchedulePreview.json";
import scheduleOverrides from "../src/json/SchedulePreviewOverrides.json";

const han = /[\u3400-\u9fff]/u;
const localizedFields = ["name", "roleOrg", "bio"] as const;
const talks = schedule.tracks.flatMap((track) => track.talks);

describe("confirmed content localization", () => {
  it("provides English and Chinese copy for every published speaker", () => {
    expect(speakersCanonical).toEqual(speakers);
    expect(speakersZh.speakers.map((speaker) => speaker.id).sort())
      .toEqual(speakers.speakers.map((speaker) => speaker.id).sort());
    for (const speaker of speakers.speakers.filter((speaker) => !speaker.draft)) {
      const zh = speakersZh.speakers.find((entry) => entry.id === speaker.id)!;
      for (const field of localizedFields) {
        expect(speaker[field].trim(), `${speaker.id}: en.${field}`).not.toBe("");
        expect(speaker[field], `${speaker.id}: en.${field}`).not.toMatch(han);
        expect(zh[field].trim(), `${speaker.id}: zh.${field}`).not.toBe("");
      }
      // Names and project names may legitimately retain their original spelling.
      expect(zh.roleOrg, `${speaker.id}: zh.roleOrg`).toMatch(han);
      expect(zh.bio, `${speaker.id}: zh.bio`).toMatch(han);
      expect(zh.nameEn).toBe(speaker.name);
    }
  });

  it("keeps reviewed speaker copy in the import sources for both languages", () => {
    for (const speaker of speakers.speakers.filter((speaker) => !speaker.draft)) {
      const source = invitedSpeakers.find((entry) => entry.id === speaker.id)
        ?? speakerOverrides.find((entry) => entry.id === speaker.id);
      expect(source, `${speaker.id}: missing import override`).toBeDefined();
      const zh = speakersZh.speakers.find((entry) => entry.id === speaker.id)!;
      for (const field of localizedFields) {
        expect(source!.en[field], `${speaker.id}: en.${field}`).toBe(speaker[field]);
        expect(source!.zh[field], `${speaker.id}: zh.${field}`).toBe(zh[field]);
      }
    }
  });

  it("keeps all visible talk titles and overviews in the correct language", () => {
    for (const talk of talks) {
      for (const field of ["title", "overview"] as const) {
        expect(talk[field].en.trim(), `${talk.ref}: en.${field}`).not.toBe("");
        expect(talk[field].en, `${talk.ref}: en.${field}`).not.toMatch(han);
        expect(talk[field].zh, `${talk.ref}: zh.${field}`).toMatch(han);
      }
      // Manual sessions are retained directly by the importer; CFP sessions need overrides.
      if ("manual" in talk && talk.manual) continue;
      const override = scheduleOverrides.find((entry) => entry.ref === talk.ref);
      expect(override, `${talk.ref}: missing import override`).toBeDefined();
      expect(override!.title).toEqual(talk.title);
      expect(override!.overview).toEqual(talk.overview);
    }
  });
});
