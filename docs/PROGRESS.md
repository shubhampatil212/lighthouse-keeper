# Progress Log

Claude Code updates this file at the end of every phase or session.

## Status
| Phase | State | Notes |
|---|---|---|
| 01 Foundation | done (owner accepted 2026-11-13) | Toolchain, folders, viewport/loop/scenes, RNG, fonts, placeholder sea + island + sweeping beam |
| 02 Core simulation | not started | |
| 03 Rendering & visuals | not started | |
| 04 Ships & hazards | not started | |
| 05 UI & screens | not started | |
| 06 Levels & campaign | not started | |
| 07 Audio | not started | |
| 08 Settings, saves, accessibility | not started | |
| 09 Polish & mobile | not started | |
| 10 QA & release | not started | |

## Decisions
(Design and technical choices not covered by the docs, with a one-line reason.)

- **2026-11-12 · TypeScript 6.0.3, not 7.0.2.** The linter (typescript-eslint) doesn't support TS 7 yet. Revisit when it does.
- **2026-11-12 · Dependency versions** (all at least 14 days old when picked): vite 8.3.5, pixi.js 8.22.0, vitest 5.0.5, @playwright/test 1.64.1, eslint 10.13.0, @eslint/js 10.0.1, typescript-eslint 8.72.1, prettier 3.9.10.
- **2026-11-12 · `.npmrc` sets `legacy-peer-deps=true`.** The npm on this machine (9.2.0) crashes while auto-resolving peer dependencies. Every peer we need is listed directly, so this is safe. Upgrading npm to 10+ would let us remove it.
- **2026-11-12 · Scale formula changed from the prototype.** `S = shorter side of the safe area ÷ (2 × 230 × 1.03)`. The prototype's formula only guaranteed about 210 units; this one always shows the full 230-unit circle plus a 3% margin.
- **2026-11-12 · Island sits in the centre of the safe area** (the prototype put it at 54% of the height). Revisit in phase 05 once the HUD's real size is known.
- **2026-11-12 · Default graphics quality is Medium** (pixel ratio capped at 1.5) until the settings screen exists, as ART_AUDIO's "Auto" starts there.
- **2026-11-12 · Pixi picks the renderer** (WebGL today). WebGPU can be preferred later once it's been tested on phones.
- **2026-11-12 · No `eslint-config-prettier`.** The lint rules in use don't touch formatting, so the extra package isn't needed.
- **2026-11-12 · Prettier skips all Markdown files** so the owner's docs and prompts keep their own formatting.
- **2026-11-12 · ESLint enforces architecture rule 1.** Inside `src/sim/` it rejects `Math.random`, `Date`, `performance.now`, `window`, `document`, `localStorage` and importing `pixi.js`.
- **2026-11-12 · Fonts are latin-only WOFF2 subsets** (Karla 400 and 700, IM Fell English regular and italic, 144 KB total) taken from the Fontsource builds of the Google Fonts files. Licences are in `public/fonts/OFL-*.txt`.
- **2026-11-12 · Double-tap zoom** is blocked with `touch-action` rather than `user-scalable=no`, so pinch-zoom stays available on menus for players who need it.

## Known issues
(Bugs and rough edges, newest first.)

- `npm audit` reports a moderate advisory in `minimatch`, which ESLint and typescript-eslint use. It only affects the developer's lint tooling and never reaches players. Clears when those packages update.
- The placeholder scene has no darkness layer, ships or input yet. That is expected; phases 02 and 03 add them.

## How to test the latest work
(Plain-language steps for the owner.)

1. In a terminal in the project folder, run `npm install` (first time only), then `npm run dev`.
2. Open the **Local** address it prints (usually http://localhost:5173) in a desktop browser. You should see a dark teal sea, a small island in the middle and a soft amber beam slowly sweeping round it.
3. On your phone (on the same Wi-Fi), open the **Network** address it prints.
4. Add `?debug` to the end of the address (for example http://localhost:5173/?debug). A red circle shows the 230-unit area that must always be visible, and a small readout in the corner shows the scale and frame rate.
   - Check: the red circle stays fully on screen and centred in phone portrait, phone landscape, and when you drag a desktop window to different shapes.
   - Check: after resizing, edges stay sharp (no stretching or blur).
5. Optional checks for a developer: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run e2e`. The first `npm run e2e` needs `npx playwright install chromium` once (a ~170 MB download).

## Session log
(Date, phase, what was done, where it stopped.)

- **2026-11-12 · Phase 01 Foundation.** Set up Vite + TypeScript (strict) + PixiJS 8 + Vitest + Playwright + ESLint + Prettier with pinned versions. Created the folder layout with a description in each folder. Built `src/app/` (viewport and scale, fixed 60 Hz game loop with catch-up cap and pause on hidden tab, scene manager with back stack and fade), the seeded RNG, angle helpers, data files for quality, viewport, loop, beam and island, colour and font tokens with local fonts, the ten render layers, and a placeholder play scene. 38 unit tests plus 3 browser smoke tests (portrait, landscape, desktop). Phase complete; owner accepted all checks on 2026-11-13 and asked for the commit.
