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

const englishData = JSON.parse(
  await readFile(path.join(projectRoot, "src/json/SpeakersCleaned.json"), "utf8"),
);
const chineseData = JSON.parse(
  await readFile(path.join(projectRoot, "src/json/SpeakersZh.json"), "utf8"),
);
syncPortraits(englishData);
syncPortraits(chineseData);

const serialized = `${JSON.stringify(englishData, null, 2)}\n`;
const outputPaths = [
  path.join(projectRoot, "src/json/Speakers.json"),
  path.join(projectRoot, "src/json/SpeakersCleaned.json"),
];
await Promise.all(outputPaths.map((outputPath) => writeFile(outputPath, serialized)));
await writeFile(
  path.join(projectRoot, "src/json/SpeakersZh.json"),
  `${JSON.stringify(chineseData, null, 2)}\n`,
);

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
