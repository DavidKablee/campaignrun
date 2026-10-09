# Layouts

## App shell

File: `apps/game/src/App.tsx`

```tsx
export function App() {
  const screen = useGameStore((s) => s.screen);
  const inRun = screen === 'game' || screen === 'paused';
  return (
    <div className="cr-shell">
      {screen === 'splash' && <Splash />}
      {screen === 'roster' && <Roster />}
      {screen === 'studio' && <StudioScreen />}
      {screen === 'briefing' && <Briefing />}
      {inRun && <GameScreen />}
      {screen === 'paused' && <Paused />}
      {screen === 'summary' && <Summary />}
      {screen === 'settings' && <Settings />}
      {screen === 'about' && <About />}
      {screen === 'map' && <CampaignMap />}
      {screen === 'yard' && <ConvoyYard />}
    </div>
  );
}
```

## Shell CSS

File: `apps/game/src/ui/styles.css`

`.cr-shell` — full viewport flex column. `.cr-screen` — flex column padding with safe-area; children max-width 560px centered except splash/roster/map overrides.
