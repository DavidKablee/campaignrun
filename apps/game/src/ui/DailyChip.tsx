import { useGameStore } from '../state';
import { todaysChallenge } from '../daily';

/** Today's challenge, shown on the briefing, in the Yard and after a run. */
export function DailyChip() {
  const claimed = useGameStore((s) => s.dailyChallengeClaimed);
  const ch = todaysChallenge();
  const done = claimed === ch.id;
  return (
    <p className={`cr-daily-chip${done ? ' is-done' : ''}`}>
      <span>Daily</span>
      {ch.label}
      <b>₦{ch.reward}</b>
    </p>
  );
}
