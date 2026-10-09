import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { migrateContenderFromGameStorage } from './contenderStore';
import './ui/styles.css';

registerSW({ immediate: true });
migrateContenderFromGameStorage();

async function init() {
  const flagsReq = await fetch('/flags.json');
  const flags = (await flagsReq.json()) as { killSwitch?: boolean };

  const rootEl = document.getElementById('app')!;

  if (flags.killSwitch) {
    rootEl.innerHTML = `<div class="cr-shell"><div class="cr-screen cr-screen--settings"><h2>Back soon</h2><div class="cr-card"><p>We're making the road smoother.</p></div></div></div>`;
    return;
  }

  const root = createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void init();
