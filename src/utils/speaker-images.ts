export const SPEAKER_PLACEHOLDER_IMAGE =
  "/images/speakers/0-speaker-placeholder.png";

export const SPEAKER_IMAGE_FALLBACK_HANDLER =
  `this.onerror=null;this.src='${SPEAKER_PLACEHOLDER_IMAGE}'`;

export const getSpeakerImagePath = (speakerId?: string) => {
  const normalizedId = speakerId?.trim();

  return normalizedId
    ? `/images/speakers/confirmed/${normalizedId}.png`
    : SPEAKER_PLACEHOLDER_IMAGE;
};
