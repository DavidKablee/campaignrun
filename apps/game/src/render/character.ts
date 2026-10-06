import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { CharacterLook, OutfitChoice } from '@cr/content';
import { GeoBuilder, mix, mulberry, shade } from './geo';
import { vcMat } from './materials';

/**
 * Original, stylised-realistic Nigerian characters. Proportions follow an adult
 * figure (about 7.2 heads tall); faces have brows, eyes with iris, nose with
 * nostril wings, full lips, cheeks and ears. Every character is built from a
 * `look` (identity, never a real person) and an `outfit` (player-editable).
 */

export type Detail = 'hi' | 'lo';

export type Pose = 'stand' | 'run' | 'sit' | 'cheer' | 'wave';

export interface CharacterRig {
  group: THREE.Group;
  body: THREE.Group;
  parts: {
    head: THREE.Group;
    torso: THREE.Group;
    armL: THREE.Group;
    armR: THREE.Group;
    elbowL: THREE.Group;
    elbowR: THREE.Group;
    thighL: THREE.Group;
    thighR: THREE.Group;
    shinL: THREE.Group;
    shinR: THREE.Group;
  };
  geometries: THREE.BufferGeometry[];
}

const HY = 0.12; // head centre above the neck pivot
const HIP_Y = 0.94;
const THIGH = 0.45;
const SHIN = 0.46;

function sleeveSpec(top: string) {
  // [upper arm fraction covered, forearm fraction covered]
  switch (top) {
    case 'jacket':
    case 'ankara-shirt':
    case 'rain-cape':
      return [1, 1] as const;
    case 'kaftan':
      return [1, 0.55] as const;
    case 'blouse':
      return [0.55, 0] as const;
    case 'hi-vis':
      return [0, 0] as const;
    default:
      return [0.6, 0] as const; // tee
  }
}

function headGeo(look: CharacterLook, outfit: OutfitChoice, detail: Detail): THREE.BufferGeometry {
  const b = new GeoBuilder();
  if (detail === 'lo') b.segScale = 0.5;
  const hi = detail === 'hi';
  const f = look.face;
  const skin = look.skin;
  const dark = shade(skin, -0.07);
  const lipC = mix(skin, '#7a2230', 0.5);
  const fw = f.width;
  const hairCol = look.hairColor;
  const female = look.gender === 'f';

  // cranium + jaw + chin
  b.sphere(0.115, skin, { y: HY, sx: 0.9 * fw, sy: 1.1, sz: 1.0 }, 14);
  b.sphere(0.1, skin, { y: HY - 0.055, z: 0.012, sx: 0.8 * fw * f.jaw, sy: 0.78, sz: 0.88 }, 12);
  b.sphere(0.03, skin, { y: HY - 0.108, z: 0.07, sx: 1.1 * f.jaw, sy: 0.8, sz: 0.9 }, 8);
  // cheeks
  for (const s of [-1, 1]) b.sphere(0.034, shade(skin, 0.035), { x: s * 0.062 * fw, y: HY - 0.03, z: 0.078, sy: 0.9 }, 8);
  // ears
  for (const s of [-1, 1]) {
    b.sphere(0.026, skin, { x: s * 0.105 * fw, y: HY, z: -0.004, sx: 0.5, sy: 1.15, sz: 0.85 }, 8);
    if (female) b.sphere(0.009, '#f0c75e', { x: s * 0.112 * fw, y: HY - 0.03, z: 0.0 }, 6);
  }
  // eyes: white, iris, pupil, lid line
  for (const s of [-1, 1]) {
    const ex = s * 0.04 * fw;
    b.sphere(0.02 * f.eye, '#f4f1ea', { x: ex, y: HY + 0.012, z: 0.099, sx: 1.25, sy: 0.82, sz: 0.55 }, 8);
    b.sphere(0.0125 * f.eye, '#2a1a12', { x: ex, y: HY + 0.012, z: 0.108, sz: 0.5 }, 8);
    if (hi) b.sphere(0.006 * f.eye, '#0a0705', { x: ex, y: HY + 0.012, z: 0.112, sz: 0.4 }, 6);
    if (hi) b.box(0.046 * f.eye, 0.006, 0.012, dark, { x: ex, y: HY + 0.03, z: 0.1, rz: s * -0.12 });
    if (hi && female) b.box(0.05 * f.eye, 0.004, 0.01, '#0a0705', { x: ex, y: HY + 0.026, z: 0.104, rz: s * -0.12 });
    // brows
    b.box(0.055, 0.006 + 0.007 * f.brow, 0.012, hairCol, {
      x: s * 0.043 * fw,
      y: HY + 0.05 + (female ? 0.004 : 0),
      z: 0.098,
      rz: s * -0.1,
    });
  }
  // nose: bridge + tip + nostril wings
  b.box(0.014 * f.nose, 0.05, 0.014, shade(skin, 0.01), { y: HY - 0.002, z: 0.108, rx: -0.25 });
  b.sphere(0.0235, shade(skin, 0.02), { y: HY - 0.03, z: 0.114, sx: 1.05 * f.nose, sy: 0.95, sz: 1.0 }, 8);
  for (const s of [-1, 1]) b.sphere(0.0135, skin, { x: s * 0.02 * f.nose, y: HY - 0.037, z: 0.104, sx: 0.9 }, 6);
  if (hi) for (const s of [-1, 1]) b.sphere(0.005, '#1a0e09', { x: s * 0.0105 * f.nose, y: HY - 0.043, z: 0.126 }, 4);
  // lips
  b.sphere(0.03, shade(lipC, -0.05), { y: HY - 0.063, z: 0.104, sx: 1.25 * f.lips, sy: 0.3 * f.lips, sz: 0.5 }, 8);
  b.sphere(0.032, lipC, { y: HY - 0.075, z: 0.1, sx: 1.2 * f.lips, sy: 0.34 * f.lips, sz: 0.55 }, 8);
  if (hi) b.box(0.04 * f.lips, 0.0035, 0.01, '#3a0f14', { y: HY - 0.0685, z: 0.108 });

  // facial hair
  if (look.facialHair === 'moustache' || look.facialHair === 'beard' || look.facialHair === 'goatee') {
    b.box(0.07, 0.014, 0.02, hairCol, { y: HY - 0.054, z: 0.108 });
  }
  if (look.facialHair === 'goatee') b.sphere(0.03, hairCol, { y: HY - 0.105, z: 0.075, sx: 0.9, sy: 1.1, sz: 0.8 }, 8);
  if (look.facialHair === 'beard') {
    b.sphere(0.1, hairCol, { y: HY - 0.082, z: 0.022, sx: 0.88 * fw, sy: 0.5, sz: 0.82 }, 12);
    for (const s of [-1, 1]) b.box(0.016, 0.07, 0.05, hairCol, { x: s * 0.088 * fw, y: HY - 0.03, z: 0.02 });
  }

  // hair
  const hw = outfit.headwear;
  const hairHidden = hw === 'headtie';
  if (!hairHidden) {
    switch (look.hair) {
      case 'short':
        b.cap(0.122, 1.75, hairCol, { y: HY + 0.008, rx: -0.75, sx: 0.93 * fw, sy: 1.1, sz: 1.04 }, 12);
        break;
      case 'natural':
        b.cap(0.132, 1.9, hairCol, { y: HY + 0.012, rx: -0.65, sx: 0.95 * fw, sy: 1.12, sz: 1.06 }, 12);
        break;
      case 'afro':
        b.cap(0.165, 2.1, hairCol, { y: HY + 0.02, rx: -0.5, sx: 1.0 * fw, sy: 1.05, sz: 1.0 }, 12);
        break;
      case 'braids':
        b.cap(0.124, 1.8, hairCol, { y: HY + 0.01, rx: -0.7, sx: 0.94 * fw, sy: 1.1, sz: 1.04 }, 12);
        for (let i = 0; i < 9; i++) {
          const a = -0.9 + (i / 8) * 1.8;
          const x = Math.sin(a) * 0.11 * fw;
          const z = -Math.cos(a) * 0.1;
          b.cyl(0.012, 0.008, 0.3, hairCol, { x, y: HY - 0.1, z, rx: 0.05, rz: -a * 0.08 }, 5);
        }
        break;
      default:
        break;
    }
  }

  // headwear
  const hc = outfit.headColor;
  switch (hw) {
    case 'headtie': {
      b.sphere(0.155, hc, { y: HY + 0.045, z: 0.01, sx: 1.18 * fw, sy: 0.85, sz: 1.15 }, 12);
      b.torus(0.13, 0.04, shade(hc, -0.08), { y: HY + 0.01, rx: Math.PI / 2, sx: 1.2 * fw }, Math.PI * 2, 14);
      b.box(0.22, 0.16, 0.045, shade(hc, -0.06), { x: 0.1, y: HY + 0.14, z: 0.09, rz: -0.55, ry: 0.2 });
      b.box(0.2, 0.15, 0.045, hc, { x: -0.02, y: HY + 0.15, z: 0.1, rz: 0.45, ry: -0.15 });
      b.sphere(0.055, shade(hc, 0.1), { x: 0.05, y: HY + 0.11, z: 0.12 }, 8);
      break;
    }
    case 'cap':
      b.cap(0.127, 1.65, hc, { y: HY + 0.015, rx: -0.5, sx: 0.93 * fw, sy: 1.08, sz: 1.04 }, 12);
      b.box(0.13, 0.012, 0.1, shade(hc, -0.1), { y: HY + 0.052, z: 0.13, rx: 0.15 });
      break;
    case 'hardhat':
      b.cap(0.138, 1.9, hc, { y: HY + 0.02, rx: -0.4, sx: 0.95 * fw, sy: 1.0, sz: 1.06 }, 12);
      b.cyl(0.155, 0.155, 0.014, shade(hc, -0.06), { y: HY + 0.055, z: 0.012, sz: 1.12 }, 16);
      b.box(0.03, 0.02, 0.26, shade(hc, -0.1), { y: HY + 0.158, z: -0.005 });
      break;
    case 'sailor':
      b.cyl(0.125 * fw, 0.115 * fw, 0.075, hc, { y: HY + 0.095, sz: 1.05 }, 14);
      b.cyl(0.14 * fw, 0.14 * fw, 0.016, hc, { y: HY + 0.136, sz: 1.05 }, 14);
      b.cyl(0.119 * fw, 0.119 * fw, 0.02, '#1a2a44', { y: HY + 0.07, sz: 1.05 }, 14);
      b.sphere(0.014, '#f0b429', { y: HY + 0.095, z: 0.13 }, 6);
      break;
    case 'headphones':
      b.torus(0.128 * fw, 0.011, hc, { y: HY + 0.005, ry: 0 }, Math.PI, 14);
      for (const s of [-1, 1]) b.cyl(0.046, 0.046, 0.034, shade(hc, -0.15), { x: s * 0.128 * fw, y: HY, rz: Math.PI / 2 }, 12);
      break;
    default:
      break;
  }

  if (look.accessory === 'goggles') {
    const gy = HY + 0.085;
    for (const s of [-1, 1]) {
      b.torus(0.029, 0.007, '#8a6a2f', { x: s * 0.04, y: gy, z: 0.122 }, Math.PI * 2, 10);
      b.cyl(0.026, 0.026, 0.004, '#7fd4e8', { x: s * 0.04, y: gy, z: 0.122, rx: Math.PI / 2 }, 10);
    }
    b.box(0.03, 0.01, 0.01, '#8a6a2f', { y: gy, z: 0.124 });
    b.cyl(0.118 * fw, 0.118 * fw, 0.014, '#3a2f22', { y: gy, sz: 1.04 }, 14);
  }

  const g = b.build()!;
  return g;
}

function torsoGeo(look: CharacterLook, outfit: OutfitChoice, detail: Detail): THREE.BufferGeometry {
  const b = new GeoBuilder();
  if (detail === 'lo') b.segScale = 0.55;
  const f = look.gender === 'f';
  const sw = (f ? 0.9 : 1) * Math.pow(look.build, 0.5);
  const hw = (f ? 1.12 : 1) * Math.pow(look.build, 0.6);
  const skin = look.skin;
  const tc = outfit.topColor;
  const bc = outfit.bottomColor;
  const top = outfit.top;

  // neck + collarbone
  b.cyl(0.052, 0.058, 0.13, skin, { y: 1.47 }, 8);
  b.sphere(0.07, skin, { y: 1.43, sx: 1.7 * sw, sy: 0.35, sz: 0.8 }, 8);

  const bodyCol = top === 'hi-vis' ? '#8a8f96' : tc;
  // chest
  b.cyl(0.17 * sw, 0.14 * hw, 0.53, bodyCol, { y: 1.18, sz: 0.62 }, 12);
  // pelvis
  const pelvisCol = outfit.bottom === 'wrapper' ? bc : bc;
  b.cyl(0.14 * hw, 0.15 * hw, 0.16, pelvisCol, { y: 0.97, sz: 0.66 }, 12);
  b.cyl(0.146 * hw, 0.146 * hw, 0.035, shade(bc, -0.18), { y: 1.04, sz: 0.67 }, 12); // belt

  switch (top) {
    case 'hi-vis':
      b.cyl(0.178 * sw, 0.148 * hw, 0.5, tc, { y: 1.19, sz: 0.66 }, 12);
      b.cyl(0.181 * sw, 0.15 * hw, 0.035, '#d9dde0', { y: 1.1, sz: 0.66 }, 12);
      b.cyl(0.184 * sw, 0.17 * sw, 0.035, '#d9dde0', { y: 1.3, sz: 0.66 }, 12);
      break;
    case 'jacket':
      b.cyl(0.18 * sw, 0.15 * hw, 0.53, tc, { y: 1.18, sz: 0.66 }, 12);
      b.cyl(0.152 * hw, 0.152 * hw, 0.05, shade(tc, -0.15), { y: 0.95, sz: 0.68 }, 12);
      b.torus(0.07, 0.02, shade(tc, -0.1), { y: 1.45, rx: Math.PI / 2, sz: 1.1 }, Math.PI * 2, 10);
      b.box(0.012, 0.5, 0.012, shade(tc, -0.3), { y: 1.18, z: 0.108 });
      for (const s of [-1, 1]) b.box(0.07, 0.03, 0.02, shade(tc, -0.12), { x: s * 0.09, y: 1.02, z: 0.1 });
      break;
    case 'kaftan':
      b.cyl(0.178 * sw, 0.27 * hw, 0.9, tc, { y: 1.0, sz: 0.72 }, 12);
      b.cyl(0.272 * hw, 0.272 * hw, 0.05, '#f0c75e', { y: 0.56, sz: 0.72 }, 12);
      b.box(0.05, 0.3, 0.012, '#f0c75e', { y: 1.28, z: 0.115 });
      break;
    case 'rain-cape':
      b.cyl(0.11 * sw, 0.38 * hw, 0.94, tc, { y: 0.99, sz: 0.85 }, 12);
      b.torus(0.095, 0.04, shade(tc, 0.06), { y: 1.47, rx: Math.PI / 2 }, Math.PI * 2, 10);
      b.sphere(0.12, shade(tc, -0.06), { y: 1.5, z: -0.09, sx: 1.0, sy: 0.9, sz: 0.7 }, 8);
      for (let i = 0; i < 6; i++) b.cyl(0.004, 0.004, 0.2, '#fff', { x: -0.2 + i * 0.08, y: 0.9, z: 0.31, rx: 0.1, rz: 0.2 }, 3);
      break;
    case 'blouse':
      b.cyl(0.152 * hw, 0.23 * hw, 0.16, tc, { y: 0.97, sz: 0.72 }, 12);
      b.torus(0.066, 0.016, '#f0c75e', { y: 1.45, rx: Math.PI / 2, sz: 1.1 }, Math.PI * 2, 10);
      for (let i = 0; i < 3; i++) b.cyl(0.171 * sw, 0.171 * sw, 0.022, shade(tc, 0.18), { y: 1.1 + i * 0.1, sz: 0.63 }, 12);
      break;
    case 'ankara-shirt':
      for (let i = 0; i < 4; i++) b.cyl(0.172 * sw, 0.158 * hw, 0.04, i % 2 ? '#f0c75e' : shade(tc, -0.2), { y: 1.0 + i * 0.12, sz: 0.63 }, 12);
      b.torus(0.07, 0.018, shade(tc, -0.25), { y: 1.45, rx: Math.PI / 2, sz: 1.1 }, Math.PI * 2, 10);
      break;
    default:
      b.torus(0.066, 0.016, shade(tc, -0.12), { y: 1.45, rx: Math.PI / 2, sz: 1.1 }, Math.PI * 2, 10);
      break;
  }

  // bottoms detail at the hips
  if (outfit.bottom === 'wrapper') {
    b.cyl(0.16 * hw, 0.3 * hw, 0.72, bc, { y: 0.66, sz: 0.78 }, 12);
    for (let i = 0; i < 3; i++) b.cyl(0.24 * hw + i * 0.018, 0.25 * hw + i * 0.018, 0.04, i % 2 ? '#f0c75e' : shade(bc, -0.22), { y: 0.5 - i * 0.12 + 0.06, sz: 0.78 }, 12);
  }

  // accessories
  if (look.accessory === 'bowtie') {
    b.cone(0.03, 0.05, '#e8a87c', { x: -0.035, y: 1.4, z: 0.1, rz: Math.PI / 2 }, 6);
    b.cone(0.03, 0.05, '#e8a87c', { x: 0.035, y: 1.4, z: 0.1, rz: -Math.PI / 2 }, 6);
    b.sphere(0.012, '#c98a5e', { y: 1.4, z: 0.105 }, 6);
  }
  if (look.prop === 'pouch') {
    b.sphere(0.055, '#8b5a2b', { x: 0.14 * hw, y: 0.98, z: 0.07, sy: 1.1 }, 8);
    b.box(0.05, 0.015, 0.03, '#f0b429', { x: 0.14 * hw, y: 1.04, z: 0.07 });
  }
  if (look.prop === 'speaker') {
    b.box(0.015, 0.04, 0.5, '#2a2a2a', { x: 0.1, y: 1.24, z: 0.0, rz: 0.7 }, );
  }

  return b.build()!;
}

function armGeos(look: CharacterLook, outfit: OutfitChoice, detail: Detail) {
  const skin = look.skin;
  const sc = outfit.top === 'hi-vis' ? skin : outfit.topColor;
  const [upFrac, loFrac] = sleeveSpec(outfit.top);
  const f = look.gender === 'f';
  const thin = f ? 0.88 : 1;
  const upper = new GeoBuilder();
  const lo = new GeoBuilder();
  if (detail === 'lo') upper.segScale = lo.segScale = 0.55;
  // upper arm 0.28
  const upLen = 0.28;
  upper.sphere(0.058 * thin, upFrac > 0 ? sc : skin, { y: 0 }, 8);
  upper.cyl(0.05 * thin, 0.042 * thin, upLen, skin, { y: -upLen / 2 }, 8);
  if (upFrac > 0) {
    const l = upLen * upFrac;
    upper.cyl(0.056 * thin, 0.05 * thin + 0.002, l, sc, { y: -l / 2 }, 8);
  }
  // forearm 0.26 + hand
  const loLen = 0.26;
  lo.sphere(0.042 * thin, skin, { y: 0 }, 8);
  lo.cyl(0.041 * thin, 0.031 * thin, loLen, skin, { y: -loLen / 2 }, 8);
  if (loFrac > 0) {
    const l = loLen * loFrac;
    lo.cyl(0.046 * thin, 0.04 * thin + 0.004, l, sc, { y: -l / 2 }, 8);
  }
  lo.sphere(0.04 * thin, skin, { y: -loLen - 0.025, sx: 0.9, sy: 1.2, sz: 0.7 }, 8);
  lo.box(0.014, 0.04, 0.02, skin, { x: 0.03, y: -loLen - 0.01, z: 0.02 });
  return { upper: upper.build()!, lower: lo.build()! };
}

function legGeos(look: CharacterLook, outfit: OutfitChoice, detail: Detail) {
  const skin = look.skin;
  const bc = outfit.bottomColor;
  const f = look.gender === 'f';
  const hw = (f ? 1.1 : 1) * Math.pow(look.build, 0.5);
  const bottom = outfit.bottom;
  const thighCol = bottom === 'wrapper' ? skin : bc;
  const shinCol = bottom === 'shorts' || bottom === 'wrapper' ? skin : bc;

  const thigh = new GeoBuilder();
  if (detail === 'lo') thigh.segScale = 0.55;
  thigh.sphere(0.075 * hw, thighCol, { y: 0 }, 8);
  thigh.cyl(0.082 * hw, 0.06, THIGH, thighCol, { y: -THIGH / 2 }, 9);
  if (bottom === 'shorts') thigh.cyl(0.085 * hw, 0.07, THIGH * 0.62, bc, { y: -THIGH * 0.31 }, 9);
  if (bottom === 'work') thigh.box(0.02, 0.1, 0.07, shade(bc, -0.15), { x: 0.07 * hw, y: -0.2 });

  const shin = new GeoBuilder();
  if (detail === 'lo') shin.segScale = 0.55;
  shin.sphere(0.06, shinCol, { y: 0 }, 8);
  shin.cyl(0.058, 0.042, SHIN - 0.02, shinCol, { y: -(SHIN - 0.02) / 2 }, 9);
  if (bottom === 'work') shin.box(0.09, 0.07, 0.03, shade(bc, -0.12), { y: -0.04, z: 0.05 });
  if (bottom !== 'shorts' && bottom !== 'wrapper') shin.cyl(0.048, 0.048, 0.025, shade(bc, -0.12), { y: -SHIN + 0.04 }, 9);

  // footwear (ground at y = -(THIGH+SHIN...) relative to knee = -0.49 + 0.03)
  const gy = -(HIP_Y - THIGH); // ground relative to knee
  const fc = outfit.footColor;
  const zc = 0.05;
  switch (outfit.footwear) {
    case 'sandals':
      shin.box(0.1, 0.022, 0.27, fc, { y: gy + 0.011, z: zc });
      shin.box(0.085, 0.035, 0.2, skin, { y: gy + 0.04, z: zc + 0.02 });
      shin.box(0.095, 0.012, 0.03, fc, { y: gy + 0.058, z: zc + 0.03 });
      shin.box(0.095, 0.012, 0.03, fc, { y: gy + 0.058, z: zc - 0.03 });
      for (const s of [-1, 1]) shin.sphere(0.012, skin, { x: s * 0.03, y: gy + 0.048, z: zc + 0.13 }, 5);
      break;
    case 'boots':
      shin.box(0.108, 0.035, 0.28, '#1a1410', { y: gy + 0.0175, z: zc });
      shin.box(0.1, 0.08, 0.22, fc, { y: gy + 0.075, z: zc + 0.015 });
      shin.cyl(0.056, 0.058, 0.2, fc, { y: gy + 0.19 }, 9);
      shin.cyl(0.06, 0.06, 0.018, shade(fc, -0.15), { y: gy + 0.29 }, 9);
      break;
    case 'shoes':
      shin.box(0.108, 0.025, 0.28, '#0d0d0d', { y: gy + 0.0125, z: zc });
      shin.box(0.095, 0.06, 0.24, fc, { y: gy + 0.055, z: zc + 0.015 });
      shin.sphere(0.05, fc, { y: gy + 0.05, z: zc + 0.13, sy: 0.7, sz: 1.1 }, 8);
      break;
    case 'slippers':
      shin.box(0.1, 0.02, 0.27, fc, { y: gy + 0.01, z: zc });
      shin.box(0.085, 0.032, 0.18, skin, { y: gy + 0.036, z: zc + 0.03 });
      shin.box(0.1, 0.014, 0.05, shade(fc, 0.1), { y: gy + 0.05, z: zc + 0.07 });
      break;
    default: // sneakers
      shin.box(0.112, 0.038, 0.29, '#f4f1ea', { y: gy + 0.019, z: zc });
      shin.box(0.1, 0.06, 0.22, fc, { y: gy + 0.068, z: zc + 0.02 });
      shin.sphere(0.052, fc, { y: gy + 0.062, z: zc + 0.13, sy: 0.7, sz: 1.1 }, 8);
      shin.box(0.103, 0.012, 0.07, '#f4f1ea', { y: gy + 0.088, z: zc + 0.05 });
      break;
  }
  return { thigh: thigh.build()!, shin: shin.build()! };
}

function propGeo(kind: string): THREE.BufferGeometry | null {
  const b = new GeoBuilder();
  switch (kind) {
    case 'fan': // hand fan: handle + round face
      b.cyl(0.012, 0.012, 0.16, '#6b4a2b', { y: -0.04 }, 5);
      b.cyl(0.11, 0.11, 0.012, '#e0902b', { y: 0.08, rz: Math.PI / 2, ry: 0.0 }, 14);
      b.cyl(0.075, 0.075, 0.014, '#2a6f97', { y: 0.08, rz: Math.PI / 2 }, 14);
      break;
    case 'wrench':
      b.cyl(0.014, 0.014, 0.34, '#9aa3ab', { y: -0.02, rx: Math.PI / 2 }, 6);
      b.box(0.04, 0.07, 0.03, '#9aa3ab', { y: -0.02, z: 0.19 });
      b.box(0.012, 0.03, 0.03, '#2a2a2a', { y: -0.02, z: 0.215 });
      break;
    case 'lantern':
      b.cyl(0.006, 0.006, 0.08, '#2a2a2a', { y: 0.05 }, 4);
      b.box(0.09, 0.12, 0.09, '#d9a441', { y: -0.1 });
      b.box(0.075, 0.1, 0.075, '#ffe9a0', { y: -0.1 });
      b.box(0.1, 0.02, 0.1, '#2a2a2a', { y: -0.17 });
      b.box(0.1, 0.02, 0.1, '#2a2a2a', { y: -0.03 });
      break;
    case 'speaker':
      b.box(0.36, 0.2, 0.14, '#22262e', { y: -0.1, rz: 0.0 });
      for (const s of [-1, 1]) {
        b.cyl(0.07, 0.07, 0.016, '#8a8f99', { x: s * 0.09, y: -0.1, z: 0.075, rx: Math.PI / 2 }, 12);
        b.cyl(0.03, 0.03, 0.02, '#111', { x: s * 0.09, y: -0.1, z: 0.08, rx: Math.PI / 2 }, 8);
      }
      b.cyl(0.006, 0.006, 0.2, '#999', { x: 0.14, y: 0.06, rz: -0.6 }, 4);
      break;
    case 'baton':
      b.cyl(0.01, 0.007, 0.34, '#e8e1d0', { y: -0.02, rx: Math.PI / 2 - 0.4, z: 0.1 }, 6);
      b.sphere(0.014, '#c98a5e', { y: 0.08, z: -0.03 }, 6);
      break;
    default:
      return null;
  }
  return b.build();
}

export function buildCharacter(look: CharacterLook, outfit: OutfitChoice, detail: Detail = 'hi'): CharacterRig {
  const mat = vcMat();
  const geometries: THREE.BufferGeometry[] = [];
  const mesh = (g: THREE.BufferGeometry) => {
    geometries.push(g);
    return new THREE.Mesh(g, mat);
  };
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const f = look.gender === 'f';
  const sw = (f ? 0.9 : 1) * Math.pow(look.build, 0.5);
  const hipX = 0.09 * (f ? 1.12 : 1) * Math.pow(look.build, 0.5);

  const torso = new THREE.Group();
  torso.position.y = 0;
  torso.add(mesh(torsoGeo(look, outfit, detail)));
  body.add(torso);

  const head = new THREE.Group();
  head.position.set(0, 1.5, 0);
  head.add(mesh(headGeo(look, outfit, detail)));
  torso.add(head);

  const arms = armGeos(look, outfit, detail);
  const mkArm = (side: 1 | -1) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.2 * sw, 1.41, 0);
    arm.add(mesh(arms.upper.clone()));
    const elbow = new THREE.Group();
    elbow.position.y = -0.28;
    elbow.add(mesh(arms.lower.clone()));
    arm.add(elbow);
    torso.add(arm);
    return { arm, elbow };
  };
  const L = mkArm(-1);
  const R = mkArm(1);
  const prop = propGeo(look.prop);
  if (prop) {
    const pm = mesh(prop);
    pm.position.set(0, -0.3, 0.02);
    R.elbow.add(pm);
  }

  const legs = legGeos(look, outfit, detail);
  const mkLeg = (side: 1 | -1) => {
    const thigh = new THREE.Group();
    thigh.position.set(side * hipX, HIP_Y, 0);
    thigh.add(mesh(legs.thigh.clone()));
    const shin = new THREE.Group();
    shin.position.y = -THIGH;
    shin.add(mesh(legs.shin.clone()));
    thigh.add(shin);
    body.add(thigh);
    return { thigh, shin };
  };
  const LL = mkLeg(-1);
  const RL = mkLeg(1);

  group.scale.setScalar(look.height);
  arms.upper.dispose();
  arms.lower.dispose();
  legs.thigh.dispose();
  legs.shin.dispose();

  return {
    group,
    body,
    parts: {
      head,
      torso,
      armL: L.arm,
      armR: R.arm,
      elbowL: L.elbow,
      elbowR: R.elbow,
      thighL: LL.thigh,
      thighR: RL.thigh,
      shinL: LL.shin,
      shinR: RL.shin,
    },
    geometries,
  };
}

/** Pose / animate. t is seconds; speed01 scales stride. Renderer-only (uses Math.sin freely). */
export function poseCharacter(rig: CharacterRig, pose: Pose, t: number, speed01 = 1) {
  const p = rig.parts;
  const set = (g: THREE.Object3D, x = 0, y = 0, z = 0) => g.rotation.set(x, y, z);
  rig.body.position.y = 0;
  switch (pose) {
    case 'run': {
      const ph = t * (8 + speed01 * 4);
      const s = Math.sin(ph);
      set(p.thighL, -s * 0.95);
      set(p.thighR, s * 0.95);
      set(p.shinL, Math.max(0, -s) * 1.3 + 0.12);
      set(p.shinR, Math.max(0, s) * 1.3 + 0.12);
      set(p.armL, s * 0.85, 0, 0.08);
      set(p.armR, -s * 0.85, 0, -0.08);
      set(p.elbowL, -1.0);
      set(p.elbowR, -1.0);
      set(p.torso, 0.14, Math.sin(ph) * 0.1);
      set(p.head, -0.1, -Math.sin(ph) * 0.1);
      rig.body.position.y = Math.abs(Math.cos(ph)) * 0.06;
      break;
    }
    case 'sit': {
      set(p.thighL, -1.3, 0, -0.12);
      set(p.thighR, -1.3, 0, 0.12);
      set(p.shinL, 1.35);
      set(p.shinR, 1.35);
      set(p.armL, -0.95, 0, 0.18);
      set(p.armR, -0.95, 0, -0.18);
      set(p.elbowL, -0.5);
      set(p.elbowR, -0.5);
      set(p.torso, 0.18);
      set(p.head, -0.15);
      break;
    }
    case 'cheer': {
      const b = Math.sin(t * 9) * 0.25;
      set(p.thighL, 0);
      set(p.thighR, 0);
      set(p.shinL, 0);
      set(p.shinR, 0);
      set(p.armL, -2.7 + b, 0, 0.3);
      set(p.armR, -2.7 - b, 0, -0.3);
      set(p.elbowL, -0.25);
      set(p.elbowR, -0.25);
      set(p.torso, 0);
      set(p.head, -0.1);
      rig.body.position.y = Math.abs(Math.sin(t * 9)) * 0.05;
      break;
    }
    case 'wave': {
      set(p.thighL, 0);
      set(p.thighR, 0);
      set(p.shinL, 0);
      set(p.shinR, 0);
      set(p.armL, 0.05, 0, 0.1);
      set(p.armR, -2.5, 0, -0.35 + Math.sin(t * 7) * 0.3);
      set(p.elbowL, -0.15);
      set(p.elbowR, -0.4);
      set(p.torso, 0);
      set(p.head, 0.05, Math.sin(t * 1.5) * 0.15);
      break;
    }
    default: {
      const br = Math.sin(t * 1.6);
      set(p.thighL, 0, 0, -0.03);
      set(p.thighR, 0, 0, 0.03);
      set(p.shinL, 0);
      set(p.shinR, 0);
      set(p.armL, 0.04 + br * 0.02, 0, 0.1);
      set(p.armR, -0.15 + br * 0.02, 0, -0.1);
      set(p.elbowL, -0.18);
      set(p.elbowR, -0.55);
      set(p.torso, br * 0.01);
      set(p.head, 0, Math.sin(t * 0.7) * 0.05);
      rig.body.position.y = br * 0.004;
      break;
    }
  }
}

export function disposeRig(rig: CharacterRig) {
  for (const g of rig.geometries) g.dispose();
  rig.geometries.length = 0;
}

/** Bake a posed rig into ONE vertex-coloured geometry (crowds / statics). */
export function bakeCharacter(look: CharacterLook, outfit: OutfitChoice, pose: Pose, t = 0, detail: Detail = 'lo'): THREE.BufferGeometry {
  const rig = buildCharacter(look, outfit, detail);
  poseCharacter(rig, pose, t, 1);
  rig.group.updateMatrixWorld(true);
  const list: THREE.BufferGeometry[] = [];
  rig.group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      const g = (o.geometry as THREE.BufferGeometry).clone();
      g.applyMatrix4(o.matrixWorld);
      list.push(g);
    }
  });
  const merged = mergeGeometries(list, false)!;
  for (const g of list) g.dispose();
  disposeRig(rig);
  merged.computeBoundingSphere();
  return merged;
}

/** Deterministic random everyday person (not tied to any real individual). */
export function randomPerson(
  seed: number,
  options: { colors: string[] },
): { look: CharacterLook; outfit: OutfitChoice } {
  const r = mulberry(seed * 7919 + 17);
  const female = r.chance(0.5);
  const skins = ['#3B2417', '#4A2C1B', '#5C3A24', '#6A4129', '#7A4B2E', '#8D5A3B'];
  const look: CharacterLook = {
    gender: female ? 'f' : 'm',
    skin: r.pick(skins),
    hair: female ? r.pick(['braids', 'natural', 'short'] as const) : r.pick(['short', 'short', 'bald', 'afro'] as const),
    hairColor: '#15100d',
    facialHair: !female && r.chance(0.3) ? r.pick(['moustache', 'goatee', 'beard'] as const) : 'none',
    face: {
      width: r.range(0.92, 1.1),
      jaw: r.range(0.9, 1.1),
      nose: r.range(0.9, 1.2),
      lips: r.range(0.9, 1.2),
      brow: r.range(0.9, 1.1),
      eye: r.range(0.95, 1.1),
    },
    height: female ? r.range(0.9, 0.99) : r.range(0.96, 1.05),
    build: r.range(0.9, 1.15),
    prop: 'none',
    accessory: 'none',
  };
  const outfit: OutfitChoice = {
    top: female ? r.pick(['blouse', 'tee', 'ankara-shirt', 'kaftan']) : r.pick(['tee', 'tee', 'ankara-shirt', 'kaftan', 'jacket']),
    topColor: r.pick(options.colors),
    bottom: female ? r.pick(['wrapper', 'jeans', 'trousers']) : r.pick(['jeans', 'trousers', 'shorts']),
    bottomColor: r.pick(['#2f4a6b', '#1b2b3a', '#3A4A5A', '#161616', '#2A6F97', '#8B5A2B']),
    footwear: r.pick(['sandals', 'sneakers', 'slippers', 'shoes']),
    footColor: r.pick(['#F3E3C3', '#161616', '#E0902B', '#1F5F8B']),
    headwear: female && r.chance(0.3) ? 'headtie' : r.chance(0.12) ? 'cap' : 'none',
    headColor: r.pick(options.colors),
  };
  return { look, outfit };
}
