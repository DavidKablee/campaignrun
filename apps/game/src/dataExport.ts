import { useAccountStore } from './accountStore';
import { contenderShareAllowed } from './consent';
import { useContenderStore } from './contenderStore';
import { useGameStore } from './state';

export interface ExportBundle {
  exportedAt: string;
  guestId: string;
  mode: 'guest' | 'saved';
  displayName: string;
  consentLog: unknown[];
  game: Record<string, unknown>;
  /** Omitted entirely when Contender-share consent is not granted. */
  contender?: Record<string, unknown>;
}

export function buildExportBundle(now = Date.now()): ExportBundle {
  const account = useAccountStore.getState();
  const game = useGameStore.getState();
  const contender = useContenderStore.getState();
  const bundle: ExportBundle = {
    exportedAt: new Date(now).toISOString(),
    guestId: account.guestId,
    mode: account.mode,
    displayName: account.displayName,
    consentLog: account.consentLog,
    game: {
      coins: game.coins,
      following: game.following,
      bestByState: game.bestByState,
      activeRideId: game.activeRideId,
      activeStateId: game.activeStateId,
      startingStory: game.startingStory,
      upgrades: game.upgrades,
      streak: game.streak,
      username: game.username,
      localBoard: game.localBoard,
      travel: game.travel,
    },
  };
  if (contenderShareAllowed(account.consentLog)) {
    bundle.contender = {
      activeContenderId: contender.activeContenderId,
      contenderLocked: contender.contenderLocked,
      contenderGraceUsed: contender.contenderGraceUsed,
      outfits: contender.outfits,
    };
  }
  return bundle;
}

export function downloadExport(bundle: ExportBundle): void {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `campaign-run-export-${bundle.guestId.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Wipe local account + Contender + game progress (guest reset). */
export function deleteAllLocalData(): void {
  useAccountStore.getState().clearAccount();
  useContenderStore.getState().clear();
  useGameStore.persist.clearStorage();
  localStorage.removeItem('cr-storage');
  localStorage.removeItem('cr-contender');
  localStorage.removeItem('cr-account');
  location.reload();
}
