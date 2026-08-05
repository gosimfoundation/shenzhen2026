# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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
npm run validate-schedule:bilingual  # Validate ScheduleBilingual.json
```

## Architecture

### Bilingual System
- English pages: `src/pages/*.astro`
- Chinese pages: `src/pages/zh/*.astro`
- Language detection via URL path (`/zh/` prefix = Chinese)
- Bilingual utilities in `src/utils/bilingual.ts` handle text extraction with `{en, zh}` objects

### Data Flow
- All conference data lives in `src/json/`:
  - `ScheduleBilingual.json` - Main schedule data (days, categories, sessions with speakers)
  - `Speakers.json` / `SpeakersZh.json` - Speaker profiles
  - `Sponsors.json` / `SponsorsZh.json` - Sponsor data
  - `FAQ.json` / `FAQZh.json` - FAQ content
- Static assets in `public/images/speakers/` and `public/images/sponsors/`

### Dynamic Routes
- `src/pages/speakers/[...name].astro` - Individual speaker pages
- `src/pages/schedule/[...event].astro` - Individual event pages
- `src/pages/workshops/[...name].astro` - Workshop presenter pages

### Key Components
- Components come in English (`*.astro`) and Chinese (`*Zh.astro`) variants
- `BilingualSchedule.astro` and `BilingualText.astro` - Handle bilingual content display
- Layouts: `Layout.astro` (English), `LayoutLandingZh.astro` (Chinese)

### Path Aliases (tsconfig.json)
- `components/*` → `src/components/*`
- `utils/*` → `src/utils/*`
- `json/*` → `src/json/*`
- `layouts/*` → `src/layouts/*`

## Adding Content

### Schedule
1. Edit `src/json/ScheduleBilingual.json`
2. Speaker images go in `public/images/speakers/` (filename only in JSON)
3. Run `npm run validate-schedule:bilingual` to validate

### Speakers
1. Add to `src/json/Speakers.json` (speakers must exist here for links to work)
2. Add images to `public/images/speakers/`

### Sponsors
1. Add to `src/json/Sponsors.json`
2. Add logos to `public/images/sponsors/`

## Testing

Tests are in `tests/` using Vitest with happy-dom environment. Test setup in `tests/setup.ts`.
