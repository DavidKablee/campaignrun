import { describe, expect, it } from 'vitest';
import hazards from '../../../packages/content/data/hazards.json';
import { atmosphereFor, MIN_FOG_FAR } from '../src/render/hazardAtmosphere';

describe('hazard atmosphere', () => {
  it('is null for hazards with no air to show', () => {
    expect(atmosphereFor(['go-slow', 'cart-weave'])).toBeNull();
    expect(atmosphereFor([])).toBeNull();
  });

  it('turns dust on for dust hazards only', () => {
    expect(atmosphereFor(['dust-plume'])?.dust).toBe(true);
    expect(atmosphereFor(['river-fog'])?.dust).toBe(false);
  });

  it('takes the strongest tint and the shortest far plane', () => {
    const a = atmosphereFor(['dust-plume', 'dust-storm', 'low-visibility'])!;
    expect(a.tintAmount).toBe(0.4);
    expect(a.farMul).toBe(0.75);
  });

  it('only names hazards that exist', () => {
    const ids = new Set((hazards as { id: string }[]).map((h) => h.id));
    for (const id of ['dust-plume', 'dust-storm', 'heat-shimmer', 'river-fog', 'low-visibility', 'rain-slick', 'flash-flood', 'flood-sheet']) {
      expect(ids.has(id)).toBe(true);
      expect(atmosphereFor([id])).not.toBeNull();
    }
  });

  it('never closes the fog in past the reaction distance, even stacked on harmattan', () => {
    const worst = atmosphereFor(['dust-storm', 'low-visibility', 'river-fog'])!;
    expect(Math.max(MIN_FOG_FAR, 85 * worst.farMul)).toBeGreaterThanOrEqual(MIN_FOG_FAR);
  });
});
