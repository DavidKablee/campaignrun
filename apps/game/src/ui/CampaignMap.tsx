import { useEffect, useMemo, useRef, useState } from 'react';
import {
  boardTotals,
  campaignMap,
  campaignStandings,
  parties,
  partyById,
  partyForContender,
  travelCaps,
} from '@cr/content';
import { CampaignBoard, type BoardTile } from '../render/mapBoard';
import { apiGet } from '../api/client';
import { liveRegionCount, mergeStandings, type LiveRegion } from '../liveBoard';
import { useOnlineStore } from '../onlineStore';
import { useContenderStore } from '../contenderStore';
import { useGameStore } from '../state';
import { campaignRows, formatUnlock, stationFor } from '../trail';
import { syncTravelDay } from '../travel';

/** Neutral fills: a region nobody leads, and a region not campaigning yet. */
const CONTESTED_FILL = '#79838C';
const CLOSED_FILL = '#375A6B';

/**
 * Election-night board for campaign progress.
 *
 * Two things this screen must never become. It is not a poll (guardrail 2), so
 * it shows Crowd and a count of regions held, never a percentage or a share of
 * anything. And the rival numbers are generated from the state id, not
 * collected from players — R0 has no server — so the board says so in print.
 */
export function CampaignMap() {
  const setScreen = useGameStore((s) => s.setScreen);
  const setActiveState = useGameStore((s) => s.setActiveState);
  const picked = useContenderStore((s) => s.activeContenderId);
  const activeStateId = useGameStore((s) => s.activeStateId);
  const localBest = useGameStore((s) => s.bestByState);
  const onlineUser = useOnlineStore((s) => s.user);
  const onlineBest = useOnlineStore((s) => s.best);
  // Signed in, the server holds the player's board; signed out, the device does.
  const best = onlineUser ? onlineBest : localBest;
  const radioOn = useGameStore((s) => s.radioOn);
  const setRadioOn = useGameStore((s) => s.setRadioOn);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const dataSaver = useGameStore((s) => s.dataSaver);
  const travel = useGameStore((s) => s.travel);
  const dayTravel = syncTravelDay(travel);
  const rows = useMemo(() => campaignRows(), []);
  const open = rows.filter((r) => r.open);
  const locked = rows.filter((r) => !r.open);
  const awaiting = rows.filter((r) => r.awaitingPack);
  const nextBatch = locked.find((r) => !r.awaitingPack)?.unlocksAt ?? locked[0]?.unlocksAt;
  const [focusId, setFocusId] = useState(activeStateId || open[0]?.id || rows[0]?.id || 'lagos');
  const focus = rows.find((r) => r.id === focusId) ?? rows[0]!;
  const station = stationFor(focus.audioStem);
  const localBoard = useGameStore((s) => s.localBoard);
  const username = useGameStore((s) => s.username);
  const localForFocus = localBoard.filter((row) => row.stateId === focus.id);

  const myParty = partyForContender(picked);

  const [live, setLive] = useState<LiveRegion[]>([]);
  const [liveFloor, setLiveFloor] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    apiGet<{ floor: number; regions: LiveRegion[] }>('/api/standings')
      .then((r) => {
        if (cancelled) return;
        setLive(r.regions);
        setLiveFloor(r.floor);
      })
      .catch(() => {
        // No server reachable: the practice board is still a board.
        if (!cancelled) setLive([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const standings = useMemo(() => {
    const generated = campaignStandings(
      rows.map((r) => ({ stateId: r.id, open: r.open })),
      myParty?.id ?? null,
      best,
    );
    return mergeStandings(generated, live, myParty?.id ?? null);
  }, [rows, myParty, best, live]);
  const liveCount = liveRegionCount(standings);
  const totals = useMemo(() => boardTotals(standings, myParty?.id ?? null), [standings, myParty]);
  const focusStanding = standings.find((s) => s.stateId === focus.id);
  const focusLeader = focusStanding?.leaderPartyId ? partyById(focusStanding.leaderPartyId) : undefined;

  const tiles = useMemo<BoardTile[]>(
    () =>
      campaignMap.regions.flatMap((region) => {
        const row = rows.find((r) => r.id === region.id);
        const standing = standings.find((s) => s.stateId === region.id);
        if (!row || !standing) return [];
        const leader = standing.leaderPartyId ? partyById(standing.leaderPartyId) : undefined;
        return [
          {
            stateId: region.id,
            abbr: abbr(row.name),
            col: region.col,
            row: region.row,
            color: !standing.open ? CLOSED_FILL : (leader?.color ?? CONTESTED_FILL),
            open: standing.open,
            mine: standing.leaderPartyId != null && standing.leaderPartyId === myParty?.id,
            contested: standing.contested,
          },
        ];
      }),
    [rows, standings, myParty],
  );

  const hostRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<CampaignBoard | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const board = new CampaignBoard(host, {
      reduceMotion,
      dataSaver,
      onSelect: (id) => setFocusId(id),
    });
    boardRef.current = board;
    setReady(true);
    return () => {
      board.dispose();
      boardRef.current = null;
      setReady(false);
    };
  }, [reduceMotion, dataSaver]);

  useEffect(() => {
    if (!ready) return;
    boardRef.current?.setTiles(tiles);
  }, [ready, tiles]);

  useEffect(() => {
    if (!ready) return;
    boardRef.current?.setFocus(focusId);
  }, [ready, focusId]);

  const heldOrder = parties
    .map((p) => ({ party: p, held: totals.held[p.id] ?? 0 }))
    .sort((a, b) => b.held - a.held || a.party.name.localeCompare(b.party.name));

  return (
    <div className="cr-screen cr-screen--map">
      <header className="cr-board-ticker">
        <button type="button" className="cr-link" onClick={() => setScreen(picked ? 'roster' : 'splash')}>
          ← Back
        </button>
        <span className="cr-pill cr-pill--live">{liveCount > 0 ? `Live · ${liveCount}` : 'Practice board'}</span>
        <span className="cr-board-ticker-msg">Game scores · Not a poll</span>
        {onlineUser ? (
          <span className="cr-board-ticker-msg">{onlineUser.username}</span>
        ) : (
          <button type="button" className="cr-link" onClick={() => setScreen('auth')}>
            Sign in to post
          </button>
        )}
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
          <span>{myParty ? 'You lead' : 'Too close'}</span>
          <strong>{myParty ? totals.playerHeld : totals.contested}</strong>
        </article>
        <article>
          <span>Your Crowd</span>
          <strong>{totals.playerCrowd}</strong>
        </article>
        <article>
          <span>Travel left</span>
          <strong>{Math.max(0, travelCaps.maxRunsPerDay - dayTravel.runsToday)}</strong>
        </article>
      </div>

      <section className="cr-tally" aria-label="Regions held">
        <div className="cr-tally-bar">
          {heldOrder.map(({ party, held }) =>
            held > 0 ? (
              <i
                key={party.id}
                style={{ flexGrow: held, background: party.color }}
                className={party.id === myParty?.id ? 'is-mine' : undefined}
                title={`${party.name} · ${held} region${held === 1 ? '' : 's'}`}
              />
            ) : null,
          )}
          {totals.contested > 0 ? (
            <i style={{ flexGrow: totals.contested, background: CONTESTED_FILL }} title={`Too close to call · ${totals.contested}`} />
          ) : null}
          {totals.closed > 0 ? (
            <i style={{ flexGrow: totals.closed, background: CLOSED_FILL }} title={`Not campaigning yet · ${totals.closed}`} />
          ) : null}
        </div>
        <ul className="cr-tally-keys">
          {heldOrder.map(({ party, held }) => (
            <li key={party.id} className={party.id === myParty?.id ? 'is-mine' : undefined}>
              <i style={{ background: party.color }} />
              <span>{party.tag}</span>
              <b>{held}</b>
            </li>
          ))}
          <li>
            <i style={{ background: CONTESTED_FILL }} />
            <span>Too close</span>
            <b>{totals.contested}</b>
          </li>
          <li>
            <i style={{ background: CLOSED_FILL }} />
            <span>Not open</span>
            <b>{totals.closed}</b>
          </li>
        </ul>
      </section>

      <div className="cr-board-main">
        <div className="cr-board-stage" ref={hostRef} aria-hidden="true" />

        <section className="cr-board-picker" aria-label="Regions">
          {rows.map((r) => {
            const standing = standings.find((s) => s.stateId === r.id);
            const leader = standing?.leaderPartyId ? partyById(standing.leaderPartyId) : undefined;
            const fill = !standing?.open ? CLOSED_FILL : (leader?.color ?? CONTESTED_FILL);
            return (
              <button
                key={r.id}
                type="button"
                className={`cr-region-chip${focusId === r.id ? ' is-focus' : ''}${r.open ? '' : ' is-locked'}`}
                style={{ ['--fill' as string]: fill }}
                onClick={() => setFocusId(r.id)}
                aria-pressed={focusId === r.id}
                title={
                  r.open
                    ? `${r.name} · ${leader ? leader.name : 'too close to call'}`
                    : `${r.name} · ${formatUnlock(r.unlocksAt)}`
                }
              >
                {abbr(r.name)}
              </button>
            );
          })}
        </section>

        <aside className="cr-board-focus">
          <p className="cr-kicker">{focus.open ? 'Campaigning' : focus.awaitingPack ? 'Pack soon' : 'Locked'}</p>
          <h2>{focus.name}</h2>

          {focus.open ? (
            <p className="cr-hold" style={{ ['--fill' as string]: focusLeader?.color ?? CONTESTED_FILL }}>
              <i />
              {focusLeader ? (
                <span>
                  <b>{focusLeader.name}</b> leads by {focusStanding?.margin}
                </span>
              ) : (
                <span>Too close to call</span>
              )}
            </p>
          ) : null}

          {focus.open && focusStanding ? (
            <p className="cr-fineprint">
              {focusStanding.source === 'live'
                ? `Live from ${focusStanding.players} players.`
                : focusStanding.players > 0
                  ? `${focusStanding.players} ${focusStanding.players === 1 ? 'player has' : 'players have'} rallied here. Practice numbers until ${liveFloor ?? '…'}.`
                  : 'Practice numbers. Nobody has posted a run here yet.'}
            </p>
          ) : null}

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
              <dt>{focus.open ? 'Your Crowd' : 'Opens'}</dt>
              <dd>{focus.open ? (focusStanding?.playerCrowd ?? 0) : formatUnlock(focus.unlocksAt)}</dd>
            </div>
            <div>
              <dt>Runs</dt>
              <dd>{best[focus.id]?.runs ?? 0}</dd>
            </div>
          </dl>

          {focus.open && focusStanding ? (
            <ol className="cr-tallies">
              {focusStanding.tallies.map((t) => {
                const p = partyById(t.partyId)!;
                return (
                  <li key={t.partyId} className={t.isPlayer ? 'is-mine' : undefined}>
                    <i style={{ background: p.color }} />
                    <span>{p.name}</span>
                    <b>{t.crowd}</b>
                  </li>
                );
              })}
            </ol>
          ) : null}

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
          {myParty ? (
            <>
              Campaigning for <b style={{ color: myParty.color }}>{myParty.name}</b> — {myParty.platform}
            </>
          ) : (
            'Pick a Contender to put your Party on the board.'
          )}
        </span>
        <span className="cr-fineprint">
          Next unlock {nextBatch ? formatUnlock(nextBatch) : '—'}
          {awaiting.length > 0 ? ` · ${awaiting.length} awaiting pack` : ''} · states today{' '}
          {dayTravel.statesTouched.length}/{travelCaps.maxStatesPerDay}
        </span>
        <span className="cr-fineprint">
          {liveCount > 0
            ? `${liveCount} ${liveCount === 1 ? 'region is' : 'regions are'} live from real play. `
            : ''}
          Regions below {liveFloor ?? 'the floor'} players show generated practice numbers, not collected ones — a
          breakdown built from a handful of people would name them. Fictional parties. Game scores, not polls.
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
