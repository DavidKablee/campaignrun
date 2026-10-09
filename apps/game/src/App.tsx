import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from './state';
import { copy, legal, metaConfig, simConfig, contenders, rides, lagosLaunch, loadStatePack, outfits, isRidePlayable, integrityEvent, travelCaps, type OutfitChoice, type StateDef } from '@cr/content';
import { initState, step, seedRng, starForCrowd, type SimState } from '@cr/sim';
import { useAccountStore } from './accountStore';
import { contenderShareAllowed } from './consent';
import { GameRenderer } from './render/GameRenderer';
import { InputController } from './input/controls';
import { audio } from './audio/engine';
import { CharacterStudio, renderPortraits } from './render/studio';
import { getCharacter } from './characters';
import { useContenderStore } from './contenderStore';
import { buildExportBundle, deleteAllLocalData, downloadExport } from './dataExport';
import { CampaignMap } from './ui/CampaignMap';
import { legAt, stationFor } from './trail';
import { Showcase } from './render/showcase';
import { todaysChallenge } from './daily';
import { runModifiers } from './meta';
import { renderShareCard, shareOrDownload } from './shareCard';
import { syncTravelDay } from './travel';

function useStatePack(id: string): StateDef | null {
  const [pack, setPack] = useState<StateDef | null>(null);
  useEffect(() => {
    let alive = true;
    setPack(null);
    void loadStatePack(id)
      .then((p) => {
        if (alive) setPack(p);
      })
      .catch(() => {
        if (alive) setPack(null);
      });
    return () => {
      alive = false;
    };
  }, [id]);
  return pack;
}

export function App() {
  const screen = useGameStore((s) => s.screen);
  const activeStateId = useGameStore((s) => s.activeStateId);
  const inRun = screen === 'game' || screen === 'paused';
  useEffect(() => {
    // Prefetch the active pack (and keep Lagos warm for the launch shell).
    void loadStatePack(activeStateId);
    if (activeStateId !== 'lagos') void loadStatePack('lagos');
  }, [activeStateId]);
  return (
    <div className="cr-shell">
      {screen === 'splash' && <Splash />}
      {screen === 'roster' && <Roster />}
      {screen === 'studio' && <StudioScreen />}
      {screen === 'briefing' && <Briefing />}
      {inRun && <GameScreen />}
      {screen === 'paused' && <Paused />}
      {screen === 'summary' && <Summary />}
      {screen === 'settings' && <Settings />}
      {screen === 'about' && <About />}
      {screen === 'account' && <AccountScreen />}
      {screen === 'map' && <CampaignMap />}
      {screen === 'yard' && <ConvoyYard />}
    </div>
  );
}

/** Campaign close: 15 Jan 2027 23:59 WAT (UTC+1). UI-only; the sim never reads the clock. */
const CLOSE_UTC = Date.UTC(2027, 0, 15, 22, 59);
function daysLeft(): number {
  return Math.max(0, Math.ceil((CLOSE_UTC - Date.now()) / 86_400_000));
}

function Splash() {
  const setScreen = useGameStore((s) => s.setScreen);
  const following = useGameStore((s) => s.following);
  const coins = useGameStore((s) => s.coins);
  const best = useGameStore((s) => s.bestByState['lagos']);
  const contenderId = useContenderStore((s) => s.activeContenderId) ?? contenders[0]!.id;
  const overrides = useContenderStore((s) => s.outfits[contenderId]);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const dataSaver = useGameStore((s) => s.dataSaver);
  const station = stationFor(lagosLaunch.audioStem);
  const heroRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const returning = following > 0 || !!best;

  useEffect(() => {
    if (!heroRef.current) return;
    let show: Showcase | null = null;
    try {
      const ch = getCharacter(contenderId, overrides);
      show = new Showcase(
        heroRef.current,
        ch.look,
        ch.outfit,
        reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        dataSaver,
      );
      setLive(true);
    } catch {
      /* WebGL unavailable: the poster background still works */
    }
    return () => show?.dispose();
  }, [contenderId, overrides, reduceMotion, dataSaver]);

  const start = () => {
    void audio.unlock();
    setScreen(returning ? 'briefing' : 'roster');
  };

  return (
    <div className={`cr-screen cr-screen--splash${live ? ' is-live' : ''}`}>
      <div className="cr-hero" ref={heroRef} aria-hidden="true" />
      <div className="cr-hero-scrim" aria-hidden="true" />
      <div className="cr-splash-top">
        <span className="cr-pill cr-pill--live">Lagos open</span>
        <span className="cr-pill">{daysLeft()} days left</span>
        {returning && <span className="cr-pill">₦{coins}</span>}
        <button
          className="cr-icon-btn cr-splash-gear"
          type="button"
          aria-label="Settings"
          onClick={() => useGameStore.getState().openSettings()}
        >
          Set
        </button>
      </div>
      <div className="cr-splash-copy">
        <p className="cr-kicker">{returning ? `Welcome back · ${following} Following` : 'Day 1 · You start in Lagos'}</p>
        <h1 className="cr-brand">
          <span>Campaign</span>
          <span>Run</span>
        </h1>
        <p className="cr-tag">Load the bus stops. Own the Lagos road. Land the grand rally.</p>
        <button className="cr-btn cr-btn--hero" type="button" onClick={start}>
          {returning ? 'Continue campaign' : copy.playButton}
        </button>
        <div className="cr-row">
          <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('map')}>
            Live board
          </button>
          <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('yard')}>
            Convoy Yard
          </button>
          {returning && (
            <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('roster')}>
              Change Contender
            </button>
          )}
          <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('account')}>
            Account
          </button>
          <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('about')}>
            About
          </button>
        </div>
        <p className="cr-fineprint">{copy.disclosure}</p>
      </div>
      <aside className="cr-splash-side">
        <p className="cr-kicker">On air</p>
        <h2>{station.name}</h2>
        <div className="cr-statrow">
          <div>
            <strong>1</strong>
            <span>open</span>
          </div>
          <div>
            <strong>36</strong>
            <span>pending</span>
          </div>
          <div>
            <strong>{best ? best.crowd : '—'}</strong>
            <span>Crowd</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function usePortraits(ids: string[]) {
  const overrides = useContenderStore((s) => s.outfits);
  const [map, setMap] = useState<Record<string, string>>({});
  const key = JSON.stringify([ids, overrides]);
  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      try {
        const items = ids.map((cid) => ({ id: cid, ...getCharacter(cid, overrides[cid]) }));
        const out = renderPortraits(items);
        if (!cancelled) setMap(out);
      } catch {
        /* WebGL unavailable: cards fall back to initials */
      }
    }, 30);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [key]);
  return map;
}

function Roster() {
  const setScreen = useGameStore((s) => s.setScreen);
  const setActive = useContenderStore((s) => s.setActiveContender);
  const active = useContenderStore((s) => s.activeContenderId);
  const following = useGameStore((s) => s.following);
  const locked = useContenderStore((s) => s.contenderLocked);
  const graceUsed = useContenderStore((s) => s.contenderGraceUsed);
  const activeList = contenders.filter((c) => c.status === 'active');
  const portraits = usePortraits(activeList.map((c) => c.id));
  const [previewId, setPreviewId] = useState(active ?? activeList[0]!.id);
  const featured = activeList.find((c) => c.id === previewId) ?? activeList[0]!;

  const openStudio = (id: string) => {
    if (locked && graceUsed && active && active !== id) return;
    setActive(id);
    void audio.unlock();
    setScreen('studio');
  };

  return (
    <div className="cr-screen cr-screen--roster">
      <div className="cr-chrome-top">
        <div className="cr-pill-row">
          <span className="cr-pill cr-pill--live">Lagos</span>
          <span className="cr-pill">{following} Following</span>
          <span className="cr-pill">{daysLeft()}d left</span>
        </div>
        <span className="cr-chrome-actions">
          <button className="cr-mini-btn" type="button" onClick={() => setScreen('map')}>
            Board
          </button>
          <button className="cr-mini-btn" type="button" aria-label="Settings" onClick={() => useGameStore.getState().openSettings()}>
            Set
          </button>
        </span>
      </div>
      <h2>Pick your Contender</h2>
      <p className="cr-tag">
        {locked
          ? graceUsed
            ? 'Contender locked on this device.'
            : 'One free switch left, then locked.'
          : 'Choice stays on this device.'}
      </p>
      <div className="cr-roster-layout">
        <aside
          className="cr-roster-hero"
          style={{ ['--c1' as string]: featured.palette[0], ['--c2' as string]: featured.palette[1] }}
        >
          <span className="cr-roster-hero-art">
            {portraits[featured.id] ? <img src={portraits[featured.id]} alt="" /> : <b>{featured.name[0]}</b>}
          </span>
          <div className="cr-roster-hero-copy">
            <p className="cr-kicker">{featured.archetype}</p>
            <h3>{featured.name}</h3>
            <p className="cr-tag">“{featured.catchphrase}”</p>
            <div className="cr-chips">
              <span className="cr-chip">{featured.perk.description}</span>
              <span className="cr-chip cr-chip--trade">{featured.tradeoff.description}</span>
            </div>
            <button className="cr-btn" type="button" onClick={() => openStudio(featured.id)}>
              Dress & campaign →
            </button>
          </div>
        </aside>
        <div className="cr-roster">
          {activeList.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`cr-contender${previewId === c.id ? ' is-active' : ''}`}
              style={{ ['--c1' as string]: c.palette[0], ['--c2' as string]: c.palette[1] }}
              onMouseEnter={() => setPreviewId(c.id)}
              onFocus={() => setPreviewId(c.id)}
              onClick={() => openStudio(c.id)}
            >
              <span className="cr-portrait">
                {portraits[c.id] ? <img src={portraits[c.id]} alt={`${c.name} portrait`} /> : <b>{c.name[0]}</b>}
              </span>
              <span>
                <strong>{c.name}</strong>
                <small>{c.archetype}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

type Slot = 'top' | 'bottom' | 'footwear' | 'headwear';
const SLOTS: Array<{ id: Slot; label: string; list: keyof typeof outfits.options; colorKey: keyof OutfitChoice | null }> = [
  { id: 'top', label: 'Top', list: 'tops', colorKey: 'topColor' },
  { id: 'bottom', label: 'Trousers', list: 'bottoms', colorKey: 'bottomColor' },
  { id: 'footwear', label: 'Footwear', list: 'footwear', colorKey: 'footColor' },
  { id: 'headwear', label: 'Headwear', list: 'headwear', colorKey: 'headColor' },
];

function StudioScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const id = useContenderStore((s) => s.activeContenderId) ?? contenders[0]!.id;
  const overrides = useContenderStore((s) => s.outfits[id]);
  const setOutfit = useContenderStore((s) => s.setOutfit);
  const resetOutfit = useContenderStore((s) => s.resetOutfit);
  const contender = contenders.find((c) => c.id === id) ?? contenders[0]!;
  const hostRef = useRef<HTMLDivElement>(null);
  const studioRef = useRef<CharacterStudio | null>(null);
  const [slot, setSlot] = useState<Slot>('top');
  const [zoom, setZoom] = useState(0);
  const { look, outfit } = getCharacter(id, overrides);

  useEffect(() => {
    if (!hostRef.current) return;
    const studio = new CharacterStudio(hostRef.current);
    studioRef.current = studio;
    return () => {
      studio.dispose();
      studioRef.current = null;
    };
  }, []);

  const outfitKey = JSON.stringify(outfit);
  useEffect(() => {
    studioRef.current?.setCharacter(look, outfit);
  }, [id, outfitKey]);

  useEffect(() => {
    studioRef.current?.setZoom(zoom);
  }, [zoom]);

  const def = SLOTS.find((x) => x.id === slot)!;
  const options = outfits.options[def.list] as Array<{ id: string; name: string }>;
  const current = outfit[slot];
  const colorKey = def.colorKey;

  return (
    <div className="cr-screen cr-screen--studio">
      <div className="cr-studio">
        <div className="cr-studio-view" style={{ ['--c1' as string]: contender.palette[0], ['--c2' as string]: contender.palette[1] }}>
          <div className="cr-studio-host" ref={hostRef} />
          <div className="cr-studio-hint">Drag to turn · scroll buttons to zoom</div>
          <div className="cr-studio-ctrl">
            <button type="button" className="cr-icon-btn" aria-label="Turn left" onClick={() => studioRef.current?.rotateBy(-Math.PI / 4)}>
              ⟲
            </button>
            <button type="button" className="cr-icon-btn" aria-label="Zoom" onClick={() => setZoom((z) => (z === 0 ? 1 : 0))}>
              {zoom === 0 ? '＋' : '－'}
            </button>
            <button type="button" className="cr-icon-btn" aria-label="Turn right" onClick={() => studioRef.current?.rotateBy(Math.PI / 4)}>
              ⟳
            </button>
          </div>
        </div>
        <div className="cr-studio-panel">
          <button type="button" className="cr-link" onClick={() => setScreen('roster')}>
            ← All Contenders
          </button>
          <h2>{contender.name}</h2>
          <p className="cr-tag" style={{ margin: 0 }}>
            {contender.archetype}
          </p>
          <div className="cr-chips">
            <span className="cr-chip">{contender.perk.description}</span>
            <span className="cr-chip cr-chip--trade">{contender.tradeoff.description}</span>
          </div>

          <div className="cr-tabs" role="tablist">
            {SLOTS.map((x) => (
              <button
                key={x.id}
                type="button"
                role="tab"
                aria-selected={slot === x.id}
                className={`cr-tab${slot === x.id ? ' is-on' : ''}`}
                onClick={() => setSlot(x.id)}
              >
                {x.label}
              </button>
            ))}
          </div>
          <div className="cr-opts">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`cr-opt${current === o.id ? ' is-on' : ''}`}
                onClick={() => setOutfit(id, { [slot]: o.id })}
              >
                {o.name}
              </button>
            ))}
          </div>
          {colorKey && (
            <div className="cr-swatches" aria-label="Colour">
              {outfits.options.colors.map((col) => (
                <button
                  key={col}
                  type="button"
                  aria-label={`Colour ${col}`}
                  className={`cr-swatch${outfit[colorKey] === col ? ' is-on' : ''}`}
                  style={{ background: col }}
                  onClick={() => setOutfit(id, { [colorKey]: col })}
                />
              ))}
            </div>
          )}
          <div className="cr-row" style={{ marginTop: 'auto' }}>
            <button className="cr-btn cr-btn--ghost" type="button" onClick={() => resetOutfit(id)}>
              Reset look
            </button>
            <button className="cr-btn" type="button" onClick={() => setScreen('briefing')}>
              Campaign in Lagos →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const STAR_LABEL: Record<string, string> = {
  none: 'No tier yet',
  foothold: 'Foothold',
  majority: 'Majority',
  landslide: 'Landslide',
};

function Briefing() {
  const setScreen = useGameStore((s) => s.setScreen);
  const setRide = useGameStore((s) => s.setActiveRide);
  const following = useGameStore((s) => s.following);
  const rideId = useGameStore((s) => s.activeRideId);
  const radioOn = useGameStore((s) => s.radioOn);
  const setRadioOn = useGameStore((s) => s.setRadioOn);
  const stateId = useGameStore((s) => s.activeStateId);
  const travelGate = useGameStore((s) => s.travelGate);
  const travel = useGameStore((s) => s.travel);
  const id = useContenderStore((s) => s.activeContenderId) ?? contenders[0]!.id;
  const pack = useStatePack(stateId);
  const contender = contenders.find((c) => c.id === id) ?? contenders[0]!;
  const chosen = rides.find((r) => r.id === rideId && isRidePlayable(r, following)) ?? rides[0]!;
  const nextRide = rides.find((r) => r.playable && r.followingGate > following);
  const landmarks = pack?.landmarks.map((l) => l.name) ?? lagosLaunch.landmarks;
  const welcome = pack?.welcomeLines[0] ?? lagosLaunch.welcomeLine;
  const stem = pack?.audioStem ?? lagosLaunch.audioStem;
  const station = stationFor(stem);
  const gate = travelGate(stateId);
  const dayTravel = syncTravelDay(travel);
  return (
    <div className="cr-screen cr-screen--briefing">
      <div className="cr-brief">
        <div className="cr-chrome-top">
          <p className="cr-kicker">{pack?.name ?? 'Lagos'} open</p>
          <button type="button" className="cr-radio-chip" onClick={() => setRadioOn(!radioOn)}>
            {radioOn ? station.name : 'Radio off'}
          </button>
        </div>
        <h2>{welcome}</h2>
        <p className="cr-tag">
          {contender.name} · {chosen.name} · Following {following}
          {nextRide ? ` · ${nextRide.followingGate - following} to ${nextRide.name}` : ''}
        </p>

        <p className="cr-kicker">Today&apos;s Road</p>
        <ol className="cr-route cr-route--trail">
          <li>
            <b>▣</b>Border Gate
          </li>
          {landmarks.map((name, i) => (
            <li key={name}>
              <b>{i + 1}</b>
              {name}
            </li>
          ))}
          <li className="is-final">
            <b>★</b>Grand Rally
          </li>
        </ol>

        <div className="cr-rides" role="listbox" aria-label="Ride">
          {rides.map((r) => {
            const open = isRidePlayable(r, following);
            const on = chosen.id === r.id;
            return (
              <button
                key={r.id}
                type="button"
                role="option"
                aria-selected={on}
                disabled={!open}
                className={`cr-ride${on ? ' is-on' : ''}`}
                onClick={() => setRide(r.id)}
              >
                <strong>{r.name}</strong>
                <small>{open ? `${r.capacity} seats` : r.playable ? `${r.followingGate} Fol.` : 'Later'}</small>
              </button>
            );
          })}
        </div>

        <p className="cr-tips-one">Swipe lanes · Flick hop · BRAKE in yellow zones to load/unload</p>
        <DailyChip />
        <p className="cr-fineprint">
          Travel today {dayTravel.runsToday}/{travelCaps.maxRunsPerDay} · states {dayTravel.statesTouched.length}/
          {travelCaps.maxStatesPerDay}
        </p>
        {!gate.ok && (
          <p className="cr-fineprint">
            Travel cap hit ({gate.reason === 'states' ? 'too many states' : gate.reason === 'state-runs' ? 'this state' : 'daily runs'}). Back tomorrow.
          </p>
        )}
        <div className="cr-row">
          <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('map')}>
            Board
          </button>
          <button
            className="cr-btn"
            type="button"
            disabled={!gate.ok}
            onClick={() => {
              setRide(chosen.id);
              setScreen('game');
            }}
          >
            Start the run
          </button>
        </div>
      </div>
    </div>
  );
}

function ConvoyYard() {
  const setScreen = useGameStore((s) => s.setScreen);
  const coins = useGameStore((s) => s.coins);
  const following = useGameStore((s) => s.following);
  const story = useGameStore((s) => s.startingStory);
  const choose = useGameStore((s) => s.chooseStartingStory);
  const levels = useGameStore((s) => s.upgrades);
  const buy = useGameStore((s) => s.buyUpgrade);
  const donationDay = useGameStore((s) => s.donationDay);
  const claim = useGameStore((s) => s.claimDonation);
  const streak = useGameStore((s) => s.streak);
  const progress = useGameStore((s) => s.missionProgress);
  const done = useGameStore((s) => s.completedMissions);
  const travel = useGameStore((s) => s.travel);
  const dayTravel = syncTravelDay(travel);
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date());
  const weekly = metaConfig.missions.weekly;
  const weeklyCur = Math.min(progress[weekly.id] ?? 0, weekly.target);
  const weeklyOk = done.includes(weekly.id);
  return (
    <div className="cr-screen cr-screen--yard">
      <div className="cr-chrome-top">
        <h2>Convoy Yard</h2>
        <button className="cr-link" type="button" onClick={() => setScreen('splash')}>
          ← Back
        </button>
      </div>
      <div className="cr-board-score cr-board-score--compact">
        <article>
          <span>Funds</span>
          <strong>₦{coins}</strong>
        </article>
        <article>
          <span>Following</span>
          <strong>{following}</strong>
        </article>
        <article>
          <span>Streak</span>
          <strong>{streak}</strong>
        </article>
      </div>

      {!story && (
        <section className="cr-yard-block">
          <p className="cr-kicker">Starting Story</p>
          <div className="cr-rides">
            {metaConfig.starts.map((start) => (
              <button key={start.id} type="button" className="cr-ride" onClick={() => choose(start.id)}>
                <strong>{start.name}</strong>
                <small>
                  ₦{start.coins} · {start.following} Fol.
                </small>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="cr-yard-block">
        <div className="cr-chrome-top">
          <p className="cr-kicker">Today</p>
          <button className="cr-mini-btn" type="button" disabled={donationDay === day} onClick={() => claim()}>
            {donationDay === day ? 'Donated' : `Claim ₦${metaConfig.rewards.donation}`}
          </button>
        </div>
        <DailyChip />
        <ul className="cr-mission-list">
          {metaConfig.missions.daily.map((m) => {
            const cur = Math.min(progress[m.id] ?? 0, m.target);
            const ok = done.includes(m.id);
            return (
              <li key={m.id} className={ok ? 'is-done' : ''}>
                <span>{m.label}</span>
                <div className="cr-track">
                  <i style={{ width: `${(cur / m.target) * 100}%` }} />
                </div>
                <b>
                  {cur}/{m.target}
                </b>
              </li>
            );
          })}
          <li className={weeklyOk ? 'is-done' : ''}>
            <span>{weekly.label}</span>
            <div className="cr-track">
              <i style={{ width: `${(weeklyCur / weekly.target) * 100}%` }} />
            </div>
            <b>
              {weeklyCur}/{weekly.target}
            </b>
          </li>
        </ul>
        <p className="cr-fineprint">
          Travel {dayTravel.runsToday}/{travelCaps.maxRunsPerDay} runs · {dayTravel.statesTouched.length}/{travelCaps.maxStatesPerDay}{' '}
          states
        </p>
      </section>

      <section className="cr-yard-block">
        <p className="cr-kicker">Upgrades</p>
        <div className="cr-rides">
          {metaConfig.upgrades.map((upgrade) => {
            const level = levels[upgrade.id];
            const cost = upgrade.costs[level];
            return (
              <button
                key={upgrade.id}
                type="button"
                className="cr-ride"
                disabled={level >= 5 || coins < (cost ?? 0)}
                onClick={() => buy(upgrade.id)}
              >
                <strong>
                  {upgrade.name} · {level}/5
                </strong>
                <small>{level >= 5 ? 'Max' : `₦${cost}`}</small>
              </button>
            );
          })}
        </div>
      </section>

      <section className="cr-yard-block">
        <p className="cr-kicker">Rides</p>
        <div className="cr-rides">
          {rides.map((ride) => (
            <div key={ride.id} className={`cr-ride${ride.playable && following >= ride.followingGate ? ' is-on' : ''}`}>
              <strong>{ride.name}</strong>
              <small>
                {ride.playable
                  ? following >= ride.followingGate
                    ? `${ride.capacity} seats`
                    : `${ride.followingGate - following} Fol.`
                  : 'Later'}
              </small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DailyChip() {
  const claimed = useGameStore((s) => s.dailyChallengeClaimed);
  const ch = todaysChallenge();
  const done = claimed === ch.id;
  return (
    <p className={`cr-daily-chip${done ? ' is-done' : ''}`}>
      <span>Daily</span>
      {ch.label}
      <b>₦{ch.reward}</b>
    </p>
  );
}

function Summary() {
  const setScreen = useGameStore((s) => s.setScreen);
  const skill = useGameStore((s) => s.lastRunSkillCrowd);
  const display = useGameStore((s) => s.lastRunDisplayCrowd);
  const delivered = useGameStore((s) => s.lastRunDelivered);
  const dents = useGameStore((s) => s.lastRunDents);
  const integrity = useGameStore((s) => s.lastRunIntegrity);
  const phase = useGameStore((s) => s.lastRunPhase);
  const addFollowing = useGameStore((s) => s.addFollowing);
  const noteRun = useGameStore((s) => s.noteRun);
  const recordMetaRun = useGameStore((s) => s.recordMetaRun);
  const claimDailyIfMet = useGameStore((s) => s.claimDailyIfMet);
  const metaReward = useGameStore((s) => s.lastMetaReward);
  const following = useGameStore((s) => s.following);
  const streak = useGameStore((s) => s.streak);
  const rideId = useGameStore((s) => s.activeRideId);
  const stateId = useGameStore((s) => s.activeStateId);
  const contenderId = useContenderStore((s) => s.activeContenderId) ?? contenders[0]!.id;
  const consentLog = useAccountStore((s) => s.consentLog);
  const shareContender = contenderShareAllowed(consentLog);
  const username = useGameStore((s) => s.username);
  const setUsername = useGameStore((s) => s.setUsername);
  const submitLastRunToBoard = useGameStore((s) => s.submitLastRunToBoard);
  const pack = useStatePack(stateId);
  const awarded = useRef(false);
  const [shareNote, setShareNote] = useState('');
  const [boardNote, setBoardNote] = useState('');
  const [nameDraft, setNameDraft] = useState(username);
  const [dailyBonus, setDailyBonus] = useState(0);
  const ride = rides.find((r) => r.id === rideId) ?? rides[0]!;
  const contender = contenders.find((c) => c.id === contenderId) ?? contenders[0]!;
  const star = phase === 'breakdown' ? 'none' : starForCrowd(skill, ride.capacity, simConfig);
  const stateName = pack?.name ?? 'Lagos';

  useEffect(() => {
    if (awarded.current) return;
    awarded.current = true;
    recordMetaRun({ delivered, crowd: skill, finished: phase === 'finished' });
    const bonus = claimDailyIfMet({
      finished: phase === 'finished',
      dents,
      delivered,
      crowd: skill,
      integrity,
      star,
    });
    setDailyBonus(bonus);
    addFollowing(delivered);
    noteRun(stateId, skill);
  }, [recordMetaRun, claimDailyIfMet, addFollowing, noteRun, skill, delivered, phase, dents, integrity, star, stateId]);

  const onShare = async () => {
    setShareNote('…');
    try {
      const blob = await renderShareCard({
        crowd: display,
        starLabel: STAR_LABEL[star] ?? 'Crowd',
        rideName: ride.name,
        contenderName: shareContender ? contender.name : 'Your Contender',
        stateName,
      });
      const how = await shareOrDownload(blob, `campaign-run-${skill}.png`);
      setShareNote(how === 'shared' ? 'Shared' : 'Saved image');
    } catch {
      setShareNote('Share failed');
    }
  };

  const onBoard = () => {
    const named = setUsername(nameDraft);
    if (!named.ok) {
      setBoardNote(named.reason === 'banned' ? 'Name not allowed' : named.reason === 'length' ? '3–16 characters' : 'Letters & numbers only');
      return;
    }
    const res = submitLastRunToBoard(stateId);
    setBoardNote(res.ok ? 'On the local board' : res.reason === 'crowd' || res.reason === 'delivered' ? 'Score rejected' : 'Could not post');
  };

  return (
    <div className="cr-screen cr-screen--summary">
      <p className="cr-kicker">{phase === 'breakdown' ? 'Breakdown' : 'Rally called'}</p>
      <h2>{STAR_LABEL[star]}</h2>
      <p className="cr-big-score">{skill}</p>
      <p className="cr-tag">Crowd · {ride.name}</p>
      <div className="cr-board-score cr-board-score--compact">
        <article>
          <span>Delivered</span>
          <strong>{delivered}</strong>
        </article>
        <article>
          <span>Following</span>
          <strong>{following + (awarded.current ? 0 : delivered)}</strong>
        </article>
        <article>
          <span>Funds</span>
          <strong>₦{metaReward + dailyBonus}</strong>
        </article>
        <article>
          <span>Dents</span>
          <strong>
            {dents}/3
          </strong>
        </article>
      </div>
      {dailyBonus > 0 ? (
        <p className="cr-daily-chip is-done">Daily cleared · ₦{dailyBonus}</p>
      ) : (
        phase === 'finished' && <DailyChip />
      )}
      {display > skill && <p className="cr-fineprint">Celebration Crowd {display}</p>}
      <p className="cr-fineprint">Streak {streak} · Game scores, not a poll</p>
      <div className="cr-share-row">
        <button className="cr-btn cr-btn--ghost" type="button" onClick={() => void onShare()}>
          Share card
        </button>
        {shareNote && <span className="cr-fineprint">{shareNote}</span>}
      </div>
      {phase === 'finished' && (
        <div className="cr-board-submit">
          <label>
            Board name
            <input
              type="text"
              maxLength={16}
              value={nameDraft}
              placeholder="3–16 chars"
              onChange={(e) => setNameDraft(e.target.value)}
            />
          </label>
          <button className="cr-mini-btn" type="button" onClick={onBoard}>
            Post local
          </button>
          {boardNote && <span className="cr-fineprint">{boardNote}</span>}
        </div>
      )}
      <div className="cr-row">
        <button className="cr-btn" type="button" onClick={() => setScreen('game')}>
          Run again
        </button>
        <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('map')}>
          Board
        </button>
        <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('yard')}>
          Yard
        </button>
      </div>
    </div>
  );
}

function Settings() {
  const setScreen = useGameStore((s) => s.setScreen);
  const back = useGameStore((s) => s.settingsBack);
  const sfx = useGameStore((s) => s.sfxVolume);
  const music = useGameStore((s) => s.musicVolume);
  const setVolumes = useGameStore((s) => s.setVolumes);
  const haptics = useGameStore((s) => s.haptics);
  const dataSaver = useGameStore((s) => s.dataSaver);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const setFlags = useGameStore((s) => s.setFlags);

  useEffect(() => {
    audio.setVolumes(sfx, music);
  }, [sfx, music]);

  return (
    <div className="cr-screen cr-screen--settings">
      <h2>Settings</h2>
      <div className="cr-card cr-settings-card">
        <label>
          SFX
          <input type="range" min={0} max={1} step={0.05} value={sfx} onChange={(e) => setVolumes(Number(e.target.value), music)} />
        </label>
        <label>
          Music
          <input type="range" min={0} max={1} step={0.05} value={music} onChange={(e) => setVolumes(sfx, Number(e.target.value))} />
        </label>
        <label className="cr-check">
          <input type="checkbox" checked={haptics} onChange={(e) => setFlags({ haptics: e.target.checked })} />
          Haptics
        </label>
        <label className="cr-check">
          <input type="checkbox" checked={dataSaver} onChange={(e) => setFlags({ dataSaver: e.target.checked })} />
          Data saver
        </label>
        <label className="cr-check">
          <input type="checkbox" checked={reduceMotion} onChange={(e) => setFlags({ reduceMotion: e.target.checked })} />
          Reduce motion
        </label>
      </div>
      <div className="cr-row">
        <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('account')}>
          Account
        </button>
        <button className="cr-btn" type="button" onClick={() => setScreen(back === 'settings' ? 'splash' : back)}>
          Back
        </button>
      </div>
    </div>
  );
}

function About() {
  const setScreen = useGameStore((s) => s.setScreen);
  return (
    <div className="cr-screen cr-screen--settings">
      <h2>About</h2>
      <div className="cr-card">
        <p>{copy.disclosure}</p>
      </div>
      <div className="cr-card">
        <p className="cr-kicker">{legal.privacyTitle}</p>
        <p>{legal.privacyBody}</p>
      </div>
      <div className="cr-card">
        <p className="cr-kicker">{legal.termsTitle}</p>
        <p>{legal.termsBody}</p>
      </div>
      <div className="cr-row">
        <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('account')}>
          Account
        </button>
        <button className="cr-btn" type="button" onClick={() => setScreen('splash')}>
          Back
        </button>
      </div>
    </div>
  );
}

function AccountScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const guestId = useAccountStore((s) => s.guestId);
  const mode = useAccountStore((s) => s.mode);
  const displayName = useAccountStore((s) => s.displayName);
  const consentLog = useAccountStore((s) => s.consentLog);
  const termsVersion = useAccountStore((s) => s.termsAcceptedVersion);
  const privacyVersion = useAccountStore((s) => s.privacyAcceptedVersion);
  const termsOk = termsVersion === legal.version;
  const privacyOk = privacyVersion === legal.version;
  const shareOk = contenderShareAllowed(consentLog);
  const acceptTerms = useAccountStore((s) => s.acceptTerms);
  const acceptPrivacy = useAccountStore((s) => s.acceptPrivacy);
  const grantContenderShare = useAccountStore((s) => s.grantContenderShare);
  const withdrawContenderShare = useAccountStore((s) => s.withdrawContenderShare);
  const saveLocalAccount = useAccountStore((s) => s.saveLocalAccount);
  const [nameDraft, setNameDraft] = useState(displayName);
  const [note, setNote] = useState('');

  const onSave = () => {
    const res = saveLocalAccount(nameDraft);
    if (!res.ok) {
      setNote(res.reason === 'legal' ? 'Accept Terms and Privacy first' : res.reason === 'length' ? '3–16 characters' : 'Name not allowed');
      return;
    }
    setNote(`Saved as ${res.name}`);
  };

  return (
    <div className="cr-screen cr-screen--settings">
      <h2>Account</h2>
      <div className="cr-card">
        <p className="cr-kicker">{mode === 'saved' ? 'Saved locally' : 'Guest'}</p>
        <p>
          {mode === 'saved' ? displayName : 'Playing as guest'} · id {guestId.slice(0, 8)}
        </p>
        <p className="cr-fineprint">Cloud sign-in comes later. Contender data stays local until you consent.</p>
      </div>

      <div className="cr-card">
        <p className="cr-kicker">{legal.guestSaveTitle}</p>
        <p>{legal.guestSaveBody}</p>
        <label className="cr-check">
          <input type="checkbox" checked={termsOk} onChange={(e) => e.target.checked && acceptTerms()} />
          Accept {legal.termsTitle} (v{legal.version})
        </label>
        <label className="cr-check">
          <input type="checkbox" checked={privacyOk} onChange={(e) => e.target.checked && acceptPrivacy()} />
          Accept {legal.privacyTitle} (v{legal.version})
        </label>
        <div className="cr-board-submit">
          <label>
            Local name
            <input type="text" maxLength={16} value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="3–16 chars" />
          </label>
          <button className="cr-mini-btn" type="button" onClick={onSave}>
            Save
          </button>
        </div>
      </div>

      <div className="cr-card">
        <p className="cr-kicker">{legal.contenderConsentTitle}</p>
        <p>{legal.contenderConsentBody}</p>
        <label className="cr-check">
          <input
            type="checkbox"
            checked={shareOk}
            onChange={(e) => (e.target.checked ? grantContenderShare() : withdrawContenderShare())}
          />
          {legal.contenderConsentAccept}
        </label>
        <p className="cr-fineprint">Consent log: {consentLog.length} entries · Lawyer review still required before public launch.</p>
      </div>

      <div className="cr-row">
        <button
          className="cr-btn cr-btn--ghost"
          type="button"
          onClick={() => {
            downloadExport(buildExportBundle());
            setNote('Export downloaded');
          }}
        >
          Export data
        </button>
        <button
          className="cr-btn cr-btn--ghost"
          type="button"
          onClick={() => {
            if (window.confirm('Delete all local Campaign Run data on this device?')) deleteAllLocalData();
          }}
        >
          Delete data
        </button>
      </div>
      {note && <p className="cr-fineprint">{note}</p>}
      <button className="cr-btn" type="button" onClick={() => setScreen('splash')}>
        Back
      </button>
    </div>
  );
}

function Paused() {
  const setScreen = useGameStore((s) => s.setScreen);
  const crowd = useGameStore((s) => s.lastRunSkillCrowd);
  return (
    <div className="cr-pause">
      <div className="cr-pause-card">
        <p className="cr-kicker">Paused</p>
        <h2>Hold the road</h2>
        <div className="cr-row">
          <button className="cr-btn" type="button" onClick={() => setScreen('game')}>
            Resume
          </button>
          <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('briefing')}>
            Quit
          </button>
        </div>
        {crowd > 0 && <p className="cr-fineprint">Last Crowd {crowd}</p>}
      </div>
    </div>
  );
}

type HudSnapshot = {
  crowd: number;
  carried: number;
  capacity: number;
  dents: number;
  momentum: number;
  integrity: number;
  progress: number;
  prompt: string;
  toast: string;
  from: string;
  to: string;
};

function GameScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const setScreen = useGameStore((s) => s.setScreen);
  const contenderId = useContenderStore((s) => s.activeContenderId) ?? 'baba-bullabaa';
  const outfitOverrides = useContenderStore((s) => s.outfits[contenderId]);
  const rideId = useGameStore((s) => s.activeRideId);
  const stateId = useGameStore((s) => s.activeStateId);
  const pack = useStatePack(stateId);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const dataSaver = useGameStore((s) => s.dataSaver);
  const upgrades = useGameStore((s) => s.upgrades);
  const haptics = useGameStore((s) => s.haptics);
  const sfxVolume = useGameStore((s) => s.sfxVolume);
  const musicVolume = useGameStore((s) => s.musicVolume);
  const radioOn = useGameStore((s) => s.radioOn);
  const setRadioOn = useGameStore((s) => s.setRadioOn);
  const seenTutorial = useGameStore((s) => s.seenTutorial);
  const setSeenTutorial = useGameStore((s) => s.setSeenTutorial);

  const [hud, setHud] = useState<HudSnapshot>({
    crowd: 0,
    carried: 0,
    capacity: 8,
    dents: 0,
    momentum: 1000,
    integrity: 100,
    progress: 0,
    prompt: '',
    toast: '',
    from: 'Your street',
    to: 'Lagos gate',
  });
  const [showTutorial, setShowTutorial] = useState(!seenTutorial);
  const toastRef = useRef({ text: '', until: 0 });

  const contender = contenders.find((c) => c.id === contenderId) ?? contenders[0]!;
  const ride = rides.find((r) => r.id === rideId) ?? rides[0]!;
  // Stable across HUD re-renders — a fresh array here remounts the whole WebGL run.
  const landmarks = useMemo(
    () => pack?.landmarks.map((l) => l.name) ?? lagosLaunch.landmarks,
    [pack],
  );
  const audioStem = pack?.audioStem ?? lagosLaunch.audioStem;
  const gateLabel = `${pack?.name ?? 'Lagos'} gate`;
  useEffect(() => {
    if (!containerRef.current || !pack) return;
    const container = containerRef.current;
    let alive = true;

    void audio.unlock();
    audio.setVolumes(sfxVolume, musicVolume);
    audio.tune(audioStem);
    audio.setRadio(radioOn);

    const debug = new URLSearchParams(window.location.search).has('debug');
    const ch = getCharacter(contender.id, outfitOverrides);
    const renderer = new GameRenderer({
      look: ch.look,
      outfit: ch.outfit,
      landmarks,
      rideId: ride.id,
      config: simConfig,
      reduceMotion: reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      dataSaver,
      debug,
    });
    container.insertBefore(renderer.canvas, container.firstChild);
    renderer.resize();
    audio.startRun();

    const input = new InputController();
    input.attach(container);

    const seed = (Math.random() * 0xffffffff) >>> 0;
    const state = initState(simConfig, seedRng(seed), { capacity: ride.capacity, contenderId, upgrades: runModifiers(upgrades) });
    // Debug-only (needs ?debug): jump to a distance in metres to inspect later Lagos segments.
    const dbgZ = Number(new URLSearchParams(window.location.search).get('debugZ'));
    if (debug && Number.isFinite(dbgZ) && dbgZ > 0) state.z = Math.floor(dbgZ) * 1000;
    let prev: SimState = cloneState(state);


    let last = performance.now();
    const msPerTick = 1000 / simConfig.tickHz;
    let acc = 0;
    let frameId = 0;
    let hudAcc = 0;

    const bindHold = (sel: string, on: (v: boolean) => void) => {
      const el = container.querySelector(sel) as HTMLElement | null;
      if (!el) return () => {};
      const down = (e: Event) => {
        e.preventDefault();
        on(true);
        el.classList.add('is-held');
      };
      const up = () => {
        on(false);
        el.classList.remove('is-held');
      };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointerleave', up);
      el.addEventListener('pointercancel', up);
      return () => {
        el.removeEventListener('pointerdown', down);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointerleave', up);
        el.removeEventListener('pointercancel', up);
      };
    };

    const cleanGas = bindHold('[data-control=gas]', (v) => input.setGas(v));
    const cleanBrake = bindHold('[data-control=brake]', (v) => input.setBrake(v));
    const cleanHorn = bindHold('[data-control=horn]', (v) => input.setHorn(v));
    const beatEl = container.querySelector('[data-control=beat]');
    const onBeat = (e: Event) => {
      e.preventDefault();
      input.pulseTap();
    };
    beatEl?.addEventListener('pointerdown', onBeat);
    const perkEl = container.querySelector('[data-control=perk]');
    const onPerk = (e: Event) => {
      e.preventDefault();
      input.pulsePerk();
    };
    perkEl?.addEventListener('pointerdown', onPerk);

    const endRun = () => {
      useGameStore.getState().setRunResult({
        skillCrowd: state.skillCrowd,
        displayCrowd: state.displayCrowd,
        delivered: state.delivered,
        dents: state.dents,
        integrity: state.integrity,
        capacity: state.capacity,
        phase: state.phase === 'breakdown' ? 'breakdown' : 'finished',
      });
      setScreen('summary');
    };

    const loop = (time: number) => {
      if (!alive) return;
      const screenNow = useGameStore.getState().screen;
      if (screenNow === 'paused') {
        audio.duck(true);
        last = time;
        frameId = requestAnimationFrame(loop);
        return;
      }
      if (screenNow !== 'game') return;
      audio.duck(false);

      const dt = Math.min(100, time - last);
      last = time;
      acc += dt;
      hudAcc += dt;

      while (acc >= msPerTick) {
        prev = cloneState(state);
        const bits = input.sample();
        step(state, bits, simConfig);
        input.postSampleClear();

        renderer.notifyEvents(state.events);
        for (const ev of state.events) {
          audio.playEvent(ev);
          if (haptics && navigator.vibrate) {
            if (ev.type === 'dent' || ev.type === 'hit') navigator.vibrate(30);
            if (ev.type === 'pickup' || ev.type === 'dropoff') navigator.vibrate(10);
          }
          if (ev.type === 'fullHouse') toastRef.current = { text: 'FULL HOUSE', until: time + 900 };
          if (ev.type === 'onBeat') toastRef.current = { text: 'ON BEAT', until: time + 900 };
          if (ev.type === 'integrityFail' && typeof ev.payload === 'string') {
            toastRef.current = { text: `FAIL · ${integrityEvent(ev.payload).title}`, until: time + 1400 };
          }
          if (ev.type === 'integritySuccess' && typeof ev.payload === 'string') {
            toastRef.current = { text: `CLEAR · ${integrityEvent(ev.payload).title}`, until: time + 1100 };
          }
        }
        acc -= msPerTick;

        if (state.phase !== 'running') {
          endRun();
          return;
        }
      }

      renderer.render(prev, state, acc / msPerTick);
      audio.setSpeed(state.speed, simConfig.maxSpeedUm);
      audio.setIntensity(state.momentum, state.carried, state.capacity);

      if (hudAcc > 80) {
        hudAcc = 0;
        let prompt = '';
        if (state.activeZoneId !== 0) {
          const z = state.entities.find((e) => e.id === state.activeZoneId);
          if (z?.zoneKind === 'pickup') prompt = 'BRAKE TO LOAD';
          else if (z?.zoneKind === 'venue' || z?.zoneKind === 'grand') prompt = 'BRAKE TO UNLOAD · TAP BEAT';
        }
        const toast = time < toastRef.current.until ? toastRef.current.text : '';
        const leg = legAt(state.z, landmarks, gateLabel);
        setHud({
          crowd: state.skillCrowd,
          carried: state.carried,
          capacity: state.capacity,
          dents: state.dents,
          momentum: state.momentum,
          integrity: state.integrity,
          progress: state.finishZ > 0 ? Math.min(100, Math.floor((state.z / state.finishZ) * 100)) : 0,
          prompt,
          toast,
          from: leg.from,
          to: leg.to,
        });
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      alive = false;
      cancelAnimationFrame(frameId);
      audio.stopRun();
      cleanGas();
      cleanBrake();
      cleanHorn();
      beatEl?.removeEventListener('pointerdown', onBeat);
      perkEl?.removeEventListener('pointerdown', onPerk);
      input.detach();
      renderer.dispose();
    };
  }, [
    pack,
    landmarks,
    audioStem,
    gateLabel,
    contender.id,
    outfitOverrides,
    ride.id,
    ride.capacity,
    reduceMotion,
    dataSaver,
    haptics,
    sfxVolume,
    musicVolume,
    setScreen,
    radioOn,
    contenderId,
    upgrades,
  ]);

  useEffect(() => {
    audio.setRadio(radioOn);
  }, [radioOn]);

  if (!pack) {
    return (
      <div className="cr-screen cr-screen--briefing">
        <p className="cr-kicker">Loading road…</p>
      </div>
    );
  }

  return (
    <div className="cr-game" ref={containerRef}>
      <div className="cr-hud">
        <div className="cr-hud-top">
          <div className="cr-stat">
            <span>Crowd</span>
            <strong>{hud.crowd}</strong>
            <div className="cr-track">
              <i style={{ width: `${hud.progress}%` }} />
            </div>
          </div>
          <div className="cr-stat">
            <span>Carry</span>
            <strong>
              {hud.carried}/{hud.capacity}
            </strong>
            <div className="cr-dents" aria-label="dents">
              {[0, 1, 2].map((i) => (
                <i key={i} className={`cr-dent${hud.dents > i ? ' is-filled' : ''}`} />
              ))}
            </div>
          </div>
          <div className="cr-stat">
            <span>Momentum</span>
            <strong>×{(hud.momentum / 1000).toFixed(2)}</strong>
          </div>
          <div className="cr-stat cr-stat--integrity">
            <span>Integrity</span>
            <strong>{hud.integrity}</strong>
            <div className="cr-track">
              <i style={{ width: `${hud.integrity}%` }} />
            </div>
          </div>
          <button className="cr-icon-btn" type="button" onClick={() => setScreen('paused')} aria-label="Pause">
            II
          </button>
        </div>
        <div className="cr-leg">
          <span>
            {hud.from} → {hud.to}
          </span>
          <button type="button" className="cr-radio-chip" onClick={() => setRadioOn(!radioOn)}>
            {radioOn ? stationFor(audioStem).name : 'Radio off'}
          </button>
        </div>

        <div className={`cr-toast${hud.toast ? ' is-on' : ''}`}>{hud.toast}</div>
        <div className={`cr-prompt${hud.prompt ? ' is-on' : ''}`}>{hud.prompt}</div>

        <div className="cr-controls">
          <button className="cr-pad cr-pad--brake" type="button" data-control="brake">
            BRAKE
          </button>
          <button className="cr-pad cr-pad--horn" type="button" data-control="horn">
            HORN
          </button>
          <button className="cr-pad cr-pad--beat" type="button" data-control="beat">
            BEAT
          </button>
          <button className="cr-pad cr-pad--perk" type="button" data-control="perk">
            PERK
          </button>
          <button className="cr-pad cr-pad--gas" type="button" data-control="gas">
            GAS
          </button>
        </div>
      </div>

      {showTutorial && (
        <div
          className="cr-screen"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(11,18,32,0.88)',
            zIndex: 5,
            justifyContent: 'center',
          }}
        >
          <div className="cr-card">
            <p>
              <strong>Swipe</strong> to change lanes · <strong>Flick up</strong> to hop
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              Hold <strong>BRAKE</strong> in glowing zones to load & unload. Tap <strong>BEAT</strong> at venues for
              a bonus.
            </p>
          </div>
          <button
            className="cr-btn"
            type="button"
            onClick={() => {
              setShowTutorial(false);
              setSeenTutorial(true);
            }}
          >
            Got it — drive
          </button>
        </div>
      )}
    </div>
  );
}

function cloneState(s: SimState): SimState {
  return {
    ...s,
    rng: { ...s.rng },
    entities: s.entities.map((e) => ({ ...e })),
    events: [...s.events],
  };
}
