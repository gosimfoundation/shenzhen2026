type SpeakerForSorting = {
  id: string;
  name: string;
  roleOrg?: string;
  keynote?: boolean;
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
  "chen-xin": "Chen",
  codingma: "Ma",
};

const isCoSpeaker = (speaker: SpeakerForSorting) => {
  const role = speaker.roleOrg?.trim().toLocaleLowerCase() || "";
  return role === "co-speaker" || role === "联合讲师";
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
  const keynoteOrder = Number(b.keynote === true) - Number(a.keynote === true);
  if (keynoteOrder !== 0) return keynoteOrder;

  const speakerTypeOrder = Number(isCoSpeaker(a)) - Number(isCoSpeaker(b));
  if (speakerTypeOrder !== 0) return speakerTypeOrder;

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
