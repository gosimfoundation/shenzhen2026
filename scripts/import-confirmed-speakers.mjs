#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { cleanText, speakerNameKey, mergeConfirmedContent } from "./lib/confirmed-content.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");
const [sourcePath, photosZipPath] = process.argv.slice(2).filter((arg) => arg !== "--dry-run");
if (!sourcePath) {
  console.error("Usage: npm run import-speakers -- accepted-proposals.json [photos.zip] [--dry-run]");
  process.exit(1);
}
const speakerPath = path.join(projectRoot, "src/json/Speakers.json");
const schedulePath = path.join(projectRoot, "src/json/Schedule.json");
const [speakerData, scheduleData, proposals] = await Promise.all(
  [speakerPath, schedulePath, path.resolve(sourcePath)].map(async (file) => JSON.parse(await readFile(file, "utf8"))),
);
const { speakers: output, schedule, report } = mergeConfirmedContent(speakerData, scheduleData, proposals);
console.log(JSON.stringify(report, null, 2));
if (dryRun) {
  console.log("Dry run: no files or photos changed.");
  process.exit(0);
}
const confirmedPhotoDirectory = path.join(projectRoot, "public/images/speakers/confirmed");
const photoInboxDirectory = path.join(projectRoot, "speaker-photo-inbox");
const supportedPhotoExtensions = new Set([".jpg", ".jpeg", ".jfif", ".png", ".webp"]);
const accepted = proposals.filter((proposal) => cleanText(proposal.status).toLowerCase() === "accept");
const speakerIdBySourceNameKey = new Map();
for (const speaker of output.speakers) {
  for (const name of [...(speaker.sourceNames || []), speaker.name.en, speaker.name.zh].filter(Boolean)) {
    speakerIdBySourceNameKey.set(speakerNameKey(name), speaker.id);
  }
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

if (photosZipPath) {
  await mkdir(photoInboxDirectory, { recursive: true });
  const inboxFilenames = new Set(await readdir(photoInboxDirectory));
  const stagedPhotos = [];

  for (const speaker of output.speakers) {
    if (confirmedImagesById.has(speaker.id)) continue;

    const photo = [...(speaker.sourceNames || []), speaker.name.en, speaker.name.zh]
      .map((name) => photosByName.get(speakerNameKey(name))).find(Boolean);
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

await writeFile(speakerPath, `${JSON.stringify(output, null, 2)}\n`);
await writeFile(schedulePath, `${JSON.stringify(schedule, null, 2)}\n`);
console.log("Merged CFP data into Speakers.json and Schedule.json. Translate new drafts in those files, then set draft to false when ready to publish.");
