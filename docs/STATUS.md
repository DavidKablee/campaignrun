# Status

**Current chunk:** C08 done. Next: C09 (Daily challenge, share card and offline shell).
**Last done:** Local-only meta loop: Starting Stories, Convoy Yard, five capped upgrades, WAT daily donation and mission progress, streak/freeze state, versioned local save, and reward breakdowns.

## Done
- Agent handoff (`AGENTS.md` pointers, ADRs, chunks C00–C19, SPEC/ARCHITECTURE/DESIGN/PLAYTEST).
- Real `pnpm verify` (size-check, content-lint, sim purity).
- Sim v2: course, zones, pickup/unload, Momentum, Full House, On Beat, 3-Dent, edge-triggered lanes.
- Three.js renderer: recycling 40 m Lagos chunks for the whole course, themed segments, merged characters and blockades.
- Character studio (turntable, top / trousers / footwear / headwear) then a Lagos briefing. Outfit stays in localStorage.
- Softer procedural audio (no sawtooth drone). Full-page layout, landscape controls.
- C04: Following counter (local), Okada at 150, Keke+ listed but not selectable. Stars scale with ride capacity.
- Campaign map lists all 37 states. Lagos is playable now. Later states show their Monday unlock. Best Crowd stays on this device.
- HUD shows the current from → to landmark. Èkó Wave is the Lagos station. Other stations stay silent until that zone opens. Music is synthesised; nothing is streamed.

## Next
1. Phone playtest per `docs/PLAYTEST.md`.
2. C09 — Daily challenge, share card and offline shell.

## Blockers
- Legal: media-law review + ToS/Privacy before R0 (not code).

## Gotchas
- Default ride is **trek**. Okada unlocks at 150 Following. `playable: false` rides stay in `rides.json` until a later chunk.
- Characters are rigs in `render/character.ts`, not indexed children.
- Sim mm → world via `MM_TO_UNITS` (0.001) only. Road bend is renderer-only (`bend` uniforms).
- Hop clears obstacles with `heightMm` < `hopHeightMm` (1500): pothole, cones, tyres, barricade, jersey. Cars, danfo, trailer, roadworks are solid.
- Parody names are allowed. Names and faces must not be close to a real person. See AGENTS.md and ADR-0007. The roster is Baba Bullabaa, Mr Tiko, Mr Obiliki, Comrade Yale, Mr. Don, and Prof. Sarah.
- The community Rally Map (other players, 200 rallies) is still C14. The map in the game is this device's trail only.
- Contender choice stays in localStorage until C11.
- E2E: `pnpm test:e2e` (needs Chromium via `PLAYWRIGHT_BROWSERS_PATH=0 playwright install chromium`). Not part of `pnpm verify`.
- State-pack loader registration is intentionally data-only; add a new pack via `packages/content/data/states/` and `packages/content/src/state-packs.ts`, then keep it under the 3 MB gzip budget.
- C08 economy is local-only until C15. Device clock changes can affect WAT daily systems; no map points or payments use it.

## Session note (splash)
- Splash is now a live 3D Lagos hero (render/showcase.ts, autopilot, 30 fps, private sim copy). Returning players get Continue campaign. Reference platform: Lagos Run (3D runner) and Lagos Life; differentiators are in the C03 plan (crowd on ride, adaptive music, Todays Road, WhatsApp 9:16 share card, offline).
- Gotcha: animate CTAs with box-shadow, not transform (Playwright stability). e2e desktop passes.
- Next still C05. Many earlier files are uncommitted in the working tree.
