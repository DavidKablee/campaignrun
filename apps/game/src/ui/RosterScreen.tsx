import { useEffect, useState } from 'react';
import { contenders, copy, partyForContender, stateIndex } from '@cr/content';
import { audio } from '../audio/engine';
import { daysLeftLabel } from '../campaignClock';
import { getCharacter } from '../characters';
import { useContenderStore } from '../contenderStore';
import { renderPortraits } from '../render/studio';
import { rosterCommit } from '../roster';
import { useGameStore } from '../state';
import { goBack } from '../nav';

const NO_PORTRAITS: Record<string, string> = {};

/**
 * Bakes two sets of portraits once per roster: a square head-and-shoulders chip
 * for the grid, and a taller half-body hero shot that shows the signature prop.
 */
function usePortraits(ids: string[]) {
  const overrides = useContenderStore((s) => s.outfits);
  const [map, setMap] = useState<{ chips: Record<string, string>; heroes: Record<string, string> }>({
    chips: NO_PORTRAITS,
    heroes: NO_PORTRAITS,
  });
  const key = JSON.stringify([ids, overrides]);
  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      try {
        const items = ids.map((cid) => ({ id: cid, ...getCharacter(cid, overrides[cid]) }));
        const chips = renderPortraits(items);
        const heroes = renderPortraits(items, { width: 320, height: 420, frame: 1.15, yBias: 0.44 });
        if (!cancelled) setMap({ chips, heroes });
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

/**
 * Pick your Contender (C40).
 *
 * Two things were wrong beyond the styling. The hero card only changed on
 * `mouseEnter`/`focus`, so on a phone — where there is no hover and a tap went
 * straight to the studio — the perk, trade-off and Party of the other five were
 * unreachable; you chose a character from a name and a thumbnail. And a tap
 * committed: it spent the single post-lock switch with no warning, or did
 * nothing at all once that switch was gone.
 *
 * So selection and commitment are now separate. Tapping a card only previews
 * it — nothing reaches the store — and the hero's button is the only thing that
 * writes a choice, after a confirm step when that choice costs the last switch.
 */
export function RosterScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const openSettings = useGameStore((s) => s.openSettings);
  const following = useGameStore((s) => s.following);
  const stateId = useGameStore((s) => s.activeStateId);
  const setActive = useContenderStore((s) => s.setActiveContender);
  const active = useContenderStore((s) => s.activeContenderId);
  const locked = useContenderStore((s) => s.contenderLocked);
  const graceUsed = useContenderStore((s) => s.contenderGraceUsed);

  const activeList = contenders.filter((c) => c.status === 'active');
  const portraits = usePortraits(activeList.map((c) => c.id));
  const [previewId, setPreviewId] = useState(active ?? activeList[0]!.id);
  const [confirming, setConfirming] = useState(false);

  const featured = activeList.find((c) => c.id === previewId) ?? activeList[0]!;
  const featuredParty = partyForContender(featured.id);
  const yours = activeList.find((c) => c.id === active) ?? null;
  const stateName = stateIndex.find((s) => s.id === stateId)?.name ?? 'Lagos';
  const commit = rosterCommit({ cardId: featured.id, activeId: active, locked, graceUsed });

  const preview = (id: string) => {
    setPreviewId(id);
    setConfirming(false);
  };

  const open = () => {
    setActive(featured.id);
    void audio.unlock();
    setScreen('studio');
  };

  return (
    <div className="cr-screen cr-screen--pick">
      <div className="cr-chrome-top">
        <button type="button" className="cr-menu-back" onClick={goBack} aria-label="Back">
          <span aria-hidden="true">‹</span>
        </button>
        <div className="cr-pill-row">
          <span className="cr-pill cr-pill--live">{stateName}</span>
          <span className="cr-pill">{following.toLocaleString('en-US')} Following</span>
          <span className="cr-pill">{daysLeftLabel(Date.now(), true)}</span>
        </div>
        <span className="cr-chrome-actions">
          <button className="cr-mini-btn" type="button" onClick={() => setScreen('map')}>
            Board
          </button>
          <button className="cr-mini-btn" type="button" onClick={openSettings}>
            Settings
          </button>
        </span>
      </div>

      <header className="cr-pick-head">
        <h2>Pick your Contender</h2>
        <p className="cr-pick-sub">
          {locked
            ? graceUsed
              ? `Locked to ${yours?.name ?? 'your Contender'} for this campaign.`
              : 'One switch left. Tap a card to read it first.'
            : 'Your choice stays on this device.'}
        </p>
      </header>

      {!locked && (
        <div className="cr-lock-alert" role="alert">
          <strong>Your first full run locks your Contender.</strong>
          {' '}Quick rallies do not lock it. After the lock you get one switch, then it is fixed for the campaign.
        </div>
      )}

      <div className="cr-pick-layout">
        <aside className="cr-pick-hero">
          <div
            className="cr-pick-art"
            style={{ ['--c1' as string]: featured.palette[0], ['--c2' as string]: featured.palette[1] }}
          >
            {portraits.heroes[featured.id] ? (
              <img src={portraits.heroes[featured.id]} alt="" />
            ) : (
              <b aria-hidden="true">{featured.name[0]}</b>
            )}
          </div>
          <div className="cr-pick-body">
            <p className="cr-eyebrow">{featured.archetype}</p>
            <h3>{featured.name}</h3>
            {featuredParty ? (
              <p className="cr-party-line" style={{ ['--fill' as string]: featuredParty.color }}>
                <i />
                {featuredParty.platform}
              </p>
            ) : null}
            <p className="cr-pick-quote">“{featured.catchphrase}”</p>

            <dl className="cr-traits">
              <div>
                <dt>In-run perk</dt>
                <dd>{featured.perk.description}</dd>
              </div>
              <div>
                <dt>Trade-off</dt>
                <dd>{featured.tradeoff.description}</dd>
              </div>
            </dl>

            {commit.kind === 'blocked' ? (
              <div className="cr-commit cr-commit--blocked">
                <p>
                  You cannot switch to {featured.name} — your free switch is spent and {yours?.name ?? 'your Contender'}{' '}
                  is locked in for the campaign.
                </p>
                {yours ? (
                  <button className="cr-btn" type="button" onClick={() => preview(yours.id)}>
                    Back to {yours.name}
                  </button>
                ) : null}
              </div>
            ) : confirming ? (
              <div className="cr-commit">
                <p>
                  Switching to {featured.name} spends your one free switch. After that your Contender is fixed until the
                  campaign closes.
                </p>
                <div className="cr-row">
                  <button className="cr-btn" type="button" onClick={open}>
                    Spend my switch
                  </button>
                  <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setConfirming(false)}>
                    Keep {yours?.name ?? 'mine'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="cr-btn cr-pick-go"
                type="button"
                onClick={() => (commit.kind === 'confirm-switch' ? setConfirming(true) : open())}
              >
                {active === featured.id ? `Style ${featured.name} →` : `Campaign as ${featured.name} →`}
              </button>
            )}

            <p className="cr-fineprint">{copy.rosterFair}</p>
            {locked ? null : <p className="cr-fineprint">{copy.rosterLock}</p>}
          </div>
        </aside>

        <div className="cr-pick-grid">
          {activeList.map((c) => {
            const state = rosterCommit({ cardId: c.id, activeId: active, locked, graceUsed });
            return (
              <button
                key={c.id}
                type="button"
                className={`cr-pick-card${previewId === c.id ? ' is-sel' : ''}${
                  state.kind === 'blocked' ? ' is-locked' : ''
                }`}
                style={{ ['--c1' as string]: c.palette[0], ['--c2' as string]: c.palette[1] }}
                aria-pressed={previewId === c.id}
                // Deliberately no hover-to-preview: it was the reason this page
                // worked only on a desktop, and a card sliding under a still
                // cursor when the hero resizes re-selects it behind your back.
                onFocus={() => preview(c.id)}
                onClick={() => preview(c.id)}
              >
                <span className="cr-portrait">
                  {portraits.chips[c.id] ? (
                    <img src={portraits.chips[c.id]} alt="" />
                  ) : (
                    <b aria-hidden="true">{c.name[0]}</b>
                  )}
                </span>
                <span className="cr-pick-name">
                  <strong>{c.name}</strong>
                  <small>{c.archetype}</small>
                </span>
                {active === c.id ? (
                  <span className="cr-tagline cr-tagline--yours">Yours</span>
                ) : state.kind === 'blocked' ? (
                  <span className="cr-tagline">Locked</span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
