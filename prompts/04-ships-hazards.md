# Phase 04 — Ships, hazards & abilities

**Goal:** every ship type, hazard and ability from CONTENT.md works in the simulation, looks right, and has tests.

## Read first
`docs/CONTENT.md` §2–4, `docs/GDD.md` §3.4, `CLAUDE.md`.

## Tasks
1. Ship types: sailboat, ferry (precious, gold lantern, fails the level when wrecked), tugboat (slows nearby dark ships while lit), smuggler (turns away from light, caught after being lit for 2 s, then towed away by a small coast guard boat).
2. Hazards: thick fog bands (shorter beam range through them, also shown visually), drifting icebergs, lightning (warning glow, then a full-map flash), storm waves, whirlpool (pull + deadly center, a swirling visual), pirate ship (hunts dark ships, is driven away by light for 5 s).
3. Multiple harbors with destination colors, plus shape markers for colorblind mode.
4. Abilities: foghorn, flare charges, second lamp with switching (the lamp you aren't controlling sweeps slowly by itself), bell buoys placed on chosen reefs.
5. New simulation events for each one (`smugglerCaught`, `foghornUsed`, `lightning` and so on) so audio and effects can respond later.
6. A **sandbox scene** (debug only, at `#sandbox`): choose ships and hazards from a panel, spawn them, change the time scale. This is for play-testing each element on its own.
7. Tests for each new behavior, and run the fairness test again with hazards on. Pirates and whirlpools must still allow a reaction window. Adjust and log if they don't.

## Acceptance checklist
- [ ] Each ship type and hazard can be spawned in the sandbox and behaves as CONTENT.md describes.
- [ ] Every new element can be recognized in under a second by someone who has read its logbook entry (the owner checks this).
- [ ] The fairness test passes with every hazard.
- [ ] All checks pass and PROGRESS.md is updated with anything tuned.
