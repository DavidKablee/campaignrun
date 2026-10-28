import { useState } from 'react';
import { feedbackTopics, limits } from '@cr/content';
import { apiPost } from '../api/client';
import { track } from '../analytics';
import { correctionText, looksPersonal, type Correction } from '../feedback';
import { useStatePack } from '../statePack';

type Status = 'idle' | 'sending' | 'sent' | 'offline';

/**
 * A small form under a state: pick a landmark and what is wrong, say it in a line, send. Closed by
 * default so it costs a screen nothing until a player from that state wants it.
 */
export function StateCorrection({ stateId, stateName }: { stateId: string; stateName: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        className="cr-link-btn"
        type="button"
        onClick={() => {
          track('feedback_open', stateId);
          setOpen(true);
        }}
      >
        Is {stateName} your state? Tell us what we got wrong
      </button>
    );
  }
  return <CorrectionForm stateId={stateId} stateName={stateName} onClose={() => setOpen(false)} />;
}

function CorrectionForm({ stateId, stateName, onClose }: { stateId: string; stateName: string; onClose: () => void }) {
  const pack = useStatePack(stateId);
  const [landmark, setLandmark] = useState('');
  const [topic, setTopic] = useState(feedbackTopics[0]!.id);
  const [note, setNote] = useState('');
  const [fromHere, setFromHere] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [copied, setCopied] = useState(false);

  const personal = looksPersonal(note);
  const correction: Correction = { stateId, landmark, topic, note: note.trim(), fromHere };
  const label = feedbackTopics.find((t) => t.id === topic)?.label ?? topic;

  const send = async () => {
    if (personal || status === 'sending') return;
    setStatus('sending');
    try {
      await apiPost('/api/feedback/state', correction);
      track('feedback_sent', stateId);
      setStatus('sent');
    } catch {
      setStatus('offline');
    }
  };

  if (status === 'sent') {
    return (
      <div className="cr-correction" role="status">
        <p>
          <b>Thank you.</b> A reviewer from {stateName} will read it. Every wrong name, shape and colour you catch makes the
          road more true.
        </p>
        <button className="cr-btn cr-btn--ghost" type="button" onClick={onClose}>
          Done
        </button>
      </div>
    );
  }

  return (
    <form
      className="cr-correction"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      <p className="cr-eyebrow">What did we get wrong in {stateName}?</p>
      <label className="cr-field">
        <span>Where</span>
        <select value={landmark} onChange={(e) => setLandmark(e.target.value)}>
          <option value="">The state in general</option>
          {pack?.landmarks.map((l) => (
            <option key={l.name} value={l.name}>
              {l.name}
            </option>
          ))}
        </select>
      </label>
      <label className="cr-field">
        <span>What</span>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          {feedbackTopics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </label>
      <label className="cr-field">
        <span>In a line (optional)</span>
        <textarea
          rows={3}
          maxLength={limits.feedback.noteMaxChars}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. The cloth here is darker, and the market has no tin roofs."
        />
      </label>
      <p className="cr-fineprint">
        Anonymous. Please leave out names, links and phone numbers. {note.length}/{limits.feedback.noteMaxChars}
      </p>
      {personal ? <p className="cr-fineprint cr-error">That looks like a link, an email or a phone number. Take it out to send.</p> : null}
      <label className="cr-check">
        <input type="checkbox" checked={fromHere} onChange={(e) => setFromHere(e.target.checked)} />
        <span>I am from {stateName}</span>
      </label>
      <div className="cr-row">
        <button className="cr-btn" type="submit" disabled={personal || status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send'}
        </button>
        <button className="cr-btn cr-btn--ghost" type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
      {status === 'offline' ? (
        <p className="cr-fineprint" role="status">
          Could not reach the server.{' '}
          <button
            className="cr-link-btn"
            type="button"
            onClick={() => {
              void navigator.clipboard
                ?.writeText(correctionText(correction, stateName, label))
                .then(() => setCopied(true))
                .catch(() => undefined);
            }}
          >
            {copied ? 'Copied' : 'Copy your note'}
          </button>{' '}
          to send it another way.
        </p>
      ) : null}
    </form>
  );
}
