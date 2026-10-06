import { stations } from '@cr/content';
import { useGameStore } from '../state';
import { campaignRows, formatUnlock, stationFor } from '../trail';

export function CampaignMap() {
  const setScreen = useGameStore((s) => s.setScreen);
  const picked = useGameStore((s) => s.activeContenderId);
  const best = useGameStore((s) => s.bestByState);
  const radioOn = useGameStore((s) => s.radioOn);
  const setRadioOn = useGameStore((s) => s.setRadioOn);
  const rows = campaignRows();
  const open = rows.filter((r) => r.open);
  const locked = rows.filter((r) => !r.open);
  const lagos = rows.find((r) => r.id === 'lagos');
  const lagosStation = stationFor(lagos?.audioStem ?? 'sw-fuji');
  const lagosBest = best.lagos;

  return (
    <div className="cr-screen cr-screen--map">
      <div className="cr-map-head">
        <button type="button" className="cr-link" onClick={() => setScreen(picked ? 'roster' : 'splash')}>
          ← {picked ? 'Contenders' : 'Start'}
        </button>
        <h2>Campaign map</h2>
        <p className="cr-tag">
          You are in <strong>Lagos</strong>. The road runs from the city gate through{' '}
          {lagos ? 'Ojuelegba toward the Victoria Island grand rally' : 'the first state'}. Other states open on Monday
          mornings.
        </p>
      </div>

      <section className="cr-map-stats">
        <article>
          <span>Open now</span>
          <strong>{open.length}</strong>
          <small>of {rows.length} states</small>
        </article>
        <article>
          <span>Your Lagos crowd</span>
          <strong>{lagosBest?.crowd ?? 0}</strong>
          <small>{lagosBest ? `${lagosBest.runs} run${lagosBest.runs === 1 ? '' : 's'}` : 'No rally yet'}</small>
        </article>
        <article>
          <span>Community map</span>
          <strong>Waiting</strong>
          <small>Too few rallies yet. Game scores, not a poll.</small>
        </article>
      </section>

      <section className="cr-radio">
        <div>
          <p className="cr-kicker">Radio</p>
          <h3>{radioOn ? lagosStation.name : 'Radio off'}</h3>
          <p>{lagosStation.blurb} Each state has one station. A locked state’s station stays silent until that state opens. Nothing is streamed from outside the game.</p>
        </div>
        <button type="button" className="cr-btn" onClick={() => setRadioOn(!radioOn)}>
          {radioOn ? 'Mute station' : 'Play Èkó Wave'}
        </button>
      </section>

      <h3 className="cr-map-label">You can campaign here</h3>
      <ul className="cr-state-grid">
        {open.map((r) => (
          <li key={r.id} className="is-open">
            <strong>{r.name}</strong>
            <small>
              {r.zone} · {stationFor(r.audioStem).name}
              {best[r.id] ? ` · best ${best[r.id]!.crowd}` : ' · not run yet'}
            </small>
          </li>
        ))}
      </ul>

      <h3 className="cr-map-label">Opens later</h3>
      <ul className="cr-state-grid">
        {locked.map((r) => (
          <li key={r.id}>
            <strong>{r.name}</strong>
            <small>
              {formatUnlock(r.unlocksAt)} · {stationFor(r.audioStem).name}
            </small>
          </li>
        ))}
      </ul>

      <section className="cr-radio cr-radio--quiet">
        <div>
          <p className="cr-kicker">Stations in the pack</p>
          <ul className="cr-station-list">
            {stations.map((s) => (
              <li key={s.id}>
                <strong>{s.name}</strong>
                <small>
                  {s.zone} · {s.id === lagosStation.id ? 'on air' : 'locked'}
                </small>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
