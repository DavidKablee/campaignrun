import { useEffect, useMemo, useRef, useState } from 'react';
import { contenders, places, stateIndex, placeKey, localsFor } from '@cr/content';
import { useContenderStore } from '../contenderStore';
import { useGameStore } from '../state';
import { goBack } from '../nav';
import { haptic, motionReduced } from '../prefs';
import { useOnlineStore } from '../onlineStore';
import { PlaceRenderer } from '../render/placeRenderer';
import { track } from '../analytics';
import { actionById, inviteHash } from './placesModel';
import { usePlacesStore } from './placesStore';

/**
 * Mobilise (C82): a campaign place full of real players. Walk by tapping the ground, use the four
 * actions, say something from the preset list. There is no text box: the only things that can be said
 * are phrases and emoji from `places.json`.
 */

const REPORT_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Harassment',
  'offensive-name': 'Offensive name',
  other: 'Something else',
};

const TOPIC_LABELS: Record<string, string> = { greet: 'Greet', chat: 'Chat', civic: 'Our area', rally: 'Rally' };

const COACHED_KEY = 'cr-places-coached';

function wasCoached(): boolean {
  try {
    return localStorage.getItem(COACHED_KEY) === '1';
  } catch {
    return true;
  }
}

function markCoached() {
  try {
    localStorage.setItem(COACHED_KEY, '1');
  } catch {
    /* private mode: the card just shows again next time */
  }
}

/** Small line icons for the dock; they sit above the short label so the buttons read at a glance. */
function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    canvass: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 8h4M19 6v4',
    flyers: 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6',
    rally: 'M3 10v4l3 1 9 4V5L6 9zM19 9a4 4 0 010 6',
    wave: 'M8 13V6a1.5 1.5 0 013 0v5M11 11V4.5a1.5 1.5 0 013 0V11M14 11V6a1.5 1.5 0 013 0v8a6 6 0 01-6 6h-1a6 6 0 01-5-3l-2-4a1.5 1.5 0 012.5-1.5L8 14',
    say: 'M4 5h16v11H9l-5 4z',
    share: 'M18 8a3 3 0 100-6 3 3 0 000 6zM6 15a3 3 0 100-6 3 3 0 000 6zM18 22a3 3 0 100-6 3 3 0 000 6zM8.6 10.6l6.8-3.2M8.6 13.4l6.8 3.2',
    back: 'M15 5l-7 7 7 7',
    close: 'M6 6l12 12M18 6L6 18',
    people: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 8a2.5 2.5 0 010 5M21 20c0-2.4-1.6-4.4-4-5',
  };
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name] ?? ''} />
    </svg>
  );
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  return h;
}

/** Ticks while something is cooling down so the rings count down. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

export function PlacesScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const activeStateId = useGameStore((s) => s.activeStateId);
  const target = useGameStore((s) => s.placesTarget);
  const stateId = target?.stateId ?? activeStateId;
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const dataSaver = useGameStore((s) => s.dataSaver);
  const status = useOnlineStore((s) => s.status);
  const store = usePlacesStore();
  const { phase, roomId, you, members, ready, today, toast, lang, muted, identity } = store;
  const pickedContender = useContenderStore((s) => s.activeContenderId);
  const myContender = contenders.find((c) => c.id === pickedContender);
  // The one-time question: only once someone has actually chosen a Contender, and only if never answered.
  const askIdentity = phase === 'in' && !!myContender && identity !== null && !identity.asked;
  const [kind, setKind] = useState<string>(target?.kind ?? places.kinds[0]!.id);
  const [sheet, setSheet] = useState<'say' | 'person' | 'invite' | 'people' | null>(null);
  const trayRef = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  // Focus follows the tray: into it when it opens, back to what opened it when it closes.
  useEffect(() => {
    if (sheet) {
      trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      trayRef.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
      return;
    }
    const back = trigger.current;
    trigger.current = null;
    if (back && document.contains(back)) back.focus();
  }, [sheet]);
  // Esc closes an open sheet first; only with none open does it fall through to Back.
  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      e.preventDefault();
      setSheet(null);
    };
    // Capture phase: it must run before the App-level Esc (Back) listener, which registered first.
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [sheet]);
  const [topic, setTopic] = useState<string>('greet');
  const [coached, setCoached] = useState(wasCoached);
  const [picked, setPicked] = useState<string | null>(null);
  const [reported, setReported] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<PlaceRenderer | null>(null);
  const lastSay = useRef(0);

  const localCount = (players: number) => {
    const n = localsFor(Math.max(1, players), places.locals);
    return dataSaver ? Math.min(n, places.locals.min) : n;
  };

  const state = stateIndex.find((s) => s.id === stateId);
  const stateName = state?.name ?? 'Lagos';
  const kindInfo = places.kinds.find((k) => k.id === kind)!;
  const signedIn = status === 'signed-in';

  // Join when signed in, and when the kind changes; leave when the screen closes.
  useEffect(() => {
    if (!signedIn) return;
    void usePlacesStore.getState().join(stateId, kind);
  }, [signedIn, stateId, kind]);
  useEffect(() => () => void usePlacesStore.getState().leave(), []);

  // One renderer per room: it owns the canvas, the people and their tags.
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !roomId || !you) return;
    const renderer = new PlaceRenderer(host, {
      kind,
      zone: state?.zone ?? 'SW',
      seed: hash(placeKey(stateId, kind)),
      reduceMotion: motionReduced(reduceMotion),
      dataSaver,
      onTap: (x, z) => {
        const here = renderer.positionOf(you);
        if (here) renderer.retarget(you, { ...here, tx: x, tz: z });
        renderer.showMarker(x, z);
        usePlacesStore.getState().moveTo(x, z);
      },
      onTapPerson: (id) => {
        setPicked(id);
        setReported(false);
        setSheet('person');
      },
    });
    rendererRef.current = renderer;
    renderer.setLanguage(usePlacesStore.getState().lang);
    renderer.setMembers(Object.values(usePlacesStore.getState().members), you);
    renderer.setLocals(localCount(Object.keys(usePlacesStore.getState().members).length));
    const off = usePlacesStore.getState().subscribe((e) => {
      switch (e.type) {
        case 'join':
          renderer.upsert(e.member);
          break;
        case 'leave':
          renderer.remove(e.id);
          break;
        case 'move':
          if (e.id !== you) renderer.retarget(e.id, e);
          break;
        case 'act': {
          const a = actionById(e.action);
          if (a) renderer.playAction(e.id, a.pose, a.poseSeconds);
          break;
        }
        case 'say':
          if (!usePlacesStore.getState().muted.includes(e.id)) renderer.say(e.id, e);
          break;
      }
    });
    if (new URLSearchParams(location.search).has('debug')) {
      (window as unknown as { __place?: unknown }).__place = { stats: () => renderer.stats };
    }
    return () => {
      off();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [roomId, you, kind, stateId, state?.zone, reduceMotion, dataSaver]);

  useEffect(() => {
    rendererRef.current?.setLanguage(lang);
  }, [lang]);

  // Locals thin out as real players arrive: a quiet place feels lived in, a busy one is not crowded.
  const playerCount = Object.keys(members).length;
  useEffect(() => {
    rendererRef.current?.setLocals(localCount(playerCount));
  }, [playerCount, roomId, you]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => usePlacesStore.getState().clearToast(), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const cooling = Object.values(ready).some((t) => t > Date.now());
  const now = useNow(cooling);
  const others = Object.values(members).filter((m) => m.id !== you);
  const person = picked ? members[picked] : undefined;

  const phraseGroups = useMemo(() => {
    const groups: Record<string, typeof places.phrases> = {};
    for (const p of places.phrases) (groups[p.tag] ??= []).push(p);
    return groups;
  }, []);

  function say(what: { phrase?: string; emoji?: string }) {
    const t = Date.now();
    if (t - lastSay.current < 900) return;
    lastSay.current = t;
    if (you) rendererRef.current?.say(you, what);
    void usePlacesStore.getState().say(what);
    setSheet(null);
  }

  const back = goBack;

  const inviteUrl = `${location.origin}${location.pathname}${inviteHash(stateId, kind)}`;
  const inviteLine = `Meet me at ${stateName} ${kindInfo.label} on Campaigner`;

  function flash(text: string) {
    usePlacesStore.setState({ toast: text });
  }

  function shareWhatsApp() {
    track('place_invite', stateId);
    window.open(`https://wa.me/?text=${encodeURIComponent(`${inviteLine}: ${inviteUrl}`)}`, '_blank', 'noopener');
  }

  async function copyLink() {
    track('place_invite', stateId);
    try {
      await navigator.clipboard.writeText(inviteUrl);
      flash('Link copied');
    } catch {
      flash('Could not copy. Use More options.');
    }
    setSheet(null);
  }

  async function shareMore() {
    track('place_invite', stateId);
    try {
      await navigator.share({ title: 'Campaigner', text: inviteLine, url: inviteUrl });
    } catch {
      /* closed without sharing */
    }
    setSheet(null);
  }

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const topics = Object.keys(phraseGroups);
  const coinPct = Math.min(100, (today.coins / places.daily.coins) * 100);
  const supPct = Math.min(100, (today.supporters / places.daily.supporters) * 100);

  return (
    <div className={`cr-screen cr-screen--places${sheet ? ' has-tray' : ''}`}>
      <header className="cr-places-head">
        <button type="button" className="cr-places-round" onClick={back} aria-label="Back">
          <Icon name="back" />
        </button>
        <div className="cr-places-title">
          <strong>
            {stateName} {kindInfo.label}
          </strong>
          <small>{phase === 'in' ? `${others.length + 1} ${others.length ? 'players' : 'player'} · ${localCount(others.length + 1)} locals` : 'Mobilise'}</small>
        </div>
        <span className="cr-places-head-actions">
          <button
            type="button"
            className="cr-places-round"
            onClick={() => setSheet(sheet === 'people' ? null : 'people')}
            aria-label={`People here (${others.length + 1})`}
            disabled={phase !== 'in'}
            title={phase !== 'in' ? 'Join a place to see who is here' : undefined}
          >
            <Icon name="people" />
          </button>
          <button
            type="button"
            className="cr-places-round cr-places-round--gold"
            onClick={() => setSheet(sheet === 'invite' ? null : 'invite')}
            aria-label="Invite a friend here"
            disabled={phase !== 'in'}
            title={phase !== 'in' ? 'Join a place to invite a friend' : undefined}
          >
            <Icon name="share" />
          </button>
        </span>
      </header>

      <nav className="cr-places-kinds" aria-label="Place">
        {places.kinds.map((k) => (
          <button
            key={k.id}
            type="button"
            className={`cr-chip${k.id === kind ? ' is-on' : ''}`}
            aria-pressed={k.id === kind}
            onClick={() => setKind(k.id)}
          >
            {k.label}
          </button>
        ))}
      </nav>

      <div className="cr-places-stage">
        <div ref={hostRef} className="cr-places-host" data-testid="place-host" />
        {status === 'unknown' ? (
          <div className="cr-places-gate" role="status">
            <p>Checking your board name…</p>
          </div>
        ) : status === 'offline' ? (
          <div className="cr-places-gate" role="alert">
            <h2>Opening soon</h2>
            <p>The field is not reachable right now.</p>
            <button type="button" className="cr-btn" onClick={() => void useOnlineStore.getState().refresh()}>
              Try again
            </button>
          </div>
        ) : !signedIn ? (
          <div className="cr-places-gate">
            <h2>Join the campaign trail</h2>
            <p>Pick a board name to meet other players in {stateName}. Chat is presets and emoji only.</p>
            <button
              type="button"
              className="cr-btn"
              onClick={() => {
                useGameStore.getState().setAuthReturn('places');
                setScreen('auth');
              }}
            >
              Choose a name
            </button>
          </div>
        ) : phase === 'joining' || phase === 'idle' ? (
          <div className="cr-places-gate" role="status">
            <p>Walking to the {kindInfo.label.toLowerCase()}…</p>
          </div>
        ) : phase === 'error' ? (
          <div className="cr-places-gate" role="alert">
            <h2>{store.error === 'offline' ? 'Opening soon' : 'Could not open this place'}</h2>
            <p>{store.error === 'offline' ? 'The field is not reachable right now.' : 'Try again in a moment.'}</p>
            <button type="button" className="cr-btn" onClick={() => void store.join(stateId, kind)}>
              Try again
            </button>
          </div>
        ) : askIdentity && !sheet ? (
          <div className="cr-places-coach" role="dialog" aria-label="Show your Contender here?">
            <p>
              <b>Show your Contender here?</b> If you say yes, everyone in this room can see you as {myContender!.name}. If not, you stay a plain citizen.
              Change it any time in Account.
            </p>
            <div className="cr-places-coach-row">
              <button type="button" onClick={() => void usePlacesStore.getState().setIdentity(null)}>
                Keep me anonymous
              </button>
              <button type="button" className="is-go" onClick={() => void usePlacesStore.getState().setIdentity(myContender!.id)}>
                Yes, show {myContender!.name}
              </button>
            </div>
          </div>
        ) : phase === 'in' && !coached && !sheet ? (
          <div className="cr-places-coach" role="note">
            <p>
              <b>Tap the ground to walk.</b> Tap a player to say hi. Tap an action to campaign. Dashed “Local” tags are townspeople, not players.
            </p>
            <button
              type="button"
              onClick={() => {
                markCoached();
                setCoached(true);
              }}
            >
              Got it
            </button>
          </div>
        ) : null}
        {toast ? (
          <p className="cr-places-toast" role="status">
            {toast}
          </p>
        ) : null}
      </div>

      {phase === 'in' && !sheet ? (
        <footer className="cr-places-dock">
          <div className="cr-places-today" aria-label="Today">
            <span>
              Coins today ₦{today.coins}/{places.daily.coins}
              <i className="cr-bar">
                <b style={{ width: `${coinPct}%` }} />
              </i>
            </span>
            <span>
              Following today {today.supporters}/{places.daily.supporters}
              <i className="cr-bar">
                <b style={{ width: `${supPct}%` }} />
              </i>
            </span>
          </div>
          <div className="cr-places-actions">
            {places.actions.map((a) => {
              const left = Math.max(0, Math.ceil(((ready[a.id] ?? 0) - now) / 1000));
              return (
                <button
                  key={a.id}
                  type="button"
                  className="cr-place-action"
                  disabled={left > 0}
                  onClick={() => {
                    haptic(12);
                    void usePlacesStore.getState().act(a);
                  }}
                >
                  <Icon name={a.id} />
                  <span>{a.short}</span>
                  <small>{left > 0 ? `${left}s` : a.coins > 0 ? `+₦${a.coins}` : 'Free'}</small>
                </button>
              );
            })}
            <button type="button" className="cr-place-action cr-place-action--say" onClick={() => setSheet('say')}>
              <Icon name="say" />
              <span>Say</span>
              <small>Phrases</small>
            </button>
          </div>
        </footer>
      ) : null}

      {sheet === 'say' ? (
        <section className="cr-places-tray" aria-label="Say something" ref={trayRef}>
          <div className="cr-places-tray-head">
            <b>Say something</b>
            <div className="cr-places-lang" role="group" aria-label="Language">
              <button type="button" aria-pressed={lang === 'en'} onClick={() => usePlacesStore.getState().setLang('en')}>
                English
              </button>
              <button type="button" aria-pressed={lang === 'pcm'} onClick={() => usePlacesStore.getState().setLang('pcm')}>
                Pidgin
              </button>
            </div>
            <button type="button" className="cr-places-x" onClick={() => setSheet(null)} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
          <div className="cr-places-emoji" aria-label="Reactions">
            {places.emoji.map((e) => (
              <button key={e} type="button" onClick={() => say({ emoji: e })} aria-label={`Send ${e}`}>
                {e}
              </button>
            ))}
          </div>
          <div className="cr-places-topics" aria-label="Topics">
            {topics.map((t) => (
              <button key={t} type="button" aria-pressed={t === topic} onClick={() => setTopic(t)}>
                {TOPIC_LABELS[t] ?? t}
              </button>
            ))}
          </div>
          <div className="cr-places-lines">
            {(phraseGroups[topic] ?? []).map((p) => (
              <button key={p.id} type="button" onClick={() => say({ phrase: p.id })}>
                {lang === 'pcm' ? p.pcm : p.en}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {sheet === 'people' ? (
        <section className="cr-places-tray" aria-label="People here" ref={trayRef}>
          <div className="cr-places-tray-head">
            <b>People here</b>
            <button type="button" className="cr-places-x" onClick={() => setSheet(null)} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
          {others.length === 0 ? (
            <p className="cr-places-note">Nobody else is here yet. Invite a friend, or try another place.</p>
          ) : (
            <ul className="cr-places-people">
              {others.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPicked(m.id);
                      setReported(false);
                      setSheet('person');
                    }}
                  >
                    <span className="cr-places-initial" aria-hidden="true">
                      {m.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span>{m.name}</span>
                    {muted.includes(m.id) ? <small>Muted</small> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {sheet === 'person' && person ? (
        <section className="cr-places-tray" aria-label={person.name} ref={trayRef}>
          <div className="cr-places-who">
            <span className="cr-places-initial" aria-hidden="true">
              {person.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <b>{person.name}</b>
              <small>Player</small>
            </div>
            <button type="button" className="cr-places-x" onClick={() => setSheet(null)} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
          {reported ? (
            <p className="cr-places-note">Thanks. They are muted for you and we will take a look.</p>
          ) : (
            <>
              <div className="cr-places-pair">
                <button
                  type="button"
                  className="is-go"
                  onClick={() => {
                    const spot = rendererRef.current?.positionOf(person.id);
                    if (spot) {
                      const here = you ? rendererRef.current?.positionOf(you) : undefined;
                      if (here && you) rendererRef.current?.retarget(you, { ...here, tx: spot.x, tz: spot.z });
                      usePlacesStore.getState().moveTo(spot.x, spot.z);
                    }
                    void usePlacesStore.getState().act(places.actions.find((a) => a.id === 'wave') ?? places.actions[0]!);
                    setSheet(null);
                  }}
                >
                  Wave at {person.name}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    usePlacesStore.getState().mute(person.id);
                    setSheet(null);
                  }}
                  disabled={muted.includes(person.id)}
                >
                  {muted.includes(person.id) ? 'Muted' : 'Mute'}
                </button>
              </div>
              <p className="cr-places-note">Report this player</p>
              <div className="cr-places-topics cr-places-topics--wrap">
                {places.report.reasons.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={async () => setReported(await usePlacesStore.getState().report(person.id, r))}
                  >
                    {REPORT_LABELS[r] ?? r}
                  </button>
                ))}
              </div>
              <p className="cr-places-note">Reporting also mutes them for you. There is no free text, so we never see what you chose to say.</p>
            </>
          )}
        </section>
      ) : null}

      {sheet === 'invite' ? (
        <section className="cr-places-tray" aria-label="Invite a friend" ref={trayRef}>
          <div className="cr-places-tray-head">
            <b>Bring a friend to the {kindInfo.label.toLowerCase()}</b>
            <button type="button" className="cr-places-x" onClick={() => setSheet(null)} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
          <div className="cr-places-card">
            <span className="cr-places-card-art" aria-hidden="true" />
            <div>
              <b>{inviteLine}</b>
              <small>Tap to walk in, canvass and say hello</small>
            </div>
          </div>
          <button type="button" className="cr-places-wa" onClick={shareWhatsApp}>
            Share on WhatsApp
          </button>
          <div className="cr-places-pair">
            <button type="button" onClick={() => void copyLink()}>
              Copy link
            </button>
            {canShare ? (
              <button type="button" onClick={() => void shareMore()}>
                More options
              </button>
            ) : null}
          </div>
          <p className="cr-places-note">Friends who open it land in this {kindInfo.label.toLowerCase()}. Rewards are the same for everyone, and nothing is shared about your Contender.</p>
        </section>
      ) : null}
    </div>
  );
}
