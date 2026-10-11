import { Card, Suit } from './cards';

export interface PlayedCard {
  player: number;
  card: Card;
}

/** Card currently winning the (possibly partial) trick. */
export function currentWinner(trick: PlayedCard[], trump: Suit | null): PlayedCard | null {
  if (trick.length === 0) return null;
  const lead = trick[0].card.suit;
  let best = trick[0];
  for (const pc of trick.slice(1)) {
    if (beats(pc.card, best.card, lead, trump)) best = pc;
  }
  return best;
}

/** Does `a` beat `b` given the led suit and trump? */
export function beats(a: Card, b: Card, lead: Suit, trump: Suit | null): boolean {
  const aTrump = trump !== null && a.suit === trump;
  const bTrump = trump !== null && b.suit === trump;
  if (aTrump && !bTrump) return true;
  if (!aTrump && bTrump) return false;
  if (a.suit === b.suit) return a.rank > b.rank;
  // different suits, neither trump: only the led suit can win
  return a.suit === lead && b.suit !== lead;
}

/**
 * Batak legal-move rules:
 *  - Lead: any card, but trump may not be led before it is broken
 *    (unless the hand holds nothing but trump).
 *  - Follow suit if possible, and beat the highest card of the led suit
 *    when the trick has not been trumped yet ("yükseltme zorunluluğu").
 *  - Void in the led suit: must play trump if held, over-trumping when possible.
 *  - Void in both: any card.
 */
export function legalMoves(
  hand: Card[],
  trick: PlayedCard[],
  trump: Suit | null,
  trumpBroken: boolean,
): Card[] {
  if (hand.length === 0) return [];

  if (trick.length === 0) {
    if (trump && !trumpBroken) {
      const nonTrump = hand.filter((c) => c.suit !== trump);
      if (nonTrump.length > 0) return nonTrump;
    }
    return hand.slice();
  }

  const lead = trick[0].card.suit;
  const winner = currentWinner(trick, trump)!;
  const sameSuit = hand.filter((c) => c.suit === lead);

  if (sameSuit.length > 0) {
    const trumped = trump !== null && lead !== trump && winner.card.suit === trump;
    if (trumped) return sameSuit;
    const higher = sameSuit.filter((c) => c.rank > winner.card.rank);
    return higher.length > 0 ? higher : sameSuit;
  }

  if (trump) {
    const trumps = hand.filter((c) => c.suit === trump);
    if (trumps.length > 0) {
      if (winner.card.suit === trump) {
        const over = trumps.filter((c) => c.rank > winner.card.rank);
        return over.length > 0 ? over : trumps;
      }
      return trumps;
    }
  }

  return hand.slice();
}

export function isLegal(card: Card, hand: Card[], trick: PlayedCard[], trump: Suit | null, trumpBroken: boolean) {
  return legalMoves(hand, trick, trump, trumpBroken).some((c) => c.suit === card.suit && c.rank === card.rank);
}
