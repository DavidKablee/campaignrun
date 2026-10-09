# Campaign Run — Design System

## Product

Lagos campaign lane-runner. Pick a fictional Contender, dress them, ride through five landmarks to a Victoria Island grand rally. Score **Crowd** (game score, not a poll). Only Lagos is open now. Music is synthesised in-browser. Contender choice stays on device.

**Splash is the style source.** Do not invent a new visual language. Every other screen is the same Naija street-poster chrome over ink-night city.

## Brand tokens

| Token | Value | Role |
|-------|-------|------|
| Danfo | `#F5C518` | Primary CTA, brand, live pills |
| Ink | `#0B1220` | Night road / text on paper |
| Indigo | `#1B2A4A` | Panels |
| Jollof | `#E85D04` | Danger / dents / accent |
| Adire | `#2A6F97` | Secondary |
| Paper | `#F7F1E3` | Card surfaces |
| Stripe | danfo / ink diagonal | Danfo bus motif |

## Type

- Display: **Archivo Black** — stacked titles, buttons, score numbers
- Body: **DM Sans**
- Brand wordmark: stacked "Campaign" / "Run", uppercase, danfo fill, hard ink shadow; "Run" uses striped clip treatment on splash

## Components (splash language)

- **Pills**: uppercase, tight letter-spacing, ink glass or solid danfo for "live"
- **Hero CTA**: danfo fill, 5px brown offset shadow (`#b8860b`), min-height 52px; pulse via **box-shadow only** (never transform for primary CTA — e2e stability)
- **Ghost button**: transparent, paper outline inset stroke
- **Cards**: paper fill, ink text, 8px bottom shadow
- **Chips**: danfo tint pills for perk; muted for trade-off
- **HUD stats**: ink glass + danfo border, same as splash side panel
- **3D hole**: full-bleed WebGL behind scrim; UI sits on gradient scrim

## Layout

- Full-page landscape shell (no 480px portrait column)
- Safe-area insets
- Touch targets ≥ 48px
- Under 700px: controls one row; wider: BRAKE+BEAT left, GAS right

## Motion

- Prefer box-shadow / opacity. Respect `prefers-reduced-motion` and Settings → Reduce motion.
- No purple gradients, glassmorphism, or emoji UI.

## Legal chrome (always)

- Disclosure on splash and About: fictional game; scores are not polls; 18+.
- No real politician names, party marks, or character→person mapping in UI copy.

## Screen jobs

1. **Splash** — keep as-is (live Lagos hero, Continue / Play, map, yard, radio stats).
2. **Roster** — split: large selected Contender + six posters; pills for Lagos / Following / days left.
3. **Studio** — turntable + poster tabs; Campaign in Lagos CTA.
4. **Briefing** — landmark trail, ride posters, radio chip, Start the run.
5. **Map** — open Lagos card, locked dated stamps, station on-air.
6. **Yard** — Starting Story, donation, upgrades, ride ladder.
7. **HUD / Pause** — splash-pill stats; pause as poster overlay.
8. **Summary** — celebration Crowd poster.
9. **Settings / About** — same chrome; Settings back returns to caller.
