# Progress Log

Claude Code updates this file at the end of every phase or session.

## Status
| Phase | State | Notes |
|---|---|---|
| 01 Foundation | done (owner accepted 2026-11-13) | Toolchain, folders, viewport/loop/scenes, RNG, fonts, placeholder sea + island + sweeping beam |
| 02 Core simulation | done (awaiting owner check) | Deterministic sim, level 1-2 playable with debug graphics, fairness test, input (follow finger / drag to rotate / keyboard), debug panel |
| 03 Rendering & visuals | done (owner accepted 2026-11-13) | Real 2.5D look: light-map darkness, water shader, beam shaft and bloom, low-poly reefs, six ship looks, island and buildings, fog/rain/snow, effects, region tints, Low/Medium/High/Auto |
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
- **2026-11-13 · Ships spawn on a fixed ring 250 wu from the island** (owner confirmed 2026-11-13), just outside the always-visible 230-unit circle, instead of at the screen edge (prototype). The night then plays out the same on every screen shape, which seeds and the fairness test rely on. On tall phones a lantern appears just past the circle rather than at the very top or bottom of the screen.
- **2026-11-13 · Fail = wrecks go *past* the allowance** (GDD §3.5 wording; owner confirmed 2026-11-13): on Keeper (allowance 3), the 4th wreck fails the night. The prototype failed on the 3rd. One line in `src/sim/rules.ts` if we want the prototype's rule back.
- **2026-11-13 · Reefs must sit at least 50 wu inside the base beam range** (rocks' outer edge ≤ 140 wu; `SEA.reefRangeMargin`). Found by the fairness test: with 1-2's first layout, a ship running with the current went from out of the beam's reach to wrecked in under 3.5 s, leaving only ~1.5 s to save it. `validateLevel` now rejects such layouts, and 1-2's reefs moved 10–16 wu inward. The prototype placed reefs out to 215 wu, beyond the beam.
- **2026-11-13 · How the fairness test reads the rule.** "The player must have had ≥ 2 s when lighting it could have saved it" = for every wreck there is a stretch of at least 2 s (checked every 0.5 s) during which lighting the ship and keeping it lit gets it home. It does not have to be the very last 2 s before impact; see the known issue about scraping ships.
- **2026-11-13 · The current never pushes a dark ship out past the spawn ring.** On Storm a cargo ship's dark speed can be weaker than the current, so it could otherwise drift away forever and the night would never end.
- **2026-11-13 · Cargo ships "need a wider path":** they avoid rocks at reef radius + 56 wu (fishing boats + 46), and their ×0.7 turn rate applies lit and dark.
- **2026-11-13 · Values CONTENT.md doesn't give come from the prototype** and live in `src/data/shipBehavior.ts`: dark turn rate 0.45 rad/s, the avoidance weights, wake every 0.15 s × 14 points, hull collision at 45% of the width, spawn heading ±0.4 rad.
- **2026-11-13 · Beam ease-out** (owner confirmed 2026-11-13): the beam turns at (distance to target × 10) per second, capped at the turn speed, so it slows within about 0.24 rad (14°) of the target. The prototype had no ease; GDD §8 asks for it.
- **2026-11-13 · Each ship has its own random stream** for its dark drift, so lighting one ship never changes how another drifts.
- **2026-11-13 · Reef layouts come from the level's own seed** (the same rocks every attempt, so they can be learned); drift and spawn jitter use a new seed each attempt. `?seed=123` in the address replays a seed.
- **2026-11-13 · "Drag to rotate" works like a dial:** the beam's target turns by the angle the finger sweeps around the island. It's still turn-limited.
- **2026-11-13 · "Reveal all" in the debug panel is drawing-only**, so debugging can't change outcomes. The fairness test uses the simulation's `mapLight` (the hook for phase 04's flares and lightning) instead.
- **2026-11-13 · Coins are rounded per ship** after the difficulty bonus (Storm: a fishing boat pays 13, a cargo ship 19).
- **2026-11-13 · Gamepad aiming is deferred to phase 08.** The phase 02 prompt lists pointer, touch and keyboard only.
- **2026-11-13 · A second, DOM-free typecheck** (`tsconfig.sim.json`, run by `npm run typecheck`) covers `src/sim` and `src/data`. Together with the ESLint rules (no Pixi, no imports from app/audio/input/render/save/scenes/ui, no timers or browser globals), it enforces architecture rule 1.
- **2026-11-13 · Hulls and rocks follow the simulation, not the darkness.** A ship's hull, sails and wake are drawn only while the simulation says it's lit (0.2 s fade), and rocks likewise. The darkness is mood on top. This keeps "a ship in the dark shows only a lantern" true even though lanterns light a small pool of water. Reef shallows also show only while their reef is visible, so they never give a hidden reef away.
- **2026-11-13 · Darkness is a multiplied light map** (night color, blended to the light color wherever light falls), drawn at half resolution. Pixi multiplies it natively, so it needs no custom shader.
- **2026-11-13 · The water shader works out the light from the beam's numbers** rather than sampling the light map (the prompt allows either). It's simpler and doesn't depend on drawing order.
- **2026-11-13 · Custom shaders are written for both WebGL and WebGPU.** Pixi still picks (WebGL today). `?renderer=webgpu` asks for WebGPU so the WebGPU version can be checked; it renders the same in Chrome.
- **2026-11-13 · The four phase 04 ship types (sailboat, ferry, tugboat, smuggler) have their CONTENT.md stats and their own look now, but no special behavior yet.** No level uses them. The smuggler pays 0 coins for reaching harbor; its 25-coin catch bonus arrives with phase 04.
- **2026-11-13 · Ship looks:** fishing boat teal with a small sail; cargo ship rust with containers and a funnel; sailboat white with tall sails; ferry cream and navy with two funnels and a bigger gold lantern; tugboat stubby black and red; smuggler low and dark with a patched sail and a dim reddish lantern.
- **2026-11-13 · The island always has a small jetty.** The "dock" building from the campaign list is a bigger wharf with crates. Buildings, in unlock order: cottage, dock, chapel, market, festival lights. Until the campaign exists (phase 06) the island shows none; the debug panel's **All buildings** shows them all.
- **2026-11-13 · Each region has a default weather** (Harbor Bay light fog, Northern Ice fog and snow, Storm Strait fog and rain, the others light fog). A level can override it; 1-2 uses Harbor Bay's.
- **2026-11-13 · The far fog bank sits under the darkness** so it glows where the beam passes; the near one is a faint haze above everything. Low quality keeps only the far one.
- **2026-11-13 · Auto quality settles once it's measured.** It starts at Medium, averages 3 s of frames, drops a level if that's above 20 ms and measures again, and stops once a window is fast enough (or Low is reached). It never steps back up, so the picture doesn't change mid-night for no visible reason.
- **2026-11-13 · Weather uses at most 60% of the particle cap,** leaving the rest for splinters and foam so effects always show.
- **2026-11-13 · Reduced motion follows the device setting** (turns off camera shake) until the settings screen exists (phase 08).
- **2026-11-13 · Edge arrows** point at ships sailing beyond the screen edge, and pulse for ships due in the next 2 s.
- **2026-11-13 · The current arrow stays** (subtle, upper left) until the phase 05 HUD.
- **2026-11-13 · Look numbers** (bob, roll, fades, glows, fog speeds, effect sizes) live in `src/data/renderFeel.ts`, region colors in `src/data/regions.ts`. The file isn't called `render.ts` because the lint rule that keeps the simulation pure blocks any import path ending in `render`.

## Known issues
(Bugs and rough edges, newest first.)

- **Ships are small on portrait phones.** The whole 230-unit circle must fit the phone's width, so on a 390 px-wide phone one world unit is about 0.8 px and a fishing boat is about 11 px long. All six types are clearly different on desktop and in the zoomed parade, but on a phone they're small. Options if it bothers you in play: draw ships larger than their collision size, or revisit the phase 01 scale rule. Worth checking on your phone with the **Ship parade**.
- **Low quality looks a little flat in the beam** (no water shader, so lit water is lighter but not warm). It's the fallback for weak devices.
- The water shader's WebGPU version is checked in desktop Chrome only (with a software GPU); WebGL is what phones use today.
- `npm audit` reports a moderate advisory in `minimatch`, which ESLint and typescript-eslint use. It only affects the developer's lint tooling and never reaches players. Clears when those packages update.
- **Lighting a ship that is scraping along a reef can make it crash sooner.** A dark ship drifts at 60% speed, so it can creep along a reef's edge for several seconds. Lighting it in the last second or two speeds it up to full speed before it can turn away. Each such ship was savable earlier (the fairness test checks this), but it may feel unfair in play. Worth watching in play-tests; a possible fix is to let lit ships speed up gradually instead of instantly.
- **The HUD and end card are temporary** (`src/ui/playtest.ts`), and there's no pause screen: Esc or P pauses on a keyboard, but a phone can't pause yet. Phase 05 brings the real screens.
- **Replays across different browsers may differ slightly**, because `Math.sin`/`Math.cos` can round differently from one engine to another. Within one browser a seed always replays exactly. This only matters if we ever share replays between devices.
- Level 1-2 balance is rough (phase 10 does the balance pass). In 100 simulated nights on Keeper, a player who never moves the beam gets mostly ★ or ★★ and fails 6% of the time; a player who always lights the oldest ship gets mostly ★★ or ★★★.

## How to test the latest work
(Plain-language steps for the owner.)

1. In a terminal in the project folder, run `npm install` (first time only), then `npm run dev`.
2. Open the **Local** address it prints (usually http://localhost:5173). You're playing level 1-2, "The cargo run", now with the real look:
   - The night is dark teal-black; the beam is a warm cone with soft edges, a glow shaft from the lamp glass, sparkles on the lit water and specks drifting in it.
   - Ships in the dark show only an amber lantern. Light one and its hull, sail and wake fade in. After 4 s in the dark a "?" pulses above its lantern.
   - Rocks appear only in the light (faceted, with a moving foam ring). When the light leaves, a dashed amber outline fades out over the reef-memory time.
   - A ship home: rings on the water and a "+10" coin pop. A wreck: splinters, foam and a small camera shake.
   - Amber arrows at the screen edge point at ships you can't see yet (try a narrow window or your phone).
3. Press the **`** key for the debug panel. New switches:
   - **Region**: try all five tints. Northern Ice snows, Storm Strait rains.
   - **Weather**: clear, fog, rain or snow on any region.
   - **Quality**: Low, Medium, High or Auto. The top line shows the frame rate and which level Auto settled on.
   - **All buildings**: the island as it will look after the campaign (cottage, wharf, chapel, market, festival lights).
   - **Ship parade**: all six ship types lit side by side, so you can judge whether they're easy to tell apart.
   - **Reveal all** still outlines hidden rocks and dark ships in red.
4. **On your phone** (same Wi-Fi), open the **Network** address with `?debug&quality=medium` on the end. Play a night and watch the fps number: Medium should hold 60. Then try `&parade` to look at the ships at phone size.
5. **Weak-device check:** in desktop Chrome, open DevTools, go to Performance, set CPU to 6× slowdown, and reload with `?debug&quality=low`. It should stay smooth. With `quality=auto` you should see it step down after about 3 s.
6. Screenshots of every look are in `docs/screenshots/phase-03/`. To retake them: `SCREENSHOTS=1 npx playwright test screenshots` (with no dev server running, or with it on port 5173).
7. Optional checks for a developer: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run e2e`.
8. Handy address options: `?seed=42`, `?quality=low|medium|high|auto`, `?region=northernIce`, `?weather=rain`, `?parade`, `?buildings=all`, `?reveal`, `?renderer=webgpu`.

## Session log
(Date, phase, what was done, where it stopped.)

- **2026-11-12 · Phase 01 Foundation.** Set up Vite + TypeScript (strict) + PixiJS 8 + Vitest + Playwright + ESLint + Prettier with pinned versions. Created the folder layout with a description in each folder. Built `src/app/` (viewport and scale, fixed 60 Hz game loop with catch-up cap and pause on hidden tab, scene manager with back stack and fade), the seeded RNG, angle helpers, data files for quality, viewport, loop, beam and island, colour and font tokens with local fonts, the ten render layers, and a placeholder play scene. 38 unit tests plus 3 browser smoke tests (portrait, landscape, desktop). Phase complete; owner accepted all checks on 2026-11-13 and asked for the commit.
- **2026-11-13 · Phase 02 Core simulation.** Built the pure, deterministic simulation in `src/sim/` (world, beam, ships, reefs, spawner, rules, bonus objectives, typed events, level validator). Its data lives in `src/data/` (ships, ship behavior, difficulties, sea rules, controls, level 1-2). Input (`src/input/`): follow finger, drag to rotate, keyboard, pause. A debug renderer (`src/render/debug/`), a debug panel, and a temporary HUD and end card, so 1-2 plays start to finish. The fairness test found reefs too close to the beam's edge; added the reef range margin rule and moved 1-2's reefs. 117 unit tests (including determinism and fairness across 120 seeds × 3 difficulties × 2 lazy players) and 4 browser tests. Phase complete, waiting for the owner's play-test.
- **2026-11-13 · Phase 03 Rendering & visuals.** Replaced the debug drawing with `src/render/Renderer.ts` and its views: water shader (GLSL + WGSL) with a Low fallback, light-map darkness with blur and "breathing" noise, beam air glow, shaft, bloom and lamp flicker, seeded low-poly reefs with foam rings and dashed memory outlines, shallows, buoys, six ship looks with upright rigs, bob, roll, wakes, lanterns, lost markers and edge arrows, the island with tower and five campaign buildings, two fog banks, rain, snow and beam spray, and event-driven effects (rings, coin pop, splinters, foam, shake). All shapes sit behind `ArtProvider` in `src/render/art/`. Region palettes, render feel numbers and Auto-quality settings are in `src/data/`. The debug panel gained Region, Weather, Quality, All buildings and Ship parade. 29 new unit tests (Auto quality, dashes, reef shapes, edge arrows, shake, blending, regions, address options) and 1 new browser test (switching every look mid-night); 146 unit + 5 browser tests pass. Measured draw calls in a busy scene: 18 per frame at High (budget 60), 14 at Medium, 9 at Low. 16 review screenshots saved. Phase complete; owner accepted on 2026-11-13.
