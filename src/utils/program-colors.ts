// One shared editorial palette for homepage cards, schedule selectors, and
// speaker filters. Both CFP source IDs and public schedule IDs resolve here.
export const PROGRAM_CATEGORY_COLORS: Readonly<Record<string, string>> = {
  "special-keynote": "#F84A10",

  "agentic-ai-summit": "#EF6A3A",
  "sz26-agentic-ai-summit": "#EF6A3A",
  "agentic-ai-on-edge": "#D5A24A",
  "sz26-agentic-ai-on-edge": "#D5A24A",
  "ai-generative-app": "#75A49C",
  "sz26-agentic-os-app": "#75A49C",
  "open-source-model": "#91A66B",
  "sz26-open-source-model": "#91A66B",
  "open-source-robotics": "#8096B2",
  "sz26-open-source-robotics": "#8096B2",
  "agentic-device": "#A48692",
  "sz26-agentic-device": "#A48692",

  // Workshop colors extend the same muted print-ink family without repeating
  // any of the six track colors.
  "ws-ai-education": "#C97872",
  "ws-dora": "#5F9AA8",
  "ws-vllm": "#8C7BB3",
  "ws-google-cloud": "#6F8CCB",
  "ws-kvcdn": "#B98B55",
};

export const DEFAULT_PROGRAM_CATEGORY_COLOR = "#6B6450";

export const programCategoryColor = (id: string) =>
  PROGRAM_CATEGORY_COLORS[id] || DEFAULT_PROGRAM_CATEGORY_COLOR;
