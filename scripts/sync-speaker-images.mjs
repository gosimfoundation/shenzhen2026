#!/usr/bin/env node

import { readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const confirmedPhotoDirectory = path.join(
  projectRoot,
  "public/images/speakers/confirmed",
);
const photoInboxDirectory = path.join(projectRoot, "speaker-photo-inbox");
const supportedPhotoExtensions = new Set([".png", ".webp", ".jpg", ".jpeg"]);

const portraitsById = new Map();
for (const filename of await readdir(confirmedPhotoDirectory)) {
  const extension = path.extname(filename).toLowerCase();
  if (!supportedPhotoExtensions.has(extension)) continue;

  const id = filename.slice(0, -extension.length);
  if (portraitsById.has(id)) {
    throw new Error(
      `Multiple confirmed portraits found for ${id}: ${portraitsById.get(id)} and ${filename}`,
    );
  }
  portraitsById.set(id, filename);
}

let updatedCount = 0;
const syncPortraits = (speakerData) => {
  if (!Array.isArray(speakerData.speakers)) {
    throw new TypeError("Speaker data does not contain a speakers array.");
  }

  for (const speaker of speakerData.speakers) {
    const nextImage = `/images/speakers/confirmed/${speaker.id}.png`;
    if (speaker.image !== nextImage) {
      speaker.image = nextImage;
      updatedCount += 1;
    }
  }
};

const speakerPath = path.join(projectRoot, "src/json/Speakers.json");
const speakers = JSON.parse(await readFile(speakerPath, "utf8"));
syncPortraits(speakers);
await writeFile(speakerPath, `${JSON.stringify(speakers, null, 2)}\n`);

let clearedInboxCount = 0;
for (const id of portraitsById.keys()) {
  for (const extension of supportedPhotoExtensions) {
    const inboxPath = path.join(photoInboxDirectory, `${id}${extension}`);
    try {
      await rm(inboxPath);
      clearedInboxCount += 1;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

console.log(
  `Synced ${portraitsById.size} confirmed portrait(s); updated ${updatedCount} speaker record(s); cleared ${clearedInboxCount} completed inbox file(s).`,
);
