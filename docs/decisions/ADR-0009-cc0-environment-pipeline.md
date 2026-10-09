# ADR-0009: CC0 environment asset pipeline

## Context
`world.ts` builds buildings/shops as canvas textures painted onto flat planes — no real massing
or depth. Rebuilding a convincing 3D city by hand in Three.js code (primitives only) is slow and
was the same mistake that hurt character quality (ADR-0008). Commissioned art is out of scope
(no budget, no artist). The user approved using free, legally unencumbered low-poly asset packs
for *background environment dressing only* — explicitly not for characters, rides, or any
gameplay-critical prop, which stay original/procedural per ADR-0005/0007.

## Decision
- **Source packs:** Kenney.nl (City/Nature/street-prop kits) and Quaternius low-poly packs — both
  **CC0** (public domain, no attribution required, no cost, no licensing risk).
- **Pipeline:** source `.glb`/`.gltf` → compressed via `gltf-transform`/`gltfpack` (meshopt) →
  loaded at runtime via `GLTFLoader` + the meshopt decoder, both already bundled inside the
  installed `three` package (`three/examples/jsm/loaders/GLTFLoader.js`,
  `three/examples/jsm/libs/meshopt_decoder.module.js`) — **no new npm dependency**.
- **Loading unit:** a **biome-kit asset bundle**, one per biome (8 biomes in the spec), shared by
  every state that uses that biome. It lazy-loads exactly like an existing state JSON pack and is
  cached by the existing Workbox service worker.
- **Budget:** each biome-kit bundle ≤ **1.5 MB gzip**, never part of the first-load bundle. Repeated
  props (lamp posts, stalls, trees, barriers) are drawn via `InstancedMesh` to keep draw calls and
  triangle count inside the existing budgets (≤150 draw calls, ≤120k on-screen tris, no real-time
  shadow maps, DPR ≤ 1.5).
- Any actual file download from a pack's source site requires explicit user permission per the
  file-download policy (name, source URL, size) before fetching — this ADR authorises the
  *approach*, not a specific unapproved download.

## Consequences
- `tools/size-check.mjs` gains a `dist/models/**` budget category, counted like `states/**`
  (excluded from first load).
- `apps/game/src/render/assets.ts` becomes the single loader/cache for all environment glTF
  assets, keyed by `assetId`, with instancing helpers.
- Characters, rides (okada, danfo, etc.) and all gameplay props stay procedural/custom in
  `character.ts` / `props.ts` — unaffected by this ADR.
