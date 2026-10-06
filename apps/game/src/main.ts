import { copy } from '@cr/content';

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
    app.innerHTML = `<p>Loading road...</p>`;
    // Game initialization would happen here
  });
}

init();
