# Launching the client without the API

The game does not need the server to be shared. "Beat my run" links carry the seed, the state, the ride and the score in the address, the local board and the Yard live on the device, and the radio, ghosts and state worlds are all client-side. The API adds accounts, the public boards, live standings, the weekly tally, anonymous usage counts and state corrections. Launching without it is a real launch with those parts quietly absent, not a demo.

## 1. Build
```bash
export VITE_PUBLIC_URL=https://your.domain      # no trailing slash; makes the link preview absolute
pnpm --filter @cr/game run build                # output: apps/game/dist
```
Without `VITE_PUBLIC_URL` the preview image path stays relative and WhatsApp will not show it.

## 2. Host `apps/game/dist`
Any static host with HTTPS works (Cloudflare Pages, Netlify, GitHub Pages). It must serve `index.html` for unknown paths and must not cache `flags.json` hard (the service worker already treats it network-first). Check after deploy:
- the page opens on a phone and installs;
- paste the URL into a WhatsApp chat: it should show the title, description and the 1200×630 image (`apps/game/public/og-image.png`, rebuilt by `PLAYWRIGHT_BROWSERS_PATH=0 node tools/og-image.mjs`);
- a challenge link from the result screen opens the game on the same road.

## 3. Change dates and say something without a redeploy: `flags.json`
Edit `flags.json` on the host:
```json
{
  "killSwitch": false,
  "notice": "The vote moved to 20 February. The game closes the day before.",
  "calendar": {
    "closeAt": "2027-02-19T22:59:00Z",
    "unlocks": { "osun": "2026-11-30T05:00:00Z" }
  }
}
```
- `notice` shows as one line on the splash screen (200 characters at most).
- `calendar.closeAt` moves the countdown and the close. `calendar.unlocks` moves single states. A date outside Oct 2026–Dec 2027, a malformed date or an unknown state is ignored, so a typo cannot lock players out or open everything.
- After the close, every state with a pack opens for practice and the pill reads "Closed".
- `featured` (a state id) picks the Weekly Tour state by hand; it is ignored if the state is unknown or not yet open.
- `killSwitch: true` shows "Back soon" instead of the game.
- Players pick a change up on their next visit (network first, three-second timeout, then the last copy offline).

## 4. Usage counts (optional, needs a server)
The client sends anonymous event counts to `<API>/api/events`, or to `VITE_ANALYTICS_URL` if set at build time. With neither reachable, they are dropped. Players can switch them off in Settings, and Do Not Track is honoured. See `docs/chunks/C78.md`.

When the API is up: `pnpm --filter @cr/api report` prints the last 14 days of the funnel (visit → run → finish → share → challenge opened) and the newest state corrections.

## 5. Before the first public link
- The privacy copy changed in C78 (`legal.version` 2026-10-28) and still says a lawyer must review it. That review is the gate for anything that collects data.
- Run `docs/PLAYTEST-FIRST-MINUTE.md` with real players first.
