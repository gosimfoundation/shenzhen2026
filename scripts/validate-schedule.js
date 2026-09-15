#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateContent } from './lib/confirmed-content.mjs';
const speakersPath = fileURLToPath(new URL('../src/json/Speakers.json', import.meta.url));
const schedulePath = process.argv[2] || fileURLToPath(new URL('../src/json/Schedule.json', import.meta.url));
try {
  const [speakers, schedule] = await Promise.all([speakersPath, schedulePath].map(async (file) => JSON.parse(await readFile(file, 'utf8'))));
  const errors = validateContent(speakers, schedule);
  if (errors.length) throw new Error(errors.join('\n'));
  console.log(`Validated ${speakers.speakers.length} speakers and ${schedule.tracks.reduce((n, track) => n + track.talks.length, 0)} sessions, including bilingual copy and speaker links.`);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
