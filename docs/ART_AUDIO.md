# Art & Audio Direction

## Look in one sentence
**A storybook maritime night:** low-poly, painterly shapes in deep teal and ink, warm amber light that feels physical, and fog you can almost touch. Think *Alto's Odyssey* meets an old sea chart.

## Palette (tokens)
| Token | Hex | Use |
|---|---|---|
| sea-deep | #0A222C | Far water, darkness tint |
| sea | #0F3542 | Mid water |
| sea-crest | #AFD7DC | Wave highlights, foam |
| fog | #9FB8BC | Fog layers |
| lamp | #FFC95E | The beam, lanterns, UI accent |
| lamp-hot | #FFE2A0 | The beam's core, lamp glass |
| rust | #B64A35 | Lighthouse stripes, buoys, danger |
| stone | #4A453F | Rocks, island cliffs |
| moss | #4C6A47 | Island grass |
| parchment | #E8DFC8 | Map screen paper (the only light background) |
| ink | #123039 | Map screen lines and text |
Colorblind mode: ship destination colors switch to blue/orange plus a shape marker (circle or triangle). Never rely on color alone.

## Typography
- **IM Fell English** (Google Fonts, SIL OFL): titles, level names, the logbook. Sentence case.
- **Karla** (Google Fonts, SIL OFL): the interface, numbers, buttons.
- Bundle the font files locally (no CDN at runtime) under `public/fonts/`.

## Rendering layers (bottom to top)
1. **Water:** a full-screen shader. Layered moving noise for the swell, sparkles that appear *only where light hits*, a subtle reflection of the lamp.
2. **Seabed and shallows:** lighter teal around the reefs and the island, visible only when lit.
3. **Reefs and icebergs:** low-poly shapes with a lit top face, a shaded side face and a foam ring that moves.
4. **Ships:** a hull in the water plane plus an upright mast and sail (the 2.5D trick). A wake trail, gentle bobbing and roll.
5. **Island:** layered cliff, grass, buildings that grow over the campaign, the lighthouse tower with stripes and an open gallery.
6. **Darkness:** a render texture filled with the night color, with the light cut out (the beam cone with soft edges, the island glow, buoys, ship lanterns). Feather the edges with a blur. On High quality, add light falloff noise so the beam edge looks "breathing".
7. **Light effects (additive):** the volumetric beam shaft from the lamp glass, dust and spray in the beam, lamp bloom, lantern glows.
8. **Weather:** layers of rolling fog at 2 depths moving at different speeds, rain streaks, lightning flashes, snow in region 2.
9. **Effects:** splinters, ripple rings, foam bursts, the coin pop.
10. **HUD** (DOM).

Each region tints layers 1, 6 and 8: Harbor Bay (teal), Northern Ice (blue-violet, snow), Storm Strait (green-grey, rain), Smugglers' Cove (purple-black, moonlit), Archipelago (deep blue with festival lanterns).

## Quality settings
| | Low | Medium | High |
|---|---|---|---|
| Max device pixel ratio | 1 | 1.5 | 2 |
| Water shader | Flat gradient + sprite waves | Shader, 1 noise layer | Shader, 3 layers + sparkles |
| Darkness blur | None | 1 pass | 2 passes + noise |
| Fog layers | 1 | 2 | 2 + spray |
| Particles cap | 100 | 250 | 600 |
**Auto** starts at Medium, measures frame time for 3 s, and drops a level if the average is above 20 ms.

## Art assets
Everything is drawn in code: Pixi Graphics, generated textures and custom filters. No external images are needed. Keep all shape definitions in `src/render/art/` so a later artist can replace them with sprites through a single `ArtProvider` interface.

## Audio direction
Everything is synthesized with the Web Audio API in `src/audio/`. Mood: quiet, warm, a bit lonely.

**Buses:** master → music, sfx, ambience (each with its own volume and a light compressor on master).

**Ambience (loops, built from filtered noise)**
- Waves: brown noise through a slowly moving low-pass filter, with volume swells every 5–9 s
- Wind: pink noise through a band-pass filter with a drifting center frequency
- Rain (region 3, storms): high-passed white noise with random droplet clicks
- Distant gulls and a buoy bell occasionally (synthesized)

**Music director (adaptive)**
- A generative, slow pad and soft plucked melody in D Dorian at about 70 BPM. Two layers:
  - *Calm layer:* plays when no ship has been in the dark for more than 3 s.
  - *Tension layer:* adds a low pulse and higher strings when any ship is lost or near a reef. Cross-fade over 1.5 s.
- A short motif plays at dawn on the results screen; a darker version on fail.
- The title screen has its own gentle theme built from the same voices.

**Sound effects**
| Event | Sound |
|---|---|
| Beam turning | Very soft mechanical whir, pitch follows turn speed (High quality only) |
| Ship lit for the first time | Small two-note bell |
| Ship home | Warm chime + a soft coin clink |
| Reef revealed | Low "thunk" with a short reverb |
| Wreck | Wood crack + low rumble + far-off bell |
| Foghorn | Deep two-tone horn (detuned saw waves through a low-pass filter) |
| Flare | Whoosh + crackle |
| Lightning | White flash crack, then thunder 0.5–2 s later |
| UI tap / back / buy | Short soft clicks; buying adds a coin sound |
| Star appears | Rising chime, one step higher for each star |

Audio rules: it starts only after a user gesture, pauses when the tab is hidden, and every sound has a slight random variation in pitch (±3%) so repeats don't feel mechanical.

## Haptics
`navigator.vibrate` where supported (Android): save 15 ms, wreck pattern [30, 40, 60], star 10 ms. Off when the setting is off.

## Performance budget
- 60 fps on a mid-range phone from ~2021 at Medium quality.
- First load under 1.5 MB gzipped (fonts included). No loading after that except the second font weight.
- Draw calls under 60 at High quality during a busy level.
