import * as THREE from 'three';
import { mulberry } from './geo';

/** All textures are painted procedurally on canvases: zero download weight. */

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  return { c, ctx };
}

function toTex(c: HTMLCanvasElement, repeat = true): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
  }
  return t;
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, n: number, alpha: number, seed: number) {
  const r = mulberry(seed);
  for (let i = 0; i < n; i++) {
    const v = r.next() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgba(${v},${v},${v},${r.range(0.02, alpha)})`;
    ctx.fillRect(r.range(0, w), r.range(0, h), r.range(1, 3), r.range(1, 3));
  }
}

const cache = new Map<string, THREE.Texture>();
function memo(key: string, make: () => THREE.Texture): THREE.Texture {
  let t = cache.get(key);
  if (!t) {
    t = make();
    cache.set(key, t);
  }
  return t;
}

/**
 * Road strip: 18 m wide (x) by 8 m long (v). Three lanes of 2.8 m, painted
 * kerbs, and block-paved sidewalks either side.
 */
export function roadTexture() {
  return memo('road', () => {
    const W = 1024;
    const H = 512;
    const { c, ctx } = canvas(W, H);
    const px = (x: number) => ((x + 9) / 18) * W;
    const pz = (z: number) => (z / 8) * H;
    // asphalt
    ctx.fillStyle = '#3d3f45';
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, 9000, 0.12, 11);
    // worn tyre tracks per lane
    for (const lx of [-2.8, 0, 2.8]) {
      for (const off of [-0.55, 0.55]) {
        const g = ctx.createLinearGradient(px(lx + off - 0.3), 0, px(lx + off + 0.3), 0);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(0.5, 'rgba(255,255,255,0.06)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(px(lx + off - 0.3), 0, px(0.6) - px(0), H);
      }
    }
    // patches + oil stains
    const r = mulberry(5);
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = `rgba(20,20,24,${r.range(0.12, 0.3)})`;
      ctx.beginPath();
      ctx.ellipse(r.range(px(-4), px(4)), r.range(0, H), r.range(10, 40), r.range(8, 26), r.range(0, 3), 0, 6.3);
      ctx.fill();
    }
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = 'rgba(70,72,78,0.5)';
      ctx.fillRect(r.range(px(-4), px(3)), r.range(0, H - 30), r.range(40, 90), r.range(10, 26));
    }
    // sidewalks: paving blocks
    for (const side of [-1, 1]) {
      const x0 = side < 0 ? 0 : px(5.0);
      const x1 = side < 0 ? px(-5.0) : W;
      ctx.fillStyle = '#b4aea0';
      ctx.fillRect(x0, 0, x1 - x0, H);
      ctx.strokeStyle = 'rgba(60,55,45,0.35)';
      ctx.lineWidth = 2;
      for (let z = 0; z <= 8; z += 0.5) {
        ctx.beginPath();
        ctx.moveTo(x0, pz(z));
        ctx.lineTo(x1, pz(z));
        ctx.stroke();
      }
      for (let x = Math.min(x0, x1); x < Math.max(x0, x1); x += px(0.5) - px(0)) {
        for (let z = 0; z < 8; z += 1) {
          const off = (Math.floor(z) % 2) * 0.25;
          const xx = x + (px(off) - px(0));
          ctx.beginPath();
          ctx.moveTo(xx, pz(z));
          ctx.lineTo(xx, pz(z + 0.5));
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(xx + (px(0.25) - px(0)), pz(z + 0.5));
          ctx.lineTo(xx + (px(0.25) - px(0)), pz(z + 1));
          ctx.stroke();
        }
      }
      speckle(ctx, W, H, 3000, 0.1, 21 + side);
    }
    // painted kerb (black / white blocks, 1 m)
    for (const side of [-1, 1]) {
      const x = side < 0 ? px(-5.0) : px(4.7);
      for (let z = 0; z < 8; z++) {
        ctx.fillStyle = z % 2 ? '#f2efe6' : '#16161a';
        ctx.fillRect(x, pz(z), px(0.3) - px(0), pz(1));
      }
    }
    // edge lines + lane dashes
    ctx.fillStyle = '#efe9d8';
    for (const side of [-1, 1]) ctx.fillRect(px(side * 4.45 - 0.08), 0, px(0.16) - px(0), H);
    for (const lx of [-1.4, 1.4]) {
      for (let z = 0; z < 8; z += 4) ctx.fillRect(px(lx - 0.07), pz(z), px(0.14) - px(0), pz(2.6));
    }
    return toTex(c);
  });
}

const WALLS = ['#e6d6b0', '#c9794f', '#7ea5b6', '#d6a23f', '#8fae88', '#e2b3aa'];

/** One window bay x one floor: 3.5 m x 3 m. Burglar-proof bars, stained paint. */
export function facadeTexture(variant: number) {
  const v = variant % WALLS.length;
  return memo(`facade${v}`, () => {
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(100 + v);
    ctx.fillStyle = WALLS[v]!;
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1600, 0.12, 40 + v);
    // rain streaks
    for (let i = 0; i < 14; i++) {
      const x = r.range(0, 256);
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, 'rgba(60,45,30,0.0)');
      g.addColorStop(1, `rgba(60,45,30,${r.range(0.05, 0.16)})`);
      ctx.fillStyle = g;
      ctx.fillRect(x, 0, r.range(2, 9), 256);
    }
    // paint bands
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(0, 0, 256, 10);
    ctx.fillRect(0, 246, 256, 10);
    // window
    const wx = 78;
    const wy = 70;
    const ww = 100;
    const wh = 120;
    ctx.fillStyle = '#5b4a3a';
    ctx.fillRect(wx - 6, wy - 6, ww + 12, wh + 12);
    const glass = ctx.createLinearGradient(0, wy, 0, wy + wh);
    glass.addColorStop(0, '#6fa0b9');
    glass.addColorStop(1, '#27424f');
    ctx.fillStyle = glass;
    ctx.fillRect(wx, wy, ww, wh);
    // louvres
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let y = wy + 6; y < wy + wh; y += 14) ctx.fillRect(wx, y, ww, 3);
    // burglar bars
    ctx.fillStyle = '#1b1b1b';
    for (let x = wx + 10; x < wx + ww; x += 20) ctx.fillRect(x, wy, 4, wh);
    ctx.fillRect(wx, wy + wh / 2 - 2, ww, 4);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(wx - 10, wy + wh + 6, ww + 20, 8); // sill
    if (v % 2 === 0) {
      // AC unit
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(196, 110, 46, 30);
      ctx.fillStyle = '#9a9a9a';
      ctx.fillRect(200, 118, 38, 4);
      ctx.fillRect(200, 126, 38, 4);
    }
    // drain pipe
    ctx.fillStyle = 'rgba(40,40,40,0.55)';
    ctx.fillRect(8, 0, 8, 256);
    return toTex(c);
  });
}

const SHOPS = [
  { name: 'PHARMACY', bg: '#1f7a4d', fg: '#ffffff', shutter: '#8f9aa3' },
  { name: 'BUKA · MAMA PUT', bg: '#b3261e', fg: '#ffe9a8', shutter: '#6d6458' },
  { name: 'BARBER SALON', bg: '#1f5f8b', fg: '#ffffff', shutter: '#9aa3a8' },
  { name: 'POS · AIRTIME', bg: '#e0902b', fg: '#16161a', shutter: '#7a828a' },
  { name: 'PURE WATER', bg: '#2a9fd0', fg: '#ffffff', shutter: '#8a949b' },
  { name: 'TAILOR · FABRICS', bg: '#7b5ea7', fg: '#ffffff', shutter: '#868e95' },
];

export const SHOP_VARIANTS = SHOPS.length;

/** Ground-floor shopfront: sign band over roll-up shutter or open stall. 3.5 m x 3.4 m. */
export function shopTexture(variant: number) {
  const v = variant % SHOPS.length;
  return memo(`shop${v}`, () => {
    const s = SHOPS[v]!;
    const { c, ctx } = canvas(256, 256);
    const r = mulberry(300 + v);
    ctx.fillStyle = '#d9cfb8';
    ctx.fillRect(0, 0, 256, 256);
    speckle(ctx, 256, 256, 1200, 0.1, 70 + v);
    // sign board
    ctx.fillStyle = s.bg;
    ctx.fillRect(10, 18, 236, 62);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(10, 18, 236, 10);
    ctx.fillStyle = s.fg;
    ctx.font = '900 30px Arial Black, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = 30;
    while (ctx.measureText(s.name).width > 216 && size > 12) {
      size -= 2;
      ctx.font = `900 ${size}px Arial Black, Arial, sans-serif`;
    }
    ctx.fillText(s.name, 128, 50);
    // shutter / opening
    if (v % 2 === 0) {
      ctx.fillStyle = s.shutter;
      ctx.fillRect(18, 92, 220, 156);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      for (let y = 98; y < 248; y += 9) {
        ctx.beginPath();
        ctx.moveTo(18, y);
        ctx.lineTo(238, y);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#2a211b';
      ctx.fillRect(18, 92, 220, 156);
      // goods
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = `hsl(${r.range(0, 360)},70%,55%)`;
        ctx.fillRect(r.range(26, 215), r.range(110, 226), r.range(12, 26), r.range(10, 24));
      }
      ctx.fillStyle = '#6b4a2b';
      ctx.fillRect(18, 214, 220, 34);
    }
    return toTex(c);
  });
}

/** Sign board with text; cached by key. */
export function signTexture(text: string, bg: string, fg: string, w = 512, h = 128, sub?: string) {
  return memo(`sign:${text}:${bg}:${fg}:${sub ?? ''}`, () => {
    const { c, ctx } = canvas(w, h);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = fg;
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = sub ? h * 0.42 : h * 0.5;
    ctx.font = `900 ${size}px Arial Black, Arial, sans-serif`;
    while (ctx.measureText(text).width > w - 50 && size > 12) {
      size -= 3;
      ctx.font = `900 ${size}px Arial Black, Arial, sans-serif`;
    }
    ctx.fillText(text, w / 2, sub ? h * 0.38 : h / 2);
    if (sub) {
      ctx.font = `700 ${h * 0.2}px Arial, sans-serif`;
      ctx.fillText(sub, w / 2, h * 0.76);
    }
    return toTex(c, false);
  });
}

/** Yellow-box load / unload marking (Lagos bus-stop style). Transparent. */
export function zoneTexture(kind: 'pickup' | 'venue') {
  return memo(`zone:${kind}`, () => {
    const { c, ctx } = canvas(256, 256);
    const col = kind === 'pickup' ? '#f5c518' : '#2ec4b6';
    ctx.clearRect(0, 0, 256, 256);
    ctx.fillStyle = col;
    ctx.globalAlpha = 0.28;
    ctx.fillRect(10, 10, 236, 236);
    ctx.globalAlpha = 0.9;
    ctx.lineWidth = 14;
    ctx.strokeStyle = col;
    ctx.strokeRect(14, 14, 228, 228);
    ctx.lineWidth = 8;
    ctx.globalAlpha = 0.7;
    for (let i = -256; i < 256; i += 34) {
      ctx.beginPath();
      ctx.moveTo(i, 256);
      ctx.lineTo(i + 256, 0);
      ctx.stroke();
    }
    return toTex(c, false);
  });
}

export function skyTexture() {
  return memo('sky', () => {
    const { c, ctx } = canvas(8, 256);
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#4d9ede');
    g.addColorStop(0.55, '#9fd0ee');
    g.addColorStop(0.85, '#f3e6c6');
    g.addColorStop(1, '#f6e3b8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 8, 256);
    const t = toTex(c, false);
    return t;
  });
}

export function cloudTexture() {
  return memo('cloud', () => {
    const { c, ctx } = canvas(256, 96);
    ctx.clearRect(0, 0, 256, 96);
    const r = mulberry(9);
    for (let i = 0; i < 14; i++) {
      const x = 40 + r.range(0, 176);
      const y = 55 + r.range(-12, 12);
      const rad = r.range(18, 34);
      const g = ctx.createRadialGradient(x, y, 2, x, y, rad);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, 6.3);
      ctx.fill();
    }
    return toTex(c, false);
  });
}

export function disposeTextures() {
  for (const t of cache.values()) t.dispose();
  cache.clear();
}
