# Phase 07 — Audio

**Goal:** the full soundscape from ART_AUDIO.md, generated in code, mixed well, and reacting to gameplay events.

## Read first
`docs/ART_AUDIO.md` (Audio direction), `CLAUDE.md` (the events rule).

## Tasks
1. `AudioEngine`: an AudioContext that is unlocked on the first user gesture, the buses (master, music, sfx, ambience) with volumes from settings, a light compressor on master, suspension when the tab is hidden, and a hard limit on how many voices play at once.
2. Synth building blocks in `src/audio/synth/`: noise sources (white, pink, brown), envelopes, filters, simple FM and pluck voices, a reverb from a generated impulse response.
3. Ambience per region: waves, wind, rain, plus the occasional gulls and buoy bell.
4. A **music director** with the calm and tension layers, cross-fading based on the simulation's state (lost ships, ships near reefs), the dawn motif, the fail motif, and the title theme. Generative but always in key and gentle.
5. Every sound effect in the table, connected through simulation events and UI events, each with ±3% pitch variation.
6. Positional feel: sound effects for ships pan slightly left or right depending on the ship's x position.
7. A sound test page in the debug panel listing every sound with a play button and level meters.

## Mixing guidance
Ambience sits quietly underneath. Music should never cover the save chime or the wreck sound. Nothing should be sharp or tiring to hear after 30 minutes. Listen on phone speakers *and* headphones.

## Acceptance checklist
- [ ] Sound starts after the first tap, with no autoplay warnings in the console.
- [ ] The owner can tell with eyes closed when a ship is saved, wrecked, or lost in the dark (music tension).
- [ ] The volume sliders work instantly, and mute really mutes.
- [ ] No crackling or clicks with 20+ ships on screen.
- [ ] All checks pass and PROGRESS.md is updated.
