import { campaignMap, copy, legal } from '@cr/content';
import { useGameStore } from '../state';
import { MenuHead, Sheet } from './MenuChrome';

/**
 * The page that has to tell the truth. Prose is left-aligned and full width
 * here (it used to be centred, which is fine for three words and poor for a
 * privacy notice), and the disclosure leads rather than trailing in fineprint.
 */
export function AboutScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  return (
    <div className="cr-screen cr-screen--menu">
      <MenuHead title="About" sub="What this game is, and what it is not" onBack={() => setScreen('splash')} />

      <Sheet tone="accent" eyebrow="Disclosure">
        <p>{copy.disclosure}</p>
      </Sheet>

      <Sheet eyebrow="Not a poll" title="What the board means">
        <p>
          Every number in Campaigner is a game score. The map colours a state for whichever Contender its players have
          been running for — that is a count of players in a game, not a measure of anyone's support, and a state only
          shows a live split once at least {campaignMap.standings.minPlayersPerRegion} players have run it. Below that
          the board shows practice numbers and says so on screen.
        </p>
      </Sheet>

      <Sheet eyebrow={`Version ${legal.version}`} title={legal.privacyTitle}>
        <p>{legal.privacyBody}</p>
      </Sheet>

      <Sheet eyebrow={`Version ${legal.version}`} title={legal.termsTitle}>
        <p>{legal.termsBody}</p>
      </Sheet>

      <div className="cr-row">
        <button className="cr-btn cr-btn--ghost" type="button" onClick={() => setScreen('account')}>
          Account
        </button>
        <button className="cr-btn" type="button" onClick={() => setScreen('splash')}>
          Back
        </button>
      </div>
    </div>
  );
}
