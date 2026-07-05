# Return to BC Road Trip — Modular Rescue Build

This package restores the road-trip site as a small data-driven static app.

## Files

- `index.html` — page shell only
- `styles.css` — styling only
- `app.js` — rendering and Leaflet map logic only
- `data.json` — all route, hotel, and dinner planning data

## Why this fixes the breakage

Future planning updates should edit only `data.json`.

Examples:
- Lock a hotel: update one hotel object in `data.json`
- Lock a dinner: update one dinner object in `data.json`
- Add a stop: add one route object in `data.json`

Do **not** rewrite `index.html` for normal trip updates.

## Current locked items included

- July 28: Ayres Suites Lake Forest
- July 29: Kimpton Canary Santa Barbara
- July 29 at 6:00 PM: The Lark
- July 30: The Butler Hotel in San Luis Obispo
- San Luis Obispo dinner: Novo Restaurant & Lounge

## Manual GitHub recovery steps

1. In GitHub, open the repo `TylerBielman/trip-to-bc`.
2. Restore the last full-function site if needed, or replace the root files with this package:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `data.json`
3. Commit to a branch first, not directly to `main`.
4. Preview the branch if possible.
5. Merge only after confirming:
   - map renders
   - route cards render
   - hotel cards render
   - dinner cards render
   - The Butler and Novo are locked

## Recommended future agent instruction

For trip updates:
> Edit `data.json` only. Do not modify `index.html`, `styles.css`, or `app.js` unless explicitly asked.
