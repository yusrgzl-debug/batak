import { Card, Suit, SUITS } from './cards';
import { GameState, bidOptions, partnerOf, PLAYERS } from './game';
import { beats, currentWinner, legalMoves } from './rules';

const bySuit = (hand: Card[], s: Suit) => hand.filter((c) => c.suit === s);

/** Rough number of tricks the hand should take if `trump` is koz. */
export function estimateTricks(hand: Card[], trump: Suit | null): number {
  let est = 0;
  for (const s of SUITS) {
    const cards = bySuit(hand, s);
    const len = cards.length;
    const has = (r: number) => cards.some((c) => c.rank === r);
    if (s === trump) {
      // every trump beyond the first few tends to win once side suits run out
      est += (has(14) ? 1 : 0) + (has(13) && len >= 2 ? 0.9 : 0) + (has(12) && len >= 3 ? 0.7 : 0);
      est += Math.max(0, len - 3) * 0.9;
    } else {
      est += (has(14) ? 0.95 : 0) + (has(13) && len >= 2 && len <= 5 ? 0.6 : 0) + (has(12) && len >= 3 && len <= 4 ? 0.25 : 0);
      if (trump && len <= 1) est += bySuit(hand, trump).length >= 3 ? 0.5 : 0; // ruffing potential
    }
  }
  return est;
}

export function bestTrump(hand: Card[]): Suit {
  let best: Suit = 'S';
  let bestScore = -Infinity;
  for (const s of SUITS) {
    const cards = bySuit(hand, s);
    const score = cards.length * 2 + cards.reduce((a, c) => a + Math.max(0, c.rank - 9), 0) * 0.5;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}

export function botBid(s: GameState, p: number): number | 'pass' {
  const hand = s.hands[p];
  const opts = bidOptions(s);
  if (s.settings.mode === 'kozMaca') {
    return Math.max(1, Math.min(13, Math.round(estimateTricks(hand, 'S'))));
  }
  let est = estimateTricks(hand, bestTrump(hand));
  if (s.settings.mode === 'esli') {
    est += 2.2; // partner usually contributes some tricks
    const partnerBid = s.bids[partnerOf(p)];
    if (typeof partnerBid === 'number' && s.highBid?.player === partnerOf(p)) {
      // don't outbid our own partner unless clearly stronger
      if (est < partnerBid + 2) return opts.canPass ? 'pass' : opts.min;
    }
  }
  const target = Math.floor(est);
  if (target >= opts.min) return opts.min;
  return opts.canPass ? 'pass' : opts.min;
}

/** A card is a "master" if no unseen card of its suit outranks it. */
function isMaster(card: Card, s: GameState, p: number): boolean {
  const seen = new Set([...s.played, ...s.trick.map((t) => t.card), ...s.hands[p]].map((c) => `${c.suit}${c.rank}`));
  for (let r = card.rank + 1; r <= 14; r++) if (!seen.has(`${card.suit}${r}`)) return false;
  return true;
}

const lowest = (cards: Card[]) => cards.reduce((a, b) => (b.rank < a.rank ? b : a));
const highest = (cards: Card[]) => cards.reduce((a, b) => (b.rank > a.rank ? b : a));

export function botPlay(s: GameState, p: number): Card {
  const hand = s.hands[p];
  const legal = legalMoves(hand, s.trick, s.trump, s.trumpBroken);
  if (legal.length === 1) return legal[0];
  const trump = s.trump;
  const esli = s.settings.mode === 'esli';

  // Leading
  if (s.trick.length === 0) {
    const isDeclarer = s.highBid?.player === p || (esli && s.highBid && partnerOf(p) === s.highBid.player);
    const myTrumps = trump ? legal.filter((c) => c.suit === trump) : [];
    if (isDeclarer && myTrumps.length >= 3) {
      const m = myTrumps.filter((c) => isMaster(c, s, p));
      if (m.length) return highest(m);
    }
    const masters = legal.filter((c) => c.suit !== trump && isMaster(c, s, p));
    if (masters.length) return highest(masters);
    // lead low from the longest side suit
    const side = legal.filter((c) => c.suit !== trump);
    const pool = side.length ? side : legal;
    const counts = new Map<Suit, number>();
    for (const c of pool) counts.set(c.suit, (counts.get(c.suit) ?? 0) + 1);
    const longSuit = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    return lowest(pool.filter((c) => c.suit === longSuit));
  }

  const lead = s.trick[0].card.suit;
  const win = currentWinner(s.trick, trump)!;
  const lastToPlay = s.trick.length === PLAYERS - 1;
  const winners = legal.filter((c) => beats(c, win.card, lead, trump));

  if (esli && win.player === partnerOf(p)) {
    const partnerSafe = lastToPlay || isMaster(win.card, s, p) || win.card.suit === trump;
    if (partnerSafe) return dumpCard(legal, trump);
  }

  if (winners.length) {
    if (lastToPlay) return lowest(winners);
    const safe = winners.filter((c) => isMaster(c, s, p));
    if (safe.length) return lowest(safe);
    // trumping in: use the smallest trump
    const trumpWinners = winners.filter((c) => c.suit === trump && lead !== trump);
    if (trumpWinners.length) return lowest(trumpWinners);
    return lowest(winners);
  }
  return dumpCard(legal, trump);
}

/** Throw away the least useful card: low, from a short non-trump suit. */
function dumpCard(legal: Card[], trump: Suit | null): Card {
  const side = legal.filter((c) => c.suit !== trump);
  const pool = side.length ? side : legal;
  return pool.reduce((a, b) => (b.rank < a.rank ? b : a));
}
