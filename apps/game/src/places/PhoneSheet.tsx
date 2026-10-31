import { useEffect, useState, type Ref } from 'react';
import { contenders, nextRideGate, placeKey, placeTitle, places, rides, stateIndex } from '@cr/content';
import { apiGet } from '../api/client';
import { useContenderStore } from '../contenderStore';
import { useGameStore } from '../state';
import { roomPlace } from './placesModel';
import { Icon } from './PlacesIcon';
import { usePlacesStore } from './placesStore';

/**
 * C91: the Campaign Phone. Mobilise's menu is a campaign-office handset: a home screen of app tiles
 * and one app open at a time. A new app is one entry in `APPS`. It replaces a scatter of trays, and it
 * is the right container for a short landscape screen, where it becomes the side column.
 *
 * The phone only shows and asks; every number on it (jobs, streak, rooms, friends) comes from the
 * server, and nothing on it can be typed into.
 */

export type PhoneApp = 'jobs' | 'friends' | 'rooms' | 'messages' | 'board' | 'convoy' | 'settings';

const APPS: { id: PhoneApp; label: string; icon: string }[] = [
  { id: 'jobs', label: 'Jobs', icon: 'jobs' },
  { id: 'friends', label: 'Friends', icon: 'friend' },
  { id: 'rooms', label: 'Rooms', icon: 'rooms' },
  { id: 'messages', label: 'Messages', icon: 'say' },
  { id: 'board', label: 'Board', icon: 'board' },
  { id: 'convoy', label: 'Convoy', icon: 'convoy' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

const n = (v: number) => v.toLocaleString('en-NG');

export function PhoneSheet({
  app,
  setApp,
  onClose,
  onSay,
  trayRef,
}: {
  app: PhoneApp | null;
  setApp: (a: PhoneApp | null) => void;
  onClose: () => void;
  onSay: () => void;
  trayRef: Ref<HTMLElement>;
}) {
  const store = usePlacesStore();
  const { jobs, friends, rooms, roomId } = store;

  useEffect(() => {
    const st = usePlacesStore.getState();
    if (app === 'jobs' || app === null) void st.loadJobs();
    if (app === 'friends') void st.loadFriends();
    if (app === 'rooms') void st.loadRooms();
  }, [app]);

  const done = jobs ? jobs.jobs.filter((j) => j.done).length : 0;
  const title = APPS.find((a) => a.id === app)?.label ?? 'Campaign Phone';

  return (
    <section className="cr-places-tray cr-phone" aria-label="Campaign Phone" ref={trayRef}>
      <div className="cr-phone-top">
        {app ? (
          <button type="button" className="cr-places-x" onClick={() => setApp(null)} aria-label="Back to the phone home">
            <Icon name="back" />
          </button>
        ) : (
          <span className="cr-phone-notch" aria-hidden="true" />
        )}
        <b>{title}</b>
        <button type="button" className="cr-places-x" onClick={onClose} aria-label="Close the phone">
          <Icon name="close" />
        </button>
      </div>

      {app === null ? (
        <div className="cr-phone-home">
          <div className="cr-phone-grid">
            {APPS.map((a) => (
              <button
                key={a.id}
                type="button"
                className="cr-phone-tile"
                onClick={() => {
                  if (a.id === 'messages') onSay();
                  else setApp(a.id);
                }}
              >
                <Icon name={a.icon} />
                <span>{a.label}</span>
                {a.id === 'jobs' && jobs ? <small>{`${done}/${jobs.jobs.length}`}</small> : null}
                {a.id === 'friends' && friends?.incoming.length ? <small>{`${friends.incoming.length} new`}</small> : null}
              </button>
            ))}
          </div>
          {jobs && jobs.streak.count > 0 ? (
            <p className="cr-places-note">
              {jobs.streak.count}-day streak{jobs.streak.doneToday ? '' : '. Do one job today to keep it'}.
            </p>
          ) : (
            <p className="cr-places-note">Finish a job today to start a streak.</p>
          )}
        </div>
      ) : null}

      {app === 'jobs' ? <JobsApp /> : null}
      {app === 'friends' ? <FriendsApp onClose={onClose} /> : null}
      {app === 'rooms' ? <RoomsApp onClose={onClose} roomId={roomId} rooms={rooms} /> : null}
      {app === 'board' ? <BoardApp /> : null}
      {app === 'convoy' ? <ConvoyApp /> : null}
      {app === 'settings' ? <SettingsApp /> : null}
    </section>
  );
}

function JobsApp() {
  const { jobs } = usePlacesStore();
  if (!jobs) return <p className="cr-places-note">Opening today's jobs…</p>;
  const paid = (c: number, s: number) => [c > 0 ? `+₦${c}` : '', s > 0 ? `+${s} Following` : ''].filter(Boolean).join(' · ');
  return (
    <div className="cr-phone-app">
      <p className="cr-phone-streak">
        <b>{jobs.streak.count > 0 ? `${jobs.streak.count}-day streak` : 'No streak yet'}</b>
        <small>
          {jobs.streak.best > 0 ? `Best ${jobs.streak.best}. ` : ''}
          {jobs.streak.next ? `Day ${jobs.streak.next.days}: ${jobs.streak.next.title}` : 'Every title earned'}
        </small>
      </p>
      <ul className="cr-phone-list">
        {jobs.jobs.map((j) => (
          <li key={j.id} className={j.done ? 'is-done' : undefined}>
            <span>
              {j.label}
              <small>{j.done ? 'Done' : `${j.progress}/${j.target}`}</small>
            </span>
            <i className="cr-bar">
              <b style={{ width: `${Math.min(100, (j.progress / j.target) * 100)}%` }} />
            </i>
            <small>{paid(j.coins, j.supporters)}</small>
          </li>
        ))}
      </ul>
      <p className="cr-places-note">
        {jobs.allDone.paid ? 'All three done today. Bonus paid.' : `All three today: ${paid(jobs.allDone.coins, jobs.allDone.supporters)}.`} Jobs reset at midnight in Lagos.
      </p>
      <p className="cr-places-note">Titles</p>
      <ul className="cr-phone-list">
        {jobs.titles.map((t) => {
          const m = places.streak.milestones.find((x) => x.title === t.id);
          return (
            <li key={t.id}>
              <span>
                {t.label}
                <small>{t.earned ? (jobs.wearing === t.id ? 'On your name tag' : 'Earned') : `Locked · ${m?.days ?? '?'}-day streak`}</small>
              </span>
              {t.earned ? (
                <button type="button" onClick={() => void usePlacesStore.getState().wearTitle(jobs.wearing === t.id ? null : t.id)}>
                  {jobs.wearing === t.id ? 'Take off' : 'Wear'}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FriendsApp({ onClose }: { onClose: () => void }) {
  const store = usePlacesStore();
  const { friends, roomId } = store;
  return (
    <div className="cr-phone-app">
      {friends && friends.incoming.length ? (
        <ul className="cr-places-people">
          {friends.incoming.map((f) => (
            <li key={f.name} className="cr-places-friendrow">
              <span>
                {f.name}
                <small>Wants to be friends</small>
              </span>
              <button type="button" className="is-go" onClick={() => void store.acceptFriend(f.name)}>
                Accept
              </button>
              <button type="button" onClick={() => void store.removeFriend(f.name)}>
                Not now
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {friends && friends.friends.length ? (
        <ul className="cr-places-people">
          {friends.friends.map((f) => {
            const spot = f.roomId ? roomPlace(f.roomId) : null;
            return (
              <li key={f.name} className="cr-places-friendrow">
                <span>
                  {f.name}
                  <small>{spot ? `In ${placeTitle(spot.stateId, spot.kind)}` : 'Not out right now'}</small>
                </span>
                {spot && f.roomId && f.roomId !== roomId ? (
                  <button
                    type="button"
                    className="is-go"
                    onClick={() => {
                      void store.join(spot.stateId, spot.kind, f.roomId);
                      onClose();
                    }}
                  >
                    Join
                  </button>
                ) : null}
                <button type="button" onClick={() => void store.removeFriend(f.name)} aria-label={`Remove ${f.name}`}>
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      ) : friends && friends.incoming.length ? null : (
        <p className="cr-places-note">No friends yet. Tap a player in a room and choose Add friend.</p>
      )}
      {friends && friends.outgoing.length ? (
        <ul className="cr-places-people">
          {friends.outgoing.map((f) => (
            <li key={f.name} className="cr-places-friendrow">
              <span>
                {f.name}
                <small>Waiting for them</small>
              </span>
              <button type="button" onClick={() => void store.removeFriend(f.name)}>
                Cancel
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function RoomsApp({ onClose, roomId, rooms }: { onClose: () => void; roomId: string | null; rooms: ReturnType<typeof usePlacesStore.getState>['rooms'] }) {
  const store = usePlacesStore();
  const here = store.stateId === places.square.stateId && store.kind === places.square.id;
  const busiest = [...rooms]
    .filter((r) => r.roomId !== roomId && r.count < r.capacity && r.count > 0)
    .sort((a, b) => b.count - a.count)[0];
  return (
    <div className="cr-phone-app">
      {busiest ? (
        <button
          type="button"
          className="cr-btn"
          onClick={() => {
            void store.join(busiest.stateId, busiest.kind, busiest.roomId);
            onClose();
          }}
        >
          Quick switch: {placeTitle(busiest.stateId, busiest.kind)} ({busiest.count} here)
        </button>
      ) : null}
      <ul className="cr-places-people cr-places-rooms">
        {rooms.map((r) => {
          const mine = r.roomId === roomId;
          const full = r.count >= r.capacity;
          return (
            <li key={r.roomId}>
              <button
                type="button"
                disabled={mine || full}
                onClick={() => {
                  void store.join(r.stateId, r.kind, r.roomId);
                  onClose();
                }}
              >
                <span>{placeTitle(r.stateId, r.kind)}</span>
                <small>
                  {mine ? 'You are here' : full ? 'Full' : `${r.count}/${r.capacity}`}
                  {r.friends ? ` · ${r.friends} ${r.friends === 1 ? 'friend' : 'friends'}` : ''}
                </small>
              </button>
            </li>
          );
        })}
        {rooms.some((r) => r.key === placeKey(places.square.stateId, places.square.id)) ? null : (
          <li>
            <button
              type="button"
              disabled={here}
              onClick={() => {
                void store.join(places.square.stateId, places.square.id);
                onClose();
              }}
            >
              <span>{places.square.label}</span>
              <small>{here ? 'You are here' : 'Every state meets here'}</small>
            </button>
          </li>
        )}
      </ul>
      {rooms.length === 0 ? <p className="cr-places-note">No rooms are open yet. You are the first one out.</p> : null}
      <p className="cr-places-note">A room holds {places.roomCapacity} players. Friends in a room show beside it.</p>
    </div>
  );
}

function BoardApp() {
  const [rows, setRows] = useState<{ stateId: string; today: number; week: number }[] | null>(null);
  const mine = usePlacesStore((s) => s.stateId);
  useEffect(() => {
    let live = true;
    apiGet<{ states: { stateId: string; today: number; week: number }[] }>('/api/places/activity')
      .then((r) => live && setRows(r.states))
      .catch(() => live && setRows([]));
    return () => {
      live = false;
    };
  }, []);
  if (rows === null) return <p className="cr-places-note">Reading the Board…</p>;
  const top = rows.filter((r) => r.today > 0 || r.week > 0).slice(0, 8);
  return (
    <div className="cr-phone-app">
      {top.length === 0 ? (
        <p className="cr-places-note">No Mobilise activity yet today. Canvass, hand out flyers or rally to put your state on the Board.</p>
      ) : (
        <ol className="cr-phone-list cr-phone-rank">
          {top.map((r, i) => (
            <li key={r.stateId} className={r.stateId === mine ? 'is-mine' : undefined}>
              <span>
                {i + 1}. {stateIndex.find((s) => s.id === r.stateId)?.name ?? r.stateId}
                <small>{n(r.week)} this week</small>
              </span>
              <b>{n(r.today)} today</b>
            </li>
          ))}
        </ol>
      )}
      <p className="cr-places-note">Counts what players with a confirmed address did in places. It changes no standings by itself.</p>
    </div>
  );
}

function ConvoyApp() {
  const following = useGameStore((s) => s.following);
  const coins = useGameStore((s) => s.coins);
  const ride = rides.find((r) => r.id === useGameStore.getState().activeRideId);
  const gate = nextRideGate(following, rides);
  return (
    <div className="cr-phone-app">
      <ul className="cr-phone-list">
        <li>
          <span>
            Your ride<small>{ride?.name ?? 'Trek'}</small>
          </span>
        </li>
        <li>
          <span>
            Following<small>Unlocks rides</small>
          </span>
          <b>{n(following)}</b>
        </li>
        <li>
          <span>
            Funds<small>Buy upgrades in the Convoy Yard</small>
          </span>
          <b>₦{n(coins)}</b>
        </li>
      </ul>
      <p className="cr-places-note">
        {gate ? `${gate.name} unlocks at ${n(gate.gate)} Following. ${n(gate.short)} to go.` : 'Every ride is unlocked.'} What you earn here goes straight to your convoy.
      </p>
    </div>
  );
}

function SettingsApp() {
  const store = usePlacesStore();
  const { lang, identity, mutedNames } = store;
  const picked = useContenderStore((s) => s.activeContenderId);
  const mine = contenders.find((c) => c.id === picked);
  return (
    <div className="cr-phone-app">
      <p className="cr-places-note">Language for phrases</p>
      <div className="cr-places-lang" role="group" aria-label="Language">
        <button type="button" aria-pressed={lang === 'en'} onClick={() => store.setLang('en')}>
          English
        </button>
        <button type="button" aria-pressed={lang === 'pcm'} onClick={() => store.setLang('pcm')}>
          Pidgin
        </button>
      </div>
      {mine && identity ? (
        <>
          <p className="cr-places-note">Your look in places</p>
          <div className="cr-places-lang" role="group" aria-label="Your look">
            <button type="button" aria-pressed={!identity.contenderId} onClick={() => void store.setIdentity(null)}>
              Plain citizen
            </button>
            <button type="button" aria-pressed={!!identity.contenderId} onClick={() => void store.setIdentity(mine.id)}>
              {mine.name}
            </button>
          </div>
        </>
      ) : null}
      <p className="cr-places-note">Muted players</p>
      {mutedNames.length === 0 ? (
        <p className="cr-places-note">Nobody is muted.</p>
      ) : (
        <ul className="cr-places-people">
          {mutedNames.map((name) => (
            <li key={name} className="cr-places-friendrow">
              <span>{name}</span>
              <button type="button" onClick={() => store.unmute(name)}>
                Unmute
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
