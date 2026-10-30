/**
 * C82: the small, pure maths of a Mobilise place, shared by the server (which decides where a
 * player stands) and the game (which draws them). One copy, so the avatar you see walking is where
 * the server thinks it is.
 */

export interface PlaceBounds {
  halfX: number;
  halfZ: number;
}

export interface Spot {
  x: number;
  z: number;
}

export function clampToBounds(p: Spot, bounds: PlaceBounds): Spot {
  return {
    x: Math.min(bounds.halfX, Math.max(-bounds.halfX, Number.isFinite(p.x) ? p.x : 0)),
    z: Math.min(bounds.halfZ, Math.max(-bounds.halfZ, Number.isFinite(p.z) ? p.z : 0)),
  };
}

/** Walks `from` toward `to` for `seconds` at `speed`, stopping on arrival. */
export function stepToward(from: Spot, to: Spot, seconds: number, speed: number): Spot {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const dist = Math.hypot(dx, dz);
  const reach = Math.max(0, seconds) * speed;
  if (dist <= reach || dist === 0) return { x: to.x, z: to.z };
  return { x: from.x + (dx / dist) * reach, z: from.z + (dz / dist) * reach };
}

export function distance(a: Spot, b: Spot): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

/** Lagos has no daylight saving: the day a daily cap resets on is the UTC+1 calendar day. */
export function placesDay(nowMs: number): string {
  return new Date(nowMs + 3_600_000).toISOString().slice(0, 10);
}

/** A stable id for a place: `kano:market`. */
export function placeKey(stateId: string, kind: string): string {
  return `${stateId}:${kind}`;
}

/** How many ambient locals to show with `players` real players present: fewer as the place fills. */
export function localsFor(players: number, cfg: { max: number; min: number } = { max: 5, min: 2 }): number {
  return Math.max(cfg.min, cfg.max - Math.floor(Math.max(0, players - 1) / 2));
}
