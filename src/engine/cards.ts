export type Suit = 'S' | 'H' | 'D' | 'C';
/** 2..14 (11 = Vale, 12 = Kız, 13 = Papaz, 14 = As) */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  suit: Suit;
  rank: Rank;
}

export const SUITS: Suit[] = ['S', 'H', 'C', 'D'];
export const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

export const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
export const SUIT_NAME: Record<Suit, string> = { S: 'Maça', H: 'Kupa', D: 'Karo', C: 'Sinek' };

export const isRed = (s: Suit) => s === 'H' || s === 'D';

export function rankLabel(r: Rank): string {
  if (r <= 10) return String(r);
  return ({ 11: 'J', 12: 'Q', 13: 'K', 14: 'A' } as const)[r as 11 | 12 | 13 | 14];
}

export const cardId = (c: Card) => `${c.suit}${c.rank}`;
export const sameCard = (a: Card, b: Card) => a.suit === b.suit && a.rank === b.rank;

export function newDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ suit, rank });
  return deck;
}

/** Fisher–Yates; `rand` is injectable for deterministic tests. */
export function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Sort a hand for display: suits alternate colour, ranks high→low. */
export function sortHand(hand: Card[]): Card[] {
  const order: Record<Suit, number> = { S: 0, H: 1, C: 2, D: 3 };
  return hand.slice().sort((a, b) => order[a.suit] - order[b.suit] || b.rank - a.rank);
}

/** Small seeded PRNG (mulberry32). */
export function seeded(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
