# Gate 1 playtest

## Setup

```bash
pnpm install
pnpm verify   # must be green
pnpm dev      # open LAN URL on phone
```

## Checklist

1. Splash shows disclosure + **Run my race** (one tap).
2. Roster: six Contenders with distinct colours/props; pick one.
3. One-thumb: swipe lanes, flick hop, hold Gas/Brake.
4. Brake in glowing Pickup Zone ~1 s → supporters load; capacity clamps.
5. Brake at Rally Venue → Crowd increases; Full House / On Beat toasts if earned.
6. Hit → dent icon fills, ~25% supporters peel off, slowdown; 3 dents → breakdown → Result.
7. Finish line → Result with Crowd (delivered, not carried).
8. Feels ≥ 30 fps on your older Android; data-saver if needed.
9. Kill switch: set `apps/game/public/flags.json` `"killSwitch": true` → Back soon.

## Visual & feel rebuild QA (C20–C25, do this before closing the track)

Everything below was checked in-browser (Claude Preview, desktop + mobile viewport emulation) during C20–C24 — this device never got a real phone/throttled-CPU pass. Re-run on an actual phone before calling the track done:

1. Characters: no visible seams/lumps on any of the 6 Contenders + outfit combos (chibi body + baked face + toon outline — `character.ts`, ADR-0008). Crowd/followers (`'lo'` detail) look clean at a distance, no textured-face artifacts.
2. Movement: running eases in/out with speed (no snap at a speed threshold), hop tuck blends, landing has a visible squash, camera has a little lag/lean on turns — not robotic (`GameRenderer.ts`, C22).
3. World: palm trees on `park`/`island` themes and parasols on `market` stalls are the real CC0 models, not the old primitive shapes (`world.ts`, C23). Use `/debug-assets.html?theme=park|island|market` to jump straight there without surviving a full run.
4. Frame rate: ≥ 30 fps on an actual low-end/throttled Android in all of the above — the only budget numbers verified so far are draw-calls/triangles (via `/debug-assets.html?theme=…`'s stats line), not real device fps, because the automated preview environment throttles `requestAnimationFrame` and its own fps readout is unreliable.
5. `apps/game/waitlist.html` — on-brand, disclosure visible, Play-now CTA works (C24).
6. Offline: after one visit to a theme with CC0 props, go offline and revisit — models should load from the `cr-biome-models` cache (`vite.config.ts` runtimeCaching), not fail.

## Tune here (JSON only)

| Feel | File / key |
|------|------------|
| Lane change speed | `sim.json` `laneChangeMmPerTick` |
| Hop | `hopTicks`, `hopHeightMm` |
| Speeds | `baseSpeedUm`, `maxSpeedUm`, accel/brake |
| Load window | `zones.loadTicks`, `zones.brakeSpeedUm` |
| Momentum | `momentum.*` |
| Spawn gaps | `spawn.gapMinMm` / `gapMaxMm` |

## Real-device run — Samsung Galaxy A16 (SM-A165F), 2026-10-28

Chrome on the phone, driven over USB debugging (adb port-forward + Playwright `connectOverCDP`, real touch events through Chrome's input pipeline, Vite dev server over Wi-Fi). Viewport 384×693 CSS px at DPR 2.81 (aspect 0.55), 90 Hz display.

- **Framing:** the rider stays at the middle of the screen (NDC x ≈ 0.0–0.1) in every lane; the road edge shifts to show which lane it is in. Before C63 the camera lost the rider for ~40–50% of a run on a tall phone.
- **Frame rate:** 87–90 fps in Lagos, Kano, Ogun and Enugu with the renderer at dpr 1.5; p50 11.1 ms, p99 ~22 ms, one ~78 ms hitch per 14 s run and 4–8 frames over 33 ms. Draws 65–107, tris 45–68k. No change needed on this phone.
- **Gestures (real touch):** quick flick = one lane; press-and-wait then flick works; one long swipe = one lane; a diagonal that is mostly sideways changes lane and does not brake; a held downward push brakes (speed 268 → 70) and releases; flick up hops.
- **Phone behaviour:** Back pauses and stays on the page; Home pauses; the pause survives returning to the app.
- **Found and fixed during the test:** the new Back sentinel fired a spurious popstate under React's dev double-effect and paused the run at start (also reachable whenever the run effect re-ran); it is now one reused history entry, unwound after a deferred check.
- **Not covered:** a full 2 km run by hand, Samsung Internet, iPhone/Safari, throttled or low-end phones, thumb comfort over a long session, audio after backgrounding. The swipe numbers come from synthetic strokes, so a human thumb's feel still needs your judgement.

