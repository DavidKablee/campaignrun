import { places } from '@cr/content';
import type { ActivePoll } from './placesModel';

/**
 * C92: a room's open poll. The question and options are preset text from `places.json`; the card shows
 * live counts and a countdown, lets a player vote once, and keeps the final result in view until closed.
 */
export function PollCard({
  poll,
  lang,
  now,
  starterName,
  onVote,
  onClose,
}: {
  poll: ActivePoll;
  lang: 'en' | 'pcm';
  now: number;
  starterName: string | null;
  onVote: (option: string) => void;
  onClose: () => void;
}) {
  const def = places.polls.items.find((q) => q.id === poll.pollId);
  if (!def) return null;
  const total = Object.values(poll.counts).reduce((a, b) => a + b, 0);
  const left = Math.max(0, Math.ceil((poll.closesAt - now) / 1000));
  const open = !poll.closed && left > 0;
  const text = (x: { en: string; pcm: string }) => (lang === 'pcm' ? x.pcm : x.en);
  return (
    <div className="cr-places-poll" role="group" aria-label="Poll">
      <div className="cr-places-poll-head">
        <b>{text(def)}</b>
        <button type="button" className="cr-places-x" onClick={onClose} aria-label="Close the poll">
          ×
        </button>
      </div>
      <ul>
        {def.options.map((o) => {
          const n = poll.counts[o.id] ?? 0;
          const pct = total > 0 ? Math.round((n / total) * 100) : 0;
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onVote(o.id)}
                disabled={!open || poll.voted !== null}
                aria-pressed={poll.voted === o.id}
                className={poll.voted === o.id ? 'is-mine' : undefined}
              >
                <span className="cr-places-poll-fill" style={{ width: `${pct}%` }} aria-hidden="true" />
                <span className="cr-places-poll-label">{text(o)}</span>
                <span className="cr-places-poll-n">{n}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <small>
        {open ? `${left}s left` : 'Poll closed'}
        {starterName ? ` · started by ${starterName}` : ''}
        {open && poll.voted === null ? ' · tap to vote' : ''}
      </small>
    </div>
  );
}
