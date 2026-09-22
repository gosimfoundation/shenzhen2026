import { describe, expect, it } from "vitest";
import { mergeConfirmedContent, validateContent } from "../scripts/lib/confirmed-content.mjs";
import speakers from "../src/json/Speakers.json";
import schedule from "../src/json/Schedule.json";

const proposal = (overrides = {}) => ({
  ref: "P-999", status: "accept", name: "New Presenter",
  role_title: "Engineer", org: "Example", bio: "Builds inference systems.",
  title: "An inference session", abstract: "An introduction to inference systems.",
  tracks: ["sz26-ws-vllm-workshop"], ...overrides,
});

describe("single-source CFP import", () => {
  it("preserves edited translations, assignments, timing, manual sessions and invited speakers", () => {
    const current = structuredClone(schedule);
    const track = current.tracks.find((t) => t.id === "ws-vllm")!;
    const talk = track.talks.find((t) => t.ref === "P-164")!;
    talk.date = "2026-10-17";
    talk.timeSlot = "13:50-14:20";
    talk.speakers = ["jiangyun-zhu"];
    talk.title = {en: "Manually edited title", zh: "人工修订标题"};
    talk.overview = {en: "Manually edited description.", zh: "人工修订介绍。"};
    const imported = mergeConfirmedContent(speakers, current, [proposal({
      ref: "P-164", name: "黄梓铭", tracks: ["sz26-agentic-os-app"],
      title: "Changed CFP title", abstract: "Changed CFP abstract",
    })]);
    const merged = imported.schedule.tracks.find((t) => t.id === "ws-vllm").talks.find((t) => t.ref === "P-164");
    expect(merged).toMatchObject({
      title: talk.title, overview: talk.overview, speakers: ["jiangyun-zhu"],
      slug: talk.slug, date: "2026-10-17", timeSlot: "13:50-14:20",
      originalTitle: "Changed CFP title", originalAbstract: "Changed CFP abstract",
    });
    expect(imported.speakers).toEqual(speakers);
    expect(imported.schedule.tracks.flatMap((t) => t.talks.map((talk) => talk.ref)))
      .toEqual(current.tracks.flatMap((t) => t.talks.map((talk) => talk.ref)));
    expect(imported.report.sourceChanges).toEqual(["P-164"]);
    expect(imported.report.speakerAssignmentChanges).toEqual(["P-164"]);
    expect(current.tracks.find((t) => t.id === "ws-vllm")!.talks.find((t) => t.ref === "P-164")).toEqual(talk);
  });

  it("adds untranslated records as drafts in the same two files and is idempotent", () => {
    const first = mergeConfirmedContent(speakers, schedule, [proposal()]);
    const person = first.speakers.speakers.find((s) => s.id === "new-presenter");
    expect(person).toMatchObject({draft: true, name: {en: "New Presenter", zh: "New Presenter"}, bio: {en: "Builds inference systems.", zh: ""}});
    const talk = first.schedule.tracks.find((t) => t.id === "ws-vllm").talks.find((t) => t.ref === "P-999");
    expect(talk).toMatchObject({draft: true, title: {en: "An inference session", zh: ""}});
    const second = mergeConfirmedContent(first.speakers, first.schedule, [proposal()]);
    expect(second.speakers).toEqual(first.speakers);
    expect(second.schedule).toEqual(first.schedule);
    expect(second.report.newTalks).toEqual([]);
    expect(second.report.newSpeakers).toEqual([]);
  });

  it("matches CFP name aliases without duplicating profiles", () => {
    const result = mergeConfirmedContent(speakers, schedule, [proposal({name: "董鑫"})]);
    expect(result.report.newSpeakers).toEqual([]);
    expect(result.schedule.tracks.find((t) => t.id === "ws-vllm").talks.find((t) => t.ref === "P-999").speakers).toEqual(["sean-dong"]);
  });

  it("adds a changed co-presenter for review without replacing the published assignment", () => {
    const result = mergeConfirmedContent(speakers, schedule, [proposal({ref: "P-164", name: "黄梓铭", coSpeakers: [{name: "New Copresenter"}]})]);
    expect(result.report.newSpeakers).toEqual(["new-copresenter"]);
    expect(result.report.speakerAssignmentChanges).toEqual(["P-164"]);
    expect(result.schedule.tracks.find((t) => t.id === "ws-vllm").talks.find((t) => t.ref === "P-164").speakers).toEqual(["黄梓铭"]);
  });

  it("never copies a Chinese CFP biography into the English field", () => {
    const result = mergeConfirmedContent(speakers, schedule, [proposal({name: "新讲师", bio: "研究高效推理。", title: "推理系统介绍", abstract: "介绍推理系统。"})]);
    const person = result.speakers.speakers.find((s) => s.id === "新讲师");
    expect(person.name).toEqual({en: "", zh: "新讲师"});
    expect(person.bio).toEqual({en: "", zh: "研究高效推理。"});
  });

  it("requires translation and published speaker profiles before publishing a draft", () => {
    const result = mergeConfirmedContent(speakers, schedule, [proposal()]);
    const talk = result.schedule.tracks.find((t) => t.id === "ws-vllm").talks.find((t) => t.ref === "P-999");
    talk.draft = false;
    const errors = validateContent(result.speakers, result.schedule);
    expect(errors.join("\n")).toContain("translation required before publishing");
    expect(errors.join("\n")).toContain("draft speaker new-presenter");
  });

  it("rejects bad exports before mutating content", () => {
    const before = JSON.stringify({speakers, schedule});
    expect(() => mergeConfirmedContent(speakers, schedule, [proposal({tracks: ["unknown"]})])).toThrow("category");
    expect(() => mergeConfirmedContent(speakers, schedule, [proposal(), proposal()])).toThrow("duplicate");
    expect(() => mergeConfirmedContent(speakers, schedule, [proposal({status: "reject"})])).toThrow("no accepted");
    expect(JSON.stringify({speakers, schedule})).toBe(before);
  });
});
