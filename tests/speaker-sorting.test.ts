import { describe, expect, it } from "vitest";
import { compareSpeakersBySurname } from "../src/utils/speaker-sorting";

const canonicalNamesById = new Map([
  ["peng-zhang", "Peng Zhang"],
  ["shiwei-liu", "Shiwei Liu"],
  ["sebastien-crozet", "Sébastien Crozet"],
]);

describe("speaker surname sorting", () => {
  it("places keynote speakers before other primary speakers", () => {
    const speakers = [
      { id: "peng-zhang", name: "Peng Zhang", roleOrg: "Founder" },
      {
        id: "dhh",
        name: "David Heinemeier Hansson",
        roleOrg: "Keynote Speaker, 37signals",
        keynote: true,
      },
      { id: "pieter-delobelle", name: "Pieter Delobelle", roleOrg: "Co-speaker" },
    ];

    expect(speakers.sort(compareSpeakersBySurname).map((speaker) => speaker.id)).toEqual([
      "dhh",
      "peng-zhang",
      "pieter-delobelle",
    ]);
  });

  it("interleaves Chinese and English display names using canonical surnames", () => {
    const speakers = [
      { id: "peng-zhang", name: "张鹏", roleOrg: "创始人" },
      { id: "shiwei-liu", name: "刘世伟", roleOrg: "研究员" },
      { id: "sebastien-crozet", name: "Sébastien Crozet", roleOrg: "创始人" },
    ];

    expect(
      speakers
        .sort((a, b) =>
          compareSpeakersBySurname(a, b, canonicalNamesById),
        )
        .map((speaker) => speaker.id),
    ).toEqual(["sebastien-crozet", "shiwei-liu", "peng-zhang"]);
  });

  it("keeps all co-speakers after primary speakers", () => {
    const speakers = [
      { id: "xun-wang", name: "Xun Wang", roleOrg: "联合讲师" },
      { id: "peng-zhang", name: "Peng Zhang", roleOrg: "Founder" },
      { id: "pieter-delobelle", name: "Pieter Delobelle", roleOrg: "Co-speaker" },
      { id: "shiwei-liu", name: "Shiwei Liu", roleOrg: "Researcher" },
    ];

    expect(speakers.sort(compareSpeakersBySurname).map((speaker) => speaker.id)).toEqual([
      "shiwei-liu",
      "peng-zhang",
      "pieter-delobelle",
      "xun-wang",
    ]);
  });

  it("handles family-name-first and compound submitted names", () => {
    const speakers = [
      { id: "sebastien-crozet", name: "Sébastien Crozet" },
      { id: "chen-xin", name: "Chen Xin" },
      { id: "bryce-adelstein-lelbach", name: "Bryce Adelstein Lelbach" },
    ];

    expect(speakers.sort(compareSpeakersBySurname).map((speaker) => speaker.id)).toEqual([
      "bryce-adelstein-lelbach",
      "chen-xin",
      "sebastien-crozet",
    ]);
  });
});
