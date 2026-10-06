import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from './state';
import { copy, simConfig, contenders, rides, lagos, outfits, isRidePlayable, type OutfitChoice } from '@cr/content';
import { initState, step, seedRng, starForCrowd, type SimState } from '@cr/sim';
import { GameRenderer } from './render/GameRenderer';
import { InputController } from './input/controls';
import { audio } from './audio/engine';
import { CharacterStudio, renderPortraits } from './render/studio';
import { getCharacter } from './characters';
import { CampaignMap } from './ui/CampaignMap';
import { legAt, stationFor } from './trail';
import { Showcase } from './render/showcase';

export function App() {
  const screen = useGameStore((s) => s.screen);
  const inRun = screen === 'game' || screen === 'paused';
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
      {screen === 'map' && <CampaignMap />}
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
  const contenderId = useGameStore((s) => s.activeContenderId) ?? contenders[0]!.id;
  const overrides = useGameStore((s) => s.outfits[contenderId]);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const dataSaver = useGameStore((s) => s.dataSaver);
  const station = stationFor(lagos.audioStem);
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
        <button className="cr-icon-btn cr-splash-gear" type="button" aria-label="Settings" onClick={() => setScreen('settings')}>
          ⚙
        </button>
      </div>
      <div className="cr-splash-copy">
        <p className="cr-kicker">{returning ? `Welcome back · ${following} Following` : 'Day 1 · You start in Lagos'}</p>
        <h1 className="cr-brand">
          <span>Campaign</span>
          <span>Run</span>
        </h1>
        <p className="cr-tag">
          Load supporters at the bus stops, dodge Lagos traffic, and roll into the Victoria Island grand rally with the
          biggest crowd.
        </p>
        <button className="cr-btn cr-btn--hero" type="button" onClick={start}>
          {returning ? 'Continue campaign' : copy.playButton}
        </button>
        <div className="cr-row">
          <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('map')}>
            Campaign map
          </button>
          {returning && (
            <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('roster')}>
              Change Contender
            </button>
          )}
          <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('about')}>
            About
          </button>
        </div>
        <p className="cr-fineprint">{copy.disclosure}</p>
      </div>
      <aside className="cr-splash-side">
        <p className="cr-kicker">On the air</p>
        <h2>{station.name}</h2>
        <p>{station.blurb}</p>
        <div className="cr-statrow">
          <div>
            <strong>1</strong>
            <span>state open</span>
          </div>
          <div>
            <strong>36</strong>
            <span>more on Mondays</span>
          </div>
          <div>
            <strong>{best ? best.crowd : '—'}</strong>
            <span>best Crowd</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

function usePortraits(ids: string[]) {
  const overrides = useGameStore((s) => s.outfits);
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
  const setActive = useGameStore((s) => s.setActiveContender);
  const active = useGameStore((s) => s.activeContenderId);
  const activeList = contenders.filter((c) => c.status === 'active');
  const portraits = usePortraits(activeList.map((c) => c.id));

  return (
    <div className="cr-screen cr-screen--roster">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Pick your Contender</h2>
        <span style={{ display: 'flex', gap: '0.4rem' }}>
          <button className="cr-mini-btn" type="button" onClick={() => setScreen('map')}>
            Map
          </button>
          <button className="cr-icon-btn" type="button" aria-label="Settings" onClick={() => setScreen('settings')}>
            ⚙
          </button>
        </span>
      </div>
      <p className="cr-tag" style={{ marginTop: 0 }}>
        Day 1 starts in Lagos. {lagos.welcomeLines[0]} Your choice stays on this device.
      </p>
      <div className="cr-roster">
        {activeList.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`cr-contender${active === c.id ? ' is-active' : ''}`}
            style={{ ['--c1' as string]: c.palette[0], ['--c2' as string]: c.palette[1] }}
            onClick={() => {
              setActive(c.id);
              void audio.unlock();
              setScreen('studio');
            }}
          >
            <span className="cr-portrait">
              {portraits[c.id] ? <img src={portraits[c.id]} alt={`${c.name} portrait`} /> : <b>{c.name[0]}</b>}
            </span>
            <span>
              <strong>{c.name}</strong>
              <small>
                {c.archetype} · “{c.catchphrase}”
              </small>
              <span className="cr-chips">
                <span className="cr-chip">{c.perk.description}</span>
                <span className="cr-chip cr-chip--trade">{c.tradeoff.description}</span>
              </span>
            </span>
          </button>
        ))}
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
  const id = useGameStore((s) => s.activeContenderId) ?? contenders[0]!.id;
  const overrides = useGameStore((s) => s.outfits[id]);
  const setOutfit = useGameStore((s) => s.setOutfit);
  const resetOutfit = useGameStore((s) => s.resetOutfit);
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
  const id = useGameStore((s) => s.activeContenderId) ?? contenders[0]!.id;
  const contender = contenders.find((c) => c.id === id) ?? contenders[0]!;
  const chosen = rides.find((r) => r.id === rideId && isRidePlayable(r, following)) ?? rides[0]!;
  const nextRide = rides.find((r) => r.playable && r.followingGate > following);
  return (
    <div className="cr-screen cr-screen--briefing">
      <div className="cr-brief">
        <p className="cr-kicker">Day 1 · Lagos</p>
        <h2>{lagos.welcomeLines[0]}</h2>
        <p className="cr-tag">
          {contender.name} campaigns through Lagos on {chosen.name}. Load supporters at the yellow bus-stop boxes and unload
          them at the rally points.
        </p>
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
                <small>
                  {open ? `${r.capacity} seats · ${r.trait}` : r.playable ? `Unlock at ${r.followingGate} Following` : 'Later'}
                </small>
              </button>
            );
          })}
        </div>
        <p className="cr-kicker">
          Following {following}
          {nextRide ? ` · ${nextRide.followingGate - following} to ${nextRide.name}` : ''}
        </p>
        <ol className="cr-route">
          {lagos.landmarks.map((l, i) => (
            <li key={l.name}>
              <b>{i + 1}</b>
              {l.name}
            </li>
          ))}
          <li className="is-final">
            <b>★</b>Grand Rally · Victoria Island
          </li>
        </ol>
        <ul className="cr-tips">
          <li>
            <strong>Swipe / ← →</strong> change lane · <strong>↑ / flick</strong> hop low barriers
          </li>
          <li>
            <strong>Hold BRAKE</strong> inside a glowing box to load or unload
          </li>
          <li>Tyres, barricades and cones can be hopped. Cars, danfos and roadworks cannot.</li>
        </ul>
        <div className="cr-row">
          <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('studio')}>
            Back
          </button>
          <button
            className="cr-btn"
            type="button"
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

function Summary() {
  const setScreen = useGameStore((s) => s.setScreen);
  const skill = useGameStore((s) => s.lastRunSkillCrowd);
  const delivered = useGameStore((s) => s.lastRunDelivered);
  const dents = useGameStore((s) => s.lastRunDents);
  const phase = useGameStore((s) => s.lastRunPhase);
  const addCoins = useGameStore((s) => s.addCoins);
  const addFollowing = useGameStore((s) => s.addFollowing);
  const noteRun = useGameStore((s) => s.noteRun);
  const following = useGameStore((s) => s.following);
  const rideId = useGameStore((s) => s.activeRideId);
  const awarded = useRef(false);
  const ride = rides.find((r) => r.id === rideId) ?? rides[0]!;
  const star = phase === 'breakdown' ? 'none' : starForCrowd(skill, ride.capacity, simConfig);

  useEffect(() => {
    if (awarded.current) return;
    awarded.current = true;
    addCoins(Math.floor(skill / 10) + delivered);
    addFollowing(delivered);
    noteRun('lagos', skill);
  }, [addCoins, addFollowing, noteRun, skill, delivered]);

  return (
    <div className="cr-screen cr-screen--summary">
      <h2>{phase === 'breakdown' ? 'Ride broke down' : 'Rally done!'}</h2>
      <p className="cr-big-score">{skill}</p>
      <p>
        Crowd · {STAR_LABEL[star]} · {ride.name}
      </p>
      <div className="cr-card" style={{ textAlign: 'left' }}>
        <p>Delivered: {delivered}</p>
        <p>Following: {following + (awarded.current ? 0 : delivered)}</p>
        <p>Dents: {dents}/3</p>
        <p style={{ marginTop: '0.5rem', opacity: 0.75 }}>{copy.disclosure}</p>
      </div>
      <div className="cr-row">
        <button className="cr-btn" type="button" onClick={() => setScreen('game')}>
          Run again
        </button>
        <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('roster')}>
          Roster
        </button>
      </div>
    </div>
  );
}

function Settings() {
  const setScreen = useGameStore((s) => s.setScreen);
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
      <div className="cr-card" style={{ width: '100%' }}>
        <label>
          SFX
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={sfx}
            onChange={(e) => setVolumes(Number(e.target.value), music)}
          />
        </label>
        <label>
          Music
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={music}
            onChange={(e) => setVolumes(sfx, Number(e.target.value))}
          />
        </label>
        <label>
          Haptics
          <input type="checkbox" checked={haptics} onChange={(e) => setFlags({ haptics: e.target.checked })} />
        </label>
        <label>
          Data saver
          <input type="checkbox" checked={dataSaver} onChange={(e) => setFlags({ dataSaver: e.target.checked })} />
        </label>
        <label>
          Reduce motion
          <input
            type="checkbox"
            checked={reduceMotion}
            onChange={(e) => setFlags({ reduceMotion: e.target.checked })}
          />
        </label>
      </div>
      <button className="cr-btn" type="button" onClick={() => setScreen('roster')}>
        Back
      </button>
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
        <p style={{ marginTop: '0.75rem' }}>18+ · Fictional Contenders · Scores are not polls.</p>
      </div>
      <button className="cr-btn" type="button" onClick={() => setScreen('splash')}>
        Back
      </button>
    </div>
  );
}

function Paused() {
  const setScreen = useGameStore((s) => s.setScreen);
  return (
    <div
      className="cr-screen cr-screen--settings"
      style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(11,18,32,0.92)' }}
    >
      <h2>Paused</h2>
      <button className="cr-btn" type="button" onClick={() => setScreen('game')}>
        Resume
      </button>
      <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('roster')}>
        Quit to roster
      </button>
    </div>
  );
}

type HudSnapshot = {
  crowd: number;
  carried: number;
  capacity: number;
  dents: number;
  momentum: number;
  progress: number;
  prompt: string;
  toast: string;
  from: string;
  to: string;
};

function GameScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const setScreen = useGameStore((s) => s.setScreen);
  const contenderId = useGameStore((s) => s.activeContenderId) ?? 'baba-bullabaa';
  const outfitOverrides = useGameStore((s) => s.outfits[contenderId]);
  const rideId = useGameStore((s) => s.activeRideId);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const dataSaver = useGameStore((s) => s.dataSaver);
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

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    let alive = true;

    void audio.unlock();
    audio.setVolumes(sfxVolume, musicVolume);
    audio.tune(lagos.audioStem);
    audio.setRadio(radioOn);

    const debug = new URLSearchParams(window.location.search).has('debug');
    const ch = getCharacter(contender.id, outfitOverrides);
    const renderer = new GameRenderer({
      look: ch.look,
      outfit: ch.outfit,
      landmarks: lagos.landmarks.map((l) => l.name),
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
    const state = initState(simConfig, seedRng(seed), { capacity: ride.capacity });
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
    const beatEl = container.querySelector('[data-control=beat]');
    const onBeat = (e: Event) => {
      e.preventDefault();
      input.pulseTap();
    };
    beatEl?.addEventListener('pointerdown', onBeat);

    const endRun = () => {
      useGameStore.getState().setRunResult({
        skillCrowd: state.skillCrowd,
        displayCrowd: state.displayCrowd,
        delivered: state.delivered,
        dents: state.dents,
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
        const leg = legAt(state.z);
        setHud({
          crowd: state.skillCrowd,
          carried: state.carried,
          capacity: state.capacity,
          dents: state.dents,
          momentum: state.momentum,
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
      beatEl?.removeEventListener('pointerdown', onBeat);
      input.detach();
      renderer.dispose();
    };
  }, [
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
  ]);

  useEffect(() => {
    audio.setRadio(radioOn);
  }, [radioOn]);

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
          <button className="cr-icon-btn" type="button" onClick={() => setScreen('paused')}>
            ❚❚
          </button>
        </div>
        <div className="cr-leg">
          <span>
            {hud.from} → {hud.to}
          </span>
          <button type="button" className="cr-radio-chip" onClick={() => setRadioOn(!radioOn)}>
            {radioOn ? stationFor(lagos.audioStem).name : 'Radio off'}
          </button>
        </div>

        <div className={`cr-toast${hud.toast ? ' is-on' : ''}`}>{hud.toast}</div>
        <div className={`cr-prompt${hud.prompt ? ' is-on' : ''}`}>{hud.prompt}</div>

        <div className="cr-controls">
          <button className="cr-pad cr-pad--brake" type="button" data-control="brake">
            BRAKE
          </button>
          <button className="cr-pad cr-pad--horn" type="button" data-control="beat">
            BEAT
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
