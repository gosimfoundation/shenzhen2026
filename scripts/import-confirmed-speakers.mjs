#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

// Add future filter categories here with group: "tracks", "workshops", or "events".
const PROGRAM_CATEGORIES = [
  {
    id: "special-keynote",
    name: "Keynote Plenary",
    nameZh: "Keynote 全体大会",
    group: "tracks",
  },
  {
    id: "sz26-agentic-ai-summit",
    name: "Agentic AI Summit",
    nameZh: "智能体 AI 峰会",
    group: "tracks",
  },
  {
    id: "sz26-agentic-ai-on-edge",
    name: "Agentic AI on Edge",
    nameZh: "边缘智能体 AI",
    group: "tracks",
  },
  {
    id: "sz26-agentic-os-app",
    name: "Agentic OS & App",
    nameZh: "智能体操作系统与应用",
    group: "tracks",
  },
  {
    id: "sz26-agentic-device",
    name: "Agentic Device",
    nameZh: "智能体设备",
    group: "tracks",
  },
  {
    id: "sz26-open-source-model",
    name: "Open Source Models & Infra",
    nameZh: "开源模型与基础设施",
    group: "tracks",
  },
  {
    id: "sz26-open-source-robotics",
    name: "Open Source Robotics",
    nameZh: "开源机器人",
    group: "tracks",
  },
  {
    id: "ws-ai-education",
    name: "AI Education Workshop",
    nameZh: "AI 教育工作坊",
    group: "workshops",
  },
  {
    id: "ws-dora",
    name: "DORA Workshop",
    nameZh: "DORA 工作坊",
    group: "workshops",
  },
  {
    id: "ws-vllm",
    name: "vLLM Workshop",
    nameZh: "vLLM 工作坊",
    group: "workshops",
  },
  {
    id: "ws-google-cloud",
    name: "Google Cloud Workshop",
    nameZh: "Google Cloud 工作坊",
    group: "workshops",
  },
  {
    id: "ws-kvcdn",
    name: "KVCDN Workshop",
    nameZh: "KVCDN 工作坊",
    group: "workshops",
  },
];

const TRACK_ALIASES = new Map([
  // The CFP portal currently exposes this workshop ID with a typo.
  ["sz26-ws-ai-education-workshoip", "ws-ai-education"],
  ["sz26-ws-dora-workshop", "ws-dora"],
  ["sz26-ws-vllm-workshop", "ws-vllm"],
  ["sz26-ws-google-cloud-workshop", "ws-google-cloud"],
  ["sz26-ws-kvcdn-workshop", "ws-kvcdn"],
  ["sz26-special-keynote", "special-keynote"],
]);

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const confirmedPhotoDirectory = path.join(
  projectRoot,
  "public/images/speakers/confirmed",
);
const photoInboxDirectory = path.join(projectRoot, "speaker-photo-inbox");
const supportedPhotoExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".jfif",
  ".png",
  ".webp",
]);
const sourcePath = process.argv[2];
const photosZipPath = process.argv[3];

if (!sourcePath) {
  console.error(
    "Usage: npm run import-speakers -- /path/to/accepted-proposals.json [/path/to/speakers-photos.zip]",
  );
  process.exit(1);
}

const cleanText = (value) =>
  typeof value === "string" ? value.trim().replace(/\r\n/g, "\n") : "";

const speakerNameKey = (value) =>
  cleanText(value)
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLocaleLowerCase();

const slugify = (name, fallback) => {
  const slug = cleanText(name)
    .normalize("NFKD")
    .replace(/\p{Mark}/gu, "")
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `speaker-${cleanText(fallback).toLowerCase()}`;
};

const normalizeTracks = (value) => {
  const tracks = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      tracks
        .map(cleanText)
        .filter(Boolean)
        .map((track) => TRACK_ALIASES.get(track) || track),
    ),
  ];
};

const normalizeUrl = (value, platform) => {
  let candidate = cleanText(value);
  if (!candidate) return undefined;

  if (platform === "twitter") {
    if (candidate.startsWith("@")) candidate = candidate.slice(1);
    if (!candidate.includes(".") && !candidate.includes("/")) {
      candidate = `https://x.com/${candidate}`;
    }
  }

  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;

  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;

    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    if (platform === "github" && hostname !== "github.com") return undefined;
    if (platform === "linkedin" && !hostname.endsWith("linkedin.com")) {
      return undefined;
    }
    if (
      platform === "twitter" &&
      !["x.com", "twitter.com"].includes(hostname)
    ) {
      return undefined;
    }

    return url.toString();
  } catch {
    return undefined;
  }
};

const getSocialLinks = (proposal) =>
  Object.fromEntries(
    ["website", "github", "twitter", "linkedin", "mastodon", "bluesky"]
      .map((platform) => [
        platform,
        normalizeUrl(proposal[platform], platform),
      ])
      .filter(([, value]) => value),
  );

const roleAndOrganization = (person) => {
  const role = cleanText(person.effectiveRole ?? person.role_title);
  const organization = cleanText(person.effectiveOrg ?? person.org);
  return [role, organization].filter(Boolean).join(", ") || "Speaker";
};

const overrideData = JSON.parse(
  await readFile(path.join(projectRoot, "src/json/SpeakerOverrides.json"), "utf8"),
);
if (!Array.isArray(overrideData)) {
  throw new TypeError("SpeakerOverrides.json must contain an array.");
}

const overridesBySourceName = new Map();
for (const entry of overrideData) {
  const sourceName = cleanText(entry.sourceName);
  if (!sourceName) throw new Error("Every speaker override needs a sourceName.");

  const key = speakerNameKey(sourceName);
  if (overridesBySourceName.has(key)) {
    throw new Error(`Duplicate speaker override for ${sourceName}.`);
  }
  overridesBySourceName.set(key, entry);
}

const scheduleOverrideData = JSON.parse(
  await readFile(
    path.join(projectRoot, "src/json/SchedulePreviewOverrides.json"),
    "utf8",
  ),
);
if (!Array.isArray(scheduleOverrideData)) {
  throw new TypeError("SchedulePreviewOverrides.json must contain an array.");
}

const scheduleOverridesByRef = new Map();
for (const entry of scheduleOverrideData) {
  const ref = cleanText(entry.ref);
  if (!ref) throw new Error("Every schedule preview override needs a ref.");
  if (scheduleOverridesByRef.has(ref)) {
    throw new Error(`Duplicate schedule preview override for ${ref}.`);
  }
  scheduleOverridesByRef.set(ref, entry);
}

const normalizeProposalTracks = (proposal) => {
  const categoryOverride = cleanText(
    scheduleOverridesByRef.get(cleanText(proposal.ref))?.categoryId,
  );
  return categoryOverride
    ? [TRACK_ALIASES.get(categoryOverride) || categoryOverride]
    : normalizeTracks(proposal.tracks);
};

const invitedSpeakerData = JSON.parse(
  await readFile(path.join(projectRoot, "src/json/InvitedSpeakers.json"), "utf8"),
);
if (!Array.isArray(invitedSpeakerData)) {
  throw new TypeError("InvitedSpeakers.json must contain an array.");
}

const invitedSpeakersById = new Map();
const invitedSpeakerIdBySourceNameKey = new Map();
for (const entry of invitedSpeakerData) {
  const id = cleanText(entry.id);
  const name = cleanText(entry.en?.name);
  const nameZh = cleanText(entry.zh?.name) || name;
  if (!id || !name) {
    throw new Error("Every invited speaker needs an id and an English name.");
  }
  if (invitedSpeakersById.has(id)) {
    throw new Error(`Duplicate invited speaker id: ${id}.`);
  }

  invitedSpeakersById.set(id, {
    en: {
      id,
      name,
      roleOrg: cleanText(entry.en?.roleOrg) || "Invited Speaker",
      bio: cleanText(entry.en?.bio),
      tags: normalizeTracks(entry.tags ?? []),
      socialLinks: entry.socialLinks ?? {},
      draft: false,
      keynote: entry.keynote === true,
      image:
        cleanText(entry.image) || `/images/speakers/confirmed/${id}.png`,
    },
    zh: {
      id,
      name: nameZh,
      roleOrg: cleanText(entry.zh?.roleOrg) || "受邀讲师",
      bio: cleanText(entry.zh?.bio) || cleanText(entry.en?.bio),
      nameEn: name,
      tags: normalizeTracks(entry.tags ?? []),
      socialLinks: entry.socialLinks ?? {},
      draft: false,
      keynote: entry.keynote === true,
      image:
        cleanText(entry.image) || `/images/speakers/confirmed/${id}.png`,
    },
  });

  const sourceNames = Array.isArray(entry.sourceNames)
    ? entry.sourceNames
    : [entry.sourceName].filter(Boolean);
  for (const sourceName of sourceNames) {
    const sourceKey = speakerNameKey(sourceName);
    if (invitedSpeakerIdBySourceNameKey.has(sourceKey)) {
      throw new Error(`Duplicate invited speaker source name: ${sourceName}.`);
    }
    invitedSpeakerIdBySourceNameKey.set(sourceKey, id);
  }
}

const raw = JSON.parse(await readFile(path.resolve(sourcePath), "utf8"));
if (!Array.isArray(raw)) {
  throw new TypeError("The confirmed-speakers export must be a JSON array.");
}

const accepted = raw.filter(
  (proposal) => cleanText(proposal.status).toLowerCase() === "accept",
);
if (!accepted.length) {
  throw new Error("The export contains no accepted proposals; no files were changed.");
}

const confirmedImagesById = new Map();
try {
  for (const filename of await readdir(confirmedPhotoDirectory)) {
    const extension = path.extname(filename).toLowerCase();
    if (!supportedPhotoExtensions.has(extension)) continue;

    const id = filename.slice(0, -extension.length);
    if (confirmedImagesById.has(id)) {
      throw new Error(
        `Multiple confirmed portraits found for ${id}: ${confirmedImagesById.get(id)} and ${filename}`,
      );
    }
    confirmedImagesById.set(id, filename);
  }
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const photosByName = new Map();
let readPhotoZipEntry;
if (photosZipPath) {
  const zipPath = path.resolve(photosZipPath);
  readPhotoZipEntry = (entryPath) =>
    execFileSync("unzip", ["-p", zipPath, entryPath], {
      maxBuffer: 25 * 1024 * 1024,
    });
  const manifest = JSON.parse(
    readPhotoZipEntry("manifest.json").toString("utf8"),
  );

  if (!manifest.trackBreakdown || typeof manifest.trackBreakdown !== "object") {
    throw new TypeError("The photo ZIP does not contain a valid speaker manifest.");
  }

  for (const [trackId, track] of Object.entries(manifest.trackBreakdown)) {
    if (!Array.isArray(track.speakers)) continue;

    for (const manifestSpeaker of track.speakers) {
      const name = cleanText(manifestSpeaker.name);
      const imageFile = cleanText(manifestSpeaker.imageFile);
      const extension = path.extname(imageFile).toLowerCase();
      if (!name || !imageFile) continue;
      if (path.basename(imageFile) !== imageFile) {
        throw new Error(`Unsafe image filename in photo manifest: ${imageFile}`);
      }
      if (![".jpg", ".jpeg", ".jfif", ".png", ".webp"].includes(extension)) {
        throw new Error(`Unsupported speaker image format: ${imageFile}`);
      }

      const key = speakerNameKey(name);
      const existingPhoto = photosByName.get(key);
      if (existingPhoto) {
        if (existingPhoto.imageFile !== imageFile) {
          throw new Error(`Conflicting photo manifest entries for ${name}.`);
        }
        continue;
      }

      const archivePath = `${trackId}/${imageFile}`;
      photosByName.set(key, { archivePath, imageFile });
    }
  }
}

let existingSpeakers = [];
let existingSpeakersZh = [];
try {
  const existingData = JSON.parse(
    await readFile(path.join(projectRoot, "src/json/SpeakersCleaned.json"), "utf8"),
  );
  existingSpeakers = Array.isArray(existingData.speakers)
    ? existingData.speakers
    : [];
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
try {
  const existingDataZh = JSON.parse(
    await readFile(path.join(projectRoot, "src/json/SpeakersZh.json"), "utf8"),
  );
  existingSpeakersZh = Array.isArray(existingDataZh.speakers)
    ? existingDataZh.speakers
    : [];
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const existingByName = new Map(
  existingSpeakers.map((speaker) => [
    speakerNameKey(speaker.name),
    speaker,
  ]),
);
const existingById = new Map(
  existingSpeakers.map((speaker) => [cleanText(speaker.id), speaker]),
);
const existingZhById = new Map(
  existingSpeakersZh.map((speaker) => [cleanText(speaker.id), speaker]),
);

const speakersByName = new Map();
const usedIds = new Set();
const sourceNameKeyById = new Map();
const speakerIdBySourceNameKey = new Map();
const coSpeakerIds = new Set();
const primarySpeakerIds = new Set();

const addSpeaker = (person, proposal, isCoSpeaker = false) => {
  const sourceName = cleanText(person.name);
  if (!sourceName) return;

  const sourceKey = speakerNameKey(sourceName);
  const invitedSpeakerId = invitedSpeakerIdBySourceNameKey.get(sourceKey);
  if (invitedSpeakerId) {
    if (isCoSpeaker) {
      throw new Error(`${sourceName} is configured as an invited primary speaker.`);
    }

    const invitedSpeaker = invitedSpeakersById.get(invitedSpeakerId);
    const tags = normalizeProposalTracks(proposal);
    invitedSpeaker.en.tags = [...new Set([...invitedSpeaker.en.tags, ...tags])];
    invitedSpeaker.zh.tags = [...new Set([...invitedSpeaker.zh.tags, ...tags])];
    invitedSpeaker.en.socialLinks = {
      ...getSocialLinks(proposal),
      ...invitedSpeaker.en.socialLinks,
    };
    invitedSpeaker.zh.socialLinks = invitedSpeaker.en.socialLinks;
    sourceNameKeyById.set(invitedSpeakerId, sourceKey);
    speakerIdBySourceNameKey.set(sourceKey, invitedSpeakerId);
    primarySpeakerIds.add(invitedSpeakerId);
    return;
  }

  const contentOverride = overridesBySourceName.get(sourceKey);
  const name = cleanText(contentOverride?.en?.name) || sourceName;
  const key = speakerNameKey(name);
  const tags = normalizeProposalTracks(proposal);
  const existing = speakersByName.get(key);
  const baseId = cleanText(contentOverride?.id) || slugify(name, proposal.ref);
  const previous =
    existingById.get(baseId) ||
    existingByName.get(key) ||
    existingByName.get(sourceKey);
  const overrideRoleOrg = cleanText(contentOverride?.en?.roleOrg);
  const overrideBio = cleanText(contentOverride?.en?.bio);

  if (existing) {
    speakerIdBySourceNameKey.set(sourceKey, existing.id);
    existing.tags = [...new Set([...existing.tags, ...tags])];
    if (!existing.bio) existing.bio = overrideBio || cleanText(person.bio);
    if (isCoSpeaker && !primarySpeakerIds.has(existing.id)) {
      existing.roleOrg = "Co-speaker";
      coSpeakerIds.add(existing.id);
    } else if (!isCoSpeaker) {
      primarySpeakerIds.add(existing.id);
      coSpeakerIds.delete(existing.id);
    }
    if (!isCoSpeaker && ["Speaker", "Co-speaker"].includes(existing.roleOrg)) {
      existing.roleOrg = overrideRoleOrg || roleAndOrganization(person);
    }
    if (!isCoSpeaker) {
      existing.socialLinks = {
        ...existing.socialLinks,
        ...getSocialLinks(proposal),
      };
    }
    return;
  }

  let id = baseId;
  let suffix = 2;
  while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
  usedIds.add(id);

  if (isCoSpeaker) {
    coSpeakerIds.add(id);
  } else {
    primarySpeakerIds.add(id);
  }

  const speaker = {
    id,
    name,
    roleOrg: isCoSpeaker
      ? "Co-speaker"
      : overrideRoleOrg ||
        (roleAndOrganization(person) === "Speaker" && previous?.roleOrg
          ? previous.roleOrg
          : roleAndOrganization(person)),
    bio: overrideBio || cleanText(person.bio) || cleanText(previous?.bio),
    tags,
    socialLinks: {
      ...(previous?.socialLinks ?? {}),
      ...(isCoSpeaker ? {} : getSocialLinks(proposal)),
    },
    draft: false,
  };

  // Every profile gets its canonical PNG path up front. The browser falls
  // back to the placeholder until that file is added to the confirmed folder.
  speaker.image = `/images/speakers/confirmed/${id}.png`;

  speakersByName.set(key, speaker);
  sourceNameKeyById.set(id, sourceKey);
  speakerIdBySourceNameKey.set(sourceKey, id);
};

for (const proposal of accepted) {
  addSpeaker(proposal, proposal);
  for (const coSpeaker of proposal.coSpeakers ?? []) {
    addSpeaker(coSpeaker, proposal, true);
  }
}

const presentTrackIds = new Set(
  [
    ...[...invitedSpeakersById.values()].map((speaker) => speaker.en),
    ...speakersByName.values(),
  ].flatMap((speaker) => speaker.tags),
);
const unknownTracks = [...presentTrackIds].filter(
  (trackId) => !PROGRAM_CATEGORIES.some((category) => category.id === trackId),
);
if (unknownTracks.length) {
  throw new Error(`Unknown track IDs: ${unknownTracks.join(", ")}`);
}

for (const invitedSpeakerId of invitedSpeakersById.keys()) {
  if (usedIds.has(invitedSpeakerId)) {
    throw new Error(
      `Invited speaker id ${invitedSpeakerId} conflicts with a CFP speaker.`,
    );
  }
}

const output = {
  categories: [
    { name: "All", nameZh: "全部", id: "all" },
    ...PROGRAM_CATEGORIES.filter((category) => presentTrackIds.has(category.id)),
  ],
  speakers: [
    ...[...invitedSpeakersById.values()].map((speaker) => speaker.en),
    ...speakersByName.values(),
  ],
};

const outputZh = {
  categories: output.categories,
  speakers: output.speakers.map((speaker) => {
    const invitedSpeaker = invitedSpeakersById.get(speaker.id);
    if (invitedSpeaker) return invitedSpeaker.zh;

    const contentOverride = overridesBySourceName.get(
      sourceNameKeyById.get(speaker.id),
    );
    const nameZh = cleanText(contentOverride?.zh?.name) || speaker.name;
    const roleOrgZh = coSpeakerIds.has(speaker.id)
      ? "联合讲师"
      : cleanText(contentOverride?.zh?.roleOrg) || speaker.roleOrg;
    const bioZh = cleanText(contentOverride?.zh?.bio) || speaker.bio;
    const localizedSpeaker = {
      ...speaker,
      name: nameZh,
      roleOrg: roleOrgZh,
      bio: bioZh,
      nameEn: speaker.name,
    };
    const existingSpeakerZh = existingZhById.get(speaker.id);
    if (!existingSpeakerZh) return localizedSpeaker;

    return Object.fromEntries([
      ...Object.keys(existingSpeakerZh)
        .filter((key) => key in localizedSpeaker)
        .map((key) => [key, localizedSpeaker[key]]),
      ...Object.entries(localizedSpeaker).filter(
        ([key]) => !(key in existingSpeakerZh),
      ),
    ]);
  }),
};

if (photosZipPath) {
  await mkdir(photoInboxDirectory, { recursive: true });
  const inboxFilenames = new Set(await readdir(photoInboxDirectory));
  const stagedPhotos = [];

  for (const speaker of output.speakers) {
    if (confirmedImagesById.has(speaker.id)) continue;

    const photo = photosByName.get(sourceNameKeyById.get(speaker.id));
    if (!photo) continue;

    const filename = `${speaker.id}.jpg`;
    if (inboxFilenames.has(filename)) continue;

    const editingCopy = await sharp(readPhotoZipEntry(photo.archivePath))
      .rotate()
      .resize({
        width: 2000,
        height: 2000,
        fit: "inside",
        withoutEnlargement: true,
      })
      .flatten({ background: "#ffffff" })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();
    stagedPhotos.push({ filename, buffer: editingCopy });
    inboxFilenames.add(filename);
  }

  await Promise.all(
    stagedPhotos.map(({ filename, buffer }) =>
      writeFile(path.join(photoInboxDirectory, filename), buffer),
    ),
  );

  const missingPhotos = [
    ...new Set(
      accepted
        .filter((proposal) => {
          const sourceKey = speakerNameKey(proposal.name);
          const speakerId = speakerIdBySourceNameKey.get(sourceKey);
          return (
            speakerId &&
            !confirmedImagesById.has(speakerId) &&
            !inboxFilenames.has(`${speakerId}.jpg`) &&
            !photosByName.has(sourceKey)
          );
        })
        .map((proposal) => cleanText(proposal.name)),
    ),
  ];
  if (missingPhotos.length) {
    console.warn(
      `No photo supplied for ${missingPhotos.length} accepted primary speaker(s): ${missingPhotos.join(", ")}`,
    );
  }
  console.log(
    `Staged ${stagedPhotos.length} new speaker photo(s) in speaker-photo-inbox; preserved ${confirmedImagesById.size} confirmed portrait(s).`,
  );
}

const serialized = `${JSON.stringify(output, null, 2)}\n`;
const serializedZh = `${JSON.stringify(outputZh, null, 2)}\n`;
const outputPaths = [
  path.join(projectRoot, "src/json/Speakers.json"),
  path.join(projectRoot, "src/json/SpeakersCleaned.json"),
];

await Promise.all(outputPaths.map((outputPath) => writeFile(outputPath, serialized)));
await writeFile(
  path.join(projectRoot, "src/json/SpeakersZh.json"),
  serializedZh,
);

// Keep the temporary no-time schedule connected to the latest accepted CFP
// proposals. Existing hand-reviewed title translations and bilingual talk
// overviews are preserved by proposal reference; newly accepted proposals get
// safe source-language content until those translations are reviewed.
const schedulePreviewPath = path.join(
  projectRoot,
  "src/json/SchedulePreview.json",
);
try {
  const schedulePreview = JSON.parse(
    await readFile(schedulePreviewPath, "utf8"),
  );
  const existingTracks = Array.isArray(schedulePreview.tracks)
    ? schedulePreview.tracks
    : [];
  const existingTalkByRef = new Map(
    existingTracks.flatMap((track) =>
      (track.talks ?? []).map((talk) => [cleanText(talk.ref), talk]),
    ),
  );
  const existingTrackBySourceId = new Map(
    existingTracks.map((track) => [cleanText(track.sourceId), track]),
  );
  const proposalsByTrack = new Map();
  const updatedTalkByRef = new Map();

  for (const proposal of accepted) {
    const ref = cleanText(proposal.ref);
    const proposalTracks = normalizeProposalTracks(proposal);
    if (proposalTracks.length !== 1) {
      throw new Error(
        `${ref} must belong to exactly one program category; found ${proposalTracks.join(", ") || "none"}.`,
      );
    }

    const trackId = proposalTracks[0];
    const trackProposals = proposalsByTrack.get(trackId) ?? [];
    trackProposals.push(proposal);
    proposalsByTrack.set(trackId, trackProposals);

    const existingTalk = existingTalkByRef.get(ref);
    const contentOverride = scheduleOverridesByRef.get(ref);
    const people = [proposal, ...(proposal.coSpeakers ?? [])];
    const speakerIds = people.map((person) => {
      const id = speakerIdBySourceNameKey.get(speakerNameKey(person.name));
      if (!id) {
        throw new Error(
          `No imported speaker profile found for ${person.name} (${ref}).`,
        );
      }
      return id;
    });
    const originalTitle = cleanText(proposal.title);
    const originalAbstract = cleanText(proposal.abstract);
    const titleLanguage = /[\u3400-\u9fff]/u.test(originalTitle) ? "zh" : "en";
    const abstractLanguage = /[\u3400-\u9fff]/u.test(originalAbstract)
      ? "zh"
      : "en";

    updatedTalkByRef.set(ref, {
      ref,
      originalTitle,
      originalLanguage: titleLanguage,
      title: contentOverride?.title ?? existingTalk?.title ?? {
        en: originalTitle,
        zh: originalTitle,
      },
      slug:
        cleanText(existingTalk?.slug) ||
        `${ref.toLowerCase()}-${slugify(originalTitle, ref)}`,
      speakers: [...new Set(speakerIds)],
      originalAbstract,
      originalAbstractLanguage: abstractLanguage,
      overview: contentOverride?.overview ?? existingTalk?.overview ?? {
        en: originalAbstract,
        zh: originalAbstract,
      },
    });
  }

  const nextTracks = PROGRAM_CATEGORIES.filter((category) =>
    proposalsByTrack.has(category.id),
  ).map((category) => {
    const existingTrack = existingTrackBySourceId.get(category.id);
    const proposals = proposalsByTrack.get(category.id);
    const proposalByRef = new Map(
      proposals.map((proposal) => [cleanText(proposal.ref), proposal]),
    );
    const orderedRefs = [
      ...(existingTrack?.talks ?? [])
        .map((talk) => cleanText(talk.ref))
        .filter((ref) => proposalByRef.has(ref)),
      ...proposals
        .map((proposal) => cleanText(proposal.ref))
        .filter((ref) => !(existingTrack?.talks ?? []).some((talk) => cleanText(talk.ref) === ref)),
    ];

    return {
      id: cleanText(existingTrack?.id) || category.id,
      sourceId: category.id,
      name: {
        en: category.name,
        zh: category.nameZh,
      },
      talks: orderedRefs.map((ref) => updatedTalkByRef.get(ref)),
      originalName: cleanText(existingTrack?.originalName) || category.name,
    };
  });

  schedulePreview.tracks = nextTracks;

  await writeFile(
    schedulePreviewPath,
    `${JSON.stringify(schedulePreview, null, 2)}\n`,
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

console.log(
  `Imported ${output.speakers.length} speakers from ${accepted.length} accepted proposals.`,
);
