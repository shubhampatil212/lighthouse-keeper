/** The logbook (diary, ships, hazards, records), briefing lines and "new tonight" text. */
import type { RegionId, ShipTypeId } from '../../data/types';
import type { IntroId, SeaFeatureId } from '../../data/uiTypes';

/** The harbor master's line for each night. */
const BRIEFINGS: Readonly<Record<string, string>> = {
  '1-1': 'Evening, keeper. A few boats out tonight. Show them the way in, that’s all.',
  '1-2': 'Two cargo ships due. Slow old tubs: they need room to turn.',
  '1-3': 'They’re coming in pairs tonight, from both sides at once.',
  '1-4': 'Breeze off the shore. The sailboats will feel it most.',
  '1-5': 'Market day tomorrow. Everyone wants in before dawn.',
  '1-6': 'Storm clouds over the bay. Keep every ship off the rocks.',
  '2-1': 'They’re coming down from the north in threes. The horn will hold them back.',
  '2-2': 'The bergs are moving. A rock that drifts is still a rock.',
  '2-3': 'The ferry runs tonight. Forty souls aboard. Don’t lose her.',
  '2-4': 'A white wall out east. Your beam will fall short inside it.',
  '2-5': 'Calving season. More ice than water, some nights.',
  '2-6': 'The longest dark of the year. Wrap up warm, keeper.',
  '3-1': 'Lightning on the strait. Use the flash to see what’s out there.',
  '3-2': 'Tugs are working tonight. Light them, and they’ll steady the others.',
  '3-3': 'The maelstrom has woken. Keep ships lit near it, or it takes them.',
  '3-4': 'Crosswaves tonight. Every hull gets shoved, lit or not.',
  '3-5': 'Everything the strait can throw at us. No rest tonight.',
  '3-6': 'The great storm. If we see dawn, we’ll have earned it.',
  '4-1': 'Boats without lanterns in the cove. Hold them in the light.',
  '4-2': 'Word is there’s contraband aboard. Catch every smuggler.',
  '4-3': 'Black sails sighted. Pirates hate the light; use it.',
  '4-4': 'The ferry has to pass the pirate’s water. Stay close to her.',
  '4-5': 'No moon tonight. The lamp feels smaller, somehow.',
  '4-6': 'The pirate king himself, and his mate. Drive them off.',
  '5-1': 'A second tower stands on the islet. Two lamps, one keeper.',
  '5-2': 'Red sails to one harbor, blue to the other. They trust you.',
  '5-3': 'Ships hopping between the islands. Watch the narrow channels.',
  '5-4': 'Festival night. Every boat in the islands is out.',
  '5-5': 'Everything at once. You’ve seen it all; now see it together.',
  '5-6': 'Thirty ships, the longest night. The whole coast is watching.',
};

export const LOGBOOK = {
  briefingLine: (levelId: string) => BRIEFINGS[levelId] ?? 'Keep the light moving, keeper.',

  intro: {
    fishing: { name: 'Fishing boat', line: 'Quick and small. The town’s bread and butter.' },
    cargo: { name: 'Cargo ship', line: 'Slow to turn: it needs a wider path around reefs.' },
    sailboat: { name: 'Sailboat', line: 'The wind pushes it hard while it’s in the dark.' },
    ferry: { name: 'Ferry', line: 'Precious. If it sinks, the night is lost.' },
    tugboat: { name: 'Tugboat', line: 'While lit, it slows the dark ships near it.' },
    smuggler: {
      name: 'Smuggler',
      line: 'Turns away from light. Hold it lit for 2 seconds to catch it.',
    },
    pirate: { name: 'Pirate ship', line: 'Hunts ships in the dark. Light drives it away.' },
    reef: { name: 'Reef', line: 'Only seen in the light. Lit ships steer around it.' },
    current: { name: 'Current', line: 'Pushes ships that sail in the dark.' },
    fogBand: { name: 'Fog band', line: 'Your beam reaches less far through it.' },
    iceberg: { name: 'Iceberg', line: 'A reef that drifts. Ships must not sail into it.' },
    lightning: {
      name: 'Lightning',
      line: 'Lights the whole sea for a moment, after a warning glow.',
    },
    stormWaves: { name: 'Storm waves', line: 'Shove every ship, lit or not.' },
    whirlpool: { name: 'Whirlpool', line: 'Pulls ships in. Its center sinks them.' },
    secondHarbor: {
      name: 'Second harbor',
      line: 'Ships carry a color: each sails for its own harbor.',
    },
    foghorn: { name: 'Foghorn', line: 'Tap the horn to slow every ship near the island.' },
    flares: { name: 'Flares', line: 'Tap the flare to light the whole sea for a moment.' },
    secondLamp: { name: 'Second lamp', line: 'Tap to switch lamps. The other sweeps on its own.' },
    pairs: { name: 'Pairs', line: 'Ships arrive two at a time, from opposite sides.' },
    rush: { name: 'Rush', line: 'Ships come faster than before.' },
    finale: { name: 'Storm night', line: 'Everything this sea has taught you, all at once.' },
  } satisfies Record<IntroId, { name: string; line: string }>,

  logDetail: {
    fishing: 'Small, quick and everywhere. Fishing boats follow your light without fuss.',
    cargo:
      'Heavy and slow to turn. Light a cargo ship early, so it has room to swing around the rocks.',
    sailboat: 'Light and lively. In the dark the wind and current push it half as hard again.',
    ferry: 'Carries the town’s families. Losing a ferry ends the night at once.',
    tugboat:
      'A working boat. While you light it, it slows the dark ships close by, buying you time.',
    smuggler:
      'Sails without a proper lantern and turns away from light. Two seconds of steady light and the coast guard takes it. It never wrecks.',
    pirate:
      'Prowls for ships in the dark and boards them after a short chase. Light makes it flee for a while.',
    reef: 'Clusters of rock, seen only in the light. A faint outline stays for a moment after.',
    current: 'A steady drift across the sea. Only ships in the dark are carried by it.',
    fogBand: 'Thick bands of fog. Your beam reaches about a third less far through them.',
    iceberg:
      'Drifting ice, wide and slow. A ship sailing head-on into it sinks; a glancing one is shoved aside.',
    lightning: 'Every so often the whole sea flashes white. A glow warns you a second before.',
    stormWaves: 'Big waves push every ship one way, then change direction every ten seconds.',
    whirlpool: 'Pulls nearby ships toward its center, which sinks them. Lit ships steer around it.',
    secondHarbor:
      'Two harbors, two colors. Each ship carries the color of the harbor it’s bound for.',
  } satisfies Record<ShipTypeId | SeaFeatureId, string>,

  logbookTitle: 'Logbook',
  logDiary: 'Diary',
  logShips: 'Ships',
  logHazards: 'Hazards',
  logRecords: 'Records',
  logUnknown: 'Not yet seen',
  logUnknownLine: 'Keep the watch and you’ll meet it.',
  diaryLockedTitle: 'A blank page',
  diaryLocked: (region: string) => `Finish ${region} to write this page.`,
  recordStars: (difficulty: string) => `Stars on ${difficulty}`,
  recordEndless: 'Best endless watch',
  recordSaved: 'Ships brought home',
  recordNone: 'Not yet',

  diary: {
    harborBay: {
      title: 'The first lamp',
      text: [
        'The old keeper left me his oilcan, a chipped mug and one rule: the light never sleeps. For a week I swung the beam too fast and lost ships among the very rocks I was meant to show them.',
        'Then Mara from the fishing boats flashed her lantern at me, two long and one short, the harbor’s thank-you. I keep it in my head on the bad nights. The town brought timber today. I am to have a cottage.',
      ],
    },
    northernIce: {
      title: 'Cold glass',
      text: [
        'Frost grows on the inside of the lens up here, and I polish it with my sleeve between ships. The fog is a wall, not a veil. The horn says what the lamp can’t.',
        'Tonight the ferry came through with a choir singing below deck. I heard them over the ice long before I saw a light. The fishermen are building me a proper dock, so the supply boat can stop rowing.',
      ],
    },
    stormStrait: {
      title: 'The bell',
      text: [
        'Lightning showed me the whole strait for a heartbeat: every rock, every wave, every tug straining at its rope. Then the dark came back twice as deep.',
        'I’ve stopped being afraid of the storm. It’s honest; it hides nothing for long. The chapel bell rang this morning for the first time in years. The priest says it rang for the lighthouse. I think it rang for the tug crews.',
      ],
    },
    smugglersCove: {
      title: 'Lanterns without names',
      text: [
        'Some boats here sail dark and hope I’ll look away. I don’t. The coast guard says I’ve caught more smugglers this season than their cutter has in five. The pirates I simply shine on until they lose their nerve.',
        'Most bad things hate being seen. The market opened again on the quay, and a girl sold me an orange for one coin. “For the light,” she said.',
      ],
    },
    archipelago: {
      title: 'Two lights',
      text: [
        'There’s a second tower out on the islet now, and some nights I run between the lamps like a man with two hearts. Red sails for one harbor, blue for the other.',
        'The festival came tonight. Every boat in the islands hung a lantern and sailed past my rocks in a long, slow line. For once nobody needed guiding. They had come to light me home.',
      ],
    },
  } satisfies Record<RegionId, { title: string; text: readonly string[] }>,
} as const;
