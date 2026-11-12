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

## 7. Endless watch
Starts at 1 ship every 6 s. Every 30 s: spawn interval ×0.92 (minimum 1.6 s), one new reef cluster, and a new hazard type every 2 minutes from those the player has unlocked. Score = ships saved × 10 + time survived in seconds. The run ends at the difficulty's wreck allowance.

## 8. Economy check
A full ★★★ run of a region should earn about 1.3× what it costs to max out that region's most useful upgrade path, so the player always has something to buy but can't buy everything until about region 4.
