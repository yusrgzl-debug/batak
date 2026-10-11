import { Mode, playerCount } from './game';

/**
 * Point economy (Pt). Pure functions so the same rules can later run on the game server,
 * which must be the authority for real money-like balances.
 */
export const ECONOMY = {
  START_POINTS: 5000,
  DAILY_BONUS: 1000,
  AD_REWARD: 500,
  AD_REWARDS_PER_DAY: 2,
  /** taken on top of the (already paid) entry fee when a player leaves a running game */
  LEAVE_PENALTY: 500,
  /** share of the entry fees kept by the house */
  HOUSE_CUT: 0.05,
  PRIZES: [1000, 2600, 5000, 10000, 25000, 50000],
} as const;

export interface Wallet {
  points: number;
  /** YYYY-MM-DD of the last daily bonus */
  lastDaily: string | null;
  adDay: string | null;
  adsToday: number;
}

export const newWallet = (): Wallet => ({ points: ECONOMY.START_POINTS, lastDaily: null, adDay: null, adsToday: 0 });

export const dayKey = (d: Date = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const canClaimDaily = (w: Wallet, today = dayKey()) => w.lastDaily !== today;

export function claimDaily(w: Wallet, today = dayKey()): Wallet {
  if (!canClaimDaily(w, today)) return w;
  return { ...w, points: w.points + ECONOMY.DAILY_BONUS, lastDaily: today };
}

export const adsLeft = (w: Wallet, today = dayKey()) =>
  w.adDay === today ? Math.max(0, ECONOMY.AD_REWARDS_PER_DAY - w.adsToday) : ECONOMY.AD_REWARDS_PER_DAY;

export function rewardAd(w: Wallet, today = dayKey()): Wallet {
  if (adsLeft(w, today) === 0) return w;
  const adsToday = w.adDay === today ? w.adsToday + 1 : 1;
  return { ...w, points: w.points + ECONOMY.AD_REWARD, adDay: today, adsToday };
}

/**
 * Prize split by finishing place, as a share of the table prize: 1st takes the prize,
 * 2nd 1/8, 3rd 1/16 (4 players). Eşli: both winners take half each.
 */
export function payoutShares(mode: Mode): number[] {
  if (mode === 'esli') return [0.5, 0.5, 0, 0];
  if (playerCount(mode) === 3) return [1, 1 / 8, 0];
  return [1, 1 / 8, 1 / 16, 0];
}

/** Entry fee so that all fees cover the payouts plus the house cut. 2600 Pt prize → 813 Pt in a 4-player room. */
export function entryFee(mode: Mode, prize: number): number {
  const total = payoutShares(mode).reduce((a, b) => a + b, 0) * prize;
  return Math.ceil((total * (1 + ECONOMY.HOUSE_CUT)) / playerCount(mode));
}

/**
 * Points each seat receives at the end, given seat indices ordered best → worst
 * (in Eşli the winning team's two seats come first).
 */
export function payouts(mode: Mode, prize: number, order: number[]): number[] {
  const shares = payoutShares(mode);
  const out = order.map(() => 0);
  order.forEach((seat, place) => {
    out[seat] = Math.round(prize * shares[place]);
  });
  return out;
}

export const canAfford = (w: Wallet, entry: number) => w.points >= entry;

export function payEntry(w: Wallet, entry: number): Wallet {
  if (!canAfford(w, entry)) throw new Error('Yetersiz puan');
  return { ...w, points: w.points - entry };
}

/** Leaving a running game: the entry is lost and a penalty is charged (never below zero). */
export const leavePenalty = (w: Wallet): Wallet => ({ ...w, points: Math.max(0, w.points - ECONOMY.LEAVE_PENALTY) });
