# Replacing drawn art and synthesized sound with real files

Everything in Lighthouse Keeper is made in code today. The shapes are drawn with Pixi and every sound is synthesized. Both pass through one replaceable layer each, so an artist or sound designer can supply files later without the game's logic changing:

- **Art** goes through the `ArtProvider` interface, in `src/render/art/types.ts`. Today's version is `createCodeArt()` in `src/render/art/codeArt.ts`.
- **Sound** goes through the sound catalog, `SOUNDS` in `src/audio/sfx/catalog.ts`, plus the music director and ambience.

This guide lists every slot, the sizes and formats to deliver, and what a programmer changes to load the files.

> **Status:** only the slots exist so far. No file loader is built yet. Adding one is a small, contained job, described at the end of each part below.

---

## Part 1 — Art

### How the game measures things

- **World units:** sizes are given in world units. The island sits at (0, 0), and the play area is a circle of radius 230. On screen one unit is about 0.8 px on a phone in portrait and about 2–3 px on a desktop.
- **Resolution:** deliver every image at **4 px per world unit**. A 22-unit cargo ship becomes an 88 px wide image. That stays sharp on high-resolution screens; the game scales it down.
- **The 2.5D trick:** some parts lie **flat on the water**: hulls, the island ground, rocks seen from above, shallows. Other parts **stand upright**, like the masts, sails, the tower and buildings. They are drawn facing the viewer, with "up" toward the top of the screen.
- **Lighting:** don't bake the night into the art. The darkness, the beam's light and the fog are all added by the game on top. Draw everything as if under soft, even daylight, at a slightly muted brightness. The game makes it dark.

### Formats

- **PNG** (with transparency) or **WebP** (lossless or quality 90+).
- Glow and particle textures must be **white on transparent**, because the game tints them.
- Sprites made of several parts can come as one **texture atlas**: a PNG plus a JSON file in the TexturePacker/Pixi format.
- **Budget:** the whole game, fonts included, must stay under **1.5 MB gzipped** on first load. It is about 0.42 MB today, so there is roughly 1 MB of room. Prefer atlases and WebP.

### Slots

| Slot (`ArtProvider` method) | What it is | Size in world units | Image size at 4 px/unit | Notes |
|---|---|---|---|---|
| `ships.createHull(type, length, width)` | Ship hull seen from above, **bow pointing right (+x)** | fishing 13×6, cargo 22×9, sailboat 12×5, ferry 24×9, tugboat 11×7, smuggler 14×6; pirate and coast guard in `src/data/hazards.ts` / `smuggler` settings | e.g. cargo 88×36 | Centre of the image = centre of the ship. The game rotates it to the heading. |
| `ships.createRig(type, length, width)` | Masts, sails, funnels, cabins **standing upright**, drawn facing right | Same length; height up to about 1.2 × length | e.g. sailboat 48×60 | Its foot sits on the hull's centre line. The game mirrors and skews it as the ship turns. |
| `ships.lantern(type)` | Not an image: the lantern's height, position, colour and glow (numbers) | — | — | Keep using numbers. The glow comes from the `glow` texture. |
| `reefs.createRock(shape, lightFrom)` | A rock seen from above, faces lit from the island's side | Radius 4–14 | 32–112 px square | `shape.points` is the collision outline. The art must cover it, or a ship would seem to hit thin air. Supply 3–4 variants; the game picks one from the seed. |
| `reefs.createIceberg(shape, lightFrom)` | Same, in ice | Radius 6–16 | 48–128 px | Pale, with a blue side. |
| `reefs.createBuoy()` | Bell buoy, upright | About 5 wide × 10 tall | 20×40 | Also return `lightHeight`: where its light sits, in units above the water. |
| `island.createGround(radius)` | Cliffs, grass and jetty, flat | Radius 34 | 272×272 | Centre = (0, 0). |
| `island.createTower()` | The lighthouse, upright | About 14 wide × 75 tall (62 to the gallery, plus the lamp room) | 56×300 | Also update `lampPoint`, `towerBase` and `towerHeight` to match the art. |
| `island.createLampGlass()` | Just the lamp glass, to flicker | About 6×6 | 24×24 | Drawn over the tower at `lampPoint`. |
| `island.createBuilding(id)` | cottage, dock, chapel, market, festivalLights | About 10–20 wide | 40–80 px | Upright. Window lights come from `buildingLights(id)` (positions, not images). |
| `island.createIslet(radius)` | The second lighthouse's rock | Radius 10 | 80×80 | The second tower reuses `createTower()` at `secondTowerScale`. |
| `textures.glow` | Soft round glow | — | **128×128** | White, full in the centre, fading to nothing at the edge. Radius 64 px = scale 1. |
| `textures.pool` | Pool of light: flat middle, soft edge from 60% to 100% | — | 128×128 | White. |
| `textures.fog` | Tileable soft noise for fog banks | — | 256×256, **tileable** | Greyscale. |
| `textures.breath` | Tileable fine noise (0.75–1 grey) for the "breathing" beam on High | — | 256×256, tileable | Must stay between 75% and 100% grey. |
| `textures.dot`, `splinter`, `drop`, `flake` | Particles: foam, wood splinters, rain, snow | — | 8–16 px | White. |
| `textures.wave` | A wave crest for Low quality water | — | 32×12 | White. |
| `beamCone(...)` | The beam's cone of light | — | Built from numbers | Leave in code. It changes shape with lens upgrades and must match the simulation exactly. |

**Leave these in code:** the water shader, the darkness and light map, the beam cone, the fog shadow, the edge arrows, the wake lines, the reef memory outline, the harbor markers and every "cue" shape (pirate ring, foghorn rings). They show game rules exactly, and the shapes must match the simulation.

### What a programmer does to switch to files

1. Put the files in `public/art/`, with an atlas if there is one.
2. Write `createFileArt(): ArtProvider` in `src/render/art/fileArt.ts`. Each method returns a `Sprite` (anchored as the table says) instead of a `Graphics`. Methods without art can fall back to the matching method of `createCodeArt()`.
3. Load the atlas during the loading screen with Pixi's `Assets.load`, between "fonts loaded" and "first frame" in `src/main.ts`, and pass the result where `createCodeArt()` is used.
4. Nothing else changes: the views only see the `ArtProvider` interface.

---

## Part 2 — Sound

### How sound works today

- Every sound effect is a **recipe**: a function that receives a voice and plays synthesized notes on it. Recipes are listed by id in `SOUNDS` (`src/audio/sfx/catalog.ts`).
- The engine already handles, for every recipe:
  - the voice limit (24 at once);
  - ±3% pitch variation;
  - left/right position from the ship's place on screen;
  - ducking the music under big sounds.
- The **sound test** in the debug panel (open with the backtick key or `?debug`) has a button for every sound id. Use it to check replacements.

### Sound-effect slots

| Id | Plays when | Length | Notes |
|---|---|---|---|
| `shipLit` | A ship is lit for the first time | 0.3–0.6 s | Two soft bell notes. |
| `shipHome` | A ship reaches harbor | 0.8–1.2 s | Warm chime plus a coin clink. The most important positive sound. |
| `reefRevealed` | Light first finds a reef | 0.3–0.5 s | Low thunk with a little room. |
| `wreck` | A ship is wrecked | 1.5–2.5 s | Wood crack, low rumble, a sad distant bell. |
| `foghorn` | Foghorn used | 2–3 s | Two-tone horn. |
| `flare` | Flare fired | 1–1.5 s | Whoosh plus crackle. |
| `lightning` | Lightning strike | 2–4 s | Crack, then thunder 0.5–2 s later (one file can hold both). |
| `lampSwitched` | Switching to the other lighthouse | 0.2 s | Mechanical clunk. |
| `abilityUnavailable` | Ability not ready | 0.1 s | Dull tick. |
| `buoyBell` | Bell buoy rings | 1–2 s | Small bell. |
| `smugglerCaught` | Smuggler caught | 0.5–0.8 s | Small chime plus coin. |
| `pirateArrived` | A pirate ship arrives | 1.5–2 s | Low, distant horn. |
| `gull` | Ambience (random) | 0.5–1 s | Supply 3–4 variants. |
| `uiTap`, `uiBack`, `uiBuy` | Menu sounds | 0.05–0.4 s | Very quiet and short. |
| `star` | Each star on Results | 0.4–0.6 s | One file. The game raises the pitch one step per star (1, 2, 3), or supply three files. |
| *(beam whir)* | Beam turning, High quality only | Loop, 2–4 s | Seamless loop. The game changes its pitch and volume with turn speed. |

### Music and ambience slots

- **Title theme:** D Dorian, about 70 BPM, calm. A loop of 30–60 s, seamless.
- **Night, calm layer** and **night, tension layer:** two loops of the **same length and tempo**, so they stay in sync. The game cross-fades between them over 1.5 s when a ship is in danger.
- **Dawn** (night won) and **Fail** (night lost) motifs: 3–5 s one-shots.
- **Ambience** per region: Harbor Bay, Northern Ice, Storm Strait, Smugglers' Cove, Archipelago. Each is a 30–60 s seamless loop of sea and wind, plus a separate **rain** loop for rainy nights. Gulls and the buoy bell play on top as separate sounds.

### Formats and levels

- **OGG Vorbis** (quality 5–6), plus an **M4A/AAC** copy, because iPhone Safari doesn't play OGG everywhere. Both at **48 kHz** (44.1 kHz is fine).
- **Mono** for effects: the game places them left and right itself. **Stereo** for music and ambience.
- **Loudness:**
  - effects peak around **−3 dBFS**;
  - music around **−18 LUFS**;
  - ambience around **−24 LUFS**.

  Final balance is set in `src/data/sound.ts` (bus levels, and a `level` for each effect).
- **Silence:** trim it at the start of effects. The game times them to the event.
- **Size:** effects together under about 300 KB; music and ambience together under about 600 KB per format. Music and ambience can load after the title appears.

### What a programmer does to switch to files

1. Put the files in `public/sound/`, named after their id, for example `shipHome.ogg` and `shipHome.m4a`.
2. Add a small loader (`src/audio/samples.ts`). After the first tap, when the AudioContext exists, it fetches each file and decodes it with `ctx.decodeAudioData`, choosing OGG or M4A with `canPlayType`.
3. For each id that has a file, replace that entry's `recipe` in `SOUNDS` with a "sample recipe". It plays the decoded buffer on the voice's output (`shot.out`), at `shot.at`, with `playbackRate = shot.pitch`, and returns the buffer's length.
   - Ids without a file keep their synthesized recipe, so files can arrive one at a time.
   - The voice limit, panning and ducking keep working, because they sit around the recipe.
4. Music: give `src/audio/music/director.ts` looping buffer sources for the calm and tension layers in place of its scheduled notes, keeping its cross-fade. Ambience: give `src/audio/ambience.ts` looping buffers in place of its noise layers.
