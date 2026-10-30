# Campaign Run — Agent Rules

## Start of every session
1. Read `docs/STATUS.md`, then the brief for the current chunk in `docs/chunks/`.
2. Read `docs/GUARDRAILS.md`. These are non-negotiable.
3. Run `pnpm verify`. If it fails before you change anything, fix that first.

## Rules
- Work ONLY on the current chunk. Anything else → append to `docs/BACKLOG.md`.
- `packages/sim` is pure and deterministic: integers only in state, no `Math.random`, `Date`, `performance`, `DOM`, `Pixi`, `Three` or transcendental `Math.*` (lint-enforced).
- The renderer reads sim state, never writes it.
- All tunable numbers live in `packages/content` JSON, never inline.
- Parody names are allowed. They must be original jokes about a role (a market queen, a fixer, a teacher), not a person.
- Never write a real politician's name, nickname, party name, party slogan, or any character→person mapping anywhere (code, content, commits, prompts, tests).
- A Contender's name, face, outfit, and prop must not be close to a real person: no phonetic echo of a real name, no signature look, no face described so someone would name the same real person. If a name or face is that close, change it.
- Contender choice never leaves the device before chunk C11 consent.
- Every behaviour change ships with a test.

## End of every session
1. `pnpm verify` green.
2. Update `docs/STATUS.md` (done / next / blockers / gotchas).
3. One line in `docs/CHANGELOG.md`. Commit: `feat(cxx): …` (Conventional Commits).

## Words (C85)

One player-facing word per idea. **Crowd** is the score of a run (never "Turnout"). **Supporters** are the people on the bus (the HUD shows them as "Aboard"). **Following** is the ride-unlock and Mobilise currency (code name `following`). Result tiers read **Small / Packed / Overflowing** (ids stay `foothold` / `majority` / `landslide`). `apps/game/test/vocabulary.test.ts` guards the first and last.
