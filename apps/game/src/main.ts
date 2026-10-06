import { copy, simConfig } from '@cr/content';
import { initState, step, seedRng, Btn } from '@cr/sim';
import { GameRenderer } from './render';
import { audio } from './audio';
import { useGameStore } from './state';

async function init() {
  const flagsReq = await fetch('/flags.json');
  const flags = await flagsReq.json();
  
  const app = document.getElementById('app')!;
  
  if (flags.killSwitch) {
    app.innerHTML = `<h1>${copy.backSoon}</h1>`;
    return;
  }
  
  app.innerHTML = `
    <h1>Campaign Run</h1>
    <p>${copy.disclosure}</p>
    <button id="playBtn">${copy.playButton}</button>
  `;
  
  document.getElementById('playBtn')?.addEventListener('click', () => {
    startGame();
  });
}

async function startGame() {
  const app = document.getElementById('app')!;
  app.innerHTML = ''; // clear UI
  
  await audio.init();

  const renderer = new GameRenderer();
  app.appendChild(renderer.canvas);
  
  window.addEventListener('resize', () => renderer.resize());

  const state = initState(simConfig, seedRng(Date.now()));
  
  // Basic keyboard controls
  let keys = 0;
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') keys |= Btn.Left;
    if (e.key === 'ArrowRight') keys |= Btn.Right;
    if (e.key === 'ArrowUp') keys |= Btn.Up;
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft') keys &= ~Btn.Left;
    if (e.key === 'ArrowRight') keys &= ~Btn.Right;
    if (e.key === 'ArrowUp') keys &= ~Btn.Up;
  });

  let lastTime = performance.now();
  const msPerTick = 1000 / simConfig.tickHz;
  let accumulator = 0;

  function loop(time: number) {
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
    
    if (state.dents < simConfig.hit.maxDents) {
      requestAnimationFrame(loop);
    } else {
      useGameStore.getState().setRunResult(Math.floor(state.z / 1000), state.carried);
      useGameStore.getState().setScreen('summary');
      const over = document.createElement('div');
      over.style.position = 'absolute';
      over.style.top = '50%';
      over.style.left = '50%';
      over.style.transform = 'translate(-50%, -50%)';
      over.style.color = 'red';
      over.style.fontSize = '3rem';
      over.innerHTML = 'BREAKDOWN!';
      app.appendChild(over);
    }
  }

  requestAnimationFrame(loop);
}

init();
