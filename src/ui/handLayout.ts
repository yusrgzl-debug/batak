import { Card, Suit } from '../engine/cards';

/**
 * Order the suits that are present so colours alternate (kırmızı-siyah-kırmızı-siyah),
 * starting with whichever colour has more suits in hand.
 */
export function suitOrder(hand: Card[]): Suit[] {
  const present = (s: Suit) => hand.some((c) => c.suit === s);
  const reds = (['H', 'D'] as Suit[]).filter(present);
  const blacks = (['S', 'C'] as Suit[]).filter(present);
  const [a, b] = reds.length >= blacks.length ? [reds, blacks] : [blacks, reds];
  const out: Suit[] = [];
  for (let i = 0; i < a.length; i++) {
    out.push(a[i]);
    if (b[i]) out.push(b[i]);
  }
  return out;
}

/** Hands this size or bigger are shown in two rows. */
export const TWO_ROWS_FROM = 9;

/**
 * Lay the hand out as one or two rows. Within a suit cards go low → high (yüksek kartlar sağda).
 * Two rows are split at the suit boundary closest to the middle so suits stay together
 * (a full 16-card Gömmeli hand of 4-4-4-4 becomes ♥♠ on top and ♦♣ below).
 */
export function arrangeHand(hand: Card[]): Card[][] {
  const sorted = suitOrder(hand).flatMap((s) => hand.filter((c) => c.suit === s).sort((x, y) => x.rank - y.rank));
  if (sorted.length < TWO_ROWS_FROM) return [sorted];
  const half = sorted.length / 2;
  let split = Math.ceil(half);
  let best = Infinity;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].suit === sorted[i - 1].suit) continue;
    const d = Math.abs(i - half);
    if (d < best) {
      best = d;
      split = i;
    }
  }
  // a very lopsided split is worse than breaking a suit across the rows
  if (best > 2) split = Math.ceil(half);
  return [sorted.slice(0, split), sorted.slice(split)];
}
