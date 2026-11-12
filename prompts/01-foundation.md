# Phase 01 — Foundation

**Goal:** a clean, well-organized project that builds, tests and shows a running Pixi canvas with a placeholder sea and a sweeping beam, ready for everything after it.

## Read first
`CLAUDE.md`, `docs/GDD.md` §1–3, `docs/ART_AUDIO.md` (layers and quality), `reference/prototype.html` (skim it for feel).

## Tasks
1. Set up Vite + TypeScript (strict) + PixiJS v8 + Vitest + Playwright + ESLint + Prettier. Pin exact versions (none published in the last 14 days). Add the npm scripts listed in CLAUDE.md. The dev server uses `--host`.
2. Create the folder layout from CLAUDE.md, with an `index.ts` or short README comment in each folder explaining what goes there.
3. `src/app/`:
   - `Viewport`: handles resize, devicePixelRatio (capped by quality), and the world-to-screen scale `S` (keep the 230 wu safe radius visible), safe-area insets.
   - `GameLoop`: fixed 60 Hz simulation steps with a cap on catch-up, and rendering every animation frame with an interpolation alpha. It pauses when the tab is hidden.
   - `SceneManager`: register, switch (`go(name, params)`), enter/exit hooks, a simple fade transition, and a back stack.
4. `src/sim/rng.ts`: a seeded RNG (mulberry32 or similar) with `float()`, `range(a,b)`, `int()`, `pick()`. Include tests showing the same seed gives the same sequence.
5. `src/ui/tokens.css`: the palette and fonts from ART_AUDIO.md, light and dark-safe. Bundle IM Fell English and Karla locally under `public/fonts/` with their OFL license files.
6. A placeholder `PlayScene` showing a sea gradient, the island circle at (0,0) and a beam that sweeps by itself, to prove the scale, layers and loop work.
7. `index.html`: viewport meta with `viewport-fit=cover`, theme-color, no zoom on double tap, `touch-action: none` on the canvas.
8. One Playwright smoke test: the page loads, the canvas exists, and there are no console errors.
9. Fill in the `Status` table and `How to test` in `docs/PROGRESS.md`.

## Don't
Don't port game logic yet. Don't add UI screens yet. Don't add any dependency not listed in CLAUDE.md without asking.

## Acceptance checklist
- [ ] `npm install && npm run dev` works, and the phone can open the network URL.
- [ ] The island stays centered and the whole 230 wu circle is visible in portrait phone, landscape phone, and desktop window sizes.
- [ ] Resizing the window doesn't stretch or blur the picture.
- [ ] typecheck, lint, test and e2e all pass.
- [ ] PROGRESS.md is updated.

## Report back
A short summary in plain language and the exact steps to see it running.
