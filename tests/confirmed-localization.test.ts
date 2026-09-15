import { describe, expect, it } from "vitest";
import { speakersEn as speakers } from "../src/utils/conference";
import speakersCanonical from "../src/json/Speakers.json";
import { speakersZh as speakersZh } from "../src/utils/conference";
import schedule from "../src/json/Schedule.json";

const han = /[\u3400-\u9fff]/u;
const localizedFields = ["name", "roleOrg", "bio"] as const;
const talks = schedule.tracks.flatMap((track) => track.talks).filter((talk) => !("draft" in talk && talk.draft));

describe("confirmed content localization", () => {
  it("provides English and Chinese copy for every published speaker", () => {
    expect(speakersCanonical.speakers.filter((s) => !s.draft)).toHaveLength(speakers.speakers.length);
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

  it("derives both languages directly from the single speaker record", () => {
    for (const source of speakersCanonical.speakers.filter((s) => !s.draft)) {
      const en = speakers.speakers.find((s) => s.id === source.id)!;
      const zh = speakersZh.speakers.find((s) => s.id === source.id)!;
      for (const field of localizedFields) {
        expect(en[field]).toBe(source[field].en);
        expect(zh[field]).toBe(source[field].zh);
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

    }
  });
});
