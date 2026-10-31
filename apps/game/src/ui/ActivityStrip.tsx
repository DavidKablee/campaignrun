import { useEffect, useState } from 'react';
import { stateIndex } from '@cr/content';
import { apiGet } from '../api/client';

interface Row {
  stateId: string;
  today: number;
  week: number;
}

/**
 * C92: the Board's "Most active in Mobilise today" strip. `GET /api/places/activity` was built in C82
 * and nothing showed it. It says where players are out campaigning; it moves no standings. It stays
 * out of the way: nothing renders while loading, offline, or when no state has any activity yet.
 */
export function ActivityStrip({ focusId }: { focusId: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    let live = true;
    apiGet<{ states: Row[] }>('/api/places/activity')
      .then((r) => live && setRows(r.states))
      .catch(() => live && setRows([]));
    return () => {
      live = false;
    };
  }, []);
  const top = (rows ?? []).filter((r) => r.today > 0).slice(0, 3);
  if (top.length === 0) return null;
  return (
    <section className="cr-activity" aria-label="Most active in Mobilise today">
      <p className="cr-kicker">Most active in Mobilise today</p>
      <ol>
        {top.map((r, i) => (
          <li key={r.stateId} className={r.stateId === focusId ? 'is-focus' : undefined}>
            <span>
              {i + 1}. {stateIndex.find((s) => s.id === r.stateId)?.name ?? r.stateId}
            </span>
            <b>{r.today.toLocaleString('en-NG')}</b>
          </li>
        ))}
      </ol>
    </section>
  );
}
