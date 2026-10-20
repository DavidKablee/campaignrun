import { describe, expect, it } from 'vitest';
import { RIG } from '../src/render/character';

/**
 * C33. These are not aesthetic preferences — each one encodes a bug that shipped.
 * The character is built from merged primitives with no skeleton to constrain
 * them, so a radius edited in one `case` of the top switch can silently swallow
 * a limb built three functions away.
 */
describe('character silhouette invariants', () => {
  it('seats the arms outboard of the shoulders, so they break the torso outline', () => {
    // At armX 0.155 against a 0.165 chest the whole upper arm sat inside the
    // torso: in any top whose sleeves share the body colour, the character
    // rendered with no arms at all.
    expect(RIG.armX).toBeGreaterThan(RIG.shoulderR);
  });

  it('keeps every top narrower than the arm line', () => {
    // hi-vis was 0.172 and the shoulder yoke 0.168 — both wider than the arms.
    expect(RIG.widestTopR).toBeLessThan(RIG.armX);
  });

  it('keeps the shoulders wider than the chest but near head width', () => {
    // Shoulders narrower than the chest give a barrel; much wider than the head
    // stops reading as chibi.
    expect(RIG.shoulderR).toBeGreaterThan(RIG.chestR);
    expect(RIG.shoulderR).toBeLessThan(RIG.headR * 1.35);
  });
});
