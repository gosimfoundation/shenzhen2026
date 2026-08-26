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
];

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const confirmedPhotoDirectory = path.join(
  projectRoot,
  "public/images/speakers/confirmed",
);
const photoInboxDirectory = path.join(projectRoot, "speaker-photo-inbox");
const supportedPhotoExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
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
  return [...new Set(tracks.map(cleanText).filter(Boolean))];
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
      if (![".jpg", ".jpeg", ".png", ".webp"].includes(extension)) {
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

const existingByName = new Map(
  existingSpeakers.map((speaker) => [
    speakerNameKey(speaker.name),
    speaker,
  ]),
);
const existingById = new Map(
  existingSpeakers.map((speaker) => [cleanText(speaker.id), speaker]),
);

const speakersByName = new Map();
const usedIds = new Set();
const sourceNameKeyById = new Map();
const coSpeakerIds = new Set();
const primarySpeakerIds = new Set();

const addSpeaker = (person, proposal, isCoSpeaker = false) => {
  const sourceName = cleanText(person.name);
  if (!sourceName) return;

  const sourceKey = speakerNameKey(sourceName);
  const contentOverride = overridesBySourceName.get(sourceKey);
  const name = cleanText(contentOverride?.en?.name) || sourceName;
  const key = speakerNameKey(name);
  const tags = normalizeTracks(proposal.tracks);
  const existing = speakersByName.get(key);
  const baseId = cleanText(contentOverride?.id) || slugify(name, proposal.ref);
  const previous =
    existingById.get(baseId) ||
    existingByName.get(key) ||
    existingByName.get(sourceKey);
  const overrideRoleOrg = cleanText(contentOverride?.en?.roleOrg);
  const overrideBio = cleanText(contentOverride?.en?.bio);

  if (existing) {
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

  const previousImage = cleanText(previous?.image);
  const confirmedImage = confirmedImagesById.get(id);
  if (confirmedImage) {
    speaker.image = `/images/speakers/confirmed/${confirmedImage}`;
  } else if (
    previousImage &&
    !previousImage.startsWith("/images/speakers/confirmed/")
  ) {
    speaker.image = previousImage;
  }

  speakersByName.set(key, speaker);
  sourceNameKeyById.set(id, sourceKey);
};

for (const proposal of accepted) {
  addSpeaker(proposal, proposal);
  for (const coSpeaker of proposal.coSpeakers ?? []) {
    addSpeaker(coSpeaker, proposal, true);
  }
}

const presentTrackIds = new Set(
  [...speakersByName.values()].flatMap((speaker) => speaker.tags),
);
const unknownTracks = [...presentTrackIds].filter(
  (trackId) => !PROGRAM_CATEGORIES.some((category) => category.id === trackId),
);
if (unknownTracks.length) {
  throw new Error(`Unknown track IDs: ${unknownTracks.join(", ")}`);
}

const output = {
  categories: [
    { name: "All", nameZh: "全部", id: "all" },
    ...PROGRAM_CATEGORIES.filter((category) => presentTrackIds.has(category.id)),
  ],
  speakers: [...speakersByName.values()],
};

const outputZh = {
  categories: output.categories,
  speakers: output.speakers.map((speaker) => {
    const contentOverride = overridesBySourceName.get(
      sourceNameKeyById.get(speaker.id),
    );
    const nameZh = cleanText(contentOverride?.zh?.name) || speaker.name;
    const roleOrgZh = coSpeakerIds.has(speaker.id)
      ? "联合讲师"
      : cleanText(contentOverride?.zh?.roleOrg) || speaker.roleOrg;
    const bioZh = cleanText(contentOverride?.zh?.bio) || speaker.bio;

    return {
      ...speaker,
      name: nameZh,
      nameEn: speaker.name,
      roleOrg: roleOrgZh,
      bio: bioZh,
    };
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
  }

  await Promise.all(
    stagedPhotos.map(({ filename, buffer }) =>
      writeFile(path.join(photoInboxDirectory, filename), buffer),
    ),
  );

  const acceptedPrimaryNames = new Set(
    accepted.map((proposal) => cleanText(proposal.name).toLocaleLowerCase()),
  );
  const missingPhotos = [...acceptedPrimaryNames].filter(
    (name) => !photosByName.has(name),
  );
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

console.log(
  `Imported ${output.speakers.length} speakers from ${accepted.length} accepted proposals.`,
);
