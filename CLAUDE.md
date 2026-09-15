# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GOSIM Shenzhen 2026 is a bilingual (English/Chinese) conference website built with Astro. It displays schedules, speakers, sponsors, and event information for the GOSIM conference.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:4321
npm run build        # Build for production (runs validation + tests first)
npm run preview      # Preview production build
npm run test         # Run tests with Vitest
npm run test:watch   # Run tests in watch mode
npm run validate-schedule  # Validate both canonical content files
```

## Architecture

### Bilingual System
- English pages: `src/pages/*.astro`
- Chinese pages: `src/pages/zh/*.astro`
- Language detection via URL path (`/zh/` prefix = Chinese)
- Bilingual utilities in `src/utils/bilingual.ts` handle text extraction with `{en, zh}` objects

### Data Flow
- Speaker and schedule content has exactly two sources of truth:
  - `src/json/Speakers.json`: one record per speaker; `name`, `roleOrg`, and `bio` are `{ en, zh }` objects. IDs, images, tags, social links, and CFP aliases (`sourceNames`) are shared.
  - `src/json/Schedule.json`: conference `days` and `tracks`, each containing `talks`. Titles and overviews are `{ en, zh }`; talks link to speakers by ID.
- Edit translations and organizer corrections directly in these records. Do not create separate language files, cleaned copies, invited-speaker lists, or override files.
- `src/utils/conference.ts` builds language-specific in-memory views and filters drafts for every page. It does not generate JSON files.
- Track `id` preserves schedule links; `sourceId` matches CFP categories and speaker tags. Category names and groups live only in Schedule.json.
- Sponsors remain in `src/json/Sponsors.json`; other unrelated site data is separate.
- Speaker photos: `public/images/speakers/confirmed/<speaker-id>.png`.

### Dynamic Routes
- `src/pages/speakers/[...name].astro` - Individual speaker pages
- `src/pages/schedule/[...event].astro` - Individual event pages

### Key Components
- Components come in English (`*.astro`) and Chinese (`*Zh.astro`) variants
- `ScheduleTracks.astro` and `src/utils/conference.ts` - Display the canonical bilingual schedule
- Layouts: `Layout.astro` (English), `LayoutLandingZh.astro` (Chinese)

### Path Aliases (tsconfig.json)
- `components/*` → `src/components/*`
- `utils/*` → `src/utils/*`
- `json/*` → `src/json/*`
- `layouts/*` → `src/layouts/*`

## Adding Content

### Speakers and Schedule
1. Edit `src/json/Speakers.json` or `src/json/Schedule.json` directly, including both languages.
2. Preserve existing speaker IDs, talk refs and slugs when editing names or titles.
3. Add invited speakers to Speakers.json with `source: "invited"`; add manual talks to Schedule.json with `manual: true`.
4. Use `draft: true` for incomplete records. Supply both languages and publish referenced speaker profiles before setting a talk's `draft` to `false`.
5. Run `npm run build` for content validation, tests, and production generation.

### Importing CFP Content
- Preview: `npm run import-speakers -- /path/to/export.json --dry-run`.
- Import: `npm run import-speakers -- /path/to/export.json [/path/to/photos.zip]`.
- The importer merges into the same two files. Existing translations, speaker assignments, category placement, dates, times, ordering, manual sessions and invited speakers are preserved. Absence from an export never deletes a record.
- New speakers and sessions are drafts. Source-language text is stored only in the matching language field; translate the other field in the same record, then publish explicitly.
- Existing CFP session originals are refreshed for comparison; `sourceChanges` and `speakerAssignmentChanges` identify sessions needing editorial review. Existing speaker biographies and roles stay as edited; compare the new export manually if those change.
- `sourceNames` stores CFP name aliases to avoid duplicate speaker records. Keep historical aliases when changing display names.
- Add unknown tracks to Schedule.json before importing. Resolve changed assignments and withdrawals explicitly rather than allowing an import to remove or replace published content.
- Optional photos are staged in `speaker-photo-inbox`; confirmed portraits are preserved.

### Sponsors
1. Add to `src/json/Sponsors.json`
2. Add logos to `public/images/sponsors/`

## Testing

Tests are in `tests/` using Vitest with happy-dom environment. Test setup in `tests/setup.ts`.
