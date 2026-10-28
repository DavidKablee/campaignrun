import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';
import { parseTally, type Tally } from '../tally';

/** "Busiest roads this week": finished rallies per state. Shows nothing until the server has a tally. */
export function BusiestRoads() {
  const [tally, setTally] = useState<Tally | null>(null);
  useEffect(() => {
    let cancelled = false;
    apiGet<unknown>('/api/tally')
      .then((raw) => {
        if (!cancelled) setTally(parseTally(raw));
      })
      .catch(() => {
        /* no server, or an older one: the section simply is not there */
      });
    return () => {
      cancelled = true;
    };
  }, []);
  if (!tally) return null;
  const top = tally.rows[0]!.rallies || 1;
  return (
    <section className="cr-busiest" aria-label="Busiest roads this week">
      <p className="cr-eyebrow">Busiest roads · last {tally.windowDays} days</p>
      <ol>
        {tally.rows.map((r) => (
          <li key={r.stateId}>
            <span>{r.name}</span>
            <i style={{ width: `${Math.max(8, Math.round((100 * r.rallies) / top))}%` }} aria-hidden="true" />
            <b>{r.rallies.toLocaleString('en-US')}</b>
          </li>
        ))}
      </ol>
      <p className="cr-fineprint">Finished rallies. Every state counts the same.</p>
    </section>
  );
}
