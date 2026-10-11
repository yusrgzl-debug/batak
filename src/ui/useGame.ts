import { useCallback, useEffect, useState } from 'react';
import { Card, Suit } from '../engine/cards';
import {
  GameState,
  Settings,
  chooseTrump,
  collectTrick,
  newGame,
  nextRound,
  placeBid,
  playCard,
} from '../engine/game';
import { bestTrump, botBid, botPlay } from '../engine/ai';
import { sfx } from './sound';

export const HUMAN = 0;

const SPEED = { slow: 1.6, normal: 1, fast: 0.5 } as const;

export function useGame(settings: Settings, speed: keyof typeof SPEED) {
  const [state, setState] = useState<GameState>(() => newGame(settings));
  const k = SPEED[speed];

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
      if (s.phase === 'bidding') after(700, () => placeBid(s, s.turn, botBid(s, s.turn)));
      else if (s.phase === 'trump') after(800, () => chooseTrump(s, bestTrump(s.hands[s.turn])));
      else if (s.phase === 'playing')
        after(650, () => {
          sfx.card();
          return playCard(s, s.turn, botPlay(s, s.turn));
        });
    }
    return () => window.clearTimeout(timer);
  }, [state, k]);

  const bid = useCallback((b: number | 'pass') => setState((s) => placeBid(s, HUMAN, b)), []);
  const trump = useCallback((suit: Suit) => setState((s) => chooseTrump(s, suit)), []);
  const play = useCallback((c: Card) => {
    sfx.card();
    setState((s) => playCard(s, HUMAN, c));
  }, []);
  const advance = useCallback(() => setState((s) => nextRound(s)), []);
  const restart = useCallback(() => setState(newGame(settings)), [settings]);

  return { state, bid, trump, play, advance, restart };
}
