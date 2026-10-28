import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { simConfig } from '@cr/content';
import { installCanvasStub } from './helpers/canvasStub';

// The kit never loads in a test, so every palm is the procedural fallback.
vi.mock('../src/render/assets', () => ({
  loadAsset: () => new Promise(() => {}),
  preloadBiome: async () => {},
  biomeAssetIds: () => [],
  buildInstancedProp: () => {
    throw new Error('not used');
  },
}));

/**
 * The Lagos world is the reference every other state is measured against, so it
 * must not drift while the renderer is made state-aware. This fingerprints what
 * a World builds (geometry, materials, signs) and what the texture painters
 * draw, for the Lagos defaults and for one themed pack, and compares them with
 * a golden captured from the code before the refactor.
 *
 * The `themed` capture was refreshed once, on purpose, when ground and water
 * materials started being keyed by colour: before that the first world built in
 * a session fixed the ground colour for every later one.
 *
 * Refresh deliberately with `UPDATE_GOLDEN=1 pnpm vitest run apps/game/test/worldGolden.test.ts`.
 */
const GOLDEN = join(dirname(fileURLToPath(import.meta.url)), '__golden__', 'lagos-world.json');

function fnv(values: ArrayLike<number>, scale = 1000): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < values.length; i++) {
    h ^= Math.round(values[i]! * scale) | 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function meshSig(mesh: THREE.Mesh): string {
  const g = mesh.geometry as THREE.BufferGeometry;
  const pos = g.getAttribute('position');
  const col = g.getAttribute('color');
  const m = mesh.material as THREE.Material & { color?: THREE.Color; map?: unknown };
  const tf = [mesh.position.x, mesh.position.y, mesh.position.z, mesh.scale.x, mesh.scale.y, mesh.scale.z, mesh.rotation.y];
  return [
    pos ? pos.count : 0,
    pos ? fnv(pos.array as Float32Array) : '-',
    col ? fnv(col.array as Float32Array) : '-',
    fnv(tf),
    m.type,
    m.color ? m.color.getHexString() : '-',
    m.map ? 'map' : 'nomap',
  ].join(':');
}

function groupSig(group: THREE.Object3D): { meshes: number; tris: number; sig: string } {
  const sigs: string[] = [];
  let tris = 0;
  group.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      sigs.push(meshSig(o));
      const pos = (o.geometry as THREE.BufferGeometry).getAttribute('position');
      tris += pos ? pos.count / 3 : 0;
    }
  });
  return { meshes: sigs.length, tris, sig: fnv(Array.from(sigs.join('|')).map((c) => c.charCodeAt(0)), 1) };
}

function captureWorld(World: new (...a: never[]) => unknown, opts: { palette?: unknown; zone?: string; scenery?: string[] }) {
  const out: Record<string, unknown> = {};
  // One distance per theme: ojuelegba, bridge, link, market, park, island.
  for (const dist of [1, 200, 500, 850, 1200, 1600, 2900]) {
    const scene = new THREE.Scene();
    const ctor = World as unknown as new (...a: unknown[]) => { update(d: number, i: boolean): void; debugSlots(): { index: number; group: THREE.Group }[] };
    const w = new ctor(scene, simConfig, ['One', 'Two', 'Three', 'Four', 'Five'], undefined, opts.palette, opts.zone, opts.scenery ?? []);
    w.update(dist, true);
    const chunks = [...w.debugSlots()].sort((a, b) => a.index - b.index).map((s) => ({ k: s.index, ...groupSig(s.group) }));
    out[`d${dist}`] = chunks;
  }
  return out;
}

describe('the Lagos world is unchanged', () => {
  let log: ReturnType<typeof installCanvasStub>;
  beforeAll(() => {
    log = installCanvasStub();
  });

  it('matches the golden', async () => {
    const { World } = await import('../src/render/world');
    const tex = await import('../src/render/textures');
    const props = await import('../src/render/props');

    const painters: Record<string, string> = {};
    const paint = (name: string, fn: () => unknown) => {
      const before = log.lines.length;
      fn();
      let h = 0x811c9dc5;
      for (const line of log.lines.slice(before).join('\n')) h = Math.imul(h ^ line.charCodeAt(0), 0x01000193) >>> 0;
      painters[name] = `${log.lines.length - before}:${h.toString(16)}`;
    };
    paint('road', () => tex.roadTexture());
    for (let v = 0; v < 6; v++) paint(`facade${v}`, () => tex.facadeTexture(v));
    for (let v = 0; v < 6; v++) paint(`shop${v}`, () => tex.shopTexture(v));
    for (const mood of ['day', 'night', 'harmattan', 'rainy'] as const) paint(`sky:${mood}`, () => tex.skyTexture(mood));

    const people: Record<string, unknown> = {};
    for (const s of [0, 5, 11, 23]) {
      for (const pose of ['stand', 'wave'] as const) {
        const g = props.personGeo(s, pose);
        const pos = g.getAttribute('position');
        people[`${s}:${pose}`] = `${pos.count}:${fnv(pos.array as Float32Array)}`;
      }
    }

    const snapshot = {
      painters,
      people,
      venue: [groupSig(props.buildVenue(false, 3)), groupSig(props.buildVenue(true, 4))],
      gate: groupSig(props.buildGate('WELCOME TO LAGOS', 'Ẹ káàbọ̀ sí Èkó!')),
      lagosDefault: captureWorld(World as never, {}),
      themed: captureWorld(World as never, {
        palette: { sky: '#E8C48A', fog: '#F3E2C5', ground: '#A67C52', accent: '#C45C26' },
        zone: 'NW',
        scenery: ['old city walls', 'dye pits', 'creek stilts', 'granite inselbergs'],
      }),
    };

    if (process.env['UPDATE_GOLDEN'] === '1' || !existsSync(GOLDEN)) {
      mkdirSync(dirname(GOLDEN), { recursive: true });
      writeFileSync(GOLDEN, `${JSON.stringify(snapshot, null, 1)}\n`);
    }
    const golden = JSON.parse(readFileSync(GOLDEN, 'utf8')) as typeof snapshot;
    expect(snapshot.painters).toEqual(golden.painters);
    expect(snapshot.people).toEqual(golden.people);
    expect(snapshot.venue).toEqual(golden.venue);
    expect(snapshot.gate).toEqual(golden.gate);
    expect(snapshot.lagosDefault).toEqual(golden.lagosDefault);
    expect(snapshot.themed).toEqual(golden.themed);
  });
});
