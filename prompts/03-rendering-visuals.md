# Phase 03 — Rendering & visuals

**Goal:** replace the debug graphics with the real 2.5D look. This phase is where the game becomes beautiful. Take your time and make it feel *atmospheric*.

## Read first
`docs/ART_AUDIO.md` (all of it), `CLAUDE.md` (performance rules), the prototype's drawing code for reference.

## Tasks
1. `src/render/Renderer.ts` builds the layers listed in ART_AUDIO.md in order, reads world state each frame with interpolation, and never changes the simulation.
2. **Water:** a custom Pixi filter or shader with moving noise swell; sparkles and the lighter shallow water only where light falls (pass the beam and glow data as uniforms, or sample the light mask texture).
3. **Darkness and light:** a light mask render texture (cone with soft edges, island glow, buoys, lanterns), feathered by blur depending on quality. The darkness is multiplied over the world. The beam's volumetric shaft from the lamp glass, plus lamp bloom, uses additive blending.
4. **Reefs:** low-poly shapes generated from a seed (top face, side face, moving foam ring). The reef memory outline is a dashed amber line that fades out.
5. **Ships:** a hull per type (shapes from CONTENT.md sizes), mast and sail upright, bobbing and gentle roll, wake trails, a lantern glow above the darkness layer, the "lost" marker after 4 s, off-screen arrows for ships about to enter.
6. **Island & lighthouse:** cliffs, grass, a dock, the striped tower with gallery and lamp room. Buildings appear by campaign progress (a flag list for now). The lamp glass flickers slightly.
7. **Weather:** 2 fog layers with parallax, plus rain and snow particle systems (turned on by level data).
8. **Effects:** splinters, ripple rings, foam bursts, the coin pop, small camera shake on wreck (off with reduced motion).
9. **Region tints:** a palette per region, applied to water, darkness and fog.
10. **Quality settings** (Low / Medium / High / Auto) exactly as in the ART_AUDIO.md table, including the Auto frame-time check.
11. Keep all shape definitions in `src/render/art/` behind an `ArtProvider` interface.

## Process
After each major layer, run the game and take a screenshot with Playwright (portrait 390×844 and desktop 1440×900). Look at it critically: is the beam the hero? Is the darkness deep but still readable? Can every ship type be told apart at a glance? Save the final screenshots to `docs/screenshots/phase-03/`.

## Acceptance checklist
- [ ] The beam looks like real light: soft edges, a visible shaft, sparkles on lit water.
- [ ] Ships in the dark show only a lantern; reefs only show in light and as memory outlines.
- [ ] Each region tint can be switched on with a debug toggle and looks distinct.
- [ ] Medium quality holds 60 fps on the owner's phone (the owner checks with the frame-rate display), and Low runs smoothly on a weak device or with CPU throttling in DevTools.
- [ ] Screenshots saved, all checks pass, PROGRESS.md updated.
