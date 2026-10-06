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
- Never write real politicians' names, party names/slogans, or any character→person mapping anywhere (code, content, commits, prompts, tests).
- Contender choice never leaves the device before chunk C11 consent.
- Every behaviour change ships with a test.

## End of every session
1. `pnpm verify` green.
2. Update `docs/STATUS.md` (done / next / blockers / gotchas).
3. One line in `docs/CHANGELOG.md`. Commit: `feat(cxx): …` (Conventional Commits).
