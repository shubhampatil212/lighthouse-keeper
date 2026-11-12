# Phase 06 — Levels, campaign & modes

**Goal:** all 30 campaign levels designed and balanced, progression connected to real data, endless watch and daily seed working, difficulty fully applied.

## Read first
`docs/CONTENT.md` §5–8, `docs/GDD.md` §4–7, `CLAUDE.md`.

## Tasks
1. Write all 30 level files following the region table and the difficulty curve in CONTENT.md §6. For each level: name, a one-line harbor-master briefing, ships, reefs, hazards, current, bonus objective. Levels within a region should each have a distinct "shape" (for example, a reef wall with one gap, a ring of reefs, traffic from one side only).
2. The tutorial script for 1-1 from GDD §7, and smaller in-context introductions for each new mechanic (first iceberg, first ferry, foghorn and so on).
3. **Bot play-tester** (`npm run playtest`): a headless script that runs every level many times on each difficulty with a few simple scripted strategies (for example, "always light the ship closest to a reef", "sweep back and forth"). It writes a report of win rate, average wrecks and stars to `docs/balance-report.md`. Use it to tune levels so that on Keeper the "smart" bot gets ★★ on most levels and the "sweeper" bot fails roughly 20–40% of region 3+ levels.
4. Progression: stars per difficulty, region unlocks, coins, upgrades, island buildings and diary entries — kept in a progress model ready for the save system (Phase 08 makes it persistent; keep it in memory for now if needed).
5. Endless watch with the rules from CONTENT.md §7, and a daily seed made from the date.
6. Difficulty multipliers applied everywhere (speed, spawn, current, wreck allowance, reef memory, coins).
7. A debug "unlock all" and "jump to level" option in the debug panel.

## Acceptance checklist
- [ ] All 30 levels can be played, and each one introduces or tests something specific.
- [ ] `docs/balance-report.md` exists and shows a smooth difficulty curve. Point out any outlier levels in your report.
- [ ] Finishing 1-6 unlocks region 2 and endless watch, adds an island building and a diary entry.
- [ ] The owner plays region 1 on Keeper and finds it fair and gradually more challenging.
- [ ] All checks pass and PROGRESS.md is updated.
