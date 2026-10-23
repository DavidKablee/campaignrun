import { describe, expect, it } from 'vitest';
import { outfits, type OutfitChoice } from '@cr/content';
import { SLOTS, changedSlots, colorLabel, isCustomised } from '../src/studio';

const base: OutfitChoice = {
  top: 'tee',
  topColor: '#E0902B',
  bottom: 'jeans',
  bottomColor: '#2A6F97',
  footwear: 'sneakers',
  footColor: '#3A4A5A',
  headwear: 'none',
  headColor: '#F5C518',
};

describe('changedSlots', () => {
  it('finds nothing on an untouched Contender', () => {
    expect(isCustomised(base, { ...base })).toBe(false);
    expect(changedSlots(base, { ...base }).size).toBe(0);
  });

  it('counts a swapped garment', () => {
    expect([...changedSlots(base, { ...base, top: 'kaftan' })]).toEqual(['top']);
  });

  it('counts a recolour of a garment you kept', () => {
    // The first edit most players make. A dot that only watched the garment id
    // would stay dark on the tab that actually changed.
    expect([...changedSlots(base, { ...base, footColor: '#1FA45B' })]).toEqual(['footwear']);
    expect(isCustomised(base, { ...base, footColor: '#1FA45B' })).toBe(true);
  });

  it('does not count the same hex written in another case', () => {
    expect(isCustomised(base, { ...base, topColor: '#e0902b' })).toBe(false);
  });

  it('reports every changed slot, not just the first', () => {
    const changed = changedSlots(base, { ...base, top: 'jacket', headwear: 'cap', bottomColor: '#F5C518' });
    expect([...changed].sort()).toEqual(['bottom', 'headwear', 'top']);
  });
});

describe('SLOTS', () => {
  it('points at option lists that exist in content', () => {
    for (const slot of SLOTS) {
      expect(outfits.options[slot.list], slot.id).toBeDefined();
      expect((outfits.options[slot.list] as unknown[]).length).toBeGreaterThan(0);
    }
  });

  it('names the colour each slot paints', () => {
    expect(SLOTS.map(colorLabel)).toEqual([
      'Top colour',
      'Trousers colour',
      'Footwear colour',
      'Headwear colour',
    ]);
  });
});
