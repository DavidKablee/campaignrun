/**
 * The game paints every texture on a canvas, and vitest runs in node, where
 * there is no `document`. This stands in a canvas whose 2D context records
 * every call and property write. A painter's call log is a fingerprint of what
 * it would have drawn, so a refactor that changes a texture changes the hash
 * without needing a pixel or a browser.
 */
export interface CanvasLog {
  /** FNV-1a over every canvas painted so far, in creation order. */
  hash(): string;
  /** The raw call log, for debugging a mismatch. */
  lines: string[];
}

function fnv(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function fmt(v: unknown): string {
  if (typeof v === 'number') return String(Math.round(v * 1000) / 1000);
  if (typeof v === 'string') return v;
  return typeof v;
}

export function installCanvasStub(): CanvasLog {
  const lines: string[] = [];
  const makeCtx = (): CanvasRenderingContext2D => {
    const gradient = () => ({ addColorStop: (...a: unknown[]) => void lines.push(`stop ${a.map(fmt).join(' ')}`) });
    const target: Record<string, unknown> = {};
    return new Proxy(target, {
      get(_t, name: string) {
        if (name === 'measureText') return (text: string) => ({ width: text.length * 11 });
        if (name === 'createLinearGradient' || name === 'createRadialGradient') {
          return (...a: unknown[]) => {
            lines.push(`${name} ${a.map(fmt).join(' ')}`);
            return gradient();
          };
        }
        if (name in target) return target[name];
        return (...a: unknown[]) => void lines.push(`${name} ${a.map(fmt).join(' ')}`);
      },
      set(_t, name: string, value) {
        target[name] = value;
        lines.push(`set ${name}=${fmt(value)}`);
        return true;
      },
    }) as unknown as CanvasRenderingContext2D;
  };

  const doc = {
    createElement: (tag: string) => {
      if (tag !== 'canvas') throw new Error(`canvas stub cannot make <${tag}>`);
      const ctx = makeCtx();
      const el = {
        width: 0,
        height: 0,
        getContext: () => {
          lines.push(`canvas ${el.width}x${el.height}`);
          return ctx;
        },
      };
      return el;
    },
  };
  (globalThis as unknown as { document: unknown }).document = doc;
  return { lines, hash: () => fnv(lines.join('\n')) };
}
