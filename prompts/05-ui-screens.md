# Phase 05 — UI & screens

**Goal:** every screen in SCREENS.md exists, is connected, and is pleasant to use with touch, mouse and keyboard.

## Read first
`docs/SCREENS.md` (all of it), `docs/ART_AUDIO.md` (palette and typography), `CLAUDE.md`.

## Tasks
1. A small DOM UI kit in `src/ui/`: Button, IconButton, Slider, Toggle, Segmented control, Card, Modal, Tabs, Stars, Coin counter, Cooldown ring. Built with `tokens.css`, visible focus, 44 px tap targets, and reduced-motion-aware transitions.
2. All the screens and the flow from SCREENS.md, including the first-launch difficulty choice and the browser back button / Esc behavior.
3. The HUD: progress bar, saved count, wrecks left, pause button, ability buttons in the thumb zone with a left-handed mirror, contextual tutorial prompts, off-screen arrows (connected to the renderer).
4. The campaign map as a parchment sea chart drawn in code (SVG or Pixi), with fog over locked regions.
5. Results screen with the dawn sky animation, stars appearing one by one, and fail tips chosen from what happened in the level (for example, "most wrecks happened while ships were in the dark for over 6 s").
6. Harbor shop with upgrade cards, level pips, and the buoy placement mini chart.
7. Logbook with Diary, Ships, Hazards and Records tabs. Write the diary entries yourself: warm, short (60–90 words each), one per region, telling the keeper's story.
8. All text in `src/ui/strings.ts`.
9. Use temporary placeholder progress data until Phase 06 and 08 connect the real thing.

## Acceptance checklist
- [ ] The owner can tap through every screen on a phone without getting stuck or needing a keyboard.
- [ ] The whole game can be navigated with just a keyboard on desktop.
- [ ] Nothing is cut off by the notch or home bar on an iPhone.
- [ ] Menus over the live scene look calm and readable.
- [ ] All checks pass, a Playwright test walks the main path (Title → Map → Level → Play → Pause → Quit), PROGRESS.md updated.
