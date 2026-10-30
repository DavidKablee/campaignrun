import { useMemo } from 'react';
import { regionCentre, regionPolygon } from '@cr/content';
import type { BoardTile } from '../render/mapBoard';

/**
 * The board drawn flat, for when WebGL is not there (a blocked or lost GPU context, a locked-down
 * browser). It was a black rectangle; the same regions as plain SVG keep the screen a map. The region
 * chips below the stage remain the keyboard path, so this is aria-hidden like the 3D stage.
 */
export function FlatBoard({
  tiles,
  focusId,
  onSelect,
}: {
  tiles: BoardTile[];
  focusId: string;
  onSelect: (stateId: string) => void;
}) {
  const shapes = useMemo(
    () =>
      tiles.map((t) => ({
        tile: t,
        outline: regionPolygon(t.col, t.row),
        centre: regionCentre(t.col, t.row),
      })),
    [tiles],
  );
  const box = useMemo(() => {
    let x0 = Infinity;
    let x1 = -Infinity;
    let z0 = Infinity;
    let z1 = -Infinity;
    for (const s of shapes) {
      for (const p of s.outline) {
        x0 = Math.min(x0, p.x);
        x1 = Math.max(x1, p.x);
        z0 = Math.min(z0, p.z);
        z1 = Math.max(z1, p.z);
      }
    }
    return shapes.length ? { x: x0 - 0.4, z: z0 - 0.4, w: x1 - x0 + 0.8, h: z1 - z0 + 0.8 } : { x: 0, z: 0, w: 1, h: 1 };
  }, [shapes]);

  return (
    <svg
      className="cr-board-flat"
      viewBox={`${box.x} ${box.z} ${box.w} ${box.h}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {shapes.map(({ tile, outline, centre }) => (
        <g key={tile.stateId} onClick={() => onSelect(tile.stateId)} className={tile.stateId === focusId ? 'is-focus' : undefined}>
          <polygon
            points={outline.map((p) => `${p.x},${p.z}`).join(' ')}
            fill={tile.color}
            fillOpacity={tile.open ? 1 : 0.7}
            stroke={tile.stateId === focusId ? '#F5C518' : tile.mine ? '#FFFFFF' : 'rgba(10,26,36,0.9)'}
            strokeWidth={tile.stateId === focusId ? 0.12 : 0.05}
            strokeLinejoin="round"
          />
          <text x={centre.x} y={centre.z} textAnchor="middle" dominantBaseline="central" className="cr-board-flat-label">
            {tile.abbr}
          </text>
        </g>
      ))}
    </svg>
  );
}
