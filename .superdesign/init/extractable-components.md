# Extractable components

## ScreenChrome (layout)
- Source: patterns in `apps/game/src/App.tsx` + `styles.css`
- Category: layout
- Description: Top pills row + back link + title kicker used across post-splash screens
- Extractable props: title, kicker, backLabel, onBack, showMap, showSettings
- Hardcoded: pill styles, danfo colors

## ContenderPoster (basic)
- Source: Roster `.cr-contender` in App.tsx
- Category: basic
- Description: Contender card with portrait, archetype, perk chips
- Extractable props: name, archetype, catchphrase, active, palette
- Hardcoded: chip layout, portrait frame

## PrimaryButton / GhostButton
- Skip extraction — CSS classes `.cr-btn` / `.cr-btn--ghost` are sufficient
