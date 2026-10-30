# Running the backend on your machine

Postgres runs locally; nothing here needs a host. (A "host" is only needed to put the game and API on a public address.)

## One-time
1. Postgres running, and a database: `createdb campaignrun_dev`.
2. Copy `.env.example` to `.env` (gitignored) and fill it in. `DATABASE_URL` points at the local database.
3. Mail (optional): add your Resend key to `.env`:
   ```
   RESEND_API_KEY=re_...
   CR_MAIL_FROM=Campaigner <onboarding@resend.dev>
   CR_APP_URL=http://localhost:5173
   ```
   Until a domain is verified in Resend, mail from `onboarding@resend.dev` is only delivered to the address your Resend account was created with. Sign up in the game with that address to test. With no key, the verification and reset links are printed in the API's terminal instead.

## Every time
```bash
pnpm --filter @cr/api dev     # API on :8787, applies the schema on boot, loads ../.env
pnpm dev                      # the game on :5173; it finds the API on the same machine at :8787
```
For a phone on the same Wi-Fi, open the game by the LAN address; the client points at the same machine's :8787, and `CR_ALLOWED_ORIGINS` must list that origin.

## Checks
```bash
curl localhost:8787/api/health
DATABASE_URL="postgres://<you>@localhost/campaignrun_test?host=/tmp" pnpm -s test
pnpm --filter @cr/api report   # funnel counts and newest state corrections
```

## Trying Mobilise with several players
Mobilise needs the API. Each browser profile is one player, and cookies are per host, so `http://localhost:5173` and `http://127.0.0.1:5173` are two players (both are in the default allowed origins). Add `CR_REQUIRE_VERIFIED=false` to see state activity from name-only accounts.
1. Start the API and the game as above.
2. In each window: play once (or finish a quick rally), open the planning page, tap **Mobilise**, choose a name.
3. Walk by tapping the ground; use the action buttons and **Say**. Players in the same place and state share a room (12 at most, then a second room opens).
4. Stop the API: the Mobilise button turns to "Opening soon".
For the Playwright check run the API with `CR_ALLOWED_ORIGINS=http://127.0.0.1:4173` added, then `pnpm --filter @cr/game run build` and `pnpm test:e2e`; `places.spec.ts` skips itself when the API is not up.
