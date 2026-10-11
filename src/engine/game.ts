import { Card, Suit, newDeck, shuffle, sortHand, sameCard } from './cards';
import { PlayedCard, currentWinner, isLegal } from './rules';

export type Mode = 'ihaleli' | 'esli' | 'kozMaca';

export const MODE_INFO: Record<Mode, { title: string; desc: string }> = {
  ihaleli: { title: 'İhaleli Batak', desc: 'İhaleyi kazanan kozu seçer. Herkes kendi için oynar.' },
  esli: { title: 'Eşli Batak', desc: 'Karşılıklı oturanlar takım. İhaleyi takım tutturur.' },
  kozMaca: { title: 'Koz Maça', desc: 'Koz her zaman maça. Herkes kaç el alacağını söyler.' },
};

export interface Settings {
  mode: Mode;
  rounds: number;
  minBid: number;
}

export const DEFAULT_SETTINGS: Settings = { mode: 'ihaleli', rounds: 11, minBid: 5 };

export type Phase = 'bidding' | 'trump' | 'playing' | 'trickEnd' | 'roundEnd' | 'gameEnd';
export type Bid = number | 'pass' | null;

export interface RoundResult {
  round: number;
  bidder: number;
  bid: number;
  trump: Suit;
  bids: Bid[];
  tricks: number[];
  delta: number[];
}

export interface GameState {
  settings: Settings;
  phase: Phase;
  round: number;
  dealer: number;
  hands: Card[][];
  bids: Bid[];
  highBid: { player: number; amount: number } | null;
  turn: number;
  trump: Suit | null;
  trumpBroken: boolean;
  trick: PlayedCard[];
  trickLeader: number;
  lastTrick: { cards: PlayedCard[]; winner: number } | null;
  tricks: number[];
  played: Card[];
  scores: number[];
  history: RoundResult[];
}

export const PLAYERS = 4;
export const next = (p: number) => (p + 1) % PLAYERS;
export const teamOf = (p: number) => p % 2;
export const partnerOf = (p: number) => (p + 2) % PLAYERS;

export function newGame(settings: Settings, rand: () => number = Math.random): GameState {
  const base: GameState = {
    settings,
    phase: 'bidding',
    round: 0,
    dealer: Math.floor(rand() * PLAYERS),
    hands: [],
    bids: [],
    highBid: null,
    turn: 0,
    trump: null,
    trumpBroken: false,
    trick: [],
    trickLeader: 0,
    lastTrick: null,
    tricks: [0, 0, 0, 0],
    played: [],
    scores: [0, 0, 0, 0],
    history: [],
  };
  return deal(base, rand);
}

export function deal(s: GameState, rand: () => number = Math.random): GameState {
  const deck = shuffle(newDeck(), rand);
  const hands = [0, 1, 2, 3].map((i) => sortHand(deck.slice(i * 13, i * 13 + 13)));
  const dealer = s.round === 0 ? s.dealer : next(s.dealer);
  const kozMaca = s.settings.mode === 'kozMaca';
  return {
    ...s,
    phase: 'bidding',
    round: s.round + 1,
    dealer,
    hands,
    bids: [null, null, null, null],
    highBid: null,
    turn: next(dealer),
    trump: kozMaca ? 'S' : null,
    trumpBroken: false,
    trick: [],
    trickLeader: next(dealer),
    lastTrick: null,
    tricks: [0, 0, 0, 0],
    played: [],
  };
}

/** Bids the current player may make. In İhale a pass is allowed unless the player is forced. */
export function bidOptions(s: GameState): { min: number; max: number; canPass: boolean } {
  if (s.settings.mode === 'kozMaca') return { min: 1, max: 13, canPass: false };
  const min = s.highBid ? s.highBid.amount + 1 : s.settings.minBid;
  const others = s.bids.filter((b, i) => i !== s.turn && b === 'pass').length;
  const forced = !s.highBid && others === PLAYERS - 1;
  return { min, max: 13, canPass: !forced };
}

export function placeBid(s: GameState, player: number, bid: number | 'pass'): GameState {
  if (s.phase !== 'bidding' || player !== s.turn) return s;
  const opts = bidOptions(s);
  if (bid === 'pass' ? !opts.canPass : bid < opts.min || bid > opts.max) return s;

  const bids = s.bids.slice();
  bids[player] = bid;

  if (s.settings.mode === 'kozMaca') {
    if (bids.every((b) => b !== null)) {
      return { ...s, bids, phase: 'playing', turn: next(s.dealer), trickLeader: next(s.dealer) };
    }
    return { ...s, bids, turn: next(player) };
  }

  const highBid = bid === 'pass' ? s.highBid : { player, amount: bid };
  const active = [0, 1, 2, 3].filter((p) => bids[p] !== 'pass');

  if (highBid && (active.length === 1 || highBid.amount === 13)) {
    return { ...s, bids, highBid, phase: 'trump', turn: highBid.player };
  }

  let t = next(player);
  while (bids[t] === 'pass') t = next(t);
  return { ...s, bids, highBid, turn: t };
}

export function chooseTrump(s: GameState, suit: Suit): GameState {
  if (s.phase !== 'trump' || !s.highBid) return s;
  return { ...s, trump: suit, phase: 'playing', turn: s.highBid.player, trickLeader: s.highBid.player };
}

export function playCard(s: GameState, player: number, card: Card): GameState {
  if (s.phase !== 'playing' || player !== s.turn) return s;
  const hand = s.hands[player];
  if (!isLegal(card, hand, s.trick, s.trump, s.trumpBroken)) return s;

  const hands = s.hands.slice();
  hands[player] = hand.filter((c) => !sameCard(c, card));
  const trick = [...s.trick, { player, card }];
  const trumpBroken = s.trumpBroken || card.suit === s.trump;

  if (trick.length < PLAYERS) {
    return { ...s, hands, trick, trumpBroken, turn: next(player) };
  }
  const winner = currentWinner(trick, s.trump)!.player;
  return { ...s, hands, trick, trumpBroken, phase: 'trickEnd', turn: winner };
}

/** Called after the UI shows the completed trick. */
export function collectTrick(s: GameState): GameState {
  if (s.phase !== 'trickEnd') return s;
  const winner = s.turn;
  const tricks = s.tricks.slice();
  tricks[winner]++;
  const played = [...s.played, ...s.trick.map((t) => t.card)];
  const st: GameState = {
    ...s,
    tricks,
    played,
    lastTrick: { cards: s.trick, winner },
    trick: [],
    trickLeader: winner,
    turn: winner,
    phase: 'playing',
  };
  return st.hands.every((h) => h.length === 0) ? finishRound(st) : st;
}

/** Score deltas for a finished round (pure; exported for tests). */
export function scoreRound(s: Pick<GameState, 'settings' | 'bids' | 'highBid' | 'tricks'>): number[] {
  const { mode } = s.settings;
  const t = s.tricks;

  if (mode === 'kozMaca') {
    return t.map((won, p) => {
      const bid = s.bids[p] as number;
      return won >= bid ? won : -bid;
    });
  }

  const { player: bidder, amount: bid } = s.highBid!;

  if (mode === 'esli') {
    const team = teamOf(bidder);
    const teamTricks = [t[0] + t[2], t[1] + t[3]];
    const made = teamTricks[team] >= bid;
    return t.map((_, p) => {
      if (teamOf(p) === team) return made ? teamTricks[team] : -bid;
      return teamTricks[teamOf(p)];
    });
  }

  return t.map((won, p) => {
    if (p === bidder) return won >= bid ? won : -bid;
    return won === 0 ? -bid : won; // el alamayan da batar
  });
}

function finishRound(s: GameState): GameState {
  const delta = scoreRound(s);
  const scores = s.scores.map((v, i) => v + delta[i]);
  const bidder = s.highBid?.player ?? next(s.dealer);
  const result: RoundResult = {
    round: s.round,
    bidder,
    bid: s.highBid?.amount ?? (s.bids[bidder] as number),
    trump: s.trump!,
    bids: s.bids,
    tricks: s.tricks,
    delta,
  };
  const over = s.round >= s.settings.rounds;
  return { ...s, scores, history: [...s.history, result], phase: over ? 'gameEnd' : 'roundEnd' };
}

export function nextRound(s: GameState, rand?: () => number): GameState {
  if (s.phase !== 'roundEnd') return s;
  return deal(s, rand);
}

/** Final ranking: player indices ordered by score (team score in Eşli). */
export function ranking(s: GameState): number[] {
  return [0, 1, 2, 3].sort((a, b) => s.scores[b] - s.scores[a]);
}
