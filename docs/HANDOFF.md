# Campaign Run — Agent Handoff Brief
*Generated for Gemini 3.1 Pro*

## 1. Project Context & Current State
Campaign Run is a stylized, lane-based 3D runner with a light social/economy layer, built as a pnpm monorepo.

**Current Chunk Phase:** **C05 (Contender Perks & Balance)**
**Completed so far:** C00 (Foundations), C01 (Sim Core), C02 (State/Audio), C03 (3D Rendering), C04 (React UI, Map, Live 3D Splash).

The architecture is split into three main workspaces:
- `packages/content`: Pure data layer. Zod schemas, JSON content files (Contenders, rides, calendar), and guardrail linter (hashed blocklist).
- `packages/sim`: **100% pure, deterministic integer simulation.** Runs at 60Hz. It has zero side-effects. Uses `sfc32` RNG, fixed-point math, and delta-encoded inputs.
- `apps/game`: Vite + React + Three.js + Zustand + Web Audio. Renders the 2D sim state into a low-poly 3D world. Includes a 3D animated splash screen, campaign map, and state routing.

## 2. Non-Negotiable Rules (The Guardrails)
Any agent touching this codebase MUST adhere to these rules:
1. **Sim Purity**: `packages/sim` is strictly pure and deterministic. **NO** `Math.random()`, `Date`, `performance`, or floating-point state calculations. ESLint enforces this.
2. **One Command to Rule Them All**: `pnpm verify` must be green before marking any chunk as done. This runs `typecheck`, `lint`, `test` (determinism checks), `content:lint`, `build`, and `size:check`.
3. **Satirical, Not Real**: Never write real politicians' names, party names, or direct mappings. The game is strictly fictional. Enforcement is done via SHA-256 hashed blocklists in `content:lint`.
4. **Renderer is Read-Only**: The Three.js renderer reads the sim state but NEVER writes to it.
5. **No Inline Tunables**: All numbers live in `packages/content` JSONs, not inline code.

## 3. What to Build Next: Chunk C05 (Contender Perks & Balance)
**Goal:** Implement contender-specific perks inside the deterministic simulation and write a "Balance Bot" to prove all 6 contenders have an equal statistical chance over 10,000 runs.

**Immediate Tasks for Gemini 3.1 Pro:**
1. Read `docs/chunks/C05.md` (create it if missing) to understand the perk mechanics (e.g., Magnet, Shield, Double Jump).
2. Update `packages/sim/src/step.ts` to actively read the selected `activeContenderId`'s perk and modify the physics/pickup logic accordingly during the step.
3. Write the **10k Balance Bot** test script in `packages/sim/test/balance.test.ts`. It should run 10,000 headless simulated runs for all 6 contenders to ensure their average crowd scores are within a tight margin of each other (proving no single contender is "pay-to-win" or statistically superior).
4. Run `pnpm verify` to ensure the sim remains deterministic and all lint rules pass.

## 4. Technical Gotchas to Remember
- The default ride is `trek`. "Okada" unlocks at 150 Following.
- Distance (Z) and positions (X) in `packages/sim` are stored in integer millimeters. The renderer converts these to units using `MM_TO_UNITS` (0.001).
- 3-Dent Breakdown: A hit drops ~25% of carried supporters and adds a dent. 3 dents = run over (breakdown).
- The "Hop" mechanic (Up arrow) clears obstacles with `heightMm < hopHeightMm` (1500). Taller obstacles (Danfo, barriers) are solid walls.
- Animate UI calls-to-action using `box-shadow`, NOT `transform` (to maintain Playwright e2e stability).
