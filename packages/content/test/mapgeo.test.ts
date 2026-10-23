import { describe, expect, it } from 'vitest';
import { campaignMap, regionPolygon, regionPolygons, hexCorners, regionCentre, type Pt } from '../src/index';

const k = (p: Pt) => `${p.x.toFixed(6)},${p.z.toFixed(6)}`;

describe('region outlines', () => {
  it('gives every region a closed 12-point outline', () => {
    for (const r of campaignMap.regions) {
      const poly = regionPolygon(r.col, r.row);
      expect(poly, r.id).toHaveLength(12);
      for (const p of poly) {
        expect(Number.isFinite(p.x) && Number.isFinite(p.z), r.id).toBe(true);
      }
    }
  });

  it('is deterministic', () => {
    for (const r of campaignMap.regions) {
      expect(regionPolygon(r.col, r.row).map(k)).toEqual(regionPolygon(r.col, r.row).map(k));
    }
  });

  /** The reason displacement is keyed on the point and not on the region. */
  it('leaves no gap between neighbours: a shared corner lands in one place', () => {
    const byCorner = new Map<string, Set<string>>();
    for (const r of campaignMap.regions) {
      const corners = hexCorners(r.col, r.row);
      const poly = regionPolygon(r.col, r.row);
      // poly[0], poly[2], poly[4]... are the displaced corners, in corner order
      corners.forEach((c, i) => {
        const latticeKey = `${Math.round(c.x * 1000)}:${Math.round(c.z * 1000)}`;
        const placed = k(poly[i * 2]!);
        if (!byCorner.has(latticeKey)) byCorner.set(latticeKey, new Set());
        byCorner.get(latticeKey)!.add(placed);
      });
    }
    const shared = [...byCorner.entries()].filter(([, places]) => places.size > 1);
    expect(shared.map(([lattice, places]) => `${lattice} -> ${[...places].join(' | ')}`)).toEqual([]);
    // and the lattice really is shared: far more regions than corners-times-six
    const reused = [...byCorner.keys()].length;
    expect(reused).toBeLessThan(campaignMap.regions.length * 6);
  });

  it('moves every region off its hex, so the coast is not a honeycomb', () => {
    let moved = 0;
    for (const r of campaignMap.regions) {
      const corners = hexCorners(r.col, r.row);
      const poly = regionPolygon(r.col, r.row);
      corners.forEach((c, i) => {
        const p = poly[i * 2]!;
        if (Math.hypot(p.x - c.x, p.z - c.z) > 0.02) moved++;
      });
    }
    expect(moved).toBeGreaterThan(campaignMap.regions.length * 5);
  });

  it('keeps every point within reach of its own region centre', () => {
    for (const { id, centre, points } of regionPolygons()) {
      for (const p of points) {
        // hex circumradius 1 + the most a corner may wander
        expect(Math.hypot(p.x - centre.x, p.z - centre.z), id).toBeLessThan(1.3);
      }
    }
  });

  it('places outlines around the centre the layout asked for', () => {
    for (const r of campaignMap.regions) {
      const c = regionCentre(r.col, r.row);
      const poly = regionPolygon(r.col, r.row);
      const mx = poly.reduce((a, p) => a + p.x, 0) / poly.length;
      const mz = poly.reduce((a, p) => a + p.z, 0) / poly.length;
      expect(Math.hypot(mx - c.x, mz - c.z), r.id).toBeLessThan(0.35);
    }
  });
});
