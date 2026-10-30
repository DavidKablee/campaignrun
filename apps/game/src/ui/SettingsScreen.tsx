import { useEffect, useState } from 'react';
import { analyticsOff, setAnalyticsOff } from '../analytics';
import { setLang, useLang } from '../i18n';
import { useGameStore } from '../state';
import { audio } from '../audio/engine';
import { MenuHead, Row, Sheet, Toggle } from './MenuChrome';

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

/**
 * Two groups of settings, each a sheet of rows: what you hear, and how hard
 * the phone has to work. Every switch carries a line saying what it does —
 * "Data saver" is not self-explanatory, and the people most likely to want it
 * are the ones least able to afford finding out by experiment.
 */
export function SettingsScreen() {
  const setScreen = useGameStore((s) => s.setScreen);
  const sfx = useGameStore((s) => s.sfxVolume);
  const music = useGameStore((s) => s.musicVolume);
  const setVolumes = useGameStore((s) => s.setVolumes);
  const haptics = useGameStore((s) => s.haptics);
  const dataSaver = useGameStore((s) => s.dataSaver);
  const reduceMotion = useGameStore((s) => s.reduceMotion);
  const setFlags = useGameStore((s) => s.setFlags);
  const lang = useLang();
  const [countsOff, setCountsOff] = useState(analyticsOff);

  useEffect(() => {
    audio.setVolumes(sfx, music);
  }, [sfx, music]);

  return (
    <div className="cr-screen cr-screen--menu">
      <MenuHead title="Settings" />

      <Sheet eyebrow="Sound">
        <div className="cr-slider">
          <header>
            <b>Horns and crowd</b>
            <span>{pct(sfx)}</span>
          </header>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={sfx}
            aria-label="Sound effects volume"
            onChange={(e) => setVolumes(Number(e.target.value), music)}
          />
        </div>
        <div className="cr-slider">
          <header>
            <b>Radio</b>
            <span>{pct(music)}</span>
          </header>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={music}
            aria-label="Music volume"
            onChange={(e) => setVolumes(sfx, Number(e.target.value))}
          />
        </div>
      </Sheet>

      <Sheet eyebrow="Play" flush>
        <Toggle
          label="Haptics"
          hint="A short buzz on a hit or a pickup."
          checked={haptics}
          onChange={(v) => setFlags({ haptics: v })}
        />
        <Toggle
          label="Data saver"
          hint="Lighter world, fewer effects. Easier on an older phone and on your battery."
          checked={dataSaver}
          onChange={(v) => setFlags({ dataSaver: v })}
        />
        <Toggle
          label="Reduce motion"
          hint="Calms camera shake and background movement."
          checked={reduceMotion}
          onChange={(v) => setFlags({ reduceMotion: v })}
        />
      </Sheet>

      <Sheet eyebrow="Language and privacy">
        <Toggle
          label="Naija Pidgin on the road"
          hint="The radio, run prompts and the message you send a friend, in Pidgin. Menus and legal text stay in English."
          checked={lang === 'pcm'}
          onChange={(v) => setLang(v ? 'pcm' : 'en')}
        />
        <Toggle
          label="Anonymous usage counts"
          hint="Counts like “a run was finished”, with no name, account, score or identifier. Your browser's Do Not Track also switches this off."
          checked={!countsOff}
          onChange={(v) => {
            setAnalyticsOff(!v);
            setCountsOff(!v);
          }}
        />
      </Sheet>

      <Sheet flush>
        <Row label="Account" hint="Sign in, consent and your data." onClick={() => setScreen('account')} />
        <Row label="About" hint="Disclosure, privacy and terms." onClick={() => setScreen('about')} />
      </Sheet>

    </div>
  );
}
