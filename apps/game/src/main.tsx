import React from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { App } from './App';
import { ErrorBoundary } from './ErrorBoundary';
import { migrateContenderFromGameStorage } from './contenderStore';
import { installFlushOnHide, track } from './analytics';
import { applyRemoteConfig } from './campaignClock';
import { useGameStore } from './state';
import './ui/styles.css';

// A new version waits until the player is between runs: reloading mid-run would throw the run away.
let updatePending = false;
const applyUpdate = () => {
  if (!updatePending) return;
  const screen = useGameStore.getState().screen;
  if (screen === 'game' || screen === 'paused') return;
  updatePending = false;
  void updateSW(true);
};
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updatePending = true;
    applyUpdate();
  },
});
useGameStore.subscribe(applyUpdate);
migrateContenderFromGameStorage();

async function init() {
  // A slow or failed flags fetch must not leave a blank page: fail open and play.
  let flags: { killSwitch?: boolean } = {};
  try {
    const flagsReq = await fetch('/flags.json');
    flags = (await flagsReq.json()) as { killSwitch?: boolean };
    // Dates and the splash notice can move without a redeploy; a malformed block is ignored.
    applyRemoteConfig(flags);
  } catch {
    /* offline or flaky: no kill switch known, carry on */
  }

  const rootEl = document.getElementById('app')!;

  if (flags.killSwitch) {
    rootEl.innerHTML = `<div class="cr-shell"><div class="cr-screen cr-screen--settings"><h2>Back soon</h2><div class="cr-card"><p>We're making the road smoother.</p></div></div></div>`;
    return;
  }

  installFlushOnHide();
  track('visit');
  const root = createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
}

void init();
