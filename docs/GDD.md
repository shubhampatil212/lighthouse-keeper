# Lighthouse Keeper — Game Design Document

## 1. Vision
**One line:** a cozy-but-tense night watch where your finger *is* the light that keeps sailors alive.

**Pillars**
1. **Light is information.** The player never fights. They decide *who sees* and *what is seen*. Every mechanic should be about revealing, guiding or withholding light.
2. **Calm surface, tense core.** Gentle visuals and sound, but always a little too much sea for one beam to cover.
3. **Short sessions, long attachment.** A level takes 60 to 120 seconds. The island and the keeper's story grow across the campaign.
4. **Fair darkness.** Losses come from the player's choices, never from hidden randomness.

**Platform:** web browser on mobile (portrait first) and desktop. Later: installable PWA, then possibly app-store wrappers.
**Audience:** casual to mid-core players aged 12 and up who enjoy Mini Metro, Alto's Odyssey and Flight Control.
**Session:** 1–3 minutes per level; 20–40 minutes per region.

## 2. Core loop
```
Night (play level) → Results (stars, coins) → Harbor (spend coins, upgrades) → Map (next level) → Night …
```

## 3. Core mechanics

### 3.1 The beam
- A cone that starts at the lighthouse. It has an **angle** (half-width), a **range** and a **turn speed** (radians per second).
- The beam points toward the player's finger or cursor but turns no faster than its turn speed.
- Light falls off softly toward the edge of the range. Anything inside the cone, the island's glow, or a buoy's glow counts as **lit**.
- Keyboard: ← and → turn the beam. Gamepad: the left stick aims it.

### 3.2 Ships
- Ships appear at the edges of the screen and head roughly toward the harbor.
- **Lit:** a ship sees reefs within its sight radius, steers around them toward the harbor, and moves at full speed.
- **Dark:** a ship drifts. Its heading wanders by a slowly changing error, it moves at about 60% speed, and the sea current pushes it.
- After 4 seconds in the dark, a ship shows a "lost" marker.
- Ships reach the harbor by entering the harbor zone. Some levels have several harbors, and ships are colored by destination.
- Ships that touch a reef or a hazard **wreck**.

### 3.3 Reefs and memory
- Reefs are visible only while lit. After the light leaves, a faint outline remains for a few seconds ("reef memory"); difficulty changes how long.
- Reefs are placed by hand in level data, with optional random clusters in endless mode.

### 3.4 Abilities (unlocked through the campaign)
- **Foghorn:** tap the horn button. For 3 seconds, every ship within 140 units slows to 40% speed. It has a cooldown.
- **Flare:** tap the flare button. The whole map lights up for 1.5 seconds. Limited charges per level.
- **Bell buoys:** bought permanently for a region and placed on reefs between levels. They light a small area.
- **Second lamp** (Archipelago only): a second lighthouse. Tap its icon to switch control between the two. The lamp you aren't controlling keeps slowly sweeping on its own.

### 3.5 Win and lose
- A level has a ship count. When every ship is either home or wrecked, the level ends.
- **Fail** happens if wrecks go past the allowance for the difficulty, or if a "precious" ship (ferry) wrecks.
- **Stars:** ★ finish the level; ★★ wrecks ≤ 1; ★★★ no wrecks **and** the level's bonus objective (for example "guide 3 ships home within 10 seconds of each other" or "never use the flare").

## 4. Progression
- **Campaign:** 5 regions × 6 levels = 30 levels (details in CONTENT.md). Each region introduces one new mechanic and ends with a "storm night" finale.
- **Unlocks:** finishing a region's level 6 unlocks the next region. Total stars unlock cosmetic lighthouse skins.
- **Coins** come from saved ships and star bonuses. They're spent in the **Harbor** on permanent upgrades (lens, lamp, gears, foghorn, flare charges, buoys).
- **The island grows:** each finished region adds a visible building to the island (cottage, dock, chapel, market, festival lights). This is the long-term reward.
- **Keeper's logbook:** a short, warm diary entry unlocks after each region, telling the story of the keeper and the town. It also lists the ship types and hazards discovered.

## 5. Game modes
1. **Campaign:** described above.
2. **Endless watch:** unlocked after region 1. The traffic rises steadily, reefs appear at random from a seed, and a high score is saved. A **daily seed** gives everyone the same sea for that day (stored locally only for now).
3. **Free sail** (optional, nice to have): no fail state, chosen ship mix, for relaxing.

## 6. Difficulty
Chosen on first play and changeable in Settings: **Calm**, **Keeper** (default), **Storm**. Difficulty changes the multipliers in CONTENT.md §5. The campaign remembers the best star count per difficulty.

## 7. Onboarding
Level 1-1 is the tutorial, with the controls taught in context:
1. One ship, already lit, sails home. Prompt: "Ships follow your light."
2. The beam is moved away for you, the second ship drifts. Prompt: "Drag to swing the beam."
3. A reef is revealed. Prompt: "Lit ships see the rocks."
4. Two ships at once. No prompt. The player learns to share the light.
Prompts appear only when needed and never block play for more than about 2 seconds.

## 8. Feel targets
- Beam motion is smooth with a slight heavy momentum (ease out as it nears the target).
- Saving a ship: a warm chime, a ring on the water, the coin count pops up.
- A wreck: a dull crack, splinters, a short low rumble, a slight camera shake (off when reduced motion is on), and a sad bell from shore.
- Night ends: the dawn transition, a sky gradient sweeping from navy to soft rose over 2 seconds.

## 9. Out of scope for version 1.0
Accounts, online leaderboards, in-app purchases, ads, multiplayer, more languages than English (but the strings are ready for them).
