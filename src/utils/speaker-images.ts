export const SPEAKER_PLACEHOLDER_IMAGE =
  "/images/speakers/0-speaker-placeholder.png";

export const SPEAKER_IMAGE_FALLBACK_HANDLER =
  `this.onerror=null;this.src='${SPEAKER_PLACEHOLDER_IMAGE}'`;

const SPEAKER_PLACEHOLDER_IDS = new Set([
  "bartlomiej-szejny",
  "chenghao-rong",
  "chen-xin",
  "shuyue-hu",
  "xin-liu",
]);

export const getSpeakerImagePath = (speakerId?: string) => {
  const normalizedId = speakerId?.trim();

  return normalizedId && !SPEAKER_PLACEHOLDER_IDS.has(normalizedId)
    ? `/images/speakers/confirmed/${normalizedId}.png`
    : SPEAKER_PLACEHOLDER_IMAGE;
};
