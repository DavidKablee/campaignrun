# Status

**Current chunk:** C22 done. Next: C23 (world/environment rebuild).
**Last done:** C22 — animation & movement feel: continuous speed-blended run pose (no more hard stand/run snap), eased hop tuck, landing squash-stretch + camera dip, spring-lag camera + lane-lean, retuned hit shake, speed-streak juice. Also fixed a real pre-existing bug: the okada seat offset still used the pre-C21 `HIP_Y=0.94`. See `docs/chunks/C22.md`.

## Status of C0–C19 (read this before touching either range)
- **C0–C11: built and tested, not "perfect."** `pnpm verify` is green and the mechanics (sim, contender/ride/state loading, accounts/consent) behave correctly for what they cover. Content breadth is partial by design-so-far — only Trek/Okada rides and 5 states (Lagos, Kano, Rivers, Anambra, Kaduna) have real content packs; other rides/states are schema-ready but unfilled. That's a content/gameplay scope question, not a defect, and it's explicitly out of bounds for the current visual-only pass.
- **C12–C19: not built at all.** Ghosts/replay, friends/teams, Rally Map, payments/ledger, rival convoys, ads, live-ops, FCT finale are backlog items waiting on backend infrastructure and legal review — not skipped because they're good enough, just not started. Not touched by C20–C25.

## Done
- Agent handoff (`AGENTS.md` pointers, ADRs, chunks C00–C19, SPEC/ARCHITECTURE/DESIGN/PLAYTEST).
- Real `pnpm verify` (size-check, content-lint, sim purity).
- Sim v2 + Three.js renderer + studio + radio + Live board.
- C04–C10: rides/stars, perks, Integrity, state packs, meta, share/PWA/daily, weekly packs + travel caps.
- C11: `cr-account` + `cr-contender` stores; consent log; score payloads omit Contender id without consent; Account screen (save / export / delete); versioned legal copy.
- **C20 (visual rebuild track):** CC0 asset loader/instancing pipeline, Lagos biome kit (19 models, 63 KB gzip), size-check budget, ADR-0008/0009. See `docs/chunks/C20.md`.
- **C21:** chibi character rebuild (proportions, baked face, toon outline). See `docs/chunks/C21.md`.
- **C22:** animation & movement feel (continuous run blend, hop easing, landing squash, camera spring/lean, speed streaks). See `docs/chunks/C22.md`.

## Next
1. **C23** — world/environment rebuild: replace flat painted facades with the C20 CC0 biome-kit props (instanced, palette-tinted), add sidewalk/curb + lane-paint decals (also a natural place to add the dust/skid decals deferred from C22), gradient sky, vary crowd instances via C21's character system at `'lo'` detail, LOD on far chunk slots. Phone/visual QA checkpoint after this one.
2. C24 — landing page polish. C25 — cross-cutting QA + perf hardening.
3. (Deferred, not in this track) Phone playtest of pre-existing gameplay per `docs/PLAYTEST.md`; **C12** ghosts/server verification.

## Later (C13–C19, untouched by the visual rebuild)
Running mates, community Rally Map (C14), ledger, rivals, ads, live-ops, finale.

## Blockers
- Legal: lawyer review of privacy/terms (chunk “7.5”) still required before public launch — copy is a draft gate only.
- Cloud accounts / server Contender table wait on backend.
- Lighthouse PWA ≥90 on a real HTTPS deploy still open.

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
