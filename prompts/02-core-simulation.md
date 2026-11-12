# Phase 02 — Core simulation

**Goal:** the full prototype gameplay rebuilt as a pure, deterministic, tested simulation, drawn with simple placeholder graphics. By the end, a night can be played from start to finish.

## Read first
`CLAUDE.md` (architecture rules 1–6), `docs/GDD.md` §3, `docs/CONTENT.md` §1, §2 (fishing and cargo only), §3 (reef and current), §5, `reference/prototype.html` (the `updShips`, `isLit` and spawning logic).

## Tasks
1. `src/data/types.ts` and data files for the beam, ships (fishing and cargo for now), difficulties, and a level format (see CONTENT.md §6). Write level 1-2 "The cargo run" as the first real level file. Use it for testing.
2. `src/sim/`:
   - `World`: holds everything, created from `(level, difficulty, upgrades, seed)`. `step(dt, intents)` advances by one fixed tick.
   - `Beam`: turn-limited aiming with ease-out near the target; `isLit(point)` covering the cone, island glow and buoys.
   - `Ships`: spawning from the level schedule, lit and dark steering exactly as described in GDD §3.2 and CONTENT §2 (including the tangent-based reef avoidance from the prototype), the current, wake points, collisions, reaching the harbor.
   - `Reefs`: clusters, reef memory timers.
   - `Rules`: wreck allowance, level end, fail, star calculation (the bonus objective system as a small interface: `start`, `onEvent`, `isMet`).
   - The event queue: `shipSpawned`, `shipLit`, `shipLost`, `shipSaved`, `shipWrecked`, `reefRevealed`, `levelEnded`.
3. Fairness guard (CLAUDE.md game-feel rule): a test that runs many seeded simulations of a level with a "lazy" scripted player and checks that every wreck had a ship in reachable beam range for ≥ 2 s beforehand. If the design breaks this, adjust the spawn or reef rules and log it in PROGRESS.md.
4. `src/input/`: pointer, touch and keyboard → intents. Both beam control styles: **Follow finger** (default) and **Drag to rotate**.
5. A temporary debug renderer in `src/render/debug/` (plain Pixi Graphics: circles, lines, the cone) plus a debug panel (toggle with `` ` ``) showing the frame rate, tick count, ships and a "reveal all" toggle.
6. Unit tests for: the beam's turn limit and wrap-around, `isLit` edge cases, steering around a reef, dark drift staying deterministic with a seed, star calculation, level end and fail rules.

## Acceptance checklist
- [ ] Level 1-2 can be played start to finish in the browser with debug graphics, and it feels like the prototype.
- [ ] Same seed + same inputs = exactly the same result (there's a test for this).
- [ ] The fairness test passes.
- [ ] Simulation code imports nothing from Pixi or the DOM (add a lint rule that enforces this).
- [ ] All checks pass and PROGRESS.md is updated.
