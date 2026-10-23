import { useState } from 'react';
import {
  maxUpgradeLevel,
  metaConfig,
  nextRideGate,
  rideDifferences,
  rides,
  travelCaps,
  upgradeReadout,
  type Ride,
  type RideStat,
} from '@cr/content';
import { useGameStore } from '../state';
import { syncTravelDay } from '../travel';
import { DailyChip } from './DailyChip';
import { MenuHead, Sheet, TabPanel, Tabs } from './MenuChrome';

const YARD_TABS = [
  { id: 'goals', label: 'Goals' },
  { id: 'upgrades', label: 'Upgrades' },
  { id: 'rides', label: 'Rides' },
  { id: 'how', label: 'How it works' },
] as const;
type YardTab = (typeof YARD_TABS)[number]['id'];

const rewards = metaConfig.rewards;

/** The top gates run to six figures, which is unreadable without separators. */
const n = (v: number) => v.toLocaleString('en-US');

function Pips({ level }: { level: number }) {
  return (
    <span className="cr-pips" aria-hidden="true">
      {Array.from({ length: maxUpgradeLevel }, (_, i) => (
        <i key={i} className={i < level ? 'is-on' : ''} />
      ))}
    </span>
  );
}

/**
 * One handling stat, as a bar that grows out from a centre line: better than
 * the baseline ride goes right, worse goes left, so a card is scannable without
 * reading a single label. Direction follows the stat's *tone*, not the sign of
 * the number — "crowd scattered by a knock, +40%" is a worse ride, and putting
 * that bar on the good side because the number went up would be a lie told in
 * green.
 *
 * Capped at 50%: past that the bars all read as "full" and stop comparing.
 */
function FeelRow({ stat }: { stat: RideStat }) {
  const width = `${Math.min(100, Math.abs(stat.deltaPercent) * 2)}%`;
  const sign = stat.deltaPercent > 0 ? '+' : '−';
  return (
    <li className={`cr-feel-row is-${stat.tone}`}>
      <span className="cr-feel-label">{stat.label}</span>
      <span className="cr-feel-bar" aria-hidden="true">
        <span className="cr-feel-half">{stat.tone === 'down' ? <i style={{ width }} /> : null}</span>
        <span className="cr-feel-half">{stat.tone === 'up' ? <i style={{ width }} /> : null}</span>
      </span>
      <b className="cr-feel-delta">
        {sign}
        {Math.abs(stat.deltaPercent)}%
      </b>
    </li>
  );
}

/**
 * The showroom card. Until C44 this was a name, a line of flavour text and a
 * seat count — which was the whole problem with the ride ladder: every rung
 * read as "the last one with more seats", because that is all it was. The card
 * now states the upside, what it costs, and how the thing actually drives.
 *
 * C48: and a locked card says what is missing in the unit the player can act
 * on — supporters delivered — rather than only naming the gate.
 */
function RideCard({ ride, following }: { ride: Ride; following: number }) {
  const open = ride.playable && following >= ride.followingGate;
  const stats = rideDifferences(ride);
  const short = ride.followingGate - following;
  return (
    <div className={`cr-ride-card${open ? ' is-on' : ' is-locked'}`}>
      <header>
        <b>{ride.name}</b>
        <span className="cr-ride-stat">
          {open ? `${ride.capacity} seats` : ride.playable ? `${n(ride.followingGate)} Following` : 'Coming later'}
        </span>
      </header>
      {open ? null : ride.playable ? (
        <small className="cr-ride-gate">
          {n(short)} to go · about {n(Math.ceil(short / Math.max(1, rewards.followingPerDelivered)))} more
          supporters delivered
        </small>
      ) : (
        <small className="cr-ride-gate">Not in the game yet.</small>
      )}
      <small className="cr-ride-up">{ride.trait}</small>
      {ride.tradeoff ? <small className="cr-ride-down">{ride.tradeoff}</small> : null}
      {stats.length > 0 ? (
        <ul className="cr-feel">
          {stats.map((stat) => (
            <FeelRow key={stat.id} stat={stat} />
          ))}
        </ul>
      ) : (
        <small className="cr-ride-even">Nothing better or worse than this anywhere — it is the baseline.</small>
      )}
    </div>
  );
}

function Goal({ label, cur, target, reward }: { label: string; cur: number; target: number; reward: number }) {
  const done = cur >= target;
  return (
    <li className={`cr-goal${done ? ' is-done' : ''}`}>
      <header>
        <b>{label}</b>
        <span>{done ? 'Done' : `${cur}/${target}`}</span>
      </header>
      <div className="cr-bar">
        <i style={{ width: `${Math.min(100, (cur / target) * 100)}%` }} />
      </div>
      {/* C48: the goals listed a target and never said what finishing one paid. */}
      <small className="cr-goal-pay">{done ? `Paid ₦${reward}` : `Pays ₦${reward}`}</small>
    </li>
  );
}

/**
 * One upgrade, stating what the level you own does and what the next one would
 * do — both read off the same number the run applies (`upgradeReadout`), so the
 * shop cannot promise an effect the sim does not deliver.
 *
 * C48: before this the row was a name, a vague sentence and five pips. "Horn
 * recharges faster" never said faster than what, by how much, or how much of
 * that you had already bought, so every price on the screen was unjudgeable.
 */
function UpgradeRow({
  upgrade,
  level,
  coins,
  onBuy,
}: {
  upgrade: (typeof metaConfig.upgrades)[number];
  level: number;
  coins: number;
  onBuy: () => void;
}) {
  const read = upgradeReadout(upgrade, level);
  const maxed = read.cost === null;
  const short = read.cost === null ? 0 : read.cost - coins;
  return (
    <div className="cr-row-item cr-upgrade">
      <span className="cr-row-text">
        <b>{upgrade.name}</b>
        <small>{upgrade.description}</small>
        <span className="cr-upgrade-read">
          <span className="cr-upgrade-stat">{read.label}</span>
          <b>{read.now}</b>
          {read.next ? (
            <>
              <i aria-hidden="true">→</i>
              <b className="is-next">{read.next}</b>
            </>
          ) : null}
        </span>
        <span className="cr-upgrade-level">
          <Pips level={level} />
          Level {level} of {read.maxLevel}
        </span>
      </span>
      <span className="cr-upgrade-buy">
        <button
          className={`cr-buy${maxed ? ' is-max' : ''}`}
          type="button"
          disabled={maxed || short > 0}
          onClick={onBuy}
          aria-label={
            maxed
              ? `${upgrade.name} is fully upgraded`
              : `Buy ${upgrade.name} level ${level + 1} for ${read.cost} naira`
          }
        >
          {maxed ? 'Max' : `₦${read.cost}`}
        </button>
        {/* A greyed-out price reads as broken; the amount still missing reads as locked. */}
        {!maxed && short > 0 ? <small>₦{short} short</small> : null}
      </span>
    </div>
  );
}

/**
 * The shop. Everything here is a thing you can buy, claim or work towards, so
 * each row states its price and its state plainly: an upgrade you cannot
 * afford says what it costs rather than greying out, and a locked ride says
 * how much Following is still missing. The old screen disabled both, which
 * read as broken rather than as locked.
 *
 * C48: and every number on it now says where it came from. The screen had two
 * currencies, five upgrades, a streak, a donation and seven gated rides, and
 * named no source for any of them — so a player could read the whole page and
 * still not know that Following comes only from delivering supporters, or that
 * the pips were levels of anything.
 */
export function ConvoyYard() {
  const setScreen = useGameStore((s) => s.setScreen);
  const coins = useGameStore((s) => s.coins);
  const following = useGameStore((s) => s.following);
  const story = useGameStore((s) => s.startingStory);
  const choose = useGameStore((s) => s.chooseStartingStory);
  const levels = useGameStore((s) => s.upgrades);
  const buy = useGameStore((s) => s.buyUpgrade);
  const donationDay = useGameStore((s) => s.donationDay);
  const claim = useGameStore((s) => s.claimDonation);
  const streak = useGameStore((s) => s.streak);
  const progress = useGameStore((s) => s.missionProgress);
  const done = useGameStore((s) => s.completedMissions);
  const travel = useGameStore((s) => s.travel);
  const dayTravel = syncTravelDay(travel);
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date());
  const weekly = metaConfig.missions.weekly;
  const claimed = donationDay === day;
  const gate = nextRideGate(following, rides);
  // C47: the Yard was three and a half phone screens of stacked sheets — goals,
  // every upgrade, then a showroom card per ride. One tab at a time is roughly
  // one screen, which is what the thumb was asking for.
  const [tab, setTab] = useState<YardTab>('goals');

  return (
    <div className="cr-screen cr-screen--menu cr-screen--yard">
      <MenuHead title="Convoy Yard" sub="Spend what the road paid you" onBack={() => setScreen('splash')} />

      {/* C48: each tile says where its number comes from — they were three bare
          counters, and two of them are the currencies the whole screen runs on.
          Three equal columns laid out on a shared three-row grid, so the label,
          the figure and the source line sit on the same baseline across all
          three however differently their text wraps. */}
      <div className="cr-wallet">
        <article>
          <span>Funds</span>
          <strong>₦{n(coins)}</strong>
          <small>
            ₦{rewards.baseRun} a rally, ₦{rewards.perDelivered} a supporter
          </small>
        </article>
        <article>
          <span>Following</span>
          <strong>{n(following)}</strong>
          <small>{rewards.followingPerDelivered} a supporter delivered</small>
        </article>
        <article>
          <span>Streak</span>
          <strong>{n(streak)}</strong>
          <small>Rallies finished in a row</small>
        </article>
      </div>

      {/* The one thing the wallet cannot say in three columns: how far the
          Following in the middle tile is from buying anything. */}
      {gate ? (
        <div className="cr-next-ride">
          <p>
            Next ride · <b>{gate.name}</b> at {n(gate.gate)} Following
            <span>{n(gate.short)} to go</span>
          </p>
          <div className="cr-bar cr-bar--gate" aria-label={`${following} of ${gate.gate} Following`}>
            <i style={{ width: `${Math.min(100, Math.round((following / gate.gate) * 100))}%` }} />
          </div>
        </div>
      ) : null}

      {!story && (
        <Sheet eyebrow="Pick one" title="How your campaign starts">
          <div className="cr-choices">
            {metaConfig.starts.map((start) => (
              <button key={start.id} type="button" className="cr-choice" onClick={() => choose(start.id)}>
                <strong>{start.name}</strong>
                <small>{start.description}</small>
                <span className="cr-choice-stats">
                  ₦{start.coins} · {start.following} Following
                </span>
              </button>
            ))}
          </div>
          <p className="cr-fineprint">
            One-time, and it cannot be changed afterwards. Funds buy upgrades; Following unlocks rides. Both end
            up in the same place — this is only which one you start with.
          </p>
        </Sheet>
      )}

      <Tabs label="Convoy Yard sections" tabs={YARD_TABS} active={tab} onPick={setTab} />

      {tab === 'goals' && (
        <TabPanel id="goals">
          <Sheet
            eyebrow="Today"
            title="Goals"
            aside={
              <button className="cr-mini-btn" type="button" disabled={claimed} onClick={() => claim()}>
                {claimed ? 'Claimed' : `Claim ₦${rewards.donation}`}
              </button>
            }
          >
            <p className="cr-lede">
              Goals tick up when you <b>finish</b> a rally — a run you quit or crash out of counts for nothing.
              Each one pays once, into Funds, the moment it completes. The ₦{rewards.donation} is a daily
              donation: free, once a day, no rally needed.
            </p>
            <DailyChip />
            <ul className="cr-goals">
              {metaConfig.missions.daily.map((m) => (
                <Goal
                  key={m.id}
                  label={m.label}
                  cur={done.includes(m.id) ? m.target : Math.min(progress[m.id] ?? 0, m.target)}
                  target={m.target}
                  reward={rewards.dailyMission}
                />
              ))}
              <Goal
                label={`${weekly.label} (this week)`}
                cur={done.includes(weekly.id) ? weekly.target : Math.min(progress[weekly.id] ?? 0, weekly.target)}
                target={weekly.target}
                reward={rewards.weeklyMission}
              />
            </ul>
            <p className="cr-fineprint">
              Daily goals reset at midnight Lagos time, the weekly one on Monday. Travel today:{' '}
              {dayTravel.runsToday}/{travelCaps.maxRunsPerDay} runs · {dayTravel.statesTouched.length}/
              {travelCaps.maxStatesPerDay} states.
            </p>
          </Sheet>
        </TabPanel>
      )}

      {tab === 'upgrades' && (
        <TabPanel id="upgrades">
          <Sheet eyebrow="Upgrades" title="Fit out the convoy" flush>
            <p className="cr-lede cr-lede--inset">
              Bought with Funds, kept for the rest of the campaign, and applied from your <b>next</b> rally on.
              Each row shows what you have now and what the next level would make it.
            </p>
            {metaConfig.upgrades.map((upgrade) => (
              <UpgradeRow
                key={upgrade.id}
                upgrade={upgrade}
                level={levels[upgrade.id]}
                coins={coins}
                onBuy={() => buy(upgrade.id)}
              />
            ))}
          </Sheet>
        </TabPanel>
      )}

      {tab === 'rides' && (
        <TabPanel id="rides">
          <Sheet eyebrow="Rides" title="Unlocked by Following">
            <p className="cr-lede">
              Rides cost no money. They open at a Following total, and Following comes only from supporters you
              deliver to a venue — {rewards.followingPerDelivered} each.
              {gate
                ? ` Next up: the ${gate.name} at ${n(gate.gate)}, which is ${n(gate.short)} away — about ${n(gate.supporters)} more supporters.`
                : ' You have opened every ride that is in the game.'}
            </p>
            {gate ? (
              <div className="cr-bar cr-bar--gate" aria-label={`${following} of ${gate.gate} Following`}>
                <i style={{ width: `${Math.min(100, Math.round((following / gate.gate) * 100))}%` }} />
              </div>
            ) : null}
            <div className="cr-ride-grid">
              {rides.map((ride) => (
                <RideCard key={ride.id} ride={ride} following={following} />
              ))}
            </div>
            <p className="cr-fineprint">
              Every figure is against the keke, the balanced ride. A bigger ride always carries more and always
              handles worse — which one is right depends on the road, not the price.
            </p>
          </Sheet>
        </TabPanel>
      )}

      {tab === 'how' && (
        <TabPanel id="how">
          {/* C48: the page the Yard never had. Every figure below is read off
              `metaConfig`, so it cannot describe a game the code is not playing. */}
          <Sheet eyebrow="Two currencies" title="Funds and Following">
            <dl className="cr-explain">
              <div>
                <dt>Funds (₦)</dt>
                <dd>
                  Paid for finishing a rally: ₦{rewards.baseRun} to start, plus ₦{rewards.perDelivered} for every
                  supporter you get to a venue. Goals and the daily donation pay in ₦ too. Funds buy upgrades,
                  and nothing else.
                </dd>
              </div>
              <div>
                <dt>Following</dt>
                <dd>
                  {rewards.followingPerDelivered} for every supporter delivered, and that is the only way it
                  moves — it is not bought, and it is not lost. Following unlocks rides.
                </dd>
              </div>
              <div>
                <dt>Crowd</dt>
                <dd>
                  Your score for one rally. It decides the board and the state tier, and is spent on nothing —
                  Funds and Following are what the Yard reads.
                </dd>
              </div>
            </dl>
          </Sheet>

          <Sheet eyebrow="A finished rally" title="What one run pays">
            <ul className="cr-payline">
              <li>
                <span>Finishing</span>
                <b>₦{rewards.baseRun}</b>
              </li>
              <li>
                <span>Each supporter delivered</span>
                <b>
                  ₦{rewards.perDelivered} + {rewards.followingPerDelivered} Following
                </b>
              </li>
              <li>
                <span>Each daily goal completed</span>
                <b>₦{rewards.dailyMission}</b>
              </li>
              <li>
                <span>The weekly goal</span>
                <b>₦{rewards.weeklyMission}</b>
              </li>
              <li>
                <span>Daily donation (no rally needed)</span>
                <b>₦{rewards.donation}</b>
              </li>
            </ul>
            <p className="cr-fineprint">
              The Fundraising Desk upgrade multiplies the rally payout — it does not touch goal payouts or the
              donation. A run you quit or crash out of pays nothing and ticks no goal.
            </p>
          </Sheet>

          <Sheet eyebrow="Honest answer" title="The rally streak buys nothing">
            <p className="cr-lede">
              It counts rallies finished without a break and is shown here and on the result screen. Nothing in
              the game reads it yet — no bonus, no unlock. It is on the list, and until then this screen is not
              going to imply otherwise.
            </p>
          </Sheet>
        </TabPanel>
      )}
    </div>
  );
}
