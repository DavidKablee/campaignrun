import React, { useEffect, useRef } from 'react';
import { useGameStore } from './state';
import { copy, simConfig, contenders } from '@cr/content';
import { initState, step, seedRng, Btn } from '@cr/sim';
import { GameRenderer } from './render';
import { audio } from './audio';

export function App() {
  const screen = useGameStore(s => s.screen);
  const setScreen = useGameStore(s => s.setScreen);


  if (screen === 'splash') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Campaign Run</h1>
        <p style={{ maxWidth: '400px', margin: '0 auto 2rem' }}>{copy.disclosure}</p>
        <button onClick={() => setScreen('roster')} style={{ fontSize: '1.5rem', padding: '1rem 2rem' }}>
          {copy.playButton}
        </button>
      </div>
    );
  }

  if (screen === 'roster') {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Select Contender</h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {contenders.map(c => (
            <button 
              key={c.id} 
              onClick={() => {
                useGameStore.getState().setActiveContender(c.id);
                setScreen('game');
              }}
              style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <strong>{c.name}</strong>
              <small>{c.perk.description}</small>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (screen === 'game') {
    return <GameScreen />;
  }

  if (screen === 'summary') {
    const lastRunDistance = useGameStore(s => s.lastRunDistance);
    const lastRunSupporters = useGameStore(s => s.lastRunSupporters);
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Run Over!</h2>
        <p>Distance: {lastRunDistance}m</p>
        <p>Supporters: {lastRunSupporters}</p>
        <button onClick={() => setScreen('roster')} style={{ fontSize: '1.2rem', padding: '0.5rem 1rem' }}>
          Play Again
        </button>
      </div>
    );
  }

  return null;
}

function GameScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const setScreen = useGameStore(s => s.setScreen);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    let isActive = true;
    
    // Initialize audio (must be inside user interaction, which roster click provided)
    audio.init().catch(console.error);

    const renderer = new GameRenderer();
    container.appendChild(renderer.canvas);
    
    const onResize = () => renderer.resize();
    window.addEventListener('resize', onResize);

    const state = initState(simConfig, seedRng(Date.now()));
    
    let keys = 0;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys |= Btn.Left;
      if (e.key === 'ArrowRight') keys |= Btn.Right;
      if (e.key === 'ArrowUp') keys |= Btn.Up;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') keys &= ~Btn.Left;
      if (e.key === 'ArrowRight') keys &= ~Btn.Right;
      if (e.key === 'ArrowUp') keys &= ~Btn.Up;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let lastTime = performance.now();
    const msPerTick = 1000 / simConfig.tickHz;
    let accumulator = 0;
    let frameId = 0;

    function loop(time: number) {
      if (!isActive) return;
      
      const dt = time - lastTime;
      lastTime = time;
      accumulator += dt;

      while (accumulator >= msPerTick) {
        step(state, keys | Btn.Gas, simConfig); // Auto gas for now
        
        for (const ev of state.events) {
          audio.playEvent(ev);
        }
        
        accumulator -= msPerTick;
      }

      renderer.render(state);
      
      // Update UI overlay (we could sync state to React or just update a DOM node for performance)
      const overlayScore = document.getElementById('overlay-score');
      if (overlayScore) {
        overlayScore.innerText = `Dist: ${Math.floor(state.z / 1000)}m | Crowd: ${state.carried} | Dents: ${state.dents}/3`;
      }
      
      if (state.dents < simConfig.hit.maxDents) {
        frameId = requestAnimationFrame(loop);
      } else {
        useGameStore.getState().setRunResult(Math.floor(state.z / 1000), state.carried);
        setScreen('summary');
      }
    }

    frameId = requestAnimationFrame(loop);

    return () => {
      isActive = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (container.contains(renderer.canvas)) {
        container.removeChild(renderer.canvas);
      }
      // cleanup renderer
      renderer.canvas.remove();
    };
  }, [setScreen]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      <div id="overlay-score" style={{ position: 'absolute', top: '10px', left: '10px', fontSize: '1.2rem', textShadow: '1px 1px 2px black' }}>
        Dist: 0m | Crowd: 0 | Dents: 0/3
      </div>
    </div>
  );
}
