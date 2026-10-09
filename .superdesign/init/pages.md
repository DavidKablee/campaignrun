# Page dependency trees

## Splash
Entry: `apps/game/src/App.tsx` → `Splash`
- `apps/game/src/state.ts`
- `apps/game/src/render/showcase.ts`
- `apps/game/src/characters.ts`
- `apps/game/src/trail.ts` (stationFor)
- `apps/game/src/ui/styles.css`
- `@cr/content` (copy, lagosLaunch, contenders)

## Roster
Entry: `App.tsx` → `Roster` (+ `usePortraits`)
- `render/studio.ts` (renderPortraits)
- `characters.ts`
- styles.css

## Studio
Entry: `App.tsx` → `StudioScreen`
- `render/studio.ts` (CharacterStudio)
- outfits from `@cr/content`
- styles.css

## Briefing
Entry: `App.tsx` → `Briefing`
- rides / isRidePlayable / lagosLaunch
- styles.css

## Campaign map
Entry: `apps/game/src/ui/CampaignMap.tsx`
- `trail.ts`
- styles.css

## Convoy Yard
Entry: `App.tsx` → `ConvoyYard`
- metaConfig from `@cr/content`
- styles.css

## Game HUD
Entry: `App.tsx` → `GameScreen`
- GameRenderer, InputController, audio, trail
- styles.css
