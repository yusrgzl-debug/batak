import { describe, expect, it } from 'vitest';
import { Card } from '../engine/cards';
import { arrangeHand, suitOrder } from './handLayout';

const c = (s: string): Card => ({ suit: s[0] as Card['suit'], rank: Number(s.slice(1)) as Card['rank'] });
const hand = (...ids: string[]) => ids.map(c);
const ids = (cards: Card[]) => cards.map((x) => `${x.suit}${x.rank}`);

describe('hand layout', () => {
  it('alternates red and black suits', () => {
    expect(suitOrder(hand('S2', 'C3', 'H4', 'D5'))).toEqual(['H', 'S', 'D', 'C']);
    expect(suitOrder(hand('S2', 'H4', 'D5'))).toEqual(['H', 'S', 'D']);
    expect(suitOrder(hand('S2', 'C4', 'D5'))).toEqual(['S', 'D', 'C']);
  });

  it('puts high cards on the right', () => {
    expect(ids(arrangeHand(hand('H14', 'H2', 'H10'))[0])).toEqual(['H2', 'H10', 'H14']);
  });

  it('splits a 4-4-4-4 hand into two rows at the suit boundary', () => {
    const h = hand(...['H', 'S', 'D', 'C'].flatMap((s) => [`${s}2`, `${s}9`, `${s}12`, `${s}14`]));
    const [top, bottom] = arrangeHand(h);
    expect(ids(top)).toEqual(['H2', 'H9', 'H12', 'H14', 'S2', 'S9', 'S12', 'S14']);
    expect(ids(bottom)).toEqual(['D2', 'D9', 'D12', 'D14', 'C2', 'C9', 'C12', 'C14']);
  });

  it('keeps small hands in one row', () => {
    expect(arrangeHand(hand('H2', 'S3', 'D4'))).toHaveLength(1);
  });

  it('breaks a suit when keeping it whole would be too lopsided', () => {
    const h = hand('H2', ...['S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12']);
    const rows = arrangeHand(h);
    expect(rows[0].length + rows[1].length).toBe(12);
    expect(Math.abs(rows[0].length - rows[1].length)).toBeLessThanOrEqual(1);
  });
});
