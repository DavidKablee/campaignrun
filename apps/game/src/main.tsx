import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

async function init() {
  const flagsReq = await fetch('/flags.json');
  const flags = await flagsReq.json();
  
  const rootEl = document.getElementById('app')!;
  
  if (flags.killSwitch) {
    rootEl.innerHTML = `<h1>Back soon!</h1>`;
    return;
  }
  
  const root = createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

init();
