import { describe, expect, it } from 'vitest';
import { simConfig } from '@cr/content';
import { campaignRows, legAt, stationFor } from '../src/trail';

describe('campaign trail', () => {
  it('names the Lagos leg the player is travelling', () => {
    const gate = simConfig.course.borderGateMm;
    const seg = simConfig.course.segmentLengthMm;
    expect(legAt(0)).toEqual({ from: 'Your street', to: 'Lagos gate' });
    expect(legAt(gate)).toEqual({ from: 'Lagos gate', to: 'Ojuelegba' });
    expect(legAt(gate + seg)).toEqual({ from: 'Ojuelegba', to: 'Third Mainland Bridge' });
    expect(legAt(gate + seg * 5)).toEqual({ from: 'Freedom Park', to: 'Grand Rally' });
  });

  it('keeps Lagos open before its Monday and locks the rest', () => {
    const before = Date.parse('2026-10-06T12:00:00Z');
    const rows = campaignRows(before);
    expect(rows.filter((r) => r.open).map((r) => r.id)).toEqual(['lagos']);
    expect(rows).toHaveLength(37);
    expect(stationFor('sw-fuji').name).toBe('Èkó Wave');
    const after = Date.parse('2026-10-26T05:00:00Z');
    const week2 = campaignRows(after).filter((r) => r.open).map((r) => r.id);
    expect(week2).toEqual(['lagos', 'kano', 'rivers', 'anambra', 'kaduna']);
  });
});
