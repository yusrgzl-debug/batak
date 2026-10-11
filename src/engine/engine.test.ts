import { describe, expect, it } from 'vitest';
import { Card, seeded } from './cards';
import { legalMoves, currentWinner } from './rules';
import {
  DEFAULT_SETTINGS,
  GameState,
  Mode,
  bidOptions,
  buryCards,
  chooseTrump,
  collectTrick,
  newGame,
  nextRound,
  placeBid,
  playCard,
  scoreRound,
} from './game';
import { botBid, botBury, botPlay, bestTrump } from './ai';

const c = (s: string): Card => ({ suit: s[0] as Card['suit'], rank: Number(s.slice(1)) as Card['rank'] });
const pc = (player: number, s: string) => ({ player, card: c(s) });

describe('legalMoves', () => {
  it('cannot lead trump before it is broken', () => {
    const hand = [c('S14'), c('H5')];
    expect(legalMoves(hand, [], 'S', false)).toEqual([c('H5')]);
    expect(legalMoves(hand, [], 'S', true)).toHaveLength(2);
  });

  it('may lead trump when holding only trump', () => {
    expect(legalMoves([c('S2'), c('S3')], [], 'S', false)).toHaveLength(2);
  });

  it('must follow suit and beat the highest card', () => {
    const hand = [c('H3'), c('H12'), c('H14'), c('S2')];
    expect(legalMoves(hand, [pc(0, 'H10')], 'S', false)).toEqual([c('H12'), c('H14')]);
  });

  it('follows with any card of the suit when it cannot beat', () => {
    const hand = [c('H3'), c('H4'), c('S2')];
    expect(legalMoves(hand, [pc(0, 'H10')], 'S', false)).toEqual([c('H3'), c('H4')]);
  });

  it('need not beat when the trick has been trumped', () => {
    const hand = [c('H3'), c('H14')];
    expect(legalMoves(hand, [pc(0, 'H10'), pc(1, 'S2')], 'S', true)).toEqual(hand);
  });

  it('must trump when void, and over-trump when possible', () => {
    const hand = [c('S3'), c('S9'), c('D4')];
    expect(legalMoves(hand, [pc(0, 'H10')], 'S', false)).toEqual([c('S3'), c('S9')]);
    expect(legalMoves(hand, [pc(0, 'H10'), pc(1, 'S5')], 'S', true)).toEqual([c('S9')]);
  });

  it('serbest rule: no obligation to trump when void', () => {
    const hand = [c('S3'), c('D4')];
    expect(legalMoves(hand, [pc(0, 'H10')], 'S', false, 'serbest')).toEqual(hand);
  });

  it('any card when void in led suit and trump', () => {
    const hand = [c('D3'), c('C9')];
    expect(legalMoves(hand, [pc(0, 'H10')], 'S', false)).toEqual(hand);
  });
});

describe('currentWinner', () => {
  it('trump beats led suit; off-suit never wins', () => {
    expect(currentWinner([pc(0, 'H10'), pc(1, 'S2'), pc(2, 'H14')], 'S')!.player).toBe(1);
    expect(currentWinner([pc(0, 'H10'), pc(1, 'D14'), pc(2, 'H11')], 'S')!.player).toBe(2);
  });
});

describe('scoring', () => {
  const base = { bids: [null, null, null, null] as GameState['bids'] };
  it('ihaleli: bidder makes or fails, zero-trick players batar', () => {
    const settings = { ...DEFAULT_SETTINGS, mode: 'ihaleli' as Mode };
    expect(scoreRound({ ...base, settings, highBid: { player: 0, amount: 6 }, tricks: [7, 3, 3, 0] })).toEqual([7, 3, 3, -6]);
    expect(scoreRound({ ...base, settings, highBid: { player: 0, amount: 8 }, tricks: [7, 3, 2, 1] })).toEqual([-8, 3, 2, 1]);
  });
  it('esli: team tricks count together', () => {
    const settings = { ...DEFAULT_SETTINGS, mode: 'esli' as Mode };
    expect(scoreRound({ ...base, settings, highBid: { player: 1, amount: 7 }, tricks: [2, 5, 3, 3] })).toEqual([5, 8, 5, 8]);
    expect(scoreRound({ ...base, settings, highBid: { player: 1, amount: 9 }, tricks: [2, 5, 3, 3] })).toEqual([5, -9, 5, -9]);
  });
  it('kozMaca: each player scores against their own bid', () => {
    const settings = { ...DEFAULT_SETTINGS, mode: 'kozMaca' as Mode };
    expect(scoreRound({ settings, bids: [3, 4, 2, 4], highBid: null, tricks: [3, 2, 4, 4] })).toEqual([3, -4, 4, 4]);
  });
});

describe('bidding', () => {
  it('ends when three players pass', () => {
    let s = newGame(DEFAULT_SETTINGS, seeded(1));
    const first = s.turn;
    s = placeBid(s, first, 5);
    for (let i = 0; i < 3; i++) s = placeBid(s, s.turn, 'pass');
    expect(s.phase).toBe('trump');
    expect(s.highBid).toEqual({ player: first, amount: 5 });
    s = chooseTrump(s, 'H');
    expect(s.phase).toBe('playing');
    expect(s.turn).toBe(first);
  });

  it('forces the last player to bid when everyone passes', () => {
    let s = newGame(DEFAULT_SETTINGS, seeded(2));
    for (let i = 0; i < 3; i++) s = placeBid(s, s.turn, 'pass');
    const last = s.turn;
    expect(placeBid(s, last, 'pass')).toBe(s); // rejected
    s = placeBid(s, last, 5);
    expect(s.phase).toBe('trump');
  });

  it('rejects bids not higher than the current one', () => {
    let s = newGame(DEFAULT_SETTINGS, seeded(3));
    s = placeBid(s, s.turn, 7);
    expect(placeBid(s, s.turn, 7)).toBe(s);
  });
});

describe('gömmeli', () => {
  const settings = { ...DEFAULT_SETTINGS, mode: 'gommeli' as Mode };

  it('deals 16 cards to 3 players and leaves 4 in the kitty', () => {
    const s = newGame(settings, seeded(4));
    expect(s.n).toBe(3);
    expect(s.hands.map((h) => h.length)).toEqual([16, 16, 16]);
    expect(s.kitty).toHaveLength(4);
    expect(bidOptions(s).min).toBe(7);
  });

  it('bidder picks up the kitty, buries 4, then chooses trump', () => {
    let s = newGame(settings, seeded(5));
    const bidder = s.turn;
    s = placeBid(s, bidder, 8);
    s = placeBid(s, s.turn, 'pass');
    s = placeBid(s, s.turn, 'pass');
    expect(s.phase).toBe('bury');
    expect(s.hands[bidder]).toHaveLength(20);
    expect(buryCards(s, bidder, s.hands[bidder].slice(0, 3))).toBe(s); // must be exactly 4
    const toBury = s.hands[bidder].slice(0, 4);
    s = buryCards(s, bidder, toBury);
    expect(s.phase).toBe('trump');
    expect(s.hands[bidder]).toHaveLength(16);
    expect(s.buried).toEqual(toBury);
  });
});

function simulate(mode: Mode, seed: number, trumpRule: 'zorunlu' | 'serbest' = 'zorunlu'): GameState {
  const rand = seeded(seed);
  let s = newGame({ mode, rounds: 3, minBid: 5, trumpRule }, rand);
  let guard = 0;
  while (s.phase !== 'gameEnd' && guard++ < 10000) {
    if (s.phase === 'bidding') s = placeBid(s, s.turn, botBid(s, s.turn));
    else if (s.phase === 'bury') s = buryCards(s, s.turn, botBury(s, s.turn));
    else if (s.phase === 'trump') s = chooseTrump(s, bestTrump(s.hands[s.turn]));
    else if (s.phase === 'playing') {
      const before = s;
      s = playCard(s, s.turn, botPlay(s, s.turn));
      expect(s).not.toBe(before); // bot must always choose a legal card
    } else if (s.phase === 'trickEnd') s = collectTrick(s);
    else if (s.phase === 'roundEnd') s = nextRound(s, rand);
  }
  return s;
}

describe('full games with bots', () => {
  for (const mode of ['ihaleli', 'esli', 'gommeli', 'kozMaca'] as Mode[]) {
    for (const rule of ['zorunlu', 'serbest'] as const) {
      it(`${mode} (${rule}): completes 3 rounds, every card played`, () => {
        const tricks = mode === 'gommeli' ? 16 : 13;
        for (let seed = 1; seed <= 20; seed++) {
          const s = simulate(mode, seed, rule);
          expect(s.phase).toBe('gameEnd');
          expect(s.history).toHaveLength(3);
          for (const r of s.history) expect(r.tricks.reduce((a, b) => a + b, 0)).toBe(tricks);
        }
      });
    }
  }
});
