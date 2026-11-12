# Phase 08 — Settings, saves & accessibility

**Goal:** progress that's never lost, a complete settings page, and a game that many more people can play comfortably.

## Read first
`docs/SCREENS.md` (Settings), `CLAUDE.md` (Saves), `docs/ART_AUDIO.md` (colorblind, haptics).

## Tasks
1. **Save system:** one versioned save object (settings, progress, upgrades, buoys, records, logbook unlocks). It's written after every result and settings change (debounced), with migrations and a test for each version. If the save is corrupted, keep a backup copy and start fresh with a friendly message instead of crashing.
2. Export the save (download JSON) and import it (check it before applying), plus reset progress with a two-step confirmation.
3. Connect every setting in SCREENS.md, each applied immediately.
4. Accessibility:
   - Reduced motion: follows the system setting by default, can be changed in-game, removes shake and big transitions, and makes fog and wave motion calmer.
   - Colorblind-friendly mode: destination colors plus shape markers everywhere colors carry meaning.
   - High-contrast reefs: a stronger memory outline that lasts longer.
   - Larger text: a 1.25× interface scale.
   - Screen reader: menus and buttons have proper labels; important game events (ship saved, wrecked, level end) are announced through a polite live region.
   - Pausing: the game pauses automatically when the tab or app loses focus.
5. Haptics (where supported) behind their setting.
6. Unit tests for the save schema, migrations, import validation, and settings defaults.

## Acceptance checklist
- [ ] Close the tab in the middle of the campaign, reopen it, and everything is still there.
- [ ] Export, reset, import: everything comes back exactly.
- [ ] Every setting visibly or audibly does what it says.
- [ ] Menus pass an axe accessibility check (automated in Playwright) with no serious issues.
- [ ] All checks pass and PROGRESS.md is updated.
