import { useEffect, useRef, useState } from 'react';
import { contenders, copy, outfits, partyForContender, stateIndex } from '@cr/content';
import { getCharacter } from '../characters';
import { useContenderStore } from '../contenderStore';
import { CharacterStudio } from '../render/studio';
import { useGameStore } from '../state';
import { SLOTS, changedSlots, colorLabel, type Slot } from '../studio';

/**
 * Edit your Contender's look (C42).
 *
 * The page worked, in the sense that every control did what it said. It was
 * also unreadable: C38 turned the side panel into a white card and left every
 * control inside it painted for the dark ground it used to sit on, so the seven
 * garment names, the back link and both perk chips were cream on white — the
 * only option you could make out was the selected one, by its outline. You
 * chose clothes by tapping blanks and watching the model.
 *
 * The rest was the usual flex-column trap: the panel had no scroll floor, so on
 * a phone the two buttons at the bottom were cut off, and a colour grid of
 * twelve swatches sat between you and them with nothing saying what it painted.
 *
 * So: readable controls on the white card, swatches labelled with the slot they
 * belong to, a dot on the tabs you have edited, Reset disabled when there is
 * nothing to reset, and an action bar pinned to the bottom of the panel.
 */
export function StudioScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const stateId = useGameStore((s) => s.activeStateId);
  const id = useContenderStore((s) => s.activeContenderId) ?? contenders[0]!.id;
  const overrides = useContenderStore((s) => s.outfits[id]);
  const setOutfit = useContenderStore((s) => s.setOutfit);
  const resetOutfit = useContenderStore((s) => s.resetOutfit);
  const contender = contenders.find((c) => c.id === id) ?? contenders[0]!;
  const party = partyForContender(contender.id);
  const hostRef = useRef<HTMLDivElement>(null);
  const studioRef = useRef<CharacterStudio | null>(null);
  const [slot, setSlot] = useState<Slot>('top');
  const [zoom, setZoom] = useState(0);
  const { look, outfit } = getCharacter(id, overrides);
  const base = getCharacter(id, undefined).outfit;
  const edited = changedSlots(base, outfit);
  // The briefing opens on the state the campaign is actually on. This button
  // said "Campaign in Lagos" on every one of the 37, the same way the roster's
  // state pill did before C40.
  const stateName = stateIndex.find((s) => s.id === stateId)?.name ?? 'Lagos';

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

  return (
    <div className="cr-screen cr-screen--studio">
      <div className="cr-studio">
        <div
          className="cr-studio-view"
          style={{ ['--c1' as string]: contender.palette[0], ['--c2' as string]: contender.palette[1] }}
        >
          <div className="cr-studio-host" ref={hostRef} />
          <button type="button" className="cr-studio-back" onClick={() => setScreen('roster')}>
            ← All Contenders
          </button>
          <p className="cr-studio-hint">Drag to turn</p>
          <div className="cr-studio-ctrl">
            <button
              type="button"
              className="cr-icon-btn"
              aria-label="Turn left"
              onClick={() => studioRef.current?.rotateBy(-Math.PI / 4)}
            >
              ⟲
            </button>
            <button
              type="button"
              className="cr-icon-btn"
              aria-label={zoom === 0 ? 'Zoom in' : 'Zoom out'}
              onClick={() => setZoom((z) => (z === 0 ? 1 : 0))}
            >
              {zoom === 0 ? '＋' : '－'}
            </button>
            <button
              type="button"
              className="cr-icon-btn"
              aria-label="Turn right"
              onClick={() => studioRef.current?.rotateBy(Math.PI / 4)}
            >
              ⟳
            </button>
          </div>
        </div>

        <div className="cr-studio-panel">
          <div className="cr-studio-scroll">
            <header className="cr-studio-id">
              <p className="cr-eyebrow">Your Contender</p>
              <h2>{contender.name}</h2>
              <p className="cr-studio-arch">{contender.archetype}</p>
              {party ? (
                <p className="cr-party-line" style={{ ['--fill' as string]: party.color }}>
                  <i />
                  {party.platform}
                </p>
              ) : null}
            </header>

            <dl className="cr-studio-facts">
              <div>
                <dt>Perk</dt>
                <dd>{contender.perk.description}</dd>
              </div>
              <div>
                <dt>Trade-off</dt>
                <dd>{contender.tradeoff.description}</dd>
              </div>
            </dl>

            <div className="cr-dress">
              <div className="cr-dress-tabs" role="tablist" aria-label="What to change">
                {SLOTS.map((x) => (
                  <button
                    key={x.id}
                    type="button"
                    role="tab"
                    aria-selected={slot === x.id}
                    className={`cr-dress-tab${slot === x.id ? ' is-on' : ''}`}
                    onClick={() => setSlot(x.id)}
                  >
                    {x.label}
                    {/* A dot rather than a count: it answers "did I touch this?",
                        which is the only question a tab can answer from here. */}
                    {edited.has(x.id) ? <i className="cr-dress-dot" aria-label="edited" /> : null}
                  </button>
                ))}
              </div>

              <div className="cr-dress-opts" role="group" aria-label={def.label}>
                {options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={outfit[slot] === o.id}
                    className={`cr-dress-opt${outfit[slot] === o.id ? ' is-on' : ''}`}
                    onClick={() => setOutfit(id, { [slot]: o.id })}
                  >
                    {o.name}
                  </button>
                ))}
              </div>

              <div className="cr-dress-colors">
                <p className="cr-dress-label">{colorLabel(def)}</p>
                <div className="cr-dress-swatches">
                  {outfits.options.colors.map((col) => (
                    <button
                      key={col}
                      type="button"
                      aria-label={`${colorLabel(def)} ${col}`}
                      aria-pressed={outfit[def.colorKey] === col}
                      className={`cr-dress-swatch${outfit[def.colorKey] === col ? ' is-on' : ''}`}
                      style={{ ['--sw' as string]: col }}
                      onClick={() => setOutfit(id, { [def.colorKey]: col })}
                    />
                  ))}
                </div>
              </div>

              {/* Reset sits with the controls it undoes, not in the action bar:
                  it is the opposite of what that bar is for, and stacking two
                  buttons down there cost a third of the scroller on a phone. */}
              <button
                className="cr-mini-btn cr-dress-reset"
                type="button"
                disabled={edited.size === 0}
                onClick={() => resetOutfit(id)}
              >
                {edited.size === 0 ? 'Original look' : `Reset look (${edited.size})`}
              </button>
            </div>

            {/* Two questions this page never answered: does dressing them up
                change how they play, and does the outfit go anywhere. */}
            <p className="cr-fineprint">{copy.studioLooks}</p>
          </div>

          <div className="cr-studio-actions">
            <button className="cr-btn" type="button" onClick={() => setScreen('briefing')}>
              Campaign in {stateName} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
