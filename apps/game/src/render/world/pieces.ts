import type { Ctx } from './ctx';

/**
 * Set pieces: the one-off buildings and places that make a landmark recognisable.
 * `at` says where along its segment the piece belongs: 'venue' is the chunk the
 * rally stage stands in, 'entry' the chunk where the district begins (and its
 * gantry). All of them keep to |x| >= 12 on the side they are placed, so the
 * lanes, the stage and the crowd stay clear.
 */
export interface PieceDef {
  at: 'venue' | 'entry';
  build(c: Ctx, side: -1 | 0 | 1): void;
}

export const PIECES: Record<string, PieceDef> = {};

/** Register the pieces of one state. Kept as plain data so the registry test can list them. */
export function registerPieces(defs: Record<string, PieceDef>) {
  Object.assign(PIECES, defs);
}
