# Screens & Flow

## Flow
```
Boot/Loading → Title ─┬→ Campaign map → Level select → Briefing → PLAY ⇄ Pause
                      │                                         ↓
                      │                               Results → Harbor (shop) → Campaign map
                      ├→ Endless watch → PLAY → Results (score)
                      ├→ Logbook
                      ├→ Settings  (also reachable from Pause)
                      └→ Credits
First launch only: Title → Difficulty choice → Level 1-1 (tutorial starts immediately)
```

## Shared UI rules
- DOM overlays above the canvas. The game keeps rendering softly behind menus (the sea, a slowly sweeping beam).
- Design tokens are in `src/ui/tokens.css`. Fonts: **IM Fell English** for titles and **Karla** for the interface (see ART_AUDIO.md).
- Portrait-first layout that also works on landscape and desktop (centered column, max 440 px wide for menus).
- Every screen can be used with touch, mouse and keyboard (Tab, Enter, Esc = back). Focus is always visible.
- Transitions: a 250 ms fade with a slight fog wipe. With reduced motion, just a fade.
- Respect safe areas (notches, home bar).
- Back behavior: browser back and Esc go to the previous screen; in play, they open Pause.

## Screens

### Boot / Loading
A dark sea, the lighthouse lamp blinking. A progress line. Text: "Lighting the lamp…". Audio starts only after the first tap (browser rule), so the title waits for that tap.

### Title
The big title "Lighthouse Keeper" over the live scene, which shows the island with the buildings already earned. Buttons: **Continue** (or **Begin your watch** on first play), **Endless watch** (locked with a hint until 1-6 is cleared), **Logbook**, **Settings**. Small: credits link, version number.

### Difficulty choice (first launch)
Three cards: Calm / Keeper / Storm, one line each in plain words ("Gentle seas and more forgiveness", and so on). Keeper is preselected. A note says it can be changed later in Settings.

### Campaign map
A hand-drawn-style sea chart in parchment and ink (the one daytime-looking screen). Five regions along a coastline, locked regions in fog. Each region shows its star count. Tap a region to open Level select.

### Level select
Six level buoys along a dotted route. Each shows its stars and is locked or unlocked. Tapping one opens Briefing.

### Briefing
Level name, a one-line story from the harbor master, the new element with a small animated icon, the bonus objective, and the abilities available. Button: **Light the lamp**.

### Play (HUD)
- Top left: level name and a progress bar of ships still to come.
- Top right: ships home ⚓, wrecks left (hull icons), pause button.
- Bottom (thumb zone): ability buttons (foghorn, flare, lamp switch), each with a cooldown ring. Left-handed mode mirrors them.
- Contextual tutorial prompts, bottom center, never covering the island.
- Off-screen arrows at the screen edge for ships about to enter.

### Pause
Resume · Restart · Settings · Quit to map. The game is frozen and dimmed behind it.

### Results
"Dawn breaks" with the sky gradient animation. Stars appear one at a time with sound. Stats: saved, wrecked, time, bonus objective ✓/✗, coins earned. Buttons: **Harbor**, **Retry**, **Next night**. On fail: "The fog won tonight", a gentle tip based on what went wrong (for example, "Ships drifted in the dark too long. Try shorter, faster sweeps."), and **Retry** / **Harbor**.

### Harbor (shop)
The island in daylight from a closer view. Upgrade cards in a list: name, level pips, effect, cost. Buoy placement: tap "Place buoy", then tap a reef on a mini chart of the next level's region. The coin balance is always visible. Bought upgrades animate on the lighthouse (for example, the lens visibly gets bigger).

### Endless results
Score, best score, time, ships saved, daily-seed tag. Buttons: **Again**, **Title**.

### Logbook
Tabs: **Diary** (unlocked entries, one per region), **Ships** (illustration and behavior, silhouettes for undiscovered ones), **Hazards** (same), **Records** (stars per difficulty, endless best, total ships saved).

### Settings
Sections:
- **Sound:** master, music, effects, ambience (sliders 0–100), mute toggle.
- **Display:** graphics quality (Low / Medium / High / Auto), show frame rate, screen shake on/off.
- **Gameplay:** difficulty, beam control (Follow finger / Drag to rotate), left-handed buttons, tutorial prompts on/off.
- **Accessibility:** reduced motion, colorblind-friendly ship colors, high-contrast reefs, larger text, haptics on/off.
- **Data:** export save (download JSON), import save, reset progress (with a two-step confirmation).
All changes apply immediately and are saved.

### Credits
A short scrolling list. It mentions that it was built with PixiJS, and the fonts with their licenses (SIL OFL).
