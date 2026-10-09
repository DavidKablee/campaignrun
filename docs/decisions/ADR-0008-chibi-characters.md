# ADR-0008: Chibi proportions, baked-face toon characters

## Context
C02–C11 built characters at realistic adult proportions (~7.2 heads tall) from 15+ overlapping
raw primitives (spheres/boxes) per face, with a flat 2-step toon gradient and no outline. On a
real phone this reads as lumpy and uncanny: primitive-only geometry chasing realism shows every
seam. The reference bar (Lagos Run, Lagos Life, Subway Surfers, Temple Run) all use deliberately
stylised, simplified character silhouettes, not realism.

## Decision
- **Proportions:** chibi, ~4.2–4.6 heads tall. Bigger head, simplified torso/limb block count.
  Fewer, bigger, more deliberate primitives per body part (not 15+ overlapping spheres).
- **Face:** generated as a single **baked 2D canvas texture**, deterministic per `CharacterLook`
  (skin, face width/jaw/eye/brow/nose/lips, hair), UV-mapped onto one smooth head mesh — replacing
  10+ overlapping primitive face parts (cranium/jaw/cheeks/ears/eyes/brows/nose/lips). This is the
  same baking technique already proven for `shopTexture`/`facadeTexture` in `textures.ts`.
- **Shading:** toon material gets a multi-step (4–5 step) gradient map instead of 2, plus a cheap
  inverted-hull outline (duplicate mesh, `BackSide`, slight scale-up, solid dark color) — no
  full-screen post-processing pass, near-zero extra mobile cost.
- `CharacterLook` / `OutfitChoice` schemas in `packages/content` are reused as-is. No content
  schema changes.

## Consequences
- Fewer verts/draws per character (good for crowds of followers).
- `CharacterRig` interface (`group`, `body`, `parts`, `geometries`) stays stable so
  `GameRenderer.ts` and `poseCharacter` call sites don't need to change — only `character.ts`
  internals change.
- The resemblance-test rule from ADR-0007 still applies to the new look: stylisation makes
  likeness to any real person even less likely, not more.
