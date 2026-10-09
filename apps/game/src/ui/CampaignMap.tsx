import { useMemo, useState } from 'react';
import { travelCaps } from '@cr/content';
import { useContenderStore } from '../contenderStore';
import { useGameStore } from '../state';
import { campaignRows, formatUnlock, stationFor } from '../trail';
import { syncTravelDay } from '../travel';

/** Election-night board for campaign progress. Scores are game Crowd, not polls. */
export function CampaignMap() {
  const setScreen = useGameStore((s) => s.setScreen);
  const setActiveState = useGameStore((s) => s.setActiveState);
  const picked = useContenderStore((s) => s.activeContenderId);
  const activeStateId = useGameStore((s) => s.activeStateId);
  const best = useGameStore((s) => s.bestByState);
  const radioOn = useGameStore((s) => s.radioOn);
  const setRadioOn = useGameStore((s) => s.setRadioOn);
  const travel = useGameStore((s) => s.travel);
  const dayTravel = syncTravelDay(travel);
  const rows = useMemo(() => campaignRows(), []);
  const open = rows.filter((r) => r.open);
  const locked = rows.filter((r) => !r.open);
  const awaiting = rows.filter((r) => r.awaitingPack);
  const nextBatch = locked.find((r) => !r.awaitingPack)?.unlocksAt ?? locked[0]?.unlocksAt;
  const [focusId, setFocusId] = useState(activeStateId || open[0]?.id || rows[0]?.id || 'lagos');
  const focus = rows.find((r) => r.id === focusId) ?? rows[0]!;
  const focusBest = best[focus.id];
  const station = stationFor(focus.audioStem);
  const totalCrowd = Object.values(best).reduce((n, b) => n + b.crowd, 0);
  const localBoard = useGameStore((s) => s.localBoard);
  const username = useGameStore((s) => s.username);
  const localForFocus = localBoard.filter((row) => row.stateId === focus.id);

  return (
    <div className="cr-screen cr-screen--map">
      <header className="cr-board-ticker">
        <button type="button" className="cr-link" onClick={() => setScreen(picked ? 'roster' : 'splash')}>
          ← Back
        </button>
        <span className="cr-pill cr-pill--live">Live board</span>
        <span className="cr-board-ticker-msg">Game scores · Not a poll</span>
        <button type="button" className="cr-radio-chip" onClick={() => setRadioOn(!radioOn)}>
          {radioOn ? stationFor(open[0]?.audioStem ?? 'sw-fuji').name : 'Radio off'}
        </button>
      </header>

      <div className="cr-board-score">
        <article>
          <span>Open</span>
          <strong>{open.length}</strong>
        </article>
        <article>
          <span>Pending</span>
          <strong>{locked.length}</strong>
        </article>
        <article>
          <span>Your Crowd</span>
          <strong>{totalCrowd}</strong>
        </article>
        <article>
          <span>Travel left</span>
          <strong>
            {Math.max(0, travelCaps.maxRunsPerDay - dayTravel.runsToday)}
          </strong>
        </article>
      </div>
      <p className="cr-fineprint cr-board-live-note">
        Next unlock {nextBatch ? formatUnlock(nextBatch) : '—'}
        {awaiting.length > 0 ? ` · ${awaiting.length} awaiting pack` : ''}
        {' · '}
        states today {dayTravel.statesTouched.length}/{travelCaps.maxStatesPerDay}
      </p>

      <div className="cr-board-main">
        <section className="cr-board-grid" aria-label="States">
          {rows.map((r) => {
            const crowd = best[r.id]?.crowd ?? 0;
            const heat = r.open ? Math.min(1, crowd / 40) : 0;
            return (
              <button
                key={r.id}
                type="button"
                className={`cr-state-cell zone-${r.zone.toLowerCase()}${r.open ? ' is-open' : ' is-locked'}${focusId === r.id ? ' is-focus' : ''}`}
                style={r.open ? { ['--heat' as string]: String(0.35 + heat * 0.65) } : undefined}
                onClick={() => setFocusId(r.id)}
                title={r.open ? `${r.name} · Crowd ${crowd}` : `${r.name} · ${formatUnlock(r.unlocksAt)}`}
              >
                <abbr>{abbr(r.name)}</abbr>
                <span>{r.open ? (crowd > 0 ? crowd : 'Open') : r.awaitingPack ? 'Pack' : shortDate(r.unlocksAt)}</span>
              </button>
            );
          })}
        </section>

        <aside className="cr-board-focus">
          <p className="cr-kicker">{focus.open ? 'Campaigning' : focus.awaitingPack ? 'Pack soon' : 'Locked'}</p>
          <h2>{focus.name}</h2>
          <dl className="cr-board-facts">
            <div>
              <dt>Zone</dt>
              <dd>{focus.zone}</dd>
            </div>
            <div>
              <dt>Station</dt>
              <dd>{station.name}</dd>
            </div>
            <div>
              <dt>{focus.open ? 'Best Crowd' : 'Opens'}</dt>
              <dd>{focus.open ? (focusBest?.crowd ?? 0) : formatUnlock(focus.unlocksAt)}</dd>
            </div>
            <div>
              <dt>Runs</dt>
              <dd>{focusBest?.runs ?? 0}</dd>
            </div>
          </dl>
          {focus.open ? (
            <button
              type="button"
              className="cr-btn"
              onClick={() => {
                setActiveState(focus.id);
                setScreen(picked ? 'briefing' : 'roster');
              }}
            >
              Rally here
            </button>
          ) : (
            <p className="cr-fineprint">
              {focus.awaitingPack ? 'Calendar open; pack not shipped yet.' : 'Opens Monday 06:00 WAT'}
            </p>
          )}
          <p className="cr-fineprint">Community map waits for enough rallies. Not a poll.</p>
          <div className="cr-local-board">
            <p className="cr-kicker">Local board{username ? ` · ${username}` : ''}</p>
            {localForFocus.length === 0 ? (
              <p className="cr-fineprint">Post a finished run from Summary. This device only.</p>
            ) : (
              <ol>
                {localForFocus.slice(0, 5).map((row, i) => (
                  <li key={`${row.name}-${row.crowd}-${i}`}>
                    <span>{row.name}</span>
                    <b>{row.crowd}</b>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>

      <footer className="cr-board-legend">
        <span>
          <i className="cr-leg-swatch is-open" /> Open
        </span>
        <span>
          <i className="cr-leg-swatch is-locked" /> Pending
        </span>
        <span>
          <i className="cr-leg-swatch is-heat" /> Your Crowd heat
        </span>
      </footer>
    </div>
  );
}

function abbr(name: string): string {
  if (name === 'FCT') return 'FCT';
  if (name === 'Akwa Ibom') return 'AKI';
  if (name === 'Cross River') return 'CRS';
  return name.slice(0, 3).toUpperCase();
}

function shortDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Lagos',
  }).format(new Date(iso));
}
