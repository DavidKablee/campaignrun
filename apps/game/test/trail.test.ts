import { describe, expect, it } from 'vitest';
import { calendar, loadStatePack, shippedStatePacks, simConfig } from '@cr/content';
import { campaignRows, finishSign, gateSign, legAt, stationFor } from '../src/trail';

describe('campaign trail', () => {
  it('names the leg the player is travelling', () => {
    const gate = simConfig.course.borderGateMm;
    const seg = simConfig.course.segmentLengthMm;
    const stops = ['Ojuelegba', 'Third Mainland Bridge', 'Lekki–Ikoyi Link Bridge', 'Balogun Market', 'Freedom Park'];
    expect(legAt(0, stops, 'Lagos gate')).toEqual({ from: 'Your street', to: 'Lagos gate' });
    expect(legAt(gate, stops, 'Lagos gate')).toEqual({ from: 'Lagos gate', to: 'Ojuelegba' });
    expect(legAt(gate + seg, stops, 'Lagos gate')).toEqual({ from: 'Ojuelegba', to: 'Third Mainland Bridge' });
    expect(legAt(gate + seg * 5, stops, 'Lagos gate')).toEqual({ from: 'Freedom Park', to: 'Grand Rally' });
  });

  it('keeps Lagos open before its Monday and locks the rest', () => {
    const before = Date.parse('2026-10-06T12:00:00Z');
    const rows = campaignRows(before);
    expect(rows.filter((r) => r.open).map((r) => r.id)).toEqual(['lagos']);
    expect(rows).toHaveLength(37);
    expect(stationFor('sw-fuji').name).toBe('Èkó Wave');
  });

  it('C34: no unlock week opens onto missing content', () => {
    // `awaitingPack` is the player-visible hole this chunk closes: the calendar
    // unlocks a state, the map shows it, and before C34 twenty-eight of them had
    // no pack behind them, so from 9 Nov the board filled up with "Pack" chips.
    // Walk every unlock date plus the close and assert none is ever in that state.
    const dates = [...calendar.unlocks.map((u) => Date.parse(u.at)), Date.parse(calendar.closeAt)];
    for (const at of dates) {
      const awaiting = campaignRows(at).filter((r) => r.awaitingPack).map((r) => r.id);
      expect(awaiting, new Date(at).toISOString()).toEqual([]);
    }
  });

  it('C34: every state is playable by the final week', () => {
    const open = campaignRows(Date.parse(calendar.closeAt)).filter((r) => r.open);
    expect(open).toHaveLength(37);
  });

  it('C34: every state signs its own gate and finish, not Lagos', async () => {
    // The gate and finish copy were string literals in GameRenderer, so the first
    // thing a player saw in all 28 newly playable states was "WELCOME TO LAGOS"
    // over the border gate and a Yoruba thank-you at the finish line.
    for (const id of shippedStatePacks()) {
      const pack = await loadStatePack(id);
      const gate = gateSign(pack.name, pack.welcomeLines[0]!);
      expect(gate.label, id).toBe(`WELCOME TO ${pack.name.toUpperCase()}`);
      expect(gate.sub, id).toBe(pack.welcomeLines[0]);
      const fin = finishSign(pack.name, pack.farewellLine);
      // Either the pack's own farewell, or a neutral line naming the state — never
      // another state's language or another state's name.
      expect(fin.sub, id).toBe(pack.farewellLine ?? `${pack.name} · Grand Rally`);
      if (id !== 'lagos') {
        expect(gate.label, id).not.toContain('LAGOS');
        expect(fin.sub, id).not.toContain('Lagos');
        expect(fin.sub, id).not.toContain('Èkó');
      }
    }
  });

  it('opens the 26 Oct batch when packs are shipped', () => {
    expect(shippedStatePacks()).toEqual(expect.arrayContaining(['lagos', 'kano', 'rivers', 'anambra', 'kaduna']));
    const after = Date.parse('2026-10-26T05:00:00Z');
    const week2 = campaignRows(after).filter((r) => r.open).map((r) => r.id);
    expect(week2).toEqual(['lagos', 'kano', 'rivers', 'anambra', 'kaduna']);
    const laterLocked = campaignRows(after).find((r) => r.id === 'oyo');
    expect(laterLocked?.open).toBe(false);
    expect(laterLocked?.awaitingPack).toBe(false);
  });
});
