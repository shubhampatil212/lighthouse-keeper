# Phase 09 — Polish, game feel & mobile

**Goal:** turn a complete game into one that feels *finished*: responsive, juicy, smooth on phones and installable.

## Read first
`docs/GDD.md` §8 (feel targets), `docs/ART_AUDIO.md` (performance budget), `docs/PROGRESS.md` (known issues).

## Tasks
1. **Feel pass:** tune the beam's easing, ship bobbing, timing of the save and wreck effects, star reveal pacing, and the button press response (scale + sound). Make a list of 10 specific improvements, apply them, and describe each in PROGRESS.md.
2. **Performance pass:** profile a busy level (5-6) on Medium quality with 4× CPU throttling. Reduce draw calls, reuse objects (pooling for particles and ships), avoid creating garbage every frame. Record the frame-time before and after in PROGRESS.md.
3. **Mobile:** stop pull-to-refresh and the page from scrolling, handle orientation changes in the middle of a level, pause on phone calls or app switching, prevent text selection and the long-press menu on the canvas.
4. **PWA:** web app manifest, icons generated in code (the lighthouse on a teal background), a service worker that caches the game so it works offline, an "Add to home screen" hint on the title screen for mobile browsers, and a fullscreen option.
5. **Loading:** a real loading screen, fonts preloaded, the first frame shown fast.
6. **Art swap slot:** document in `docs/ASSETS.md` how an artist or sound designer could replace any drawn shape or synthesized sound with real files through `ArtProvider` and the audio registry, and which sizes and formats to deliver.
7. Fix everything in "Known issues" that's possible.

## Acceptance checklist
- [ ] Installs to the home screen on Android (Chrome) and iPhone (Safari), launches fullscreen and works offline.
- [ ] 60 fps on the owner's phone in level 5-6 on Medium quality.
- [ ] Nothing on screen wobbles, jumps or flickers when the device is rotated.
- [ ] The owner says it "feels good" (if not, list what they'd change and do it).
- [ ] All checks pass and PROGRESS.md is updated.
