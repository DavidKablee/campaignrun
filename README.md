# Campaign Run

A fictional, lane-based 3D campaign runner. pnpm monorepo: a pure deterministic
simulation, a JSON content layer, and a Vite + React + Three.js client.


## Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node | **>= 22** | `pnpm dev` tolerates Node 20, but `pnpm verify` does not — see [Node version](#node-version). |
| pnpm | 10.30.3 | Pinned via `packageManager` in `package.json`. Use `corepack enable` to honour it. |

## Run it

```bash
pnpm install
pnpm dev
```

Vite prints the URL — by default `http://localhost:5173/`. Open it and the splash
screen loads (18+ gate, then roster → studio → briefing → run).

### If port 5173 is busy

`pnpm dev` does **not** fail on a taken port, because `apps/game/vite.config.ts`
sets `server: { host: true }`, which binds `0.0.0.0`. Another dev server bound only
to IPv6 `::1:5173` will coexist with it, and `localhost:5173` then resolves to
whichever of the two your OS picks — so you can silently end up looking at a
different app.

Pick an explicit port instead. The `--port` flag has to reach Vite, not pnpm, so
use `exec`:

```bash
pnpm --filter @cr/game exec vite --port 5180 --strictPort
```

`--strictPort` makes a clash an error rather than a silent fallback. Confirm you
have the right app:

```bash
curl -s http://localhost:5180/ | grep '<title>'   # => <title>Campaign Run</title>
```

Note that `pnpm dev -- --port 5180` does *not* work — the flag is swallowed before
Vite sees it and the server comes up on 5173 anyway.

### Node version

`pnpm dev` runs fine on Node 20. The full check does not: `pnpm content:lint`
invokes `node --experimental-strip-types`, a flag Node 20 rejects outright
(`node: bad option`). With nvm:

```bash
nvm use 22
```

## The API and database

The game posts scores to `api/` (Hono on Node, Postgres). Without it the game still runs —
you play signed out, your board stays on the device and the map shows generated practice numbers.

You need a Postgres database. Then:

```bash
createdb campaignrun_dev
export DATABASE_URL="postgres://localhost/campaignrun_dev"
pnpm --filter @cr/api build
node api/dist/server.js          # http://localhost:8787, applies the schema on boot
```

The client talks to `http://localhost:8787` by default; set `VITE_API_URL` to point elsewhere.

| Variable | Default | Notes |
| --- | --- | --- |
| `DATABASE_URL` | *(required)* | Postgres connection string. |
| `PORT` | `8787` | |
| `CR_ALLOWED_ORIGINS` | the dev hosts | Comma-separated. `localhost:5180` and `127.0.0.1:5180` are **different origins** — a missing one looks exactly like the server being down. |
| `CR_MIN_PLAYERS` | `200` | How many players a region needs before its party breakdown is published. Lower it to see the live map locally; never lower it in production. |
| `CR_MIGRATE_ON_BOOT` | `true` | Set `false` to apply the schema separately. |

`api/src/schema.sql` is idempotent and re-runnable.

### API tests

The unit tests always run. The integration tests need a database and skip without one:

```bash
DATABASE_URL="postgres://localhost/campaignrun_test" pnpm test
```

## Other commands

Run from the repo root.

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server with HMR (`@cr/game`). |
| `pnpm build` | Production build to `apps/game/dist`. |
| `pnpm --filter @cr/game preview` | Serve the built output (no root alias for this one). |
| `pnpm test` | Vitest unit + determinism tests. |
| `pnpm typecheck` | `tsc --noEmit` across the workspace. |
| `pnpm lint` | ESLint, including the sim-purity rules. |
| `pnpm content:lint` | Validates `packages/content` JSON and the hashed name blocklist. **Node 22+.** |
| `pnpm size:check` | Fails if first-load gzip > 4 MB, a state pack > 3 MB, or a biome kit > 1.5 MB. Needs a build first. |
| `pnpm test:e2e` | Playwright smoke tests; builds and previews on `127.0.0.1:4173` automatically. |
| `pnpm verify` | typecheck → lint → test → content:lint → build → size:check. Must be green before any chunk is called done. |

### Troubleshooting the build

If `pnpm build` fails with:

```
[lightningcss minify] Cannot find module '../lightningcss.darwin-arm64.node'
```

that message is a red herring — it comes from a fallback path in
`lightningcss/node/index.js`, which only reports the *second* of two attempts.
The real failure is `require('lightningcss-darwin-arm64')`. The platform binary
normally is installed, so retry the build first; the failure can be transient.
If it persists, reinstall so the optional native dep is relinked:

```bash
pnpm install --force
```

### Playwright

`pnpm test:e2e` sets `PLAYWRIGHT_BROWSERS_PATH=0`, so browsers live in
`node_modules` rather than the shared system cache. If they are missing:

```bash
PLAYWRIGHT_BROWSERS_PATH=0 pnpm exec playwright install chromium
```

## Layout

```
apps/game        Vite + React + Three.js client, Zustand stores, Web Audio
packages/sim     Pure deterministic integer simulation (60 Hz)
packages/content JSON content + Zod schemas + guardrail linter
tools/           content-lint, size-check, hash-blocklist
docs/            SPEC, ARCHITECTURE, DESIGN, STATUS, GUARDRAILS, chunks/, decisions/
```

`packages/sim` is pure by contract and lint-enforced: integers only in state, and
no `Math.random`, `Date`, `performance`, DOM, Pixi, Three or transcendental
`Math.*`. The renderer reads sim state and never writes it. Tunable numbers live
in `packages/content` JSON, never inline.

## Working on it

`AGENTS.md` is the source of truth for contributors, human or agent. Start with
`docs/STATUS.md` for the current chunk, then that chunk's brief in `docs/chunks/`,
then `docs/GUARDRAILS.md` — those constraints are non-negotiable. Every behaviour
change ships with a test.

CI (`.github/workflows/ci.yml`) runs `pnpm verify` on Node 22 for every push and
pull request.

## API configuration

`api/` reads everything from the environment. Only `DATABASE_URL` is required.

| Variable | Default | What it does |
| --- | --- | --- |
| `DATABASE_URL` | — | Postgres connection string. Required. |
| `PORT` | `8787` | |
| `CR_ALLOWED_ORIGINS` | the local dev hosts | Comma-separated origin allowlist. Credentials are cookies, so this cannot be `*`. |
| `CR_APP_URL` | `http://localhost:5173` | Where verification and reset links point. |
| `CR_COOKIE_SAMESITE` | `Lax` | `Lax` is right when the game and the API share a registrable domain (`example.com` / `api.example.com`). On genuinely different domains the browser stops sending the session on fetch and sign-in looks like an outage — that case needs `None`, which requires HTTPS. |
| `CR_COOKIE_DOMAIN` | unset | Set to share the cookie across subdomains. |
| `CR_COOKIE_SECURE` | on in production | |
| `CR_TRUST_PROXY` | `false` | Read `x-forwarded-for`. Only turn this on behind a proxy that **overwrites** the header — anyone can send it, and trusting it makes every IP limit decorative. |
| `CR_REQUIRE_VERIFIED` | `true` | Public boards and standings count confirmed addresses only. |
| `CR_MIN_PLAYERS` | from `map.json` (200) | Privacy floor for publishing a region's party breakdown. |
| `CR_ALLOW_NO_MAIL` | `false` | Boot in production without a mail provider. Verification and reset links then only reach the server log — staging only. |

Abuse limits (`CR_SIGNUP_PER_DAY`, `CR_LOGIN_PER_MIN`, `CR_LOGIN_FAILURES`, `CR_LOCKOUT_MINUTES`,
`CR_FORGOT_PER_HOUR`, `CR_VERIFY_TOKEN_HOURS`, `CR_RESET_TOKEN_MINUTES`, `CR_MIN_PASSWORD`,
`CR_SCORES_PER_MIN`, `CR_BOARD_MAX_ROWS`) all default to
`packages/content/data/limits.json`, which is also where the client reads them to tell the player
how long a wait or a link lasts.

### Before a public deploy

**Implement `Mailer.send()` in `api/src/mailer.ts`.** There is no provider wired up, and the
API refuses to start in production without one, because the quiet failure — booting anyway and
printing reset links into a log — leaves every locked-out player permanently locked out.
