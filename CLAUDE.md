# Lighthouse Keeper — project memory for Claude Code

You are building **Lighthouse Keeper**, a 2.5D browser game for mobile and desktop. The player controls a lighthouse beam at night, guiding ships through fog and past reefs to a harbor. A playable one-file prototype lives in `reference/prototype.html`; it defines the *feel* we want to keep. Treat it as reference only and never import from it.

The project owner is a producer, not a programmer. Explain decisions in plain language. When a design question isn't answered by the docs, pick the option that best matches `docs/GDD.md`, note it in `docs/PROGRESS.md` under "Decisions", and keep going. Stop and ask only if the choice is expensive to reverse.

## Source of truth (read before designing anything)
- `docs/GDD.md` — mechanics, rules, modes
- `docs/CONTENT.md` — every number, ship, hazard, upgrade and level
- `docs/SCREENS.md` — screens and how they connect
- `docs/ART_AUDIO.md` — look, sound, performance budgets
- `docs/PROGRESS.md` — what's done; update it at the end of every phase

If code and docs disagree, the docs win, unless the owner says otherwise. When the owner changes a rule, update the doc in the same change.

## Tech stack (fixed — do not swap without asking)
- **TypeScript** (strict mode) + **Vite**
- **PixiJS v8** for rendering (WebGL, with WebGPU when available, Pixi decides)
- **Web Audio API** directly for all sound; procedural synthesis, no audio files required
- **Vitest** for unit tests; **Playwright** for smoke tests
- No game framework beyond Pixi. No React. UI screens are DOM overlays (plain TS + CSS) above the canvas.
- Pin exact dependency versions in `package.json` (no `^` or `~`). Never pick a version published in the last 14 days.

## Commands
- `npm run dev` — dev server (with `--host` so phones on the same network can connect)
- `npm run build` — production build into `dist/`
- `npm run test` — Vitest
- `npm run e2e` — Playwright smoke tests
- `npm run lint` / `npm run typecheck`

## Architecture rules
1. **Simulation and rendering are separate.** `src/sim/` holds pure TypeScript game logic: no Pixi, no DOM, no `Math.random`, no `Date`. It advances on a **fixed 60 Hz timestep** and uses a **seeded RNG** (`src/sim/rng.ts`). `src/render/` reads simulation state and draws it. It never changes that state.
2. **All tunable numbers live in `src/data/`** (TypeScript objects typed by interfaces in `src/data/types.ts`). No balance numbers hard-coded in logic.
3. **World units, not pixels.** The island sits at (0,0). One world unit equals `S` screen pixels, where `S` is calculated from the viewport (the prototype's approach). The play area has a safe radius of 230 units that must always be visible.
4. **Input is turned into intents.** `src/input/` converts pointer, touch, keyboard and gamepad events into `{ aimAngle, foghorn, flare, switchLamp, pause }` intents for the simulation.
5. **Scenes:** `src/scenes/` has one module per screen, managed by `SceneManager` with enter/exit hooks and transitions.
6. **Events:** the simulation emits typed events (`shipSaved`, `shipWrecked`, `reefRevealed` and so on) into a queue. Audio, effects and UI subscribe to these. They never poll internal state.
7. **Saves:** one versioned save object in `src/save/`, stored in localStorage behind try/catch, with migrations when the version changes.

## Folder layout
```
src/
  main.ts            boot
  app/               SceneManager, game loop, viewport/scale
  sim/               pure logic (world, ships, hazards, beam, rng, systems)
  render/            Pixi layers, shaders/filters, effects
  audio/             AudioEngine, synth voices, music director
  input/             intents
  scenes/            title, map, levelSelect, briefing, play, pause, results, shop, settings, logbook, credits
  ui/                DOM components + CSS (tokens.css)
  data/              ships, hazards, upgrades, difficulties, levels/, types.ts
  save/              save schema + migrations
tests/               vitest (sim), e2e/ (playwright)
```

## Code conventions
- Small modules (under ~300 lines). Prefer plain functions and data over class hierarchies.
- Name things after the game's world: `Ship`, `Reef`, `Beam`, `Harbor`, `Buoy`.
- Every simulation system gets unit tests. Bugs get a regression test before the fix.
- No `any`. No commented-out code. No unused dependencies.
- Text the player sees lives in `src/ui/strings.ts` (English first, ready for translation later). Use sentence case and plain verbs.

## Game-feel rules (never break these)
- The beam follows the finger with a turn-speed limit. That limit *is* the skill, so don't remove it.
- Ships in the dark show only a lantern. Reefs are visible only in light (plus a brief memory outline).
- A wreck must never feel random: before a ship hits a reef, the player must have had at least ~2 seconds when lighting it could have saved it.
- Touch first: every control works one-handed on a phone in portrait. Tap targets are at least 44 px.
- Target 60 fps on a mid-range phone. If a visual effect costs frames, it gets a quality setting.

## Definition of done (every task)
- `npm run typecheck`, `npm run lint` and `npm run test` all pass.
- The game runs with `npm run dev` with no console errors.
- New tunable values are in `src/data/`, and docs are updated if rules changed.
- `docs/PROGRESS.md` is updated: what was done, decisions made, known issues, how to test.
- Give the owner a short summary: what changed, how to see it in the game, anything they should play-test.

## Working style
- Start every phase by reading the phase prompt and the docs it lists, then present a plan.
- Work in small steps and run the tests often. Commit only when the owner asks.
- If the scope is too big for one session, finish a stable chunk, update PROGRESS.md with exactly where you stopped, and say so.
