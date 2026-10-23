import { campaignMap, hash32 } from './standings';

/**
 * Region outlines for the campaign map.
 *
 * `map.json` places each region on a hex lattice, which keeps the zones as
 * neighbours and guarantees nothing overlaps. Drawn as plain hexes that reads
 * as a board game, not a map, so each hex is walked corner by corner and every
 * point is pushed off true by a fixed amount derived from the point itself.
 *
 * Deriving the displacement from the *point* rather than from the region is the
 * whole trick: a corner belongs to up to three regions and an edge midpoint to
 * two, and each of them hashes the same key, so they all move it to the same
 * place and the shared edge stays a shared edge. Jitter per region instead and
 * the coastline tears open along every border.
 *
 * The result is an invented continent. No outline here is traced from anywhere.
 */

export interface Pt {
  x: number;
  z: number;
}

/** How far a lattice corner may wander, in hex radii. */
const CORNER_WANDER = 0.26;
/** Edge midpoints wander less, so regions stay convex enough to read. */
const EDGE_WANDER = 0.16;
/** Lattice points are snapped to this grid before hashing, so two regions that
 *  compute the same corner through different arithmetic still agree on it. */
const SNAP = 1000;

function snap(n: number): number {
  return Math.round(n * SNAP) / SNAP;
}

function key(p: Pt): string {
  return `${Math.round(p.x * SNAP)}:${Math.round(p.z * SNAP)}`;
}

/** A fixed offset for a lattice point, same every time, same for every region that shares it. */
function wander(k: string, amount: number): Pt {
  const h = hash32(k);
  const angle = (((h >>> 8) % 4096) / 4096) * Math.PI * 2;
  const radius = ((h & 0xff) / 255) * amount;
  return { x: Math.cos(angle) * radius, z: Math.sin(angle) * radius };
}

function displaced(base: Pt, amount: number): Pt {
  const k = key(base);
  const d = wander(k, amount);
  return { x: base.x + d.x, z: base.z + d.z };
}

const HEX_W = Math.sqrt(3);

export function regionCentre(col: number, row: number): Pt {
  return { x: col * HEX_W, z: row * 1.5 };
}

/** The six lattice corners of a region's hex, snapped so neighbours agree. */
export function hexCorners(col: number, row: number): Pt[] {
  const c = regionCentre(col, row);
  const out: Pt[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    out.push({ x: snap(c.x + Math.cos(a)), z: snap(c.z + Math.sin(a)) });
  }
  return out;
}

/** A region's coastline: 12 points, corners and edge midpoints, all displaced. */
export function regionPolygon(col: number, row: number): Pt[] {
  const corners = hexCorners(col, row);
  const out: Pt[] = [];
  for (let i = 0; i < 6; i++) {
    const a = corners[i]!;
    const b = corners[(i + 1) % 6]!;
    out.push(displaced(a, CORNER_WANDER));
    const mid: Pt = { x: snap((a.x + b.x) / 2), z: snap((a.z + b.z) / 2) };
    out.push(displaced(mid, EDGE_WANDER));
  }
  return out;
}

export function regionPolygons(): { id: string; centre: Pt; points: Pt[] }[] {
  return campaignMap.regions.map((r) => ({
    id: r.id,
    centre: regionCentre(r.col, r.row),
    points: regionPolygon(r.col, r.row),
  }));
}
