# Routes / screens

No URL router. Screen state is Zustand `screen` in `apps/game/src/state.ts`, rendered in `apps/game/src/App.tsx`.

| Screen | Component | Notes |
|--------|-----------|-------|
| splash | Splash | Live 3D Showcase hero — KEEP style |
| roster | Roster | Contender pick |
| studio | StudioScreen | Outfit turntable |
| briefing | Briefing | Ride + Lagos trail |
| game | GameScreen | HUD over Three.js |
| paused | Paused | Overlay |
| summary | Summary | Run result |
| settings | Settings | Volumes / flags |
| about | About | Disclosure |
| map | CampaignMap | `ui/CampaignMap.tsx` |
| yard | ConvoyYard | Meta upgrades |

Flow: splash → roster → studio → briefing → game → summary. Splash also → map | yard | about | settings.
