import { useEffect, useRef, useState } from 'react';
import { contenders, followingGain, partyForContender, places, rides, simConfig, stateIndex } from '@cr/content';
import { starForCrowd } from '@cr/sim';
import { useAccountStore } from '../accountStore';
import { track } from '../analytics';
import { challengeText, challengeUrl, judgeChallenge, whatsappUrl, type Challenge } from '../challenge';
import { t, useLang } from '../i18n';
import { contenderShareAllowed } from '../consent';
import { useContenderStore } from '../contenderStore';
import { emailPromptDue, runsFromBest } from '../emailPrompt';
import { useOnlineStore } from '../onlineStore';
import { type Outcome, resultExclaim } from '../exclaim';
import { renderShareCard, shareOrDownload } from '../shareCard';
import { useStatePack } from '../statePack';
import { StateCorrection } from './StateCorrection';
import { useGameStore } from '../state';
import { DailyChip } from './DailyChip';
import { Sheet } from './MenuChrome';

const STAR_LABEL: Record<string, string> = {
  none: 'No tier yet',
  foothold: 'Small',
  majority: 'Packed',
  landslide: 'Overflowing',
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
  const eventNote = useGameStore((s) => s.lastEventNote);
  const following = useGameStore((s) => s.following);
  const streak = useGameStore((s) => s.streak);
  const streakBonus = useGameStore((s) => s.lastStreakBonus);
  const streakNote = useGameStore((s) => s.lastStreakNote);
  const challenge = useGameStore((s) => s.challenge);
  const quick = useGameStore((s) => s.lastRunQuick);
  const seed = useGameStore((s) => s.lastRunSeed);
  const replay = useGameStore((s) => s.lastRunReplay);
  // A challenge decides its own road; otherwise it is the one picked on the map.
  const rideId = useGameStore((s) => challenge?.rideId ?? s.activeRideId);
  const stateId = useGameStore((s) => challenge?.stateId ?? s.activeStateId);
  // A quick rally or a fixed-seed challenge is a casual run: it pays and counts
  // toward missions, but it never reaches a board or a personal best, because a
  // short course or a known seed is not comparable (or is trivially repeatable).
  const casual = quick || challenge !== null;
  const chosenContenderId = useContenderStore((s) => s.activeContenderId);
  const contenderId = chosenContenderId ?? contenders[0]!.id;
  const progress = useGameStore((s) => s.lastRunProgress);
  const reached = useGameStore((s) => s.lastRunReached);
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const ride = rides.find((r) => r.id === rideId) ?? rides[0]!;
  const contender = contenders.find((c) => c.id === contenderId) ?? contenders[0]!;
  const party = partyForContender(contenderId);
  const finished = phase === 'finished';
  // Tiers are tuned to the full road, so a quick rally is judged per segment.
  const fullScale = quick ? simConfig.course.segmentCount / Math.min(simConfig.course.segmentCount, simConfig.course.quickSegmentCount) : 1;
  const star = phase === 'breakdown' ? 'none' : starForCrowd(Math.round(skill * fullScale), ride.capacity, simConfig);
  const stateName = pack?.name ?? 'Lagos';
  const brokeDown = phase === 'breakdown';
  const exclaim = resultExclaim(brokeDown ? 'breakdown' : (star as Outcome), skill);
  // A breakdown has a result too: how far the convoy got is the number to beat.
  const shareLabel = brokeDown
    ? `Broke down · ${progress}% of the road`
    : `${quick ? 'Quick rally · ' : ''}${STAR_LABEL[star] ?? 'Crowd'}`;
  const verdict = challenge && finished ? judgeChallenge(challenge.crowd, skill) : null;
  const [linkNote, setLinkNote] = useState('');
  const challengeStateName = stateIndex.find((x) => x.id === stateId)?.name ?? stateName;
  // Sent from a finished run only: a breakdown has no score worth chasing. WhatsApp is the first
  // button because it is where a link like this actually travels; the rest are fallbacks.
  const lang = useLang();
  const onChallengeFriend = async (channel: 'whatsapp' | 'native' | 'copy') => {
    const link: Challenge = { seed, stateId, rideId: ride.id, crowd: skill, quick, from: username };
    const url = challengeUrl(window.location.href, link);
    const text = challengeText(link, ride.name, challengeStateName, lang);
    track(channel === 'whatsapp' ? 'share_whatsapp' : channel === 'native' ? 'share_native' : 'share_copy', stateId);
    try {
      if (channel === 'whatsapp') {
        window.open(whatsappUrl(text, url), '_blank', 'noopener,noreferrer');
        setLinkNote(t('challenge.sent'));
      } else if (channel === 'native' && typeof navigator.share === 'function') {
        await navigator.share({ text, url });
        setLinkNote(t('challenge.shared'));
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setLinkNote(t('challenge.copied'));
      }
    } catch {
      setLinkNote(t('challenge.failed'));
    }
  };
  /** Back to the normal campaign: no fixed road, full length. */
  const goCampaign = (to: 'game' | 'roster' | 'splash') => {
    const g = useGameStore.getState();
    g.setChallenge(null);
    g.setQuickRun(false);
    setScreen(to);
  };
  const supportersTotal = following + (awarded.current ? 0 : followingGain(delivered));

  useEffect(() => {
    if (awarded.current) return;
    awarded.current = true;
    // A quick rally is not a completed campaign run: it pays for what it
    // delivered but does not lock a Contender, extend the streak or clear the daily.
    recordMetaRun({ delivered, crowd: skill, finished: phase === 'finished' && !quick, broke: phase === 'breakdown' && !quick, quick, stateId });
    const bonus = claimDailyIfMet({
      finished: phase === 'finished' && !quick,
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
    if (casual) return;
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
      // Only a debug-jumped or replay-less run goes without; the server
      // refuses those, which is the point.
      replay: replay ? { seed, ...replay } : undefined,
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
    quick,
    casual,
    seed,
    replay,
  ]);

  useEffect(() => {
    let revoke: string | null = null;
    let cancelled = false;
    void renderShareCard({
      crowd: display,
      starLabel: shareLabel,
      rideName: ride.name,
      contenderName: shareContender ? contender.name : 'Your Contender',
      stateName,
      partyColor: party?.color,
      partyName: shareContender ? contender.name : undefined,
    })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        revoke = url;
        setPreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null);
      });
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [display, shareLabel, ride.name, shareContender, contender.name, stateName]);

  const onShare = async () => {
    track('share_card', stateId);
    setShareNote('…');
    try {
      const blob = await renderShareCard({
        crowd: display,
        starLabel: shareLabel,
        rideName: ride.name,
        contenderName: shareContender ? contender.name : 'Your Contender',
        stateName,
        partyColor: party?.color,
        partyName: shareContender ? contender.name : undefined,
      });
      const how = await shareOrDownload(blob, `campaigner-${skill}.png`);
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

  // A first-timer has just driven a trial: the one thing to do next sits right under the score,
  // before the wallet, the card and the board, which all make more sense once they have a Contender.
  const trial = chosenContenderId === null && challenge === null;
  const next = (
    <>
      {challenge ? (
        <>
          <button className="cr-btn cr-result-again" type="button" onClick={() => setScreen('game')}>
            {verdict?.won ? 'Run it again' : 'Rematch'}
          </button>
          <button className="cr-btn cr-btn--ghost" type="button" onClick={() => goCampaign(chosenContenderId === null ? 'roster' : 'game')}>
            {chosenContenderId === null ? 'Pick your Contender' : 'Back to my campaign'}
          </button>
        </>
      ) : chosenContenderId === null ? (
        <>
          <button
            className="cr-btn cr-result-again"
            type="button"
            onClick={() => goCampaign(brokeDown ? 'game' : 'roster')}
          >
            {brokeDown ? 'Try again' : 'Pick your Contender →'}
          </button>
          <button
            className="cr-btn cr-btn--ghost"
            type="button"
            onClick={() => goCampaign(brokeDown ? 'roster' : 'game')}
          >
            {brokeDown ? 'Pick your Contender' : 'Run again'}
          </button>
        </>
      ) : quick ? (
        <>
          <button className="cr-btn cr-result-again" type="button" onClick={() => goCampaign('game')}>
            Full campaign run
          </button>
          <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('game')}>
            Another quick rally
          </button>
        </>
      ) : (
        <button className="cr-btn cr-result-again" type="button" onClick={() => goCampaign('game')}>
          Campaign again
        </button>
      )}
    </>
  );

  return (
    <div className="cr-screen cr-screen--menu cr-screen--result">
      <section className={`cr-result${finished ? '' : ' cr-result--down'}`}>
        <p className="cr-eyebrow">
          {finished ? (quick ? 'Quick rally' : 'Rally called') : 'Breakdown'} · {stateName}
        </p>
        {verdict ? (
          <p className={`cr-result-verdict${verdict.won ? ' is-win' : ''}`}>
            {verdict.won
              ? `You beat ${challenge!.from || 'your friend'} by ${verdict.margin}.`
              : verdict.tied
                ? `Dead level with ${challenge!.from || 'your friend'}.`
                : `${verdict.margin} short of ${challenge!.from || 'your friend'}'s ${challenge!.crowd}.`}
          </p>
        ) : null}
        {exclaim ? <p className={`cr-result-exclaim${brokeDown ? ' is-down' : ''}`}>{exclaim}</p> : null}
        <h2>{brokeDown ? 'Convoy broke down' : STAR_LABEL[star]}</h2>
        <p className="cr-result-score">
          <b>{skill}</b>
          <span>Crowd</span>
        </p>
        {brokeDown ? (
          <p className="cr-result-reach">
            Made it <b>{progress}%</b> of the road{reached ? ` · past ${reached}` : ''}. Beat that next time.
          </p>
        ) : null}
        <p className="cr-result-who">
          {contender.name} · {ride.name}
        </p>
        <p className="cr-result-explain">
          <b>{delivered}</b> delivered at venues → Following · Crowd is the run score (multipliers can lift it above
          delivered)
        </p>
        {display > skill ? <p className="cr-fineprint">Celebration Crowd {display}</p> : null}
      </section>

      {trial && next}

      {/* Held for the trial: a first-timer cannot yet explain a quick-rally score to a friend. */}
      {finished && skill > 0 && !trial ? (
        <Sheet tone="accent" eyebrow="Challenge" title={t('challenge.title')}>
          <p className="cr-fineprint">{t('challenge.sub', { crowd: skill })}</p>
          <div className="cr-share-row">
            <button className="cr-btn" type="button" onClick={() => void onChallengeFriend('whatsapp')}>
              {t('challenge.whatsapp')}
            </button>
            {typeof navigator.share === 'function' ? (
              <button className="cr-btn cr-btn--ghost" type="button" onClick={() => void onChallengeFriend('native')}>
                {t('challenge.other')}
              </button>
            ) : null}
            <button className="cr-btn cr-btn--ghost" type="button" onClick={() => void onChallengeFriend('copy')}>
              {t('challenge.copy')}
            </button>
          </div>
          {linkNote ? <p className="cr-fineprint">{linkNote}</p> : null}
        </Sheet>
      ) : null}

      <div className="cr-wallet">
        <article>
          <span>Delivered</span>
          <strong>{delivered}</strong>
        </article>
        <article>
          <span>Following</span>
          <strong>{supportersTotal.toLocaleString('en-US')}</strong>
        </article>
        <article>
          <span>Funds earned</span>
          <strong>₦{(metaReward + dailyBonus).toLocaleString('en-US')}</strong>
        </article>
        <article>
          <span>Dents</span>
          <strong>{dents}/3</strong>
        </article>
      </div>

      {eventNote ? <p className="cr-fineprint cr-streak-line">{eventNote}</p> : null}

      {streakBonus > 0 || streakNote ? (
        <p className="cr-fineprint cr-streak-line">
          {streakBonus > 0 ? `Rally streak: +${streakBonus / 10}% Funds on this run. ` : ''}
          {streakNote === 'frozen' ? 'The weekly streak freeze covered this breakdown — your streak is safe. ' : ''}
          {streakNote === 'lost' ? 'The streak is back to 0. Finish a rally to start it again. ' : ''}
        </p>
      ) : null}

      {dailyBonus > 0 ? (
        <p className="cr-daily-chip is-done">Daily cleared · ₦{dailyBonus.toLocaleString('en-US')}</p>
      ) : (
        finished && !quick && <DailyChip />
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

      {casual ? (
        <p className="cr-fineprint">
          {quick ? 'Quick rallies' : 'Challenge runs'} are for fun: they pay out, but they do not go on a board.
        </p>
      ) : (
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
              <button className="cr-btn cr-btn--post" type="button" onClick={onBoard}>
                Post
              </button>
            </div>
            {boardNote ? <p className="cr-fineprint">{boardNote}</p> : null}
          </>
        ) : (
          <p>A convoy that breaks down does not post a score. Finish a run to put it on the board.</p>
        )}
      </Sheet>
      )}

      <Sheet eyebrow="Share" title="Make a card">
        <p className="cr-fineprint">
          A picture of this run: tier, Crowd, ride and state.{' '}
          {shareContender ? 'Your Contender is named on it, because you consented to share it.' : 'Your Contender is not named on it.'}
        </p>
        {previewUrl ? (
          <figure className="cr-share-preview">
            <img src={previewUrl} alt="Share card preview" />
          </figure>
        ) : (
          <div className="cr-share-preview cr-share-preview--empty" aria-hidden="true">
            Preparing card…
          </div>
        )}
        <div className="cr-share-row">
          <button className="cr-btn" type="button" onClick={() => void onShare()} disabled={!previewUrl}>
            Share card
          </button>
          {shareNote ? <span className="cr-fineprint">{shareNote}</span> : null}
        </div>
      </Sheet>

      <StateCorrection stateId={stateId} stateName={challengeStateName} />

      {!trial && next}
      <nav className="cr-result-nav" aria-label="After this run">
        <button
          type="button"
          disabled={following < places.followingGate}
          onClick={() => useGameStore.getState().openPlaces('summary')}
        >
          <span aria-hidden="true">⚑</span>
          <small>{following < places.followingGate ? `Mobilise · ${(places.followingGate - following).toLocaleString('en-US')} to go` : 'Mobilise'}</small>
        </button>
        <button type="button" onClick={() => setScreen('map')}>
          <span aria-hidden="true">⊙</span>
          <small>Board</small>
        </button>
        <button type="button" onClick={() => setScreen('yard')}>
          <span aria-hidden="true">⊞</span>
          <small>Yard</small>
        </button>
        <button type="button" onClick={() => goCampaign('splash')}>
          <span aria-hidden="true">⌂</span>
          <small>Home</small>
        </button>
      </nav>
      <p className="cr-fineprint cr-result-foot">Streak {streak}</p>
    </div>
  );
}
