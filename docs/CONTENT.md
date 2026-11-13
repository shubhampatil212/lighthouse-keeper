# Content & Balance Sheet

All values here go into `src/data/`. Units: world units (wu), seconds (s), radians (rad). These are **starting values**. Phase 10 includes a balance pass.

## 1. Beam
| Stat | Base | Per upgrade level | Max level |
|---|---|---|---|
| Half-angle | 0.20 rad | +0.05 | 5 |
| Range | 190 wu | +28 | 5 |
| Turn speed | 2.4 rad/s | +0.7 | 4 |
| Island glow radius | 60 wu | — | — |

## 2. Ships
| Type | Unlocks in | Speed (wu/s) | Size (L×W) | Coins | Behavior |
|---|---|---|---|---|---|
| Fishing boat | 1-1 | 18 | 13×6 | 10 | Standard |
| Cargo ship | 1-2 | 12 | 22×9 | 15 | Turns slowly (turn rate ×0.7), needs a wider path around reefs |
| Sailboat | 1-4 | 16 | 12×5 | 10 | The wind pushes it 1.5× more than other ships while in the dark |
| Ferry | 2-3 | 13 | 24×9 | 30 | **Precious:** if it wrecks, the level fails. It has a gold lantern. |
| Tugboat | 3-2 | 20 | 11×7 | 10 | While lit, it slows nearby dark ships for you (tows them) |
| Smuggler | 4-1 | 22 | 14×6 | +25 bonus if caught | Turns **away** from the light. Keep it lit for 2 s to "catch" it: it stops and coast guard tows it away. If it escapes off-screen there's no penalty, but no bonus either. It never counts as a wreck. |

Dark behavior (all ships): speed ×0.6, heading error eases toward a random target in ±1.05 rad, re-rolled every 2–4 s, ease rate 0.8/s. Lit: turn rate 1.9 rad/s, reef avoidance radius = reef radius + 46 wu.

## 3. Hazards
| Hazard | Region | Rules |
|---|---|---|
| Reef | All | Static. Rocks of 6–12 wu radius in clusters of 2–4 |
| Current | All | Steady drift on dark ships; strength per level |
| Thick fog | 2 | Bands of fog that shrink the beam's range by 35% where the beam passes through them |
| Iceberg | 2 | A drifting reef, 18–30 wu, speed 3–6 wu/s, shown with an ice-blue edge when lit |
| Lightning | 3 | Every 8–15 s, the whole map lights up for 0.25 s. A warning glow comes 1 s before. Distant thunder sounds after. |
| Storm waves | 3 | Push all ships (lit too) by 6 wu/s in a direction that changes every 10 s |
| Whirlpool | 3 | Pulls ships within 60 wu toward its center; the center (radius 10 wu) wrecks ships |
| Pirate ship | 4 | Hunts dark ships within 90 wu and wrecks them on contact. Lighting it drives it away for 5 s. |
| Second harbor | 5 | Ships carry a destination color; lit ships steer toward their own harbor |

### Rules and numbers added in phase 04
CONTENT.md above didn't give these. They live in `src/data/` (`ships.ts`, `hazards.ts`, `abilities.ts`, `harbors.ts`). See PROGRESS.md for the reasons.
- **Tugboat:** a lit tug slows dark ships within 50 wu (centre to centre) to ×0.5 of their speed.
- **Smuggler:** in the dark it crosses the sea toward an exit point on the far side, 0.35–0.7 rad off straight across, so it misses the island. It knows the waters: it steers round rocks even in the dark and is never wrecked by anything. Lit, it turns away from whatever lights it. 2 s of *unbroken* light catch it. It escapes 4 wu past the spawn ring. Pirates ignore it. The coast guard boat (34 wu/s out, 14 wu/s towing) is cosmetic; the catch already counts.
- **Fog band:** a point the beam can only reach through fog is lit only within 65% of the range. Glows, buoys and flares ignore fog.
- **Iceberg:** a ship sailing (nearly) head-on into an iceberg, within 60° of its centre, wrecks. An iceberg drifting into a ship's side shoves it aside. Icebergs bounce to stay inside the fair zone: outer edge within the reef limit (base range − 50 wu), inner edge 10 wu clear of the harbor, and 30 wu of open water from any rock or other iceberg.
- **Storm waves:** lit ships lean into the push and keep their course. On a storm-wave level, rocks must sit a further 16 wu inside the reef limit.
- **Whirlpool:** pull 8 wu/s at the centre, fading to 0 at 60 wu. Lit ships steer round the core with 40 wu of room. It must sit in the beam's fair reach and not pull at a harbor.
- **Pirate:** 18×7 wu; patrols 150 wu out at 11 wu/s, hunts at 19, flees at 22. It hunts only ships inside the beam's range. **It must chase a ship for 2.5 s before it can board** (the player's reaction window). Lighting it drives it away for 5 s after the light last touched it. It never wrecks.
- **Second harbor:** each ship carries a harbor index. Ships bound elsewhere steer round the island and never sail onto it. Harbors must sit within the beam's fair reach. Colors: red and blue. Colorblind mode uses orange and blue, plus a circle or triangle marker.
- **Foghorn:** slows every ship within 140 wu of the island, at the moment it sounds, to ×0.4 of its own speed for 3 s. The current and waves still push. Cooldown: 12 s at level 1, 10 s at level 2, 8 s at level 3.
- **Flares:** charges per night = the flare upgrade level. Each lights the whole map for 1.5 s.
- **Second lamp:** a second tower on a 10 wu islet, with a 36 wu glow and the same beam stats as the main lamp. The lamp you aren't steering sweeps at 0.5 rad/s. A lamp you take over stops where it is.
- **Bell buoy:** rings (`buoyRang`) when a ship sails into its light.

## 4. Upgrades (Harbor shop)
Cost formula: `round5(base × (1 + level × 0.6))`

| Upgrade | Base cost | Max | Effect |
|---|---|---|---|
| Wider lens | 30 | 5 | +0.05 rad half-angle |
| Brighter lamp | 30 | 5 | +28 wu range |
| Oiled gears | 25 | 4 | +0.7 rad/s turn speed |
| Foghorn | 40 (unlocks in 2-1) | 3 | Level 1: 3 s slow, 12 s cooldown; each level: −2 s cooldown |
| Flares | 35 (unlocks in 3-1) | 3 | +1 charge per level (starts at 1) |
| Bell buoy | 20, +10 for each one owned | 3 per region | Lights 54 wu radius around a chosen reef |

## 5. Difficulty multipliers
| | Calm | Keeper | Storm |
|---|---|---|---|
| Ship speed | ×0.8 | ×1.0 | ×1.15 |
| Spawn interval | ×1.3 | ×1.0 | ×0.8 |
| Current strength | ×0.6 | ×1.0 | ×1.3 |
| Wreck allowance | 5 | 3 | 2 |
| Reef memory | 6 s | 3 s | 1.5 s |
| Coin reward | ×1.0 | ×1.0 | ×1.25 |

## 6. Campaign
Level format in `src/data/levels/<region>-<n>.ts`: id, name, seed, ships (list of `{type, at: seconds, edge or angle}` or a spawn pattern), reefs (cluster positions), hazards, current, bonus objective, star thresholds, and an optional tutorial script.

### Region 1 — Harbor Bay (tutorial, gentle)
| Level | Name | Ships | New element | Bonus objective |
|---|---|---|---|---|
| 1-1 | First light | 4 | Beam, reefs (guided tutorial) | — |
| 1-2 | The cargo run | 6 | Cargo ship | Save both cargo ships |
| 1-3 | Two at once | 8 | Ships arrive in pairs from opposite sides | No ship lost in the dark for over 6 s |
| 1-4 | Offshore breeze | 8 | Sailboats, a visible current | Finish in under 90 s |
| 1-5 | Rush hour | 10 | Faster spawning | Save 3 ships within 10 s of each other |
| 1-6 | First storm | 12 | Finale: rain, stronger current | No wrecks (counts as ★★★) |

### Region 2 — Northern Ice (thick fog, icebergs, foghorn unlocks)
2-1 Frost line (foghorn tutorial) · 2-2 Drifting giants (icebergs) · 2-3 The ferry (the first precious ship) · 2-4 White wall (fog bands) · 2-5 Calving season (many icebergs) · 2-6 Polar night (finale)

### Region 3 — Storm Strait (lightning, waves, whirlpool, flares unlock)
3-1 Flash of white (flare tutorial and lightning) · 3-2 Tug duty (tugboats) · 3-3 The maelstrom (whirlpool) · 3-4 Crosswaves (storm waves) · 3-5 No rest (all hazards mixed) · 3-6 The great storm (finale)

### Region 4 — Smugglers' Cove (smugglers, pirates)
4-1 Shadows on the water (smugglers) · 4-2 Contraband (bonus: catch all smugglers) · 4-3 Black sails (pirates) · 4-4 Escort (a ferry with a pirate nearby) · 4-5 Moonless (shorter range, more reefs) · 4-6 The pirate king (finale: 2 pirates)

### Region 5 — Lantern Archipelago (second lamp, two harbors)
5-1 Two lights (second lamp tutorial) · 5-2 Red and blue (two harbors) · 5-3 Island hopping · 5-4 Festival night (heavy traffic) · 5-5 Everything at once · 5-6 The longest night (finale, 30 ships)

Levels other than 1-1 to 1-6 must be designed by Claude Code following the curve: each region's levels 1–2 introduce, 3–5 combine, 6 is the test. Target difficulty on Keeper: a first-time player earns ★★ on most levels and ★★★ after practice.

### Designed levels, regions 2–5 (phase 06)
Ship counts include smugglers. Shapes and exact positions are in `src/data/levels/<region>-<n>.ts`; how the bots fare is in `docs/balance-report.md`.

| Level | Name | Ships | What it tests | Bonus objective |
|---|---|---|---|---|
| 2-1 | Frost line | 10 | Foghorn (lent for the night): ships in bunches of three from the north | 3 ships home within 6 s of each other |
| 2-2 | Drifting giants | 10 | Two icebergs, two small reefs | No ship in the dark for over 7 s |
| 2-3 | The ferry | 11 | First ferry, down a channel between rock walls | Finish within 95 s |
| 2-4 | White wall | 12 | Fog bands over the east and north | No ship in the dark for over 7 s |
| 2-5 | Calving season | 12 | Four drifting icebergs, a ferry | Save every cargo ship (★★★ allows 1 wreck) |
| 2-6 | Polar night | 14 | Finale: fog, icebergs, ferry | — (★★★ = no wrecks) |
| 3-1 | Flash of white | 12 | Lightning; one flare lent | No ship in the dark for over 7 s |
| 3-2 | Tug duty | 13 | Tug-led convoys from two sides | Save every tugboat (★★★ allows 1 wreck) |
| 3-3 | The maelstrom | 12 | Whirlpool beside a reef wall | 3 ships home within 8 s |
| 3-4 | Crosswaves | 12 | Storm waves, inner reef ring | Finish within 85 s |
| 3-5 | No rest | 14 | Lightning, waves and a whirlpool | No ship in the dark for over 8 s |
| 3-6 | The great storm | 16 | Finale: everything in the strait | Never fire a flare |
| 4-1 | Shadows on the water | 11 | Smugglers (3) | Catch 2 smugglers |
| 4-2 | Contraband | 13 | Smugglers (5) | Catch every smuggler |
| 4-3 | Black sails | 12 | One pirate | Drive pirates away twice |
| 4-4 | Escort | 12 | Ferry with a pirate nearby | No ship in the dark for over 8 s |
| 4-5 | Moonless | 13 | Six reefs inside a ring of fog | 3 ships home within 8 s |
| 4-6 | The pirate king | 16 | Finale: two pirates, smugglers, ferry | — |
| 5-1 | Two lights | 14 | Second lamp; reefs only it reaches well | No ship in the dark for over 7 s |
| 5-2 | Red and blue | 14 | Two harbors | Finish within 100 s |
| 5-3 | Island hopping | 14 | Second lamp and two harbors | No ship in the dark for over 8 s |
| 5-4 | Festival night | 20 | Heavy traffic, 2 s apart | 4 ships home within 8 s |
| 5-5 | Everything at once | 16 | Lamps, harbors, ice, fog, lightning, pirate, smugglers | Catch every smuggler |
| 5-6 | The longest night | 30 | Finale | — |

### Level rules added in phase 06
- **Bonus objectives** (`BonusObjectiveDef`): save every ship of a type; no ship in the dark longer than N s (only counted while a lamp could reach it, fog included); finish within N s (stretched by the difficulty's spawn interval, so ×1.3 on Calm); N ships home within N s of each other; catch N (or all) smugglers; never use an ability; drive pirates away N times.
- **★★★ wreck allowance per level:** where the bonus is "save every X", ★★★ allows one wreck of another type, or the bonus would add nothing.
- **Lent abilities:** a level may lend an ability for its night (2-1 the foghorn, 3-1 one flare), so its tutorial works before the shop sells it.
- **Current limit:** on every difficulty, a level's current (× the ship's wind factor) may be at most 75% of the slowest ship's dark speed (`SEA.currentMaxShare`). Stronger currents held ships at the spawn ring and the night never ended.
- **Fog and rocks (fairness):** no rock may sit behind a fog band as seen from a lamp, and every rock keeps at least 10 wu of open water from any band (`HAZARDS.fog.rockClearance`). With rocks inside or behind fog, a ship became lightable only about 1 s before it hit them.
- **Star coins:** 5 coins for each star earned for the first time on a level at a difficulty (× the difficulty's coin reward). Replays pay their ships again but not their stars.

## 7. Endless watch
Starts at 1 ship every 6 s. Every 30 s: spawn interval ×0.92 (minimum 1.6 s), one new reef cluster, and a new hazard type every 2 minutes from those the player has unlocked. Score = ships saved × 10 + time survived in seconds. The run ends at the difficulty's wreck allowance.

Details picked in phase 06 (`src/data/endless.ts`):
- The run ends when wrecks go **past** the allowance, the same rule as the campaign.
- The sea starts with 2 reef clusters; at most 12. New reefs sit 75–90 wu out, 30 wu clear of other rocks, 45 wu clear of any ship, and clear of whirlpools.
- Ships and hazards come from the campaign nights the keeper has cleared. No ferries (a lost ferry would end the run at once). Ship mix: fishing 6, cargo 2, sailboat 2, tugboat 1, smuggler 1.
- The current is 2.5 wu/s in a direction from the seed. The difficulty's multipliers apply as in the campaign; saved ships pay coins.
- **Daily sea:** the seed comes from the player's local date, and it uses every ship type and hazard, so every keeper gets the same sea that day. Best daily score is kept per day.

## 8. Economy check
A full ★★★ run of a region should earn about 1.3× what it costs to max out that region's most useful upgrade path, so the player always has something to buy but can't buy everything until about region 4.
