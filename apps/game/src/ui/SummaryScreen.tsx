import { useEffect, useRef, useState } from 'react';
import { contenders, followingGain, rides, simConfig } from '@cr/content';
import { starForCrowd } from '@cr/sim';
import { useAccountStore } from '../accountStore';
import { contenderShareAllowed } from '../consent';
import { useContenderStore } from '../contenderStore';
import { emailPromptDue, runsFromBest } from '../emailPrompt';
import { useOnlineStore } from '../onlineStore';
import { renderShareCard, shareOrDownload } from '../shareCard';
import { useStatePack } from '../statePack';
import { useGameStore } from '../state';
import { DailyChip } from './DailyChip';
import { Sheet } from './MenuChrome';

const STAR_LABEL: Record<string, string> = {
  none: 'No tier yet',
  foothold: 'Foothold',
  majority: 'Majority',
  landslide: 'Landslide',
};

/**
 * The page after a run (C40).
 *
 * It was a centred stack on a screen with no `overflow`, so on a phone the
 * board-name field and the three navigation buttons were squeezed off the
 * bottom with nowhere to scroll — and the field itself was `--cr-ink` text on a
 * dark slab, so whatever you typed into it was invisible. The result now leads
 * with one card (tier, Crowd, who ran), the four figures sit in white stat
 * cards, and posting and sharing each say what they do before you press them.
 */
export function SummaryScreen() {
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
  const onlineUser = useOnlineStore((s) => s.user);
  const best = useOnlineStore((s) => s.best);
  const snoozeEmailPrompt = useOnlineStore((s) => s.snoozeEmailPrompt);
  // C42: the end of a run is where a name-only player has just made something
  // worth keeping, which is the only honest moment to point out that this
  // phone is currently the only place it exists.
  const askForEmail = onlineUser
    ? emailPromptDue({ email: onlineUser.email, runs: runsFromBest(best), promptAfter: onlineUser.emailPromptAfter })
    : false;
  const awarded = useRef(false);
  const [shareNote, setShareNote] = useState('');
  const [boardNote, setBoardNote] = useState('');
  const [nameDraft, setNameDraft] = useState(username);
  const [dailyBonus, setDailyBonus] = useState(0);
  const ride = rides.find((r) => r.id === rideId) ?? rides[0]!;
  const contender = contenders.find((c) => c.id === contenderId) ?? contenders[0]!;
  const finished = phase === 'finished';
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
    // C48: one Following per supporter delivered — the rate is content now, and
    // the Yard prints it, so the two cannot drift.
    addFollowing(followingGain(delivered));
    noteRun(stateId, skill);
    // Post to the server too, when there is an account to post under. The
    // Contender id only rides along with consent — and the server drops it
    // anyway if the account has not consented (guardrail 10).
    void useOnlineStore.getState().submitScore({
      stateId,
      crowd: skill,
      delivered,
      dents,
      integrity,
      capacity: ride.capacity,
      rideId: ride.id,
      contenderId: shareContender ? contenderId : null,
    });
  }, [
    recordMetaRun,
    claimDailyIfMet,
    addFollowing,
    noteRun,
    skill,
    delivered,
    phase,
    dents,
    integrity,
    star,
    stateId,
    ride,
    contenderId,
    shareContender,
  ]);

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
      setBoardNote(
        named.reason === 'banned' ? 'Name not allowed' : named.reason === 'length' ? '3–16 characters' : 'Letters & numbers only',
      );
      return;
    }
    const res = submitLastRunToBoard(stateId);
    setBoardNote(res.ok ? 'On the local board' : res.reason === 'crowd' || res.reason === 'delivered' ? 'Score rejected' : 'Could not post');
  };

  return (
    <div className="cr-screen cr-screen--menu cr-screen--result">
      <section className={`cr-result${finished ? '' : ' cr-result--down'}`}>
        <p className="cr-eyebrow">
          {finished ? 'Rally called' : 'Breakdown'} · {stateName}
        </p>
        <h2>{STAR_LABEL[star]}</h2>
        <p className="cr-result-score">
          <b>{skill}</b>
          <span>Crowd</span>
        </p>
        <p className="cr-result-who">
          {contender.name} · {ride.name}
        </p>
        {display > skill ? <p className="cr-fineprint">Celebration Crowd {display}</p> : null}
      </section>

      <div className="cr-wallet">
        <article>
          <span>Delivered</span>
          <strong>{delivered}</strong>
        </article>
        <article>
          <span>Following</span>
          <strong>{following + (awarded.current ? 0 : delivered)}</strong>
        </article>
        <article>
          <span>Funds earned</span>
          <strong>₦{metaReward + dailyBonus}</strong>
        </article>
        <article>
          <span>Dents</span>
          <strong>{dents}/3</strong>
        </article>
      </div>

      {dailyBonus > 0 ? (
        <p className="cr-daily-chip is-done">Daily cleared · ₦{dailyBonus}</p>
      ) : (
        finished && <DailyChip />
      )}

      {askForEmail ? (
        <Sheet tone="accent" eyebrow="Keep this campaign" title="Add an email to your account">
          <p>
            Your runs are saved under {onlineUser!.username}, but only this phone can reach that account. Add an email
            and a password and you can sign in on any device — and your runs can reach the public boards.
          </p>
          <div className="cr-row">
            <button className="cr-btn" type="button" onClick={() => setScreen('account')}>
              Add email
            </button>
            <button className="cr-btn cr-btn--ghost" type="button" onClick={() => void snoozeEmailPrompt()}>
              Not now
            </button>
          </div>
        </Sheet>
      ) : null}

      <Sheet eyebrow="Local board" title={finished ? 'Post this run' : 'Nothing to post'}>
        {finished ? (
          <>
            <p className="cr-fineprint">
              The local board lives on this device. Your board name is public on any board you post to.
            </p>
            <div className="cr-name-save">
              <label className="cr-field">
                <span>Board name</span>
                <input
                  type="text"
                  maxLength={16}
                  value={nameDraft}
                  placeholder="3–16 characters"
                  onChange={(e) => setNameDraft(e.target.value)}
                />
              </label>
              <button className="cr-btn cr-btn--ghost" type="button" onClick={onBoard}>
                Post
              </button>
            </div>
            {boardNote ? <p className="cr-fineprint">{boardNote}</p> : null}
          </>
        ) : (
          <p>A convoy that breaks down does not post a score. Finish a run to put it on the board.</p>
        )}
      </Sheet>

      <Sheet eyebrow="Share" title="Make a card">
        <p className="cr-fineprint">
          A picture of this run: tier, Crowd, ride and state.{' '}
          {shareContender ? 'Your Contender is named on it, because you consented to share it.' : 'Your Contender is not named on it.'}
        </p>
        <div className="cr-share-row">
          <button className="cr-btn cr-btn--ghost" type="button" onClick={() => void onShare()}>
            Share card
          </button>
          {shareNote ? <span className="cr-fineprint">{shareNote}</span> : null}
        </div>
      </Sheet>

      <button className="cr-btn cr-result-again" type="button" onClick={() => setScreen('game')}>
        Run again
      </button>
      <div className="cr-row">
        <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('map')}>
          Board
        </button>
        <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('yard')}>
          Yard
        </button>
      </div>
      <p className="cr-fineprint cr-result-foot">Streak {streak} · Game scores, not a poll</p>
    </div>
  );
}
