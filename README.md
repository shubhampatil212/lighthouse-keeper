# Lighthouse Keeper: Director's Pack for Claude Code

This pack turns the one-file prototype into a complete browser game. You act as the producer: you hand Claude Code one phase at a time, play-test the result, and approve it before moving on. The documents in `docs/` are the "source of truth" Claude Code checks whenever it's unsure.

## What's inside

| File | Purpose |
|---|---|
| `CLAUDE.md` | Project memory. Claude Code reads it automatically at the start of each session. It holds the stack, the architecture rules, and the definition of done. |
| `docs/GDD.md` | Game Design Document: vision, core loop, mechanics, progression, game modes. |
| `docs/CONTENT.md` | Exact numbers: ship types, hazards, upgrades, difficulties, all 30 campaign levels. |
| `docs/SCREENS.md` | Every screen, how screens connect, and how each one behaves. |
| `docs/ART_AUDIO.md` | Visual and sound direction, palettes, effects lists, performance budgets. |
| `docs/PROGRESS.md` | A running log that Claude Code updates at the end of every phase. |
| `prompts/01–10` | Phase prompts. Run them in order. |
| `prompts/_bugfix.md`, `prompts/_feature.md` | Reusable templates for reporting bugs and requesting changes. |
| `reference/prototype.html` | The playable prototype, kept as a reference for how the game should feel. |

## Setup (once)

1. Make sure Node.js 20 or newer is installed (`node -v`).
2. Create an empty folder, e.g. `lighthouse-keeper/`, and copy **everything** in this pack into it, keeping the folders as they are.
3. Run `git init` inside it, so every phase can be committed and rolled back if needed.
4. Open a terminal in that folder and run `claude`.

## Running a phase

1. Start fresh for each phase: type `/clear` (or open a new session).
2. Switch to **plan mode** (Shift+Tab until it says *plan mode*) and send this message:
   > Read `prompts/01-foundation.md` and follow it. Show me your plan first.
3. Read the plan. If something looks off, say so. Once you're happy, approve it and let Claude Code work.
4. When it reports that it's done, run `npm run dev`, open the URL it gives you, and play the game, on your phone too (Vite prints a "Network" URL you can open on the same Wi-Fi).
5. Check the **Acceptance checklist** at the bottom of the phase prompt. If something fails, use `prompts/_bugfix.md`.
6. When everything passes, ask Claude Code to commit:
   > All acceptance checks pass. Commit this phase.
7. Move on to the next phase.

## Phase overview

| # | Phase | You get |
|---|---|---|
| 01 | Foundation | Project setup, build tools, an empty game that runs |
| 02 | Core simulation | The game logic, ported from the prototype, deterministic and tested |
| 03 | Rendering & visuals | The new 2.5D look: water, fog, volumetric beam, island |
| 04 | Ships & hazards | All ship types and hazards from CONTENT.md |
| 05 | UI & screens | Title, campaign map, level select, pause, results, shop |
| 06 | Levels & campaign | 30 levels, stars, unlocks, endless mode, difficulties |
| 07 | Audio | Ambience, adaptive music, sound effects (all generated in code) |
| 08 | Settings, saves, accessibility | Settings page, save system, colorblind mode, reduced motion |
| 09 | Polish & mobile | Game feel, haptics, performance, installable PWA |
| 10 | QA & release | Testing pass, balance pass, production build, deployment |

Expect each phase to take one or more Claude Code sessions. Phases 03, 04 and 06 are the biggest. If a session's context fills up, start a new one with:
> Continue phase NN. Read `docs/PROGRESS.md` to see what's done.

## Tips

- **Play between every phase.** Claude Code can test logic, but only you can tell whether the game *feels* good.
- **Use real numbers when giving feedback.** "Ships are too fast" is weaker than "cargo ships feel about 30% too fast on Keeper difficulty."
- **Balance numbers live in `src/data/`.** You can tweak them yourself without touching code.
- **Art and audio are generated in code** (shapes, shaders, synthesized sound), so there are no licensing problems. Phase 09 adds a slot for swapping in professional assets later if you want them.
- If Claude Code goes off track, press Esc, say what's wrong, and point it back to the relevant document.
