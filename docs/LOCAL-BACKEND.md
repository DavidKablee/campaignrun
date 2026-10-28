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
