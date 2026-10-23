/**
 * What a tap on the roster does, kept out of the component so it can be tested
 * (the game's Vitest runs in `node`, with no DOM).
 *
 * The roster used to decide this inline and `return` early on the locked case,
 * so tapping a locked Contender was a dead tap: the card looked exactly like
 * the five that worked and nothing happened or explained itself. The same tap
 * also spent the one free switch immediately, with no confirmation — and that
 * is not recoverable, because `lockAfterFinish` never clears.
 */
export type RosterCommit =
  /** Free: nothing is locked yet, or this is already your Contender. */
  | { kind: 'open' }
  /** Locked with the free switch still unspent — ask before spending it. */
  | { kind: 'confirm-switch' }
  /** Locked and the switch is spent. The card must say so, not swallow the tap. */
  | { kind: 'blocked' };

export function rosterCommit(args: {
  cardId: string;
  activeId: string | null;
  locked: boolean;
  graceUsed: boolean;
}): RosterCommit {
  const { cardId, activeId, locked, graceUsed } = args;
  // Re-opening your own Contender costs nothing: the store short-circuits on an
  // unchanged id, so dressing the character you already picked is always free.
  if (!locked || activeId === null || activeId === cardId) return { kind: 'open' };
  return graceUsed ? { kind: 'blocked' } : { kind: 'confirm-switch' };
}
