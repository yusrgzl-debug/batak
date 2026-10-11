import { Card, Suit, newDeck, shuffle, sortHand, sameCard } from './cards';
import { PlayedCard, currentWinner, isLegal } from './rules';

export type Mode = 'ihaleli' | 'esli' | 'gommeli' | 'kozMaca';

export const MODE_INFO: Record<Mode, { title: string; desc: string }> = {
  ihaleli: { title: 'İhaleli', desc: '4 kişi. İhaleyi kazanan kozu seçer, herkes kendi için oynar.' },
  esli: { title: 'Eşli', desc: '4 kişi. Karşılıklı oturanlar takım, ihaleyi takım tutturur.' },
  gommeli: { title: 'Gömmeli', desc: '3 kişi, 16’şar kart. İhaleyi alan kozu seçer, 4 kart gömer, sonra yerdeki 4 kartı alır.' },
  kozMaca: { title: 'Koz Maça', desc: '4 kişi. Koz her zaman maça, herkes kaç el alacağını söyler.' },
};

/**
 * zorunlu ("Koz Çıkmalı"): elinde yerdeki renk yoksa koz atmak, yerde koz varsa yükseltmek zorunlu.
 * serbest: renk yoksa istenen kart atılabilir.
 */
export type TrumpRule = 'zorunlu' | 'serbest';

export interface Settings {
  mode: Mode;
  rounds: number;
  minBid: number;
  trumpRule: TrumpRule;
  /** Oda içi mesajlaşma açık mı */
  chat: boolean;
}

export const ROUND_OPTIONS = [3, 5, 7, 9, 11, 13];

export const DEFAULT_SETTINGS: Settings = { mode: 'ihaleli', rounds: 7, minBid: 5, trumpRule: 'zorunlu', chat: true };

export const playerCount = (mode: Mode) => (mode === 'gommeli' ? 3 : 4);
export const handSize = (mode: Mode) => (mode === 'gommeli' ? 16 : 13);
export const KITTY = 4;
/** Gömmeli is usually bid from 7 (16 tricks per hand); other modes use the configured minimum. */
export const minBidFor = (s: Settings) => (s.mode === 'gommeli' ? Math.max(s.minBid, 7) : s.minBid);

export type Phase = 'bidding' | 'bury' | 'trump' | 'playing' | 'trickEnd' | 'roundEnd' | 'gameEnd';
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
  /** number of players: 4, or 3 in Gömmeli */
  n: number;
  phase: Phase;
  round: number;
  dealer: number;
  hands: Card[][];
  /** Gömmeli: the 4 face-down cards the winning bidder picks up */
  kitty: Card[];
  /** Gömmeli: the 4 cards the bidder buried (only the bidder knows them) */
  buried: Card[];
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

export const nextPlayer = (p: number, n: number) => (p + 1) % n;
export const teamOf = (p: number) => p % 2;
export const partnerOf = (p: number) => (p + 2) % 4;
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

export function newGame(settings: Settings, rand: () => number = Math.random): GameState {
  const n = playerCount(settings.mode);
  const base: GameState = {
    settings,
    n,
    phase: 'bidding',
    round: 0,
    dealer: Math.floor(rand() * n),
    hands: [],
    kitty: [],
    buried: [],
    bids: [],
    highBid: null,
    turn: 0,
    trump: null,
    trumpBroken: false,
    trick: [],
    trickLeader: 0,
    lastTrick: null,
    tricks: range(n).map(() => 0),
    played: [],
    scores: range(n).map(() => 0),
    history: [],
  };
  return deal(base, rand);
}

export function deal(s: GameState, rand: () => number = Math.random): GameState {
  const { n } = s;
  const size = handSize(s.settings.mode);
  const deck = shuffle(newDeck(), rand);
  const hands = range(n).map((i) => sortHand(deck.slice(i * size, (i + 1) * size)));
  const kitty = deck.slice(n * size);
  const dealer = s.round === 0 ? s.dealer : nextPlayer(s.dealer, n);
  const first = nextPlayer(dealer, n);
  return {
    ...s,
    phase: 'bidding',
    round: s.round + 1,
    dealer,
    hands,
    kitty,
    buried: [],
    bids: range(n).map(() => null),
    highBid: null,
    turn: first,
    trump: s.settings.mode === 'kozMaca' ? 'S' : null,
    trumpBroken: false,
    trick: [],
    trickLeader: first,
    lastTrick: null,
    tricks: range(n).map(() => 0),
    played: [],
  };
}

/** Bids the current player may make. A pass is allowed unless everyone else already passed. */
export function bidOptions(s: GameState): { min: number; max: number; canPass: boolean } {
  const max = handSize(s.settings.mode);
  if (s.settings.mode === 'kozMaca') return { min: 1, max, canPass: false };
  const min = s.highBid ? s.highBid.amount + 1 : minBidFor(s.settings);
  const othersPassed = s.bids.filter((b, i) => i !== s.turn && b === 'pass').length;
  const forced = !s.highBid && othersPassed === s.n - 1;
  return { min, max, canPass: !forced };
}

export function placeBid(s: GameState, player: number, bid: number | 'pass'): GameState {
  if (s.phase !== 'bidding' || player !== s.turn) return s;
  const opts = bidOptions(s);
  if (bid === 'pass' ? !opts.canPass : bid < opts.min || bid > opts.max) return s;

  const bids = s.bids.slice();
  bids[player] = bid;

  if (s.settings.mode === 'kozMaca') {
    if (bids.every((b) => b !== null)) {
      const first = nextPlayer(s.dealer, s.n);
      return { ...s, bids, phase: 'playing', turn: first, trickLeader: first };
    }
    return { ...s, bids, turn: nextPlayer(player, s.n) };
  }

  const highBid = bid === 'pass' ? s.highBid : { player, amount: bid };
  const active = range(s.n).filter((p) => bids[p] !== 'pass');

  if (highBid && (active.length === 1 || highBid.amount === opts.max)) {
    // Gömmeli: koz → 4 kart gömme → yerdeki 4 kartı alma (see chooseTrump / buryCards)
    return { ...s, bids, highBid, phase: 'trump', turn: highBid.player };
  }

  let t = nextPlayer(player, s.n);
  while (bids[t] === 'pass') t = nextPlayer(t, s.n);
  return { ...s, bids, highBid, turn: t };
}

/**
 * Gömmeli: after choosing trump the bidder buries exactly 4 cards from their own 16, without
 * having seen the kitty; only then are the 4 kitty cards added to the hand and play starts.
 */
export function buryCards(s: GameState, player: number, cards: Card[]): GameState {
  if (s.phase !== 'bury' || player !== s.turn || cards.length !== KITTY) return s;
  const hand = s.hands[player];
  const unique = cards.filter((c, i) => cards.findIndex((d) => sameCard(c, d)) === i);
  if (unique.length !== KITTY || !unique.every((c) => hand.some((h) => sameCard(h, c)))) return s;
  const hands = s.hands.slice();
  hands[player] = sortHand([...hand.filter((h) => !unique.some((c) => sameCard(c, h))), ...s.kitty]);
  return { ...s, hands, buried: unique, phase: 'playing', trickLeader: player };
}

export function chooseTrump(s: GameState, suit: Suit): GameState {
  if (s.phase !== 'trump' || !s.highBid) return s;
  const bidder = s.highBid.player;
  const phase = s.settings.mode === 'gommeli' ? 'bury' : 'playing';
  return { ...s, trump: suit, phase, turn: bidder, trickLeader: bidder };
}

export function playCard(s: GameState, player: number, card: Card): GameState {
  if (s.phase !== 'playing' || player !== s.turn) return s;
  const hand = s.hands[player];
  if (!isLegal(card, hand, s.trick, s.trump, s.trumpBroken, s.settings.trumpRule)) return s;

  const hands = s.hands.slice();
  hands[player] = hand.filter((c) => !sameCard(c, card));
  const trick = [...s.trick, { player, card }];
  const trumpBroken = s.trumpBroken || card.suit === s.trump;

  if (trick.length < s.n) {
    return { ...s, hands, trick, trumpBroken, turn: nextPlayer(player, s.n) };
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

  // İhaleli and Gömmeli
  return t.map((won, p) => {
    if (p === bidder) return won >= bid ? won : -bid;
    return won === 0 ? -bid : won; // el alamayan da batar
  });
}

function finishRound(s: GameState): GameState {
  const delta = scoreRound(s);
  const scores = s.scores.map((v, i) => v + delta[i]);
  const bidder = s.highBid?.player ?? nextPlayer(s.dealer, s.n);
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

/** Finishing order for prizes: Eşli puts the winning team's two seats first. */
export function finishOrder(s: GameState): number[] {
  if (s.settings.mode !== 'esli') return ranking(s);
  return s.scores[0] >= s.scores[1] ? [0, 2, 1, 3] : [1, 3, 0, 2];
}

/** Final ranking: player indices ordered by score. */
export function ranking(s: GameState): number[] {
  return range(s.n).sort((a, b) => s.scores[b] - s.scores[a]);
}
