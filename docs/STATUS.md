# Status

**Current chunk:** C26 done. **Visual & feel rebuild track (C20–C25) is complete**; now mid-way through the **content breadth & client-side gameplay upgrade track (C26–C30)**. Next: C27 (state pack batch 2).
**Last done:** C26 — ride roster complete: Keke/Hilux/Danfo/Coaster/Grand Convoy are playable, with real mechanics behind their previously-cosmetic traits (size-class collision rules, Hilux free-hit, Danfo plough, Coaster magnet, Signature Ride +10% Crowd). Balance bot extended from trek-only to all 7 ride classes and passes. Also caught and fixed a real gap found mid-chunk: only okada had a 3D vehicle model — added the rest so newly-unlocked rides don't ship looking broken. See `docs/chunks/C26.md`.

## Status of C0–C19 (read this before touching either range)
- **C0–C11: built and tested, breadth gap closing.** `pnpm verify` is green and the mechanics (sim, contender/ride/state loading, accounts/consent) behave correctly for what they cover. Rides: all 7 are now playable as of C26 (was Trek/Okada only). States: 5 have real content packs (Lagos, Kano, Rivers, Anambra, Kaduna); 31 remain schema-ready stubs — C27 adds 4 more (Oyo, Borno, Delta, Kwara), the rest stay a later-session task.
- **C12–C19: not built at all** as originally scoped (all assume a real backend — hosting, database, and for C15 a real payment merchant account that only the user can set up). C26–C30 add **new** chunks for the genuinely client-side-only slices of C12/C16/C18 (ghosts playback, rival convoys + remaining Integrity events, weather/time-of-day) without marking the original backend-dependent chunks "done" — see each new chunk's "Open" section for exactly what's still backend-gated.

## Done
- Agent handoff (`AGENTS.md` pointers, ADRs, chunks C00–C19, SPEC/ARCHITECTURE/DESIGN/PLAYTEST).
- Real `pnpm verify` (size-check, content-lint, sim purity).
- Sim v2 + Three.js renderer + studio + radio + Live board.
- C04–C10: rides/stars, perks, Integrity, state packs, meta, share/PWA/daily, weekly packs + travel caps.
- C11: `cr-account` + `cr-contender` stores; consent log; score payloads omit Contender id without consent; Account screen (save / export / delete); versioned legal copy.
- **C20 (visual rebuild track):** CC0 asset loader/instancing pipeline, Lagos biome kit (19 models, 63 KB gzip), size-check budget, ADR-0008/0009. See `docs/chunks/C20.md`.
- **C21:** chibi character rebuild (proportions, baked face, toon outline). See `docs/chunks/C21.md`.
- **C22:** animation & movement feel (continuous run blend, hop easing, landing squash, camera spring/lean, speed streaks). See `docs/chunks/C22.md`.
- **C23:** CC0 palms (park/island) + parasols (market) + sun-glow sky. See `docs/chunks/C23.md` for what's deferred (buildings, curbs/decals, LOD).
- **C24:** `waitlist.html` rewrite (on-brand, honest copy, fixed a required-field bug). See `docs/chunks/C24.md`.
- **C25:** PWA/offline fix for CC0 model caching, regression check, final docs/budget pass. See `docs/chunks/C25.md`. **Visual track complete.**
- **C26 (content/gameplay upgrade track):** ride roster complete — all 7 rides playable with real mechanics, balance bot extended to all ride classes, missing vehicle models added. See `docs/chunks/C26.md`.

## Next
1. **C27** — state pack batch 2 (Oyo, Borno, Delta, Kwara), researched for real landmark accuracy.
2. C28 (rival convoys + remaining Integrity events), C29 (local ghost playback), C30 (weather/time-of-day) — see the plan for the C26–C30 track.
3. **Owed from the visual track:** a real phone / throttled-CPU playtest per `docs/PLAYTEST.md` ("Visual & feel rebuild QA") — everything so far was verified via browser preview emulation only.
4. Optional follow-ups noted as deferred-not-dropped in C23/C25: CC0 buildings integration, sidewalk/curb decals, LOD on far chunk slots, Lighthouse run (needs an HTTPS deploy).
5. (Separate backlog) Phone playtest of pre-existing gameplay per the original Gate-1 checklist in `docs/PLAYTEST.md`; backend-dependent halves of C12/C16/C18, plus C13/C14/C15/C17/C19 in full, all wait on hosting + payment-provider accounts only the user can create.

## Later (C13–C19, untouched by the visual rebuild)
Running mates, community Rally Map (C14), ledger, rivals, ads, live-ops, finale.

## Blockers
- Legal: lawyer review of privacy/terms (chunk “7.5”) still required before public launch — copy is a draft gate only.
- Cloud accounts / server Contender table wait on backend.
- Lighthouse PWA ≥90 on a real HTTPS deploy still open.
- **Visual rebuild track (C20–C25):** no real phone / throttled-CPU device has touched any of this work yet — every check this session was via browser-preview emulation (desktop + mobile viewport). The emulation environment's `requestAnimationFrame` throttling made its own fps readouts meaningless, so draw-call/triangle counts were used as the performance proxy instead. Run `docs/PLAYTEST.md`'s "Visual & feel rebuild QA" checklist on an actual device before treating this as launch-ready.

## Gotchas
- Contender choice is in `cr-contender`, not `cr-storage`. Score/share paths must check consent.
- Default ride is **trek**. Okada unlocks at 150 Following.
- Drop new state JSON under `packages/content/data/states/` — no loader edit.
- Community Rally Map is C14. Live board + local board are this device only.
- E2E: `pnpm test:e2e` (not part of `pnpm verify`).
- Animate CTAs with box-shadow, not transform (Playwright).
- **Visual rebuild (C20+):** environment glTF assets live under `apps/game/public/models/<biome>/`, loaded via `apps/game/src/render/assets.ts` (`loadAsset`/`preloadBiome`/`buildInstancedProp`). CC0 only (Kenney so far); characters/rides/gameplay props stay procedural (character.ts/props.ts) per ADR-0005/0007/0008 — never replace those with CC0 packs.
- `pnpm --filter @cr/game dev` → `/debug-assets.html` is a dev-only asset-pipeline sanity page (not built into `dist`). Useful for checking a new biome kit loads before wiring it into `world.ts`. Add `?face=1` for a close-up character/face view (light background, no world) — useful for any future `character.ts` work.
- Flat decal meshes mounted on curved geometry (e.g. the face plate on the cranium sphere) must clear the parent surface at every covered point, not just at the decal's own center, or the parent occludes the decal's middle. Custom vertex-shader patches that need a normal should use the raw `normal` attribute, not `objectNormal` (only declared under `USE_ENVMAP`/`USE_SKINNING`) — see `docs/chunks/C21.md`.
- `.claude/launch.json` (both at repo root and at the Claude Code primary-working-directory root) configures `preview_start` for the game dev server on port 5173.
