# Status

**Current chunk:** C33 done. Both earlier tracks (C20–C25 visual, C26–C30 content/gameplay) remain complete; C31–C33 are a corrective run on top of them. Next: a real-device playtest (now owed by three tracks), or the backend-dependent backlog.
**Last done:** C33 — "closer to 3D and cleaner". The flatness was lighting: `MeshToonMaterial` ramps a directional light's `dot(N, L)` but hemisphere light is *not* ramped, so the hemisphere value is a hard floor under every surface — at 1.25 (studio) and 1.35 (world) the floor alone already saturated the ramp's top step and nothing in the game could have a shadow side. Rebalanced both rigs, added shadow maps + contact shadows to the studio and the portrait bakes, and fixed the silhouette: arms sat *inside* the torso (so same-coloured tops rendered a character with no arms), the head was sunk into the chest to the chin, and all three newly-exercised headwear pieces were far wider than the head. See `docs/chunks/C33.md`.
**Before that:** C32 — the Contender picker rendered six blank palette gradients. Three stacked pre-existing bugs: the portrait camera used pre-chibi eye heights (C21 moved `HEAD_Y` to 0.93, the camera still aimed at ~1.46), `headtie` was built from a full sphere that depth-occluded the face plate, and the hero slot centre-cropped to the torso because a percentage height had no definite parent. Portrait framing is now measured from the rig's bounding box rather than assumed. See `docs/chunks/C32.md`.
**Earlier:** C31 — roster names returned to the original fiction of spec v3 section 4.2 (Mama Ankara, Engineer Spark, Captain Kobo, Sister Beacon, Uncle Boombox, Madam Metronome). The shipped names were shortened phonetic echoes, which guardrail 3 forbids outright. Also seeded the hashed blocklist, which had shipped empty — guardrail 12 could never fire. See `docs/chunks/C31.md`.

## Status of C0–C19 (read this before touching either range)
- **C0–C11: built and tested, breadth gap closing.** `pnpm verify` is green and the mechanics (sim, contender/ride/state loading, accounts/consent) behave correctly for what they cover. Rides: all 7 are now playable as of C26 (was Trek/Okada only). States: 9 have real content packs as of C27 (Lagos, Kano, Rivers, Anambra, Kaduna, Oyo, Borno, Delta, Kwara); 27 remain schema-ready stubs — a later-session task, same pattern each time (research + author matching `stateSchema`, `import.meta.glob` already picks it up with zero code change).
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
- **C27:** state pack batch 2 (Oyo/Borno/Delta/Kwara), researched content, matches the 2 Nov calendar week. See `docs/chunks/C27.md`.
- **C28:** 5 remaining Integrity events + core Rival Convoys (client-side slice of C16). See `docs/chunks/C28.md`.
- **C29:** local ghost record/playback (client-side slice of C12). See `docs/chunks/C29.md`.
- **C30:** weather & time-of-day — NEPA, harmattan, rainy season, Rally Saturday ×2 Crowd (real multiplier, tested). See `docs/chunks/C30.md`. **Content/gameplay track complete.**
- **C31 (corrective):** roster back to original fictional names; blocklist seeded + test so it cannot silently empty again. See `docs/chunks/C31.md`.
- **C32 (corrective):** Contender portraits actually render — camera framing measured from the rig, `headtie` no longer occludes the face, hero shows the signature prop. See `docs/chunks/C32.md`.
- **C33 (corrective):** lighting rebalanced so the toon ramp can band, shadow maps on the character screens, silhouette and headwear rebuilt, shared portrait WebGL context. See `docs/chunks/C33.md`.

## Next
1. **Owed from both tracks, same root cause:** a real phone / throttled-CPU playtest. Every check across C20–C30 was via browser-preview emulation (desktop + mobile viewport simulation) — never an actual device. Checklist: `docs/PLAYTEST.md` ("Visual & feel rebuild QA"), plus specifically seeing the C28 rival/Integrity entities, C29's ghost, and C30's night/NEPA/harmattan/rainy moods in motion (none of those were ever actually screen-rendered this session — all verified through tests + live-browser module/logic checks instead, see each chunk's "Open" section).
2. Optional follow-ups noted as deferred-not-dropped: CC0 buildings integration, sidewalk/curb decals, LOD on far chunk slots (C23); Contest a Venue / Face-off / Peace Salute, the 3 situational rival interactions (C28); Lighthouse run (needs an HTTPS deploy).
3. 27 states still need content packs (C27's pattern repeats).
4. Backend-dependent backlog: the server-verification half of C12, the ads/sponsor half of C16, the live-ops half of C18, plus C13/C14/C15/C17/C19 in full — all wait on hosting + payment-provider accounts only the user can create.

## Later (backend-dependent backlog, untouched by either rebuild track)
Server replay verification, friends/teams, community Rally Map (C14), payments ledger, ads/sponsors, live-ops, finale.

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
- **Weather (C30):** the real clock is read exactly once, in `App.tsx` right next to the run's `seed`, via `computeWeather()` in `apps/game/src/weather.ts`. Never add a `Date`/`Math.random` call anywhere else for weather/time-of-day — pass the result through props instead, same as every other run-start decision.
- A long edit session can leave the running `pnpm dev` server's Vite HMR state stuck showing a stale error even after the on-disk files are fixed (seen once in C30, around a content-schema change) — if the console shows an error that a fresh `pnpm build` doesn't reproduce, restart the dev server (`preview_stop` + `preview_start`) before assuming it's real.
- **Node 22 required.** `pnpm verify`'s `content:lint` step uses `node --experimental-strip-types`; on Node 20 it fails with "bad option" before any content is checked. nvm has v22.23.1 — `export PATH="$HOME/.nvm/versions/node/v22.23.1/bin:$PATH"`. Worth an `.nvmrc`.
- **Portrait framing is measured, not hard-coded (C32).** `renderPortraits` derives its camera from `Box3.setFromObject(rig)`. Do not reintroduce literal eye heights — that is exactly what broke when C21 changed proportions. The `StudioScene` camera still uses a literal `0.92`; if proportions change again, check it too.
- **Headwear is newly exercised (C31/C32).** Before C31 every Contender had `headwear: none` and `prop: none`, so `headtie`/`hardhat`/`sailor`/`headphones` and the `fan`/`wrench`/`lantern`/`speaker` props had never actually rendered. `headtie` turned out to be broken. The remaining untested values in the schema are `cap`, and the outfit options players can pick in the studio.
- **Port 5173 may belong to another project.** `.claude/launch.json` has a `game-alt` entry on 5174 for when it does; `preview_start` will move again (to 5175) if 5174 is taken too.
- **Hemisphere light is not put through the toon ramp (C33).** It is a flat floor under every surface, so raising it does not brighten a scene — it *flattens* it, by pushing everything onto the ramp's top step. Day/night intensities live in named constants at the top of `world.ts`; `addLights` in `studio.ts` serves the studio and the portrait bakes. If the art ever looks washed out, check the hemisphere value before anything else.
- **Shadow maps are on the character screens only (C33).** The gameplay world still uses `blobShadow`. `patchBend` displaces vertices in the vertex shader and that patch is *not* applied to three's depth material, so any world shadow map would misalign with the road curve until the bend is patched into a custom depth material.
- **Outline shells must stay out of the shadow pass.** They are BackSide copies of the same geometry; letting them cast thickens and offsets every shadow. `castShadows()` in `studio.ts` skips anything using `outlineMat()`.
- **`PCFSoftShadowMap` was removed in three 0.186** and silently falls back to `PCFShadowMap` with a console warning. Set the type explicitly.
- **One shared WebGL context for portrait bakes (C33).** `renderPortraits` used to create and destroy a renderer per call, and the picker calls it twice in the same tick — past the browser's live-context cap (commonly 16) the oldest is dropped and the bake silently produces nothing, which looks exactly like the C32 blank-cards bug. Do not go back to a per-call renderer.
- **Character radii are related, not independent (C33).** Chest-level clothing radii must stay under `ARM_X` or they swallow the arms; outer layers use `LAYER_Z` so they stay proud of the chest in depth too. `apps/game/test/silhouette.test.ts` guards the invariants.
