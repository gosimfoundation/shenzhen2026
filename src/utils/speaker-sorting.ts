type SpeakerForSorting = {
  id: string;
  name: string;
  roleOrg?: string;
  keynote?: boolean;
  tags?: string[];
};

type CanonicalNamesById = ReadonlyMap<string, string>;

const surnameCollator = new Intl.Collator("en", {
  numeric: true,
  sensitivity: "base",
});

// These submitted names use a mononym, family-name-first order, or a compound
// surname that cannot be derived reliably by taking the final word.
const surnameOverrides: Record<string, string> = {
  "alba-maria-tellez-fernandez": "Téllez Fernández",
  "bryce-adelstein-lelbach": "Adelstein Lelbach",
  "cen-ming": "Cen",
  "chen-xin": "Chen",
  "zhifei-xie": "Xie",
  codingma: "Ma",
};

const isKeynoteSpeaker = (speaker: SpeakerForSorting) =>
  speaker.keynote === true || speaker.tags?.includes("special-keynote") === true;

const speakerGroupRank = (speaker: SpeakerForSorting) => {
  if (speaker.id === "dhh") return 0;
  if (isKeynoteSpeaker(speaker)) return 1;
  return 2;
};

const getSurname = (
  speaker: SpeakerForSorting,
  canonicalNamesById?: CanonicalNamesById,
) => {
  const override = surnameOverrides[speaker.id];
  if (override) return override;

  const canonicalName = canonicalNamesById?.get(speaker.id) || speaker.name;
  const nameParts = canonicalName.trim().split(/\s+/);
  return nameParts.at(-1) || canonicalName;
};

export const compareSpeakersBySurname = (
  a: SpeakerForSorting,
  b: SpeakerForSorting,
  canonicalNamesById?: CanonicalNamesById,
) => {
  const groupOrder = speakerGroupRank(a) - speakerGroupRank(b);
  if (groupOrder !== 0) return groupOrder;

  const surnameOrder = surnameCollator.compare(
    getSurname(a, canonicalNamesById),
    getSurname(b, canonicalNamesById),
  );
  if (surnameOrder !== 0) return surnameOrder;

  const canonicalNameA = canonicalNamesById?.get(a.id) || a.name;
  const canonicalNameB = canonicalNamesById?.get(b.id) || b.name;
  const nameOrder = surnameCollator.compare(canonicalNameA, canonicalNameB);
  return nameOrder !== 0 ? nameOrder : a.id.localeCompare(b.id);
};
