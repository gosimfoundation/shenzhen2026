import speakerData from "../json/Speakers.json";
import scheduleData from "../json/Schedule.json";

export type Language = "en" | "zh";
export type LocalizedText = Record<Language, string>;
export interface Speaker {
  id: string;
  name: LocalizedText;
  roleOrg: LocalizedText;
  bio: LocalizedText;
  image: string;
  tags: string[];
  socialLinks: Record<string, string>;
  draft?: boolean;
  keynote?: boolean;
  source?: string;
  sourceNames?: string[];
}
export interface Talk {
  ref: string;
  slug: string;
  title: LocalizedText;
  overview: LocalizedText;
  speakers: string[];
  date?: string;
  timeSlot?: string;
  room?: LocalizedText;
  type?: string;
  draft?: boolean;
  manual?: boolean;
  originalTitle: string;
  originalLanguage: string;
  originalAbstract: string;
  originalAbstractLanguage: string;
}
export interface Track {
  id: string;
  sourceId: string;
  name: LocalizedText;
  group: string;
  notice?: LocalizedText;
  room?: LocalizedText;
  talks: Talk[];
}

// These are read-only language views. Edit the two JSON files, never generated copies.
export const allSpeakers = speakerData.speakers as Speaker[];
export const allTracks = scheduleData.tracks as Track[];
export const schedule = {
  ...scheduleData,
  tracks: allTracks.map((track) => ({
    ...track,
    talks: track.talks.filter((talk) => !talk.draft),
  })),
};

export function localizeSpeakers(lang: Language) {
  return {
    categories: [
      { id: "all", name: "All", nameZh: "全部", group: "" },
      ...allTracks.map((track) => ({
        id: track.sourceId,
        name: track.name.en,
        nameZh: track.name.zh,
        group: track.group,
      })),
    ],
    speakers: allSpeakers.filter((speaker) => !speaker.draft).map((speaker) => ({
      ...speaker,
      name: speaker.name[lang],
      nameEn: speaker.name.en,
      roleOrg: speaker.roleOrg[lang],
      bio: speaker.bio[lang],
    })),
  };
}
export const speakersEn = localizeSpeakers("en");
export const speakersZh = localizeSpeakers("zh");

export function getEventPaths(lang: Language) {
  const people = new Map(localizeSpeakers(lang).speakers.map((speaker) => [speaker.id, speaker]));
  return schedule.tracks.flatMap((track) => track.talks.map((talk) => ({
    params: { event: talk.slug },
    props: {
      category: track.id,
      event: {
        title: talk.title[lang],
        content: "",
        date: talk.date || "",
        timeSlot: talk.timeSlot || "",
        type: talk.type || "talk",
        speakers: talk.speakers.map((id) => {
          const speaker = people.get(id);
          if (!speaker) throw new Error(`${talk.ref}: missing published speaker ${id}`);
          return speaker;
        }),
        room: talk.room?.[lang] || track.room?.[lang] || "",
        slug: talk.slug,
        categoryLabel: track.name[lang],
        preview: !(talk.date && talk.timeSlot),
        overview: talk.overview[lang],
        notice: track.notice?.[lang] || "",
      },
    },
  })));
}
