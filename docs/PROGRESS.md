# Progress Log

Claude Code updates this file at the end of every phase or session.

## Status
| Phase | State | Notes |
|---|---|---|
| 01 Foundation | done (owner accepted 2026-11-13) | Toolchain, folders, viewport/loop/scenes, RNG, fonts, placeholder sea + island + sweeping beam |
| 02 Core simulation | done (awaiting owner check) | Deterministic sim, level 1-2 playable with debug graphics, fairness test, input (follow finger / drag to rotate / keyboard), debug panel |
| 03 Rendering & visuals | done (owner accepted 2026-11-13) | Real 2.5D look: light-map darkness, water shader, beam shaft and bloom, low-poly reefs, six ship looks, island and buildings, fog/rain/snow, effects, region tints, Low/Medium/High/Auto |
| 04 Ships & hazards | done (awaiting owner check) | Sailboat, ferry, tugboat, smuggler + coast guard; fog bands, icebergs, lightning, storm waves, whirlpool, pirates; second harbor with colorblind shapes; foghorn, flares, second lamp, bell buoy chime; sandbox at #sandbox; demo nights; fairness passes with every hazard |
| 05 UI & screens | done (awaiting owner check) | Every screen from SCREENS.md connected: boot, title, first-launch difficulty, sea chart, level select, briefing, real HUD, pause, results with dawn and tips, harbor shop with buoy chart, logbook with diary, settings, credits, endless results. UI kit, back/Esc handling, live sea behind menus. Placeholder progress until phases 06/08 |
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
- **2026-11-13 · Phase 04 numbers CONTENT.md didn't give** are listed in CONTENT.md under "Rules and numbers added in phase 04" and live in `src/data/` (`ships.ts` TUG and SMUGGLER, `hazards.ts`, `abilities.ts`, `harbors.ts`). Tug: 50 wu, ×0.5 speed. Whirlpool pull: 8 wu/s at the centre. Pirate: 11/19/22 wu/s, patrols 150 wu out. Coast guard boat: 34 wu/s out, 14 wu/s towing.
- **2026-11-13 · Pirate reaction window (fairness).** A pirate only hunts ships inside the beam's range, and must chase a ship for 2.5 s before it can board it. A dashed red line and a ring closing on the prey show those 2.5 s. Without this, a ship entering the beam's range next to a pirate could be sunk at once. This rule was designed in up front; the fairness test confirms it (pirates sink ships for the lazy player, and every such wreck had a 2 s rescue window).
- **2026-11-13 · Icebergs (found with the fairness test).** First try: lit ships were rammed from the side by drifting icebergs, or squeezed between an iceberg and a reef, even while lit. Three fixes:
  - Lit ships judge "ahead" by relative motion, so they see an iceberg closing in from the side.
  - Only a ship sailing (nearly) head-on into an iceberg wrecks. An iceberg drifting into a ship's side shoves it aside.
  - Icebergs bounce off rocks and each other, keeping 30 wu of open water. They also bounce to stay within the fair zone (outer edge ≤ 140 wu, inner edge 10 wu clear of the harbor).
  Tried and dropped: "pass behind a drifting iceberg" made it worse.
- **2026-11-13 · Storm waves need reefs further in (found with the fairness test).** On Storm, a dark ship with the waves and current behind it drifts at ~24 wu/s, which left only 1.5 s to save it. Storm-wave levels must keep rocks a further 16 wu inside the reef limit (`HAZARDS.stormWaves.extraReefMargin`, checked by `validateLevel`). Lit ships lean into the waves so they still go where they mean to.
- **2026-11-13 · Smugglers** cross the map toward an exit point (so they need not head for a harbor), turn away from whatever lights them, and are caught by 2 s of *unbroken* light. They're never wrecked by anything (reefs, whirlpool, pirates). Pirates leave them alone. A caught or escaped smuggler counts as resolved for ending the night, but not toward stars.
- **2026-11-13 · The foghorn slows a ship's own speed** to ×0.4 for 3 s, for ships within 140 wu at the moment it sounds. The current and waves still push them. Cooldown 12/10/8 s by level. Flares: charges = flare upgrade level.
- **2026-11-13 · Second lamp:** a second tower on a 10 wu islet (an always-lit rock, so ships steer round it), with a 36 wu glow and the main lamp's beam stats. The lamp you aren't steering sweeps at 0.5 rad/s. A lamp you take over stops where it is. The pointer aims around the lamp you're steering. New intent `switchLamp` (CLAUDE.md updated).
- **2026-11-13 · Second harbor:** a harbor is a water zone with a pier and a ring of lights in its color. Ships bound elsewhere steer round the island and never sail onto it.
- **2026-11-13 · Harbor colors:** red and blue. Colorblind mode is orange and sky blue (0x56b4e9 rather than 0x0072b2, which vanished on night water), plus a circle or triangle marker. Destination dots show beside each lantern, even in the dark, whenever a night has more than one harbor. Until the settings screen (phase 08), colorblind mode is a debug toggle and `?colorblind`.
- **2026-11-13 · The whirlpool is always faintly visible**, even in the dark: it's moving water, and a hidden deadly hazard would feel unfair. Brighter when lit.
- **2026-11-13 · Fog shortens the beam's look** (a night-colored shadow behind each band past 65% of the range, plus the air glow, shaft and lit water along the beam's centre line), using the same rule as the simulation.
- **2026-11-13 · Lightning is cold white, a flare is warm.** The map-wide flood now sits outside the region-tinted lights so the two can differ. (In Northern Ice, whose light is cool, a flare reads cool-ish too.)
- **2026-11-13 · Hazards use their own random stream**, separate from ship spawns, so adding lightning or a pirate to a level never changes when or how its ships arrive.
- **2026-11-13 · Pirates arrive on the level's schedule, stretched by the difficulty** like ships.
- **2026-11-13 · New events** for audio, effects and UI: `smugglerCaught`, `smugglerEscaped`, `smugglerTowed`, `tugTowing`, `buoyRang`, `foghornUsed`, `flareFired`, `lampSwitched`, `abilityUnavailable` (cooldown, empty or locked), `lightningWarning`, `lightning`, `wavesShifted`, `shipInWhirlpool`, `pirateArrived`, `pirateHunting`, `pirateDrivenOff`. `shipWrecked` now has a `cause` (reef, iceberg, whirlpool, pirate), and `reefRevealed` carries its position.
- **2026-11-13 · Sandbox is debug only:** `#sandbox` in a dev build (`npm run dev`), or with `?debug` in a production build. Changing the night options (abilities, buoys, second harbor or lamp) restarts it.
- **2026-11-13 · Demo nights** (`?level=demo-ice`, `demo-storm`, `demo-cove`, `demo-archipelago`) show each group of new elements in play before the campaign exists. They start with the foghorn and 3 flares. They're not campaign levels.
- **2026-11-13 · Temporary ability buttons** (Horn, Flare, Switch lamp) sit at the bottom of the screen, 44 px tall, until the phase 05 HUD. Keys: H = horn, F = flare, Q = switch lamp.
- **2026-11-13 · Screens are plain DOM over the canvas** (`src/ui/kit/` holds the UI kit: buttons, icon buttons, sliders, switches, segmented controls, cards, modals, tabs, stars, coin counter, cooldown ring). Each menu scene is built by `menuScene()` in `src/scenes/menuScene.ts`, which also keeps the live sea drawing behind it.
- **2026-11-13 · The live sea behind menus** is an empty, never-ending night (`src/scenes/backdrop.ts`): the island with the buildings earned so far and a beam sweeping by itself at 0.3 rad/s. The play scene hides it, since both draw into the same layers. The sea chart and level select hide it too (they cover the whole screen).
- **2026-11-13 · The UI is always the dark (night) theme.** The phase 01 tokens switched panels to pale colors when the device prefers light mode; over the night sea that made text unreadable. `index.html` now sets `data-theme="dark"`. The sea chart is the one light screen, as SCREENS.md says.
- **2026-11-13 · Back = Esc = the browser's back button.** Order: close the top dialog, then let the screen handle it (play opens Pause, Pause resumes, the shop cancels buoy placement), then go back a screen. The browser history keeps one spare entry to catch its back button; on the title screen, back leaves the page as usual. Esc no longer pauses through the input code (P still does), so Esc can't pause and unpause at once. The controller test now presses P.
- **2026-11-13 · Screen stacks after a night are rebuilt** so back always makes sense: a night sits on Title → Chart → its region's level select; Results, the shop and "Quit to map" go back to the chart.
- **2026-11-13 · The campaign list** (all 30 levels with their CONTENT.md names, what each introduces, and where regions sit on the chart) is in `src/data/campaign.ts`. Levels phase 06 hasn't written play a stand-in night, renamed and tinted for their region: region 1 plays 1-2's layout, regions 2–5 play the matching demo night (ice, storm, cove, archipelago). The stand-in's bonus objective shows on the briefing.
- **2026-11-13 · Placeholder progress lives in memory only** (`src/app/progress.ts`, presets in `progressPresets.ts`). Results award stars, coins and ships saved, the shop spends coins, and regions unlock, but a reload starts a new keeper. `?progress=mid` (region 1 done, half of region 2, 185 coins) and `?progress=all` (everything, 2000 coins) let you test later states. Phase 06 finishes the rules; phase 08 saves them.
- **2026-11-13 · Unlock rules (placeholder until phase 06):** a level opens when the one before it in its region is cleared; a region opens when the previous region's finale is cleared; each finished region adds its island building and diary page; endless watch opens after Harbor Bay. The foghorn is sold once 1-6 is cleared (so it can be bought before 2-1, where it's introduced), flares once 2-6 is cleared.
- **2026-11-13 · Bell buoys are placed per level** (the next night's reef chart in the shop), at most 3 per region, priced 20 + 10 for each already placed in that region. They can't be moved yet.
- **2026-11-13 · Settings apply at once and are kept in memory until phase 08.** Working now: graphics quality, frame-rate counter, screen shake, difficulty (restarts a night in progress), beam control, left-handed buttons, tutorial prompts, reduced motion, colorblind colors, larger text (1.25×). Stored but with nothing to control yet: the four volume sliders and mute (audio is phase 07), high-contrast reefs and vibration (phase 08). Export and import show as "coming soon"; reset progress works, with a two-tap confirmation. The debug panel's difficulty, control, quality and colorblind switches change the same settings.
- **2026-11-13 · Contextual tutorial prompts** show once per visit, at the bottom of the screen, for 3.5 s, and never block play: a ship lost in the dark, the first smuggler, ferry, pirate, whirlpool and lightning. Phase 06 adds 1-1's scripted tutorial.
- **2026-11-13 · Fail tips come from what happened** (`src/scenes/nightLog.ts` listens to events only): a lost ferry; pirates, the whirlpool or icebergs (when they caused at least half the wrecks); ships in the dark for 6 s or more; ships lit only shortly before they sank; otherwise a general sweep tip.
- **2026-11-13 · HUD:** the progress bar shows ships still to come; wrecks left are hull icons; ability buttons (60 px) sit bottom right, bottom left in left-handed mode, with a cooldown ring on the foghorn, a charge count on flares, and the steered lamp's number on the switch button. Edge arrows now keep clear of the HUD's bars and the notch.
- **2026-11-13 · The island stays in the centre of the screen** (phase 01 said to revisit once the HUD existed). The HUD's top bar and the ability buttons fit outside the 230-unit circle on portrait phones.
- **2026-11-13 · The sea chart and level select are SVG** (drawn in code: paper, coastline with hatching, compass rose, rhumb lines; fog over locked regions), with real HTML buttons on top so keyboards and screen readers work. On short screens the chart scrolls rather than shrinking.
- **2026-11-13 · The shop's lighthouse is an SVG drawing by day** (rather than a second, daytime Pixi scene): the lens grows with Wider lens, the glow with Brighter lamp, gear dots with Oiled gears, and it pulses when you buy.
- **2026-11-13 · Ship and hazard drawings** for the briefing ("new tonight", gently animated) and the logbook (dark silhouettes until met) are small SVGs in `src/ui/illustrations.ts`.
- **2026-11-13 · Player text is split into `src/ui/text/`** (common names, screens, logbook) and gathered into `STRINGS` in `src/ui/strings.ts`, which is still the only file the game imports text from. The 30 harbor-master briefing lines and the 5 diary pages are written (phase 06 may revise the briefings with the levels).
- **2026-11-13 · Transitions are 250 ms** (SCREENS.md; it was 220) with a fog band sweeping across; with reduced motion, just the fade.
- **2026-11-13 · Debug shortcuts:** `?level=` or `?seed=` still start a night at once (Title sits behind it), `?screen=<name>` opens any screen (`&night=2-3`, `&region=stormStrait`, `&fail` for a lost night's results), `#sandbox` as before.
- **2026-11-13 · No new tests this phase** (the owner will write tests at the end of the project). The phase prompt's Playwright walk (Title → Map → Level → Play → Pause → Quit) was run by hand with a script instead, along with a keyboard-only walk; both pass with no console errors. The deferred tests are listed under Known issues.

## Known issues
(Bugs and rough edges, newest first.)

- **Phase 05 tests to write (owner: no tests until the end, 2026-11-13):**
  - Playwright: the main path Title → Map → Level → Play → Pause → Quit (the phase checklist's test); a keyboard-only walk; Esc and browser back on every screen; no cut-off content in an iPhone-shaped viewport with notch insets
  - regression (bug fixed 2026-11-13): over the sea, the canvas (not the HUD layer) receives the mouse, so "follow finger" works with a cursor
  - unit: progress rules (unlocks, `recordResult`, upgrade and buoy prices, buying, buoy limit), `pickTip` and the night log, the navigator's back order, `levelDef` stand-ins, `nextLevelId`, settings store updates
- **Progress resets on reload** (memory only until phase 08), so a fresh visit always starts at "Begin your watch" and the difficulty choice. Use `?progress=mid` or `?progress=all` to skip ahead.
- **Unbuilt levels play stand-ins** (1-2 or a demo night), so every region-1 night looks like 1-2 and 1-1's briefing shows 1-2's cargo bonus. Phase 06 writes the real levels and 1-1's tutorial.
- **Endless watch is a placeholder:** its button and locked hint are real, and its results screen can be seen with `?screen=endlessResults`, but the mode itself is phase 06.
- **Sound sliders, high-contrast reefs and vibration don't do anything yet** (phases 07 and 08). Export/import save are greyed out until phase 08.
- **Bell buoys can't be removed or moved** once placed (no rule in the docs; easy to add if wanted).
- **The HUD level label for debug demos shows the demo's id** (for example "demo-cove"). Campaign nights show "1-2 The cargo run".
- **Visible focus rings appear on the first button of each screen** even when you tap rather than use the keyboard, in some browsers. It's the price of putting keyboard players straight on the first control.
- **Tests still to write (owner asked to defer, 2026-11-13).** Already covered: fairness with every hazard, fog, icebergs, lightning, whirlpools, pirates, determinism, and all special ships. Still to write:
  - the foghorn: locked, slow, cooldown by level
  - flares: charges, empty
  - second lamp: switching, the idle sweep, pointer aim around it
  - the bell-buoy chime
  - storm waves pushing lit ships, and their lean-in
  - the pirate's exact boarding moment (it boards a little later than 2.5 s when it starts right on top of a ship, because it overshoots and turns back)
  - the sandbox's world edits (launchShip, addHazard, clearHazard)
  - the input keys and buttons
  - a browser smoke test of #sandbox (checked by hand with a script: no console errors)
- **`Renderer.ts` is 325 lines and `lightMap.ts` 313**, a little over the ~300 guideline. Worth splitting during phase 09 polish.
- **The second lamp lights the water without sparkles** (the water shader knows only the island's beam). Light and reveals are correct.
- **The fog shadow can darken the other lamp's cone** where they overlap. It only shows on a level with both fog and a second lamp.
- **Not seen on screen yet:** the tug's rope line and the whirlpool-wreck swirl (both checked in code; the sandbox shows them), and the lightning warning glow (too brief for a screenshot).
- **The whole test suite now takes about 70 s** (the fairness runs replay thousands of nights). The fairness checks are split over three files so they run in parallel.
- **Ships are small on portrait phones.** The whole 230-unit circle must fit the phone's width, so on a 390 px-wide phone one world unit is about 0.8 px and a fishing boat is about 11 px long. All six types are clearly different on desktop and in the zoomed parade, but on a phone they're small. Options if it bothers you in play: draw ships larger than their collision size, or revisit the phase 01 scale rule. Worth checking on your phone with the **Ship parade**.
- **Low quality looks a little flat in the beam** (no water shader, so lit water is lighter but not warm). It's the fallback for weak devices.
- The water shader's WebGPU version is checked in desktop Chrome only (with a software GPU); WebGL is what phones use today.
- `npm audit` reports a moderate advisory in `minimatch`, which ESLint and typescript-eslint use. It only affects the developer's lint tooling and never reaches players. Clears when those packages update.
- **Lighting a ship that is scraping along a reef can make it crash sooner.** A dark ship drifts at 60% speed, so it can creep along a reef's edge for several seconds. Lighting it in the last second or two speeds it up to full speed before it can turn away. Each such ship was savable earlier (the fairness test checks this), but it may feel unfair in play. Worth watching in play-tests; a possible fix is to let lit ships speed up gradually instead of instantly.
- **Replays across different browsers may differ slightly**, because `Math.sin`/`Math.cos` can round differently from one engine to another. Within one browser a seed always replays exactly. This only matters if we ever share replays between devices.
- Level 1-2 balance is rough (phase 10 does the balance pass). In 100 simulated nights on Keeper, a player who never moves the beam gets mostly ★ or ★★ and fails 6% of the time; a player who always lights the oldest ship gets mostly ★★ or ★★★.

## How to test the latest work
(Plain-language steps for the owner.)

1. In a terminal in the project folder, run `npm run dev`, and open the **Local** address it prints (usually http://localhost:5173). On your phone (same Wi-Fi), open the **Network** address.
2. **The main path:** tap "Tap to begin" → **Begin your watch** → pick a difficulty → **Light the lamp**. The night starts. Tap the pause button (top right) → **Quit to map** → tap **Harbor Bay** → tap a level buoy → read the briefing → **Light the lamp**. Finish or lose a night to see **Results** (dawn sky, stars one by one, or a tip if the fog won), then **Harbor** for the shop.
3. **Back everywhere:** the phone's back gesture, the browser's back button and Esc should always do the sensible thing: close a dialog, open Pause during a night, or go back one screen.
4. **Later progress:** add `?progress=mid` (region 1 done, 185 coins) or `?progress=all` to the address to see unlocked regions, stars, the shop with coins, diary pages and records.
5. **One screen at a time:** `?screen=title`, `map`, `levelSelect`, `briefing&night=2-2`, `results`, `results&fail`, `shop&night=2-4&progress=mid`, `logbook&progress=mid`, `settings`, `credits`, `endlessResults`.
6. **Settings to try** (from the title or from Pause, mid-night): left-handed buttons (abilities move to the left), larger text, reduced motion (no fog wipe, no star pop), colorblind colors (try `?level=demo-archipelago`), show frame rate, beam control, difficulty.
7. **HUD with abilities:** `?level=demo-cove` or `?level=demo-archipelago` start with the foghorn (cooldown ring) and 3 flares (count badge); the archipelago adds the lamp switch. Keys H, F, Q, P still work.
8. **Keyboard only (desktop):** Tab and Enter through every menu, arrow keys in the difficulty cards, settings choices and logbook tabs, Esc to go back.
9. **Phase 04 sandbox** is unchanged: http://localhost:5173/#sandbox.
10. Optional checks for a developer: `npm run typecheck`, `npm run lint`, `npm run test` (about 65 s), `npm run e2e`.

## Session log
(Date, phase, what was done, where it stopped.)

- **2026-11-12 · Phase 01 Foundation.** Set up Vite + TypeScript (strict) + PixiJS 8 + Vitest + Playwright + ESLint + Prettier with pinned versions. Created the folder layout with a description in each folder. Built `src/app/` (viewport and scale, fixed 60 Hz game loop with catch-up cap and pause on hidden tab, scene manager with back stack and fade), the seeded RNG, angle helpers, data files for quality, viewport, loop, beam and island, colour and font tokens with local fonts, the ten render layers, and a placeholder play scene. 38 unit tests plus 3 browser smoke tests (portrait, landscape, desktop). Phase complete; owner accepted all checks on 2026-11-13 and asked for the commit.
- **2026-11-13 · Phase 02 Core simulation.** Built the pure, deterministic simulation in `src/sim/` (world, beam, ships, reefs, spawner, rules, bonus objectives, typed events, level validator). Its data lives in `src/data/` (ships, ship behavior, difficulties, sea rules, controls, level 1-2). Input (`src/input/`): follow finger, drag to rotate, keyboard, pause. A debug renderer (`src/render/debug/`), a debug panel, and a temporary HUD and end card, so 1-2 plays start to finish. The fairness test found reefs too close to the beam's edge; added the reef range margin rule and moved 1-2's reefs. 117 unit tests (including determinism and fairness across 120 seeds × 3 difficulties × 2 lazy players) and 4 browser tests. Phase complete, waiting for the owner's play-test.
- **2026-11-13 · Phase 03 Rendering & visuals.** Replaced the debug drawing with `src/render/Renderer.ts` and its views: water shader (GLSL + WGSL) with a Low fallback, light-map darkness with blur and "breathing" noise, beam air glow, shaft, bloom and lamp flicker, seeded low-poly reefs with foam rings and dashed memory outlines, shallows, buoys, six ship looks with upright rigs, bob, roll, wakes, lanterns, lost markers and edge arrows, the island with tower and five campaign buildings, two fog banks, rain, snow and beam spray, and event-driven effects (rings, coin pop, splinters, foam, shake). All shapes sit behind `ArtProvider` in `src/render/art/`. Region palettes, render feel numbers and Auto-quality settings are in `src/data/`. The debug panel gained Region, Weather, Quality, All buildings and Ship parade. 29 new unit tests (Auto quality, dashes, reef shapes, edge arrows, shake, blending, regions, address options) and 1 new browser test (switching every look mid-night); 146 unit + 5 browser tests pass. Measured draw calls in a busy scene: 18 per frame at High (budget 60), 14 at Medium, 9 at Low. 16 review screenshots saved. Phase complete; owner accepted on 2026-11-13.
- **2026-11-13 · Phase 04 Ships, hazards & abilities.** Simulation:
  - All four new ship types, plus the coast guard tow.
  - Six hazards: fog bands, icebergs, lightning, storm waves, whirlpool, pirates.
  - Second harbor, foghorn, flares, second lamp, bell-buoy chime, and 16 new events.
  - The world split into smaller modules (`worldSetup`, `worldNight`, `worldEdit`, `shipForces`, `steering`).

  Drawing: every new element, harbor colors and colorblind shapes, and effects for the new events. Input: H, F and Q keys, plus temporary ability buttons. Also a sandbox scene at `#sandbox` and four demo nights.

  Fairness was re-run with every hazard on test levels built from 1-2. It led to the iceberg changes and the storm-wave reef margin; pirates had the 2.5 s boarding window built in. Result: 250 unit tests and 5 browser tests pass. Per the owner, further unit tests are deferred (list under Known issues). Phase complete, waiting for the owner's play-test.
- **2026-11-13 · Phase 05 UI & screens.** Built:
  - A DOM UI kit (`src/ui/kit/`).
  - Back handling for Esc and the browser button (`src/app/navigator.ts`).
  - The live sea behind menus.
  - Placeholder progress and a settings store (`src/app/`).
  - The campaign list (`src/data/campaign.ts`), shop prices (`src/data/shop.ts`) and menu timing and default settings (`src/data/menus.ts`).
  - Every screen in SCREENS.md (`src/scenes/`): boot, title, first-launch difficulty, sea chart, level select, briefing, play with the real HUD and Pause, results with dawn and fail tips, endless results, harbor shop with buoy chart, logbook (diary, ships, hazards, records), settings, credits.

  The temporary HUD and end card are gone. Wrote the 30 briefing lines and 5 diary pages. Checked by script in a headless browser: the main path, a keyboard-only walk, every screen on portrait, landscape and desktop, the sandbox. No console errors. Typecheck, lint, 250 unit tests and 5 browser tests pass (one existing test now presses P to pause, one now looks for the new HUD). No new tests, per the owner. Phase complete, waiting for the owner's play-test.
- **2026-11-13 · Fix: the beam didn't follow the mouse** (owner report). The HUD's full-screen layer was catching the pointer, because the `#ui > *` rule outranked `.hud { pointer-events: none }`. The rule is now `:where(#ui > *)`, so the HUD, toast and frame-rate counter let the pointer through to the sea. Checked in a browser: the beam turns toward the cursor, menu buttons still work, and the browser tests pass.
