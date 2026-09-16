// Shared by the CFP importer and the build validator. No generated content files.
export const cleanText = (value) => typeof value === 'string' ? value.trim().replace(/\r\n/g, '\n') : '';
export const speakerNameKey = (value) => cleanText(value).normalize('NFKD').replace(/\p{Mark}/gu, '').toLocaleLowerCase();
export const slugify = (value, fallback) => speakerNameKey(value).replace(/[^\p{Letter}\p{Number}]+/gu, '-').replace(/^-+|-+$/g, '') || fallback;
const han = /[\u3400-\u9fff]/u;
const nativeText = (value) => {
  const text = cleanText(value);
  return { en: han.test(text) ? '' : text, zh: han.test(text) ? text : '' };
};
const trackAliases = new Map([
  ['sz26-ws-ai-education-workshoip', 'ws-ai-education'],
  ['sz26-ws-dora-workshop', 'ws-dora'], ['sz26-ws-vllm-workshop', 'ws-vllm'],
  ['sz26-ws-google-cloud-workshop', 'ws-google-cloud'], ['sz26-ws-kvcdn-workshop', 'ws-kvcdn'],
  ['sz26-special-keynote', 'special-keynote'],
]);
const safeId = (value) => typeof value === 'string' && /^[\p{Letter}\p{Number}_-]+$/u.test(value);

export function validateContent(speakers, schedule) {
  const errors = [];
  if (!Array.isArray(speakers?.speakers) || !Array.isArray(schedule?.tracks) || !Array.isArray(schedule?.days)) {
    return ['Expected Speakers.speakers, Schedule.tracks and Schedule.days arrays.'];
  }
  const unique = (items, key, label) => {
    const seen = new Set();
    for (const item of items) {
      if (!item[key] || seen.has(item[key])) errors.push(`${label}: missing or duplicate ${key} ${item[key]}`);
      seen.add(item[key]);
    }
  };
  const text = (value, label, draft, isName = false) => {
    for (const lang of ['en', 'zh']) {
      if (typeof value?.[lang] !== 'string') errors.push(`${label}.${lang}: expected a string`);
      else if (!draft && !value[lang].trim()) errors.push(`${label}.${lang}: translation required before publishing`);
    }
    if (!draft && han.test(value?.en || '')) errors.push(`${label}.en: contains untranslated Chinese`);
    if (!draft && !isName && !han.test(value?.zh || '')) errors.push(`${label}.zh: Chinese translation required`);
  };
  unique(speakers.speakers, 'id', 'Speakers');
  unique(schedule.tracks, 'id', 'Tracks');
  unique(schedule.tracks, 'sourceId', 'Track source IDs');
  unique(schedule.days, 'date', 'Days');
  const people = new Map(speakers.speakers.map((s) => [s.id, s]));
  const tags = new Set(schedule.tracks.map((t) => t.sourceId));
  const names = new Map();
  for (const s of speakers.speakers) {
    if (!safeId(s.id)) errors.push(`Unsafe speaker ID: ${s.id}`);
    if (s.draft !== undefined && typeof s.draft !== 'boolean') errors.push(`${s.id}: draft must be boolean`);
    for (const field of ['name', 'roleOrg', 'bio']) text(s[field], `${s.id}.${field}`, s.draft, field === 'name');
    for (const tag of s.tags || []) if (!tags.has(tag)) errors.push(`${s.id}: unknown tag ${tag}`);
    for (const alias of [...(s.sourceNames || []), s.name?.en, s.name?.zh].filter(Boolean)) {
      const key = speakerNameKey(alias);
      if (names.has(key) && names.get(key) !== s.id) errors.push(`Ambiguous speaker alias: ${alias}`);
      names.set(key, s.id);
    }
  }
  const talks = schedule.tracks.flatMap((t) => t.talks || []);
  unique(talks, 'ref', 'Talks'); unique(talks, 'slug', 'Talk routes');
  for (const track of schedule.tracks) {
    text(track.name, `${track.id}.name`, false);
    if (!Array.isArray(track.talks)) errors.push(`${track.id}: talks must be an array`);
    for (const talk of track.talks || []) {
      if (!safeId(talk.slug)) errors.push(`Unsafe talk slug: ${talk.slug}`);
      if (talk.draft !== undefined && typeof talk.draft !== 'boolean') errors.push(`${talk.ref}: draft must be boolean`);
      text(talk.title, `${talk.ref}.title`, talk.draft);
      text(talk.overview, `${talk.ref}.overview`, talk.draft);
      if (!Array.isArray(talk.speakers)) { errors.push(`${talk.ref}: speakers must be an array`); continue; }
      for (const id of talk.speakers) {
        if (!people.has(id)) errors.push(`${talk.ref}: missing speaker ${id}`);
        else if (!talk.draft && people.get(id).draft) errors.push(`${talk.ref}: published talk references draft speaker ${id}`);
      }
      if (!talk.draft && !talk.speakers.length && !['check-in', 'break', 'pending', 'ama'].includes(talk.type)) errors.push(`${talk.ref}: speaker required`);
      if (talk.date && !schedule.days.some((d) => d.date === talk.date)) errors.push(`${talk.ref}: unknown conference day ${talk.date}`);
      if (talk.timeSlot) {
        const match = /^(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})$/.exec(talk.timeSlot);
        if (!match || +match[1] > 23 || +match[3] > 23 || +match[2] > 59 || +match[4] > 59 || (+match[1]*60 + +match[2]) >= (+match[3]*60 + +match[4])) errors.push(`${talk.ref}: invalid time slot ${talk.timeSlot}`);
        if (!talk.date) errors.push(`${talk.ref}: time slot requires a date`);
      }
      if (talk.room) text(talk.room, `${talk.ref}.room`, talk.draft, true);
    }
  }
  return errors;
}

export function mergeConfirmedContent(currentSpeakers, currentSchedule, proposals) {
  if (!Array.isArray(proposals)) throw new Error('The CFP export must be an array.');
  const accepted = proposals.filter((p) => cleanText(p.status).toLowerCase() === 'accept');
  if (!accepted.length) throw new Error('The export contains no accepted proposals; no files were changed.');
  const speakers = structuredClone(currentSpeakers);
  const schedule = structuredClone(currentSchedule);
  const errors = validateContent(speakers, schedule);
  if (errors.length) throw new Error(errors.join('\n'));
  const names = new Map();
  const ids = new Set(speakers.speakers.map((s) => s.id));
  const talks = new Map(schedule.tracks.flatMap((track) => track.talks.map((talk) => [talk.ref, {track, talk}])));
  const tracks = new Map(schedule.tracks.flatMap((track) => [[track.id, track], [track.sourceId, track]]));
  for (const speaker of speakers.speakers) for (const name of [...(speaker.sourceNames || []), speaker.name.en, speaker.name.zh].filter(Boolean)) names.set(speakerNameKey(name), speaker);
  const report = { accepted: accepted.length, newSpeakers: [], newTalks: [], sourceChanges: [], speakerAssignmentChanges: [] };
  const seenRefs = new Set();
  const addSpeaker = (person, track, ref, coSpeaker) => {
    const name = cleanText(person.name);
    if (!name) throw new Error(`${ref}: speaker name is required`);
    const key = speakerNameKey(name);
    let speaker = names.get(key);
    if (!speaker) {
      const base = slugify(name, `speaker-${ref.toLowerCase()}`);
      let id = base;
      for (let i = 2; ids.has(id); i++) id = `${base}-${i}`;
      ids.add(id);
      const role = [cleanText(person.effectiveRole ?? person.role_title), cleanText(person.effectiveOrg ?? person.org)].filter(Boolean).join(', ');
      speaker = {
        id, name: nativeText(name), roleOrg: role ? nativeText(role) : {en: coSpeaker ? 'Co-speaker' : 'Speaker', zh: coSpeaker ? '联合讲师' : '讲师'},
        bio: nativeText(person.bio), tags: [track.sourceId], socialLinks: {},
        draft: true, image: `/images/speakers/confirmed/${id}.png`, sourceNames: [name], source: 'cfp',
      };
      // Latin-script personal names can be used in both languages; biographies cannot.
      if (!han.test(name)) speaker.name.zh = name;
      for (const platform of ['website', 'github', 'twitter', 'linkedin', 'mastodon', 'bluesky']) {
        const value = cleanText(person[platform]);
        if (/^https?:\/\//i.test(value)) speaker.socialLinks[platform] = value;
      }
      speakers.speakers.push(speaker); names.set(key, speaker); report.newSpeakers.push(id);
    }
    if (speaker.draft && !speaker.tags.includes(track.sourceId)) speaker.tags.push(track.sourceId);
    // Existing profile text, affiliations, photos and links are editorial data.
    return speaker.id;
  };
  for (const proposal of accepted) {
    const ref = cleanText(proposal.ref);
    if (!ref || seenRefs.has(ref)) throw new Error(`Missing or duplicate proposal ref: ${ref}`);
    seenRefs.add(ref);
    const existing = talks.get(ref);
    // A manually moved session keeps its position and category on re-import.
    let track = existing?.track;
    if (!track) {
      const rawTracks = Array.isArray(proposal.tracks) ? proposal.tracks : [proposal.tracks];
      const trackIds = [...new Set(rawTracks.map(cleanText).filter(Boolean).map((id) => trackAliases.get(id) || id))];
      if (trackIds.length !== 1 || !tracks.has(trackIds[0])) throw new Error(`${ref}: add the conference category to Schedule.json before importing (${trackIds.join(', ')})`);
      track = tracks.get(trackIds[0]);
    }
    const originalTitle = cleanText(proposal.title);
    const originalAbstract = cleanText(proposal.abstract);
    const source = { originalTitle, originalLanguage: han.test(originalTitle) ? 'zh' : 'en', originalAbstract, originalAbstractLanguage: han.test(originalAbstract) ? 'zh' : 'en' };
    const speakerIds = [addSpeaker(proposal, track, ref, false), ...(proposal.coSpeakers || []).map((person) => addSpeaker(person, track, ref, true))];
    if (existing) {
      if (JSON.stringify([...new Set(speakerIds)].sort()) !== JSON.stringify([...existing.talk.speakers].sort())) report.speakerAssignmentChanges.push(ref);
      if (Object.entries(source).some(([key, value]) => existing.talk[key] !== value)) report.sourceChanges.push(ref);
      Object.assign(existing.talk, source);
      continue;
    }
    const talk = {ref, ...source, slug: `${slugify(ref, 'proposal')}-${slugify(originalTitle, 'session')}`, title: nativeText(originalTitle), overview: nativeText(originalAbstract), speakers: [...new Set(speakerIds)], draft: true};
    track.talks.push(talk); talks.set(ref, {track, talk}); report.newTalks.push(ref);
  }
  const mergedErrors = validateContent(speakers, schedule);
  if (mergedErrors.length) throw new Error(mergedErrors.join('\n'));
  return { speakers, schedule, report };
}
