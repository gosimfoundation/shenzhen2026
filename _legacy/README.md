# _legacy — archive

One place for everything legacy/reference. **Nothing here is built or imported by
the live site** — it sits outside `src/` and `public/` on purpose. Pull things
back into the app when needed (the `components/*`, `utils/*`, `json/*` path
aliases still resolve from anywhere, so archived components keep working once
re-imported).

## Contents

- `components/` — old/unused Astro components kept for reference and reuse
  (Agenda, VenueDetails, ConferenceTracks_BoldDesign, TextAndImageVisa, etc.).
- `icons/` — retired SVG icons.
- `sponsor-logos-archive/` — duplicate / variant / orphan sponsor logos removed
  from the active set during cleanup. The active, de-duplicated logos live in
  `public/images/sponsors/` and are listed in `src/json/Sponsors.json`.
  Archived here: `huawei-vertical.png` (kept horizontal `huawei.png`),
  `zhipuai.png` (kept `z-ai.png`), `kimi-logo.png` (kept `kimi.png`),
  plus orphans `zai.png`, `peking-university.png`.

## To reuse something

Move it back into the relevant `src/` or `public/` folder, then import/reference
it as usual.
