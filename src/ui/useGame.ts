import { useCallback, useEffect, useState } from 'react';
import { Card, Suit } from '../engine/cards';
import {
  GameState,
  Settings,
  buryCards,
  chooseTrump,
  collectTrick,
  newGame,
  nextRound,
  placeBid,
  playCard,
} from '../engine/game';
import { bestTrump, botBid, botBury, botPlay } from '../engine/ai';
import { tap } from './haptics';
import { sfx } from './sound';

export const HUMAN = 0;

const SPEED = { slow: 1.6, normal: 1, fast: 0.5 } as const;

/** Time a player has to act before the game plays the best move for them. */
export const TURN_MS = 10_000;

const ACTIVE: GameState['phase'][] = ['bidding', 'trump', 'bury', 'playing'];

/** Changes whenever a new decision is due, so the countdown restarts for every move. */
export const turnKey = (s: GameState) =>
  ACTIVE.includes(s.phase) ? `${s.round}-${s.phase}-${s.turn}-${s.played.length + s.trick.length}` : null;

/** The move the game makes for a player who runs out of time (same logic as the bots). */
export function autoMove(s: GameState, p: number): GameState {
  if (s.phase === 'bidding') return placeBid(s, p, botBid(s, p));
  if (s.phase === 'trump') return chooseTrump(s, bestTrump(s.hands[p]));
  if (s.phase === 'bury') return buryCards(s, p, botBury(s, p));
  if (s.phase === 'playing') return playCard(s, p, botPlay(s, p));
  return s;
}

export function useGame(settings: Settings, speed: keyof typeof SPEED) {
  const [state, setState] = useState<GameState>(() => newGame(settings));
  const k = SPEED[speed];

  const [timedOut, setTimedOut] = useState(0);

  // shuffle + deal sound at the start of every hand
  useEffect(() => {
    sfx.deal();
  }, [state.round]);

  // The human's turn clock: after TURN_MS the best move is played automatically.
  const key = turnKey(state);
  useEffect(() => {
    if (!key || state.turn !== HUMAN) return;
    const t = window.setTimeout(() => {
      setState((s) => {
        if (turnKey(s) !== key) return s;
        if (s.phase === 'playing') sfx.card();
        return autoMove(s, HUMAN);
      });
      setTimedOut((n) => n + 1);
    }, TURN_MS);
    return () => window.clearTimeout(t);
  }, [key]);

  // Drive bots and trick collection with small delays so play is readable.

  useEffect(() => {
    const s = state;
    let timer: number | undefined;
    const after = (ms: number, fn: () => GameState) => {
      timer = window.setTimeout(() => setState(fn()), ms * k);
    };

    if (s.phase === 'trickEnd') {
      after(1100, () => {
        sfx.trick();
        return collectTrick(s);
      });
    } else if (s.turn !== HUMAN) {
      if (s.phase === 'bidding') after(700, () => autoMove(s, s.turn));
      else if (s.phase === 'bury') after(1200, () => autoMove(s, s.turn));
      else if (s.phase === 'trump') after(800, () => autoMove(s, s.turn));
      else if (s.phase === 'playing')
        after(650, () => {
          sfx.card();
          return autoMove(s, s.turn);
        });
    }
    return () => window.clearTimeout(timer);
  }, [state, k]);

  const bid = useCallback((b: number | 'pass') => setState((s) => placeBid(s, HUMAN, b)), []);
  const bury = useCallback((cards: Card[]) => setState((s) => buryCards(s, HUMAN, cards)), []);
  const trump = useCallback((suit: Suit) => setState((s) => chooseTrump(s, suit)), []);
  const play = useCallback((c: Card) => {
    sfx.card();
    tap();
    setState((s) => playCard(s, HUMAN, c));
  }, []);
  const advance = useCallback(() => setState((s) => nextRound(s)), []);
  const restart = useCallback(() => setState(newGame(settings)), [settings]);

  return { state, bid, bury, trump, play, advance, restart, timedOut, turnKey: key };
}
