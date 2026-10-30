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
  partyForContender,
  runConfig,
  stateIndex,
  places,
} from '@cr/content';
import { initState, step, seedRng, encodeInputLog, type SimState, type InputRecord } from '@cr/sim';
import { loadGhost, saveGhostIfBest, bytesToBase64 } from './ghostStore';
import { computeGhostTrajectory } from './ghostReplay';
import { computeWeather, debugWeather } from './weather';
import { decodeChallenge } from './challenge';
import { parseInvite } from './places/placesModel';
import { GameRenderer } from './render/GameRenderer';
import { InputController } from './input/controls';
import { audio } from './audio/engine';
import { getCharacter } from './characters';
import { useContenderStore } from './contenderStore';
import { holdBackGuard, goBack, onEscape } from './nav';
import { haptic, motionReduced, usePrefsOnRoot } from './prefs';
import { CampaignMap } from './ui/CampaignMap';
import { AuthScreen } from './ui/AuthScreen';
import { AboutScreen } from './ui/AboutScreen';
import { SettingsScreen } from './ui/SettingsScreen';
import { AccountScreen } from './ui/AccountScreen';
import { ConvoyYard } from './ui/ConvoyYard';
import { DailyChip } from './ui/DailyChip';
import { useOnlineStore } from './onlineStore';
import { campaignRows, finishSign, gateSign, legAt, stationFor } from './trail';
import { Showcase } from './render/showcase';
import { hasPlayed, runModifiers } from './meta';
import { syncTravelDay } from './travel';
import { daysLeftLabel, isClosed, remoteNotice } from './campaignClock';
import { liveBanners } from './liveEvents';
import { track, trackRunStart } from './analytics';
import { approachingZone, bumpCoachRuns, coachWanted } from './coach';
import { t } from './i18n';
import { useStatePack, useStateWorld } from './statePack';
import { authLinkFromUrl, strippedUrl } from './authLink';
import { PlacesScreen } from './places/PlacesScreen';
import { usePlacesStore } from './places/placesStore';
import { RosterScreen } from './ui/RosterScreen';
import { StudioScreen } from './ui/StudioScreen';
import { SummaryScreen } from './ui/SummaryScreen';
import { CALLOUT_COOLDOWN_MS, CALLOUT_MS, calloutForEvent, calloutForLandmark, stationForZone } from './radioCallouts';

/** Live run screens that hold a Back sentinel (more than one only while React re-runs the effect). */

export function App() {
  const screen = useGameStore((s) => s.screen);
  const activeStateId = useGameStore((s) => s.activeStateId);
  const inRun = screen === 'game' || screen === 'paused';
  const refreshOnline = useOnlineStore((s) => s.refresh);

  // A "beat my run" link lands here with the road in the hash. Read it, hold it
  // until the player says they are 18+, and take it out of the address bar.
  useEffect(() => {
    const take = () => {
      const invite = parseInvite(window.location.hash);
      if (invite) {
        const g = useGameStore.getState();
        if (g.following >= places.followingGate) {
          g.setPlacesTarget(invite);
          track('mobilise_open', invite.stateId);
          if (g.screen === 'splash') g.openPlaces('splash');
        }
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        return;
      }
      const c = decodeChallenge(window.location.hash);
      if (!c) return;
      useGameStore.getState().setIncomingChallenge(c);
      track('challenge_open', c.stateId);
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    };
    take();
    window.addEventListener('hashchange', take);
    return () => window.removeEventListener('hashchange', take);
  }, []);

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
  usePrefsOnRoot();
  // Esc is Back on every menu; the browser / hardware Back steps through them too. The run holds its own
  // guard (GameScreen) so a hand-over between a menu and a run never drops the history entry.
  useEffect(() => {
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, []);
  const deep = screen !== 'splash' && !inRun;
  useEffect(() => (deep ? holdBackGuard(goBack) : undefined), [deep]);
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
      {screen === 'places' && <PlacesScreen />}
    </div>
  );
}

const fmt = (v: number) => v.toLocaleString('en-US');
const naira = (v: number) => `₦${fmt(v)}`;

function Splash() {
  const setScreen = useGameStore((s) => s.setScreen);
  const following = useGameStore((s) => s.following);
  const coins = useGameStore((s) => s.coins);
  const tourClaimedKey = useGameStore((s) => s.tourClaimedKey);
  const best = useGameStore((s) => s.bestByState['lagos']);
  const contenderId = useContenderStore((s) => s.activeContenderId) ?? contenders[0]!.id;
  const overrides = useContenderStore((s) => s.outfits[contenderId]);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const dataSaver = useGameStore((s) => s.dataSaver);
  const station = stationFor(lagosLaunch.audioStem);
  const heroRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const startingStory = useGameStore((s) => s.startingStory);
  const returning = hasPlayed({ following, startingStory, hasBest: !!best });
  const allStates = useMemo(() => campaignRows(), []);
  const openStates = useMemo(() => allStates.filter((r) => r.open), [allStates]);
  const pendingStates = allStates.length - openStates.length;

  useEffect(() => {
    if (!heroRef.current) return;
    let show: Showcase | null = null;
    try {
      const ch = getCharacter(contenderId, overrides);
      show = new Showcase(
        heroRef.current,
        ch.look,
        ch.outfit,
        motionReduced(reduceMotion),
        dataSaver,
      );
      setLive(true);
    } catch {
      /* WebGL unavailable: the poster background still works */
    }
    return () => show?.dispose();
  }, [contenderId, overrides, reduceMotion, dataSaver]);

  const chosen = useContenderStore((s) => s.activeContenderId);
  const incoming = useGameStore((s) => s.incomingChallenge);
  const incomingOpen = incoming ? openStates.some((r) => r.id === incoming.stateId) : false;
  const incomingRide = incoming ? rides.find((r) => r.id === incoming.rideId) : undefined;
  const incomingState = incoming ? stateIndex.find((r) => r.id === incoming.stateId) : undefined;
  const takeChallenge = () => {
    if (!incoming) return;
    void audio.unlock();
    useGameStore.getState().setChallenge(incoming);
    useGameStore.getState().setIncomingChallenge(null);
    setScreen('game');
  };
  const start = () => {
    void audio.unlock();
    // A brand-new player drives first and picks a Contender afterwards: Lagos,
    // the default Contender and the on-foot ride, straight into the run.
    if (!returning && chosen === null) {
      // ...and the first go is a quick rally, so the result and the pick come
      // inside two minutes rather than after a three-minute run.
      useGameStore.getState().setChallenge(null);
      useGameStore.getState().setQuickRun(true);
      setScreen('game');
      return;
    }
    setScreen(returning ? 'briefing' : 'roster');
  };

  return (
    <div className={`cr-screen cr-screen--splash${live ? ' is-live' : ''}`}>
      <div className="cr-hero" ref={heroRef} aria-hidden="true" />
      <div className="cr-hero-scrim" aria-hidden="true" />
      <div className="cr-splash-top">
        <span className="cr-pill cr-pill--live">
          {openStates.length === 1
            ? `${openStates[0]!.name} open`
            : `${openStates.length} states open`}
        </span>
        <span className="cr-pill">{daysLeftLabel()}</span>
        {returning && <span className="cr-pill">{naira(coins)}</span>}
        {returning && (
          <span className="cr-pill cr-pill--supporters" title="Unlocks rides">
            {fmt(following)} Following
          </span>
        )}
        <button
          className="cr-icon-btn cr-splash-gear"
          type="button"
          onClick={() => useGameStore.getState().openSettings()}
        >
          <span aria-hidden="true">⚙</span> Settings
        </button>
      </div>
      <div className="cr-splash-copy">
        <p className="cr-kicker">{returning ? `Welcome back · ${fmt(following)} Following` : 'Day 1 · You start in Lagos'}</p>
        <h1 className="cr-brand">Campaigner</h1>
        {incoming ? (
          <div className="cr-challenge-banner" role="status">
            <p>
              <b>{incoming.from || 'A friend'}</b> got <b>{incoming.crowd}</b> Crowd on {incomingState?.name ?? 'this road'}
              {incomingRide ? ` · ${incomingRide.name}` : ''}
              {incoming.quick ? ' (quick rally)' : ''}. Same road, same traffic. Beat it.
            </p>
            {incomingOpen ? null : <p className="cr-fineprint">That state is not open yet.</p>}
            <div className="cr-row">
              <button className="cr-btn" type="button" disabled={!incomingOpen} onClick={takeChallenge}>
                I'm 18+ · Take the challenge
              </button>
              <button
                className="cr-btn cr-btn--ghost"
                type="button"
                onClick={() => useGameStore.getState().setIncomingChallenge(null)}
              >
                Not now
              </button>
            </div>
          </div>
        ) : null}
        {remoteNotice() ? (
          <p className="cr-notice" role="status">
            {remoteNotice()}
          </p>
        ) : null}
        {isClosed() ? (
          <p className="cr-notice" role="status">
            The campaign has closed. Every road is open for practice.
          </p>
        ) : null}
        {liveBanners(Date.now(), tourClaimedKey).map((b) => (
          <p key={b.id} className={`cr-notice cr-notice--${b.id}`} role="status">
            <b>{b.title}</b> · {b.line}
          </p>
        ))}
        <p className="cr-tag">Drive your convoy through Nigeria. Load your people, dodge the go-slow, fill the rally.</p>
        <button className="cr-btn cr-btn--hero" type="button" onClick={start}>
          {returning ? 'Continue campaign' : copy.playButton}
        </button>
        {returning ? null : <p className="cr-fineprint cr-age">Tapping this confirms you are 18 or over.</p>}
        <button
          type="button"
          className="cr-btn cr-btn--ghost cr-mobilise cr-mobilise--splash"
          disabled={following < places.followingGate}
          onClick={() => {
            track('mobilise_open', useGameStore.getState().activeStateId);
            useGameStore.getState().openPlaces('splash');
          }}
        >
          <span>
            <span aria-hidden="true">⚑</span> Mobilise
          </span>
          <small>
            {following < places.followingGate
              ? `Unlocks at ${places.followingGate.toLocaleString('en-US')} Following · ${(places.followingGate - following).toLocaleString('en-US')} to go`
              : 'Meet other players and campaign on the ground'}
          </small>
        </button>
        <nav className="cr-splash-nav">
          <button type="button" onClick={() => setScreen('map')}>
            <span aria-hidden="true">⊙</span>
            <small>Board</small>
          </button>
          <button type="button" onClick={() => setScreen('yard')}>
            <span aria-hidden="true">⊞</span>
            <small>Yard</small>
          </button>
          {returning && (
            <button type="button" onClick={() => setScreen('roster')}>
              <span aria-hidden="true">↻</span>
              <small>Contender</small>
            </button>
          )}
          <button type="button" onClick={() => setScreen('account')}>
            <span aria-hidden="true">◌</span>
            <small>Account</small>
          </button>
          <button type="button" onClick={() => setScreen('about')}>
            <span aria-hidden="true">ℹ</span>
            <small>About</small>
          </button>
        </nav>
      </div>
      <aside className="cr-splash-side">
        <p className="cr-kicker cr-on-air-label">
          <span className="cr-on-air-dot" aria-hidden="true" />
          On air
        </p>
        <h2>{station.name}</h2>
        <div className="cr-on-air-waves" aria-hidden="true">
          <span /><span /><span />
        </div>
        <div className="cr-statrow">
          <div>
            <strong>{openStates.length}</strong>
            <span>Open states</span>
          </div>
          <div>
            <strong>{pendingStates}</strong>
            <span>Pending</span>
          </div>
          <div>
            <strong>{best ? best.crowd : '0'}</strong>
            <span>{best ? 'Best Crowd' : 'Your best: go set it'}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

/** A `?debug` review parameter, or null. Nothing here does anything without `?debug` in the URL. */
function debugParam(name: string): string | null {
  const q = new URLSearchParams(window.location.search);
  return q.has('debug') ? q.get(name) : null;
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
  const placesUp = usePlacesStore((st) => st.availability);
  const placesOnline = usePlacesStore((st) => st.online);
  const placesLocked = following < places.followingGate;
  useEffect(() => {
    void usePlacesStore.getState().probe(stateId);
  }, [stateId]);
  // C45: the same hazard list the sim is about to be handed, in words.
  const hazards = pack?.hazards ?? [];
  const roadToday = roadLines(hazards);
  const fit = roadFit(chosen, hazards);
  return (
    <div className="cr-screen cr-screen--briefing">
      <div className="cr-brief">
        <div className="cr-chrome-top">
          <p className="cr-kicker">{pack?.name ?? 'Lagos'} open</p>
          <button
            type="button"
            className={`cr-radio-chip${radioOn ? ' is-live' : ''}`}
            onClick={() => setRadioOn(!radioOn)}
            aria-pressed={radioOn}
          >
            <i className="cr-radio-dot" aria-hidden="true" />
            <span>{radioOn ? station.name : 'Radio off'}</span>
          </button>
        </div>
        <h2>{welcome}</h2>
        <p className="cr-tag">
          {contender.name} · {chosen.name} · {fmt(following)} Following
          {nextRide ? ` · ${fmt(nextRide.followingGate - following)} to ${nextRide.name}` : ''}
        </p>

        <button
          type="button"
          className="cr-btn cr-btn--ghost cr-mobilise"
          disabled={placesLocked || placesUp === 'down'}
          onClick={() => {
            track('mobilise_open', stateId);
            useGameStore.getState().openPlaces('briefing');
          }}
        >
          Mobilise
          <small>
            {placesLocked
              ? `Unlocks at ${places.followingGate.toLocaleString('en-US')} Following · ${(places.followingGate - following).toLocaleString('en-US')} to go`
              : placesUp === 'down'
              ? 'Opening soon'
              : placesOnline
                ? `${placesOnline} out in ${pack?.name ?? 'Lagos'} now`
                : `Meet players in ${pack?.name ?? 'Lagos'}`}
          </small>
        </button>

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
                <small>{open ? `${r.capacity} seats` : r.playable ? `${fmt(r.followingGate)} Sup.` : 'Later'}</small>
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
          <button
            className="cr-btn cr-btn--ghost"
            type="button"
            disabled={!gate.ok}
            onClick={() => {
              setRide(chosen.id);
              useGameStore.getState().setChallenge(null);
              useGameStore.getState().setQuickRun(true);
              setScreen('game');
            }}
          >
            Quick rally <small>~90 s</small>
          </button>
          <button className="cr-btn cr-btn--ghost cr-btn--icon-label" type="button" onClick={() => setScreen('map')}>
            Board
          </button>
          <button
            className="cr-btn"
            type="button"
            disabled={!gate.ok}
            onClick={() => {
              setRide(chosen.id);
              useGameStore.getState().setChallenge(null);
              useGameStore.getState().setQuickRun(false);
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
          <button
            className="cr-btn"
            type="button"
            onClick={() => {
              // iOS leaves the audio context interrupted after a call or a tab switch.
              void audio.unlock();
              setScreen('game');
            }}
          >
            Resume
          </button>
          <button
            className="cr-btn cr-btn--ghost"
            type="button"
            // A first-timer who bails out of the trial goes back to the start, not into a
            // Briefing for a campaign they never chose; Play there runs the trial again.
            onClick={() => setScreen(useContenderStore.getState().activeContenderId === null ? 'splash' : 'briefing')}
          >
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
  /** DJ-style radio line while music is ducked. */
  radioLine: string;
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
  const activeRideId = useGameStore((s) => s.activeRideId);
  const activeStateId = useGameStore((s) => s.activeStateId);
  // A challenge being played decides the road; otherwise it is the player's own choice.
  const challengeNow = useGameStore((s) => s.challenge);
  const rideId = challengeNow?.rideId ?? activeRideId;
  // Review aid: `?debug&debugState=kano` plays that state without unlocking or travelling.
  const stateId = debugParam('debugState') ?? challengeNow?.stateId ?? activeStateId;
  const pack = useStatePack(stateId);
  const world = useStateWorld(pack);
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
    from: '',
    to: '',
    radioLine: '',
    braking: false,
    beatOpen: 0,
    beatTaps: 0,
    beatNeeded: simConfig.bonuses.onBeatTaps,
    perkCharge: 100,
    perkActive: false,
  });
  const [showTutorial, setShowTutorial] = useState(!seenTutorial);
  // The run loop lives in an effect that must not restart, so it reads this ref
  // instead of the state: the convoy waits while the instructions are up.
  const tutorialRef = useRef(showTutorial);
  tutorialRef.current = showTutorial;
  const toastRef = useRef({ text: '', until: 0 });
  const startedRef = useRef(false);
  const radioCalloutRef = useRef({ text: '', until: 0, coolUntil: 0, lastTo: '' });

  const contender = contenders.find((c) => c.id === contenderId) ?? contenders[0]!;
  const party = partyForContender(contenderId);
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
    if (!containerRef.current || !pack || !world) return;
    const container = containerRef.current;
    let alive = true;

    void audio.unlock();
    audio.setVolumes(sfxVolume, musicVolume);
    audio.tune(audioStem);
    // Read, not subscribed: toggling the radio must not tear the run down (a separate effect applies it).
    audio.setRadio(useGameStore.getState().radioOn);

    const debug = new URLSearchParams(window.location.search).has('debug');
    const ch = getCharacter(contender.id, outfitOverrides);
    // C29: your personal-best ghost for this state, if one's been set — precomputed once up
    // front so the render loop only ever does an array lookup, no second live sim.
    // A quick rally is a different course length, and a ghost is only ever
    // replayed on the course it was recorded on, so quick runs race no ghost.
    const runState = useGameStore.getState();
    const challenge = runState.challenge;
    const quick = challenge ? challenge.quick : runState.quickRun;
    const cfg = runConfig(simConfig, quick);
    const ghost = quick || challenge ? null : loadGhost(stateId);
    // C45: on this state's road, because a ghost is only ever stored and replayed
    // per state — the road it drove is the road you are about to drive.
    const ghostTrajectory = ghost
      ? computeGhostTrajectory(ghost, simConfig, roadProfile(pack?.hazards ?? []))
      : undefined;
    const dbgSeed = Number(debugParam('debugSeed'));
    const seed = challenge ? challenge.seed : Number.isFinite(dbgSeed) && dbgSeed > 0 ? dbgSeed >>> 0 : (Math.random() * 0xffffffff) >>> 0;
    // C30: decided once, here, from the real clock — sim and the renderer's World just apply
    // the result, neither ever reads Date itself.
    const weather = debugWeather(computeWeather(Date.now(), pack?.zone ?? 'SW', seed), debugParam('debugWeather'));
    const renderer = new GameRenderer({
      look: ch.look,
      outfit: ch.outfit,
      landmarks,
      gate,
      finish,
      rideId: ride.id,
      config: cfg,
      reduceMotion: motionReduced(reduceMotion),
      dataSaver,
      debug,
      ghostTrajectory,
      weather,
      palette: pack?.palette,
      zone: pack?.zone ?? 'SW',
      scenery: pack?.scenery ?? [],
      world,
      hazards: pack?.hazards ?? [],
      stateName,
      venueTypes: pack?.landmarks.map((l) => l.venueType) ?? [],
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
    const state = initState(cfg, seedRng(seed), {
      // C44: capacity, size, traits and handling in one place, shared with the
      // ghost replay so the two can't disagree about how this ride drives.
      ...rideSimTraits(ride),
      // C45: the state's hazards, composed into arithmetic the sim understands.
      road: roadProfile(pack?.hazards ?? []),
      contenderId,
      upgrades: runModifiers(upgrades),
      signatureRideBonusPermille: pack?.signatureRide === ride.id ? simConfig.bonuses.signatureRideBonusPermille : 1000,
      // A challenge is the same road for everyone, so no clock-dependent bonus.
      rallySaturdayMultiplierPermille: weather.isRallySaturday && !challenge ? simConfig.bonuses.rallySaturdayMultiplierPermille : 1000,
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
    let lastCloseCall = -1e9;
    // Counted once per run, whatever made this effect run again (a pack loading, a dev double-run).
    const coaching = coachWanted();
    if (!startedRef.current) {
      startedRef.current = true;
      bumpCoachRuns();
      trackRunStart(stateId);
      if (challenge) track('challenge_start', stateId);
    }

    // C46: BEAT and PERK are the only two pads left. Everything else is a
    // gesture read off the glass by the InputController itself.
    const beatEl = container.querySelector('[data-control=beat]');
    const onBeat = (e: Event) => {
      e.preventDefault();
      input.tap();
    };
    beatEl?.addEventListener('pointerdown', onBeat);
    const perkEl = container.querySelector('[data-control=perk]');
    // PERK spends a charge, so it fires on release of a press that stayed put: a swipe that merely
    // starts on the pad (the right thumb's natural spot) steers instead of spending it.
    let perkDown: { id: number; x: number; y: number } | null = null;
    const onPerkDown = (e: Event) => {
      e.preventDefault();
      const p = e as PointerEvent;
      perkDown = { id: p.pointerId, x: p.clientX, y: p.clientY };
    };
    const onPerkUp = (e: Event) => {
      const p = e as PointerEvent;
      const d = perkDown;
      perkDown = null;
      if (d && d.id === p.pointerId && Math.hypot(p.clientX - d.x, p.clientY - d.y) < 14) input.pulsePerk();
    };
    const onPerkCancel = () => {
      perkDown = null;
    };
    perkEl?.addEventListener('pointerdown', onPerkDown);
    perkEl?.addEventListener('pointerup', onPerkUp);
    perkEl?.addEventListener('pointercancel', onPerkCancel);

    const endRun = () => {
      track(state.phase === 'finished' ? 'run_finish' : 'run_breakdown', stateId);
      if (challenge) track('challenge_finish', stateId);
      // C29: only a clean finish becomes your "personal best" ghost to race next time.
      if (state.phase === 'finished' && stateId && !quick && !challenge) {
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
        progress: state.finishZ > 0 ? Math.min(100, Math.floor((state.z / state.finishZ) * 100)) : 0,
        reached: legAt(state.z, landmarks, gateLabel, cfg.course, world.start.label).from,
        seed,
        quick,
        replay: {
          log: bytesToBase64(encodeInputLog(inputLog)),
          upgrades,
          rallySaturday: weather.isRallySaturday && !challenge,
        },
      });
      setScreen('summary');
    };

    const pushCallout = (time: number, line: string | null) => {
      if (!line || !useGameStore.getState().radioOn) return;
      const rc = radioCalloutRef.current;
      if (time < rc.coolUntil) return;
      rc.text = line;
      rc.until = time + CALLOUT_MS;
      rc.coolUntil = time + CALLOUT_COOLDOWN_MS;
      audio.blip();
    };

    const loop = (time: number) => {
      if (!alive) return;
      const screenNow = useGameStore.getState().screen;
      const calloutActive = time < radioCalloutRef.current.until;
      if (screenNow === 'paused') {
        audio.duck(true);
        input.reset();
        last = time;
        frameId = requestAnimationFrame(loop);
        return;
      }
      if (screenNow !== 'game') return;
      if (tutorialRef.current) {
        input.reset();
        last = time;
        renderer.render(prev, state, 0);
        frameId = requestAnimationFrame(loop);
        return;
      }
      audio.duck(calloutActive);

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
        step(state, bits, cfg);

        renderer.notifyEvents(state.events);
        const legNow = legAt(state.z, landmarks, gateLabel, cfg.course, world.start.label);
        for (const ev of state.events) {
          audio.playEvent(ev);
          if (ev.type === 'dent' || ev.type === 'hit') haptic(30);
          if (ev.type === 'pickup' || ev.type === 'dropoff') haptic(10);
          if (ev.type === 'fullHouse') toastRef.current = { text: t('toast.fullHouse'), until: time + 900 };
          if (ev.type === 'onBeat') toastRef.current = { text: t('toast.onBeat'), until: time + 900 };
          if (ev.type === 'integrityFail' && typeof ev.payload === 'string') {
            toastRef.current = { text: `${t('toast.fail')} · ${integrityEvent(ev.payload).title}`, until: time + 1400 };
          }
          if (ev.type === 'integritySuccess' && typeof ev.payload === 'string') {
            toastRef.current = { text: `${t('toast.clear')} · ${integrityEvent(ev.payload).title}`, until: time + 1100 };
          }
          if (ev.type === 'toll') toastRef.current = { text: t('toast.toll'), until: time + 1300 };
          if (ev.type === 'tollDodged') toastRef.current = { text: t('toast.tollDodged'), until: time + 1000 };
          if (ev.type === 'stubborn') toastRef.current = { text: t('toast.stubborn'), until: time + 1500 };
          if (ev.type === 'weaveWarn') toastRef.current = { text: t('toast.weaveWarn'), until: time + 900 };
          // Close calls come one after another in dense traffic: say it once in a while, not every pass.
          if (ev.type === 'closeCall') {
            if (time - lastCloseCall < 5000) continue;
            lastCloseCall = time;
            if (toastRef.current.until < time) toastRef.current = { text: t('toast.closeCall'), until: time + 900 };
          }
          pushCallout(time, calloutForEvent(ev, legNow.to, pack?.zone ?? 'SW', pack?.name));
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
          if (z?.zoneKind === 'pickup') prompt = t('prompt.pickup');
          else if (z?.zoneKind === 'venue' || z?.zoneKind === 'grand') prompt = t('prompt.venue', { beat: beatMult });
        } else if (coaching) {
          // The first few runs hear about a zone a few seconds early, so the brake is already in mind.
          const next = approachingZone(state);
          if (next === 'pickup') prompt = t('prompt.pickupAhead');
          else if (next === 'venue') prompt = t('prompt.venueAhead');
        }
        const toast = time < toastRef.current.until ? toastRef.current.text : '';
        const leg = legAt(state.z, landmarks, gateLabel, cfg.course, world.start.label);
        if (leg.to !== radioCalloutRef.current.lastTo) {
          radioCalloutRef.current.lastTo = leg.to;
          pushCallout(time, calloutForLandmark(leg.to, pack?.zone ?? 'SW', pack?.name));
        }
        const radioLine = time < radioCalloutRef.current.until ? radioCalloutRef.current.text : '';
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
          radioLine,
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
      perkEl?.removeEventListener('pointerdown', onPerkDown);
      perkEl?.removeEventListener('pointerup', onPerkUp);
      perkEl?.removeEventListener('pointercancel', onPerkCancel);
      input.detach();
      renderer.dispose();
    };
  }, [
    pack,
    world,
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
    contenderId,
    upgrades,
  ]);

  useEffect(() => {
    audio.setRadio(radioOn);
  }, [radioOn]);

  // A phone call, a notification shade or a tab switch must not let the convoy run on
  // unattended, and the hardware Back / iOS edge swipe pauses instead of leaving the game.
  useEffect(() => {
    const pauseIfRunning = () => {
      // The tutorial already holds the convoy still; a pause card on top of it would hide the instructions.
      if (useGameStore.getState().screen === 'game' && !tutorialRef.current) setScreen('paused');
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') pauseIfRunning();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented || e.repeat) return;
      const st = useGameStore.getState().screen;
      if (st === 'game') pauseIfRunning();
      else if (st === 'paused') {
        void audio.unlock();
        setScreen('game');
      }
    };
    const release = holdBackGuard(pauseIfRunning);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', pauseIfRunning);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', pauseIfRunning);
      window.removeEventListener('keydown', onKey);
      release();
    };
  }, [setScreen]);

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
    <div className="cr-game" ref={containerRef} style={{ '--cr-party': party?.color ?? 'var(--cr-danfo)' } as React.CSSProperties}>
      <div className="cr-hud">
        <div className="cr-hud-chrome">
          <header className="cr-hud-bar" aria-label="Run meters">
            <div className="cr-hud-metric">
              <span className="cr-hud-metric__label">Crowd</span>
              <strong>{hud.crowd}</strong>
              <div className="cr-hud-metric__foot">
                <div className="cr-track">
                  <i style={{ width: `${hud.progress}%` }} />
                </div>
              </div>
            </div>
            <div className="cr-hud-metric">
              <span className="cr-hud-metric__label">Aboard</span>
              <strong>
                {hud.carried}
                <span className="cr-hud-metric__cap">/{hud.capacity}</span>
              </strong>
              <div className="cr-hud-metric__foot">
                <div className="cr-dents" aria-label="dents">
                  {[0, 1, 2].map((i) => (
                    <i key={i} className={`cr-dent${hud.dents > i ? ' is-filled' : ''}`} />
                  ))}
                </div>
              </div>
            </div>
            <div className="cr-hud-metric">
              <span className="cr-hud-metric__label">Momentum</span>
              <strong>×{(hud.momentum / 1000).toFixed(2)}</strong>
              <div className="cr-hud-metric__foot" aria-hidden="true" />
            </div>
            <div className="cr-hud-metric cr-hud-metric--integrity">
              <span className="cr-hud-metric__label">Integrity</span>
              <strong>{hud.integrity}</strong>
              <div className="cr-hud-metric__foot">
                <div className="cr-track">
                  <i style={{ width: `${hud.integrity}%` }} />
                </div>
              </div>
            </div>
            <button className="cr-hud-pause" type="button" onClick={() => setScreen('paused')} aria-label="Pause">
              <span aria-hidden="true">⏸</span>
            </button>
          </header>
          <div className="cr-leg">
            <span className="cr-leg-route">
              {hud.from} → {hud.to}
            </span>
          </div>
          {/* Always-visible radio strip — matches Danfo Run UX */}
          <div
            className={`cr-radio-strip${radioOn ? ' is-on' : ' is-off'}`}
            role="status"
            aria-live="polite"
          >
            <button
              type="button"
              className="cr-radio-strip__btn"
              onClick={() => setRadioOn(!radioOn)}
              aria-pressed={radioOn}
              aria-label={radioOn ? 'Radio on — tap to mute' : 'Radio off — tap to enable'}
            >
              <i className="cr-radio-dot" aria-hidden="true" />
              <span className="cr-radio-strip__name">
                {radioOn ? stationForZone(pack?.zone ?? 'SW') : 'Radio off'}
              </span>
              <span className="cr-radio-strip__skip" aria-hidden="true">&gt;</span>
            </button>
            {radioOn && hud.radioLine ? (
              <span className="cr-radio-strip__line">{hud.radioLine}</span>
            ) : null}
          </div>
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
            aria-label={`Beat: double-tap for ${beatMult} times the Crowd`}
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
        <div
          className="cr-gestures"
          style={{ animationDuration: `${controlTuning.hintMs}ms` }}
          // Static strings from i18n.ts, never player text.
          dangerouslySetInnerHTML={{ __html: t('hint.gestures') }}
        />
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
          <div className="cr-card cr-coach-card">
            <h3>{t('tutorial.title')}</h3>
            <div className="cr-coach-move">
              <span className="cr-coach-demo cr-coach-demo--lane" aria-hidden="true">
                <i />
              </span>
              <p>{t('tutorial.lane')}</p>
            </div>
            <div className="cr-coach-move">
              <span className="cr-coach-demo cr-coach-demo--hop" aria-hidden="true">
                <i />
              </span>
              <p>{t('tutorial.hop')}</p>
            </div>
            <div className="cr-coach-move">
              <span className="cr-coach-demo cr-coach-demo--load" aria-hidden="true">
                <i />
              </span>
              <p>{t('tutorial.load')}</p>
            </div>
            <p className="cr-coach-note">{t('tutorial.integrity')}</p>
            <p className="cr-fineprint">{t('tutorial.rest')}</p>
          </div>
          <button
            className="cr-btn"
            type="button"
            onClick={() => {
              setShowTutorial(false);
              setSeenTutorial(true);
            }}
          >
            {t('tutorial.go')}
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
