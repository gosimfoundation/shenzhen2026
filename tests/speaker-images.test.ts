import { describe, expect, it } from "vitest";
import {
  getSpeakerImagePath,
  SPEAKER_IMAGE_FALLBACK_HANDLER,
  SPEAKER_PLACEHOLDER_IMAGE,
} from "../src/utils/speaker-images";

describe("speaker image paths", () => {
  it("uses the canonical confirmed PNG filename for every speaker", () => {
    expect(getSpeakerImagePath("che-jiang")).toBe(
      "/images/speakers/confirmed/che-jiang.png",
    );
  });

  it("falls back when no speaker id is available", () => {
    expect(getSpeakerImagePath()).toBe(SPEAKER_PLACEHOLDER_IMAGE);
    expect(SPEAKER_IMAGE_FALLBACK_HANDLER).toContain(
      SPEAKER_PLACEHOLDER_IMAGE,
    );
  });

  it.each([
    "bartlomiej-szejny",
    "chenghao-rong",
    "chen-xin",
    "shuyue-hu",
    "xin-liu",
  ])("uses the placeholder instead of the GitHub identicon for %s", (speakerId) => {
    expect(getSpeakerImagePath(speakerId)).toBe(SPEAKER_PLACEHOLDER_IMAGE);
  });
});
