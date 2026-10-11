import { describe, expect, it } from 'vitest';
import { ECONOMY, adsLeft, canClaimDaily, claimDaily, entryFee, leavePenalty, newWallet, payEntry, payouts, rewardAd } from './economy';

describe('economy', () => {
  it('daily bonus once per day', () => {
    let w = newWallet();
    expect(canClaimDaily(w, '2026-10-11')).toBe(true);
    w = claimDaily(w, '2026-10-11');
    expect(w.points).toBe(ECONOMY.START_POINTS + ECONOMY.DAILY_BONUS);
    expect(claimDaily(w, '2026-10-11')).toBe(w);
    expect(claimDaily(w, '2026-10-12').points).toBe(w.points + ECONOMY.DAILY_BONUS);
  });

  it('rewarded ads at most twice a day', () => {
    let w = newWallet();
    w = rewardAd(rewardAd(w, 'd1'), 'd1');
    expect(w.points).toBe(ECONOMY.START_POINTS + 2 * ECONOMY.AD_REWARD);
    expect(adsLeft(w, 'd1')).toBe(0);
    expect(rewardAd(w, 'd1')).toBe(w);
    expect(adsLeft(w, 'd2')).toBe(2);
    expect(rewardAd(w, 'd2').points).toBe(w.points + ECONOMY.AD_REWARD);
  });

  it('entry fee is close to the reference app (2600 prize → 811 here, 813 there)', () => {
    expect(entryFee('ihaleli', 2600)).toBe(811);
    expect(entryFee('gommeli', 2600)).toBeGreaterThan(0);
  });

  it('pays out by finishing place', () => {
    expect(payouts('ihaleli', 2600, [2, 0, 3, 1])).toEqual([325, 0, 2600, 163]);
    expect(payouts('esli', 1000, [1, 3, 0, 2])).toEqual([0, 500, 0, 500]);
    expect(payouts('gommeli', 1000, [1, 2, 0])).toEqual([0, 1000, 125]);
  });

  it('fees always cover payouts', () => {
    for (const mode of ['ihaleli', 'esli', 'gommeli', 'kozMaca'] as const)
      for (const prize of ECONOMY.PRIZES) {
        const n = mode === 'gommeli' ? 3 : 4;
        const paid = payouts(mode, prize, [...Array(n).keys()]).reduce((a, b) => a + b, 0);
        expect(entryFee(mode, prize) * n).toBeGreaterThanOrEqual(paid);
      }
  });

  it('entry and leave penalty', () => {
    const w = payEntry(newWallet(), 1000);
    expect(w.points).toBe(ECONOMY.START_POINTS - 1000);
    expect(() => payEntry({ ...w, points: 10 }, 1000)).toThrow();
    expect(leavePenalty({ ...w, points: 100 }).points).toBe(0);
  });
});
