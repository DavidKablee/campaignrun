import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { cameraFor } from '../src/render/camera';

const LANES = [-2.8, 0, 2.8];
// 360x800, 390x844, 412x915, 9:16, 9:21, landscape laptop, landscape phone
const ASPECTS = [0.45, 0.462, 0.45, 0.5625, 0.43, 1.778, 2.17];

/** Player NDC x with the camera settled on its target (what the renderer converges to). */
function ndcX(aspect: number, pX: number, pZ: number, speed01: number, reduce = false) {
  const rig = cameraFor(aspect, pX, pZ, speed01, reduce);
  const cam = new THREE.PerspectiveCamera(rig.fov, aspect, 0.1, 180);
  cam.position.set(rig.x, rig.y, pZ + rig.back);
  cam.lookAt(rig.lookX, rig.lookY, pZ - rig.ahead);
  cam.updateMatrixWorld();
  return new THREE.Vector3(pX, 0.9, pZ).project(cam).x;
}

describe('mobile camera keeps the player in frame', () => {
  it('stays well inside the screen at every lane, curve phase and speed', () => {
    for (const aspect of ASPECTS) {
      for (const pX of LANES) {
        for (let z = 0; z <= 2740; z += 10) {
          for (const sp of [0, 1]) {
            const x = ndcX(aspect, pX, -z, sp);
            expect(Math.abs(x), `aspect ${aspect} lane ${pX} z ${z}`).toBeLessThan(0.8);
          }
        }
      }
    }
  });

  it('does the same with reduced motion', () => {
    for (const pX of LANES) expect(Math.abs(ndcX(0.462, pX, -300, 0.5, true))).toBeLessThan(0.8);
  });

  it('keeps the landscape framing as it was', () => {
    const r = cameraFor(16 / 9, 2.8, -300, 0.5, false);
    expect(r.x).toBeCloseTo(1.4);
    expect(r.back).toBeCloseTo(7.2);
    expect(r.y).toBeCloseTo(3.3);
    expect(r.fov).toBeCloseTo(62);
    expect(r.lookX).toBeCloseTo(2.8 * 0.3 + Math.sin((-300 / 1200) * Math.PI * 2) * 5.5);
  });

  it('widens the view on a tall phone but never past the cap', () => {
    const r = cameraFor(0.43, 0, 0, 1, false);
    expect(r.fov).toBeGreaterThan(70);
    expect(r.fov).toBeLessThanOrEqual(80);
  });
});
