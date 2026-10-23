import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from './state';
import {
  copy,
  simConfig,
  contenders,
  controlTuning,
  rides,
  lagosLaunch,
  loadStatePack,
  isRidePlayable,
  integrityEvent,
  rideSimTraits,
  roadFit,
  roadLines,
  roadProfile,
  travelCaps,
} from '@cr/content';
import { initState, step, seedRng, encodeInputLog, type SimState, type InputRecord } from '@cr/sim';
import { loadGhost, saveGhostIfBest, bytesToBase64 } from './ghostStore';
import { computeGhostTrajectory } from './ghostReplay';
import { computeWeather } from './weather';
import { GameRenderer } from './render/GameRenderer';
import { InputController } from './input/controls';
import { audio } from './audio/engine';
import { getCharacter } from './characters';
import { useContenderStore } from './contenderStore';
import { CampaignMap } from './ui/CampaignMap';
import { AuthScreen } from './ui/AuthScreen';
import { AboutScreen } from './ui/AboutScreen';
import { SettingsScreen } from './ui/SettingsScreen';
import { AccountScreen } from './ui/AccountScreen';
import { ConvoyYard } from './ui/ConvoyYard';
import { DailyChip } from './ui/DailyChip';
import { useOnlineStore } from './onlineStore';
import { finishSign, gateSign, legAt, stationFor } from './trail';
import { Showcase } from './render/showcase';
import { runModifiers } from './meta';
import { syncTravelDay } from './travel';
import { daysLeft } from './campaignClock';
import { useStatePack } from './statePack';
import { authLinkFromUrl, strippedUrl } from './authLink';
import { RosterScreen } from './ui/RosterScreen';
import { StudioScreen } from './ui/StudioScreen';
import { SummaryScreen } from './ui/SummaryScreen';

export function App() {
  const screen = useGameStore((s) => s.screen);
  const activeStateId = useGameStore((s) => s.activeStateId);
  const inRun = screen === 'game' || screen === 'paused';
  const refreshOnline = useOnlineStore((s) => s.refresh);

  // C41: a confirmation or reset link lands here with its token in the query.
  // Read it once, act on it, and take it out of the address bar — a reset
  // token is a credential, and a URL ends up in history and in Referer.
  useEffect(() => {
    const link = authLinkFromUrl(window.location.search);
    if (!link) return;
    window.history.replaceState(null, '', strippedUrl(window.location.href));
    if (link.kind === 'reset') {
      useOnlineStore.getState().openReset(link.token);
      useGameStore.getState().setScreen('auth');
    } else {
      void useOnlineStore.getState().verifyEmail(link.token);
    }
  }, []);
  useEffect(() => {
    // The session is an httpOnly cookie, so the only way to know whether the
    // player is signed in is to ask the server once on boot.
    void refreshOnline();
  }, [refreshOnline]);
  useEffect(() => {
    // Prefetch the active pack (and keep Lagos warm for the launch shell).
    void loadStatePack(activeStateId);
    if (activeStateId !== 'lagos') void loadStatePack('lagos');
  }, [activeStateId]);
  return (
    <div className="cr-shell">
      {screen === 'splash' && <Splash />}
      {screen === 'roster' && <RosterScreen />}
      {screen === 'studio' && <StudioScreen />}
      {screen === 'briefing' && <Briefing />}
      {inRun && <GameScreen />}
      {screen === 'paused' && <Paused />}
      {screen === 'summary' && <SummaryScreen />}
      {screen === 'settings' && <SettingsScreen />}
      {screen === 'about' && <AboutScreen />}
      {screen === 'account' && <AccountScreen />}
      {screen === 'map' && <CampaignMap />}
      {screen === 'auth' && <AuthScreen />}
      {screen === 'yard' && <ConvoyYard />}
    </div>
  );
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
  // C45: the same hazard list the sim is about to be handed, in words.
  const hazards = pack?.hazards ?? [];
  const roadToday = roadLines(hazards);
  const fit = roadFit(chosen, hazards);
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

        {/*
          C45: until this chunk a state's hazards were three words in a JSON file
          that nothing read. They now reweight the obstacle table and the
          player's own handling, so the briefing names them — the road is the
          reason to change ride, and you cannot act on a reason you can't see.
        */}
        {roadToday.length > 0 && (
          <ul className="cr-road">
            {roadToday.map((h) => (
              <li key={h.id}>
                <b>{h.label}</b>
                <small>{h.note}</small>
              </li>
            ))}
          </ul>
        )}

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

        {/*
          C44: the picker above is seven near-identical buttons, and before this
          chunk that was an honest picture of seven near-identical rides. Now
          that they drive differently, the one you have selected says what it is
          good at and what it costs — in words, because this screen is two taps
          from the road and the numbers belong in the Yard.
        */}
        <p className="cr-ride-feel">
          <b>{chosen.trait}</b>
          {chosen.tradeoff ? ` · ${chosen.tradeoff}` : ''}
        </p>

        {/* C45: and what that ride is worth on *this* road, read off the composed profile. */}
        <ul className="cr-road-fit">
          {fit.map((note) => (
            <li key={note.text} className={`is-${note.tone}`}>
              {note.text}
            </li>
          ))}
        </ul>

        {/* C46 moved the controls to the glass; this line said BRAKE pad until C47. */}
        <p className="cr-tips-one">Flick ◀ ▶ lane · up hop · down brake &amp; hold in yellow zones</p>
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

/**
 * C46: the beat bonus, printed from the same permille the sim multiplies by, so
 * the prompt cannot promise a number the sim does not pay.
 */
const beatMult = (simConfig.bonuses.onBeatPermille / 1000).toFixed(1);

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
  // C46: the gestures replaced the pads, so the pads can no longer be what
  // tells the player their input landed. These do.
  braking: boolean;
  /** Percent of the on-beat window still open; 0 = shut. */
  beatOpen: number;
  beatTaps: number;
  beatNeeded: number;
  /** Percent charged; 100 = ready. */
  perkCharge: number;
  perkActive: boolean;
};

function GameScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const setScreen = useGameStore((s) => s.setScreen);
  const contenderId = useContenderStore((s) => s.activeContenderId) ?? 'mama-ankara';
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
    braking: false,
    beatOpen: 0,
    beatTaps: 0,
    beatNeeded: simConfig.bonuses.onBeatTaps,
    perkCharge: 100,
    perkActive: false,
  });
  const [showTutorial, setShowTutorial] = useState(!seenTutorial);
  const toastRef = useRef({ text: '', until: 0 });

  const contender = contenders.find((c) => c.id === contenderId) ?? contenders[0]!;
  const ride = rides.find((r) => r.id === rideId) ?? rides[0]!;
  const perkLabel = contender.perk.id.replace(/-/g, ' ');
  // Stable across HUD re-renders — a fresh array here remounts the whole WebGL run.
  const landmarks = useMemo(
    () => pack?.landmarks.map((l) => l.name) ?? lagosLaunch.landmarks,
    [pack],
  );
  const audioStem = pack?.audioStem ?? lagosLaunch.audioStem;
  const gateLabel = `${pack?.name ?? 'Lagos'} gate`;
  // C34: the roadside signs read from the pack. They were literals in the
  // renderer, so every state greeted the player with "WELCOME TO LAGOS".
  const stateName = pack?.name ?? 'Lagos';
  const gate = useMemo(
    () => gateSign(stateName, pack?.welcomeLines[0] ?? lagosLaunch.welcomeLine),
    [stateName, pack],
  );
  const finish = useMemo(() => finishSign(stateName, pack?.farewellLine), [stateName, pack]);
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
    // C29: your personal-best ghost for this state, if one's been set — precomputed once up
    // front so the render loop only ever does an array lookup, no second live sim.
    const ghost = loadGhost(stateId);
    // C45: on this state's road, because a ghost is only ever stored and replayed
    // per state — the road it drove is the road you are about to drive.
    const ghostTrajectory = ghost
      ? computeGhostTrajectory(ghost, simConfig, roadProfile(pack?.hazards ?? []))
      : undefined;
    const seed = (Math.random() * 0xffffffff) >>> 0;
    // C30: decided once, here, from the real clock — sim and the renderer's World just apply
    // the result, neither ever reads Date itself.
    const weather = computeWeather(Date.now(), pack?.zone ?? 'SW', seed);
    const renderer = new GameRenderer({
      look: ch.look,
      outfit: ch.outfit,
      landmarks,
      gate,
      finish,
      rideId: ride.id,
      config: simConfig,
      reduceMotion: reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      dataSaver,
      debug,
      ghostTrajectory,
      weather,
    });
    container.insertBefore(renderer.canvas, container.firstChild);
    renderer.resize();
    audio.startRun();

    const input = new InputController();
    input.attach(container);
    input.setHaptics(haptics);
    // The perk's cooldown is the ride's tradeoff away from the Contender's own
    // number, so the HUD learns the full bar from the first use rather than
    // recomputing the tradeoff maths a second time.
    let perkCdMax = 1;

    const inputLog: InputRecord[] = [];
    let lastLoggedBits = -1;
    const state = initState(simConfig, seedRng(seed), {
      // C44: capacity, size, traits and handling in one place, shared with the
      // ghost replay so the two can't disagree about how this ride drives.
      ...rideSimTraits(ride),
      // C45: the state's hazards, composed into arithmetic the sim understands.
      road: roadProfile(pack?.hazards ?? []),
      contenderId,
      upgrades: runModifiers(upgrades),
      signatureRideBonusPermille: pack?.signatureRide === ride.id ? simConfig.bonuses.signatureRideBonusPermille : 1000,
      rallySaturdayMultiplierPermille: weather.isRallySaturday ? simConfig.bonuses.rallySaturdayMultiplierPermille : 1000,
    });
    // Debug-only (needs ?debug): jump to a distance in metres to inspect later Lagos segments.
    const dbgZ = Number(new URLSearchParams(window.location.search).get('debugZ'));
    if (debug && Number.isFinite(dbgZ) && dbgZ > 0) state.z = Math.floor(dbgZ) * 1000;
    let prev: SimState = cloneState(state);


    let last = performance.now();
    const msPerTick = 1000 / simConfig.tickHz;
    let acc = 0;
    let frameId = 0;
    let hudAcc = 0;

    // C46: BEAT and PERK are the only two pads left. Everything else is a
    // gesture read off the glass by the InputController itself.
    const beatEl = container.querySelector('[data-control=beat]');
    const onBeat = (e: Event) => {
      e.preventDefault();
      input.tap();
    };
    beatEl?.addEventListener('pointerdown', onBeat);
    const perkEl = container.querySelector('[data-control=perk]');
    const onPerk = (e: Event) => {
      e.preventDefault();
      input.pulsePerk();
    };
    perkEl?.addEventListener('pointerdown', onPerk);

    const endRun = () => {
      // C29: only a clean finish becomes your "personal best" ghost to race next time.
      if (state.phase === 'finished' && stateId) {
        saveGhostIfBest({
          stateId,
          seed,
          contenderId,
          rideId: ride.id,
          ticks: state.tick,
          crowd: state.displayCrowd,
          log: bytesToBase64(encodeInputLog(inputLog)),
        });
      }
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
        const bits = input.sample(time);
        if (bits !== lastLoggedBits) {
          inputLog.push({ tick: state.tick, input: bits });
          lastLoggedBits = bits;
        }
        step(state, bits, simConfig);

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
          if (z?.zoneKind === 'pickup') prompt = 'FLICK DOWN & HOLD · LOAD';
          else if (z?.zoneKind === 'venue' || z?.zoneKind === 'grand') prompt = `FLICK DOWN & HOLD · DOUBLE-TAP ×${beatMult}`;
        }
        const toast = time < toastRef.current.until ? toastRef.current.text : '';
        const leg = legAt(state.z, landmarks, gateLabel);
        if (state.perkCooldownTicks > perkCdMax) perkCdMax = state.perkCooldownTicks;
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
          braking: input.isBraking(time),
          beatOpen: Math.round((state.beatWindowTicks / simConfig.bonuses.onBeatWindowTicks) * 100),
          beatTaps: state.beatTaps,
          beatNeeded: simConfig.bonuses.onBeatTaps,
          perkCharge:
            state.perkCooldownTicks > 0 ? Math.round(((perkCdMax - state.perkCooldownTicks) / perkCdMax) * 100) : 100,
          perkActive: state.perkActiveTicks > 0,
        });
      }

      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      alive = false;
      cancelAnimationFrame(frameId);
      audio.stopRun();
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
    gate,
    finish,
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
    // C48: this used to borrow the briefing screen, which lays its children out
    // in a 560-px column — so the text sat against that column's left edge on
    // anything wider than a phone instead of in the middle of the screen.
    return (
      <div className="cr-screen cr-screen--loading" role="status" aria-live="polite">
        <div className="cr-loading">
          <span className="cr-loading-spin" aria-hidden="true" />
          <p className="cr-kicker">Loading road…</p>
        </div>
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
          <div className={`cr-brake-tell${hud.braking ? ' is-on' : ''}`} aria-hidden="true">
            BRAKING
          </div>
          <button
            className={`cr-pad cr-pad--beat${hud.beatOpen > 0 ? ' is-live' : ''}`}
            type="button"
            data-control="beat"
            aria-label={`Beat: double-tap for ${beatMult} times the crowd`}
          >
            <span>BEAT</span>
            <small>
              {hud.beatOpen > 0 ? `${hud.beatTaps}/${hud.beatNeeded} taps` : `double-tap · ×${beatMult}`}
            </small>
            <i style={{ width: `${hud.beatOpen}%` }} />
          </button>
          <button
            className={`cr-pad cr-pad--perk${hud.perkActive ? ' is-live' : hud.perkCharge >= 100 ? ' is-ready' : ''}`}
            type="button"
            data-control="perk"
            aria-label={`Perk: ${perkLabel}`}
          >
            <span>{perkLabel}</span>
            <small>{hud.perkActive ? 'running' : hud.perkCharge >= 100 ? 'ready' : 'charging'}</small>
            <i style={{ width: `${hud.perkCharge}%` }} />
          </button>
        </div>

        {/* Fades itself out after controlTuning.hintMs — no timer, so a HUD
            re-render can't restart it mid-run. */}
        <div className="cr-gestures" style={{ animationDuration: `${controlTuning.hintMs}ms` }}>
          <b>Flick</b> ◀ ▶ lane · <b>up</b> hop · <b>down</b> brake · <b>double-tap</b> beat · <b>hold</b> horn
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
              The convoy drives itself. <strong>Flick left or right</strong> to change lane,{' '}
              <strong>flick up</strong> to hop a pothole.
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              <strong>Flick down and keep your thumb on the screen</strong> to brake — that is how you load at a
              pickup and unload at a venue.
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              At a venue, <strong>double-tap</strong> the glass on the beat for ×{beatMult} the crowd. Hold a finger
              still to <strong>sound the horn</strong> and pull supporters to your lane.
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
