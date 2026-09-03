import { describe, expect, it } from "vitest";
import {
  PROGRAM_CATEGORY_COLORS,
  programCategoryColor,
} from "../src/utils/program-colors";

describe("shared program category colors", () => {
  it("keeps all six tracks and three workshops visually distinct", () => {
    const categoryIds = [
      "agentic-ai-summit",
      "agentic-ai-on-edge",
      "ai-generative-app",
      "open-source-model",
      "open-source-robotics",
      "agentic-device",
      "ws-ai-education",
      "ws-dora",
      "ws-vllm",
    ];

    expect(new Set(categoryIds.map(programCategoryColor)).size).toBe(9);
  });

  it("maps CFP source IDs to the same colors used by the public schedule", () => {
    expect(PROGRAM_CATEGORY_COLORS["sz26-agentic-ai-summit"])
      .toBe(PROGRAM_CATEGORY_COLORS["agentic-ai-summit"]);
    expect(PROGRAM_CATEGORY_COLORS["sz26-agentic-ai-on-edge"])
      .toBe(PROGRAM_CATEGORY_COLORS["agentic-ai-on-edge"]);
    expect(PROGRAM_CATEGORY_COLORS["sz26-agentic-os-app"])
      .toBe(PROGRAM_CATEGORY_COLORS["ai-generative-app"]);
  });
});
