import { Suit } from '../../engine/cards';

/** Suit silhouettes on a 100×100 box, point-down for hearts like a real pip. */
export const SUIT_PATH: Record<Suit, string> = {
  H: 'M50 90 C22 70 4 52 9 32 C13 15 33 9 44 20 C47 23 49 26 50 30 C51 26 53 23 56 20 C67 9 87 15 91 32 C96 52 78 70 50 90 Z',
  D: 'M50 4 Q64 28 86 50 Q64 72 50 96 Q36 72 14 50 Q36 28 50 4 Z',
  S: 'M50 6 C36 26 8 40 10 61 C11 76 27 84 41 75 C43 74 45 72 46 70 C45 82 40 90 32 95 L68 95 C60 90 55 82 54 70 C55 72 57 74 59 75 C73 84 89 76 90 61 C92 40 64 26 50 6 Z',
  C: 'M50 8 A19 19 0 0 1 64 40 A19 19 0 1 1 57 66 C57 80 61 89 68 95 L32 95 C39 89 43 80 43 66 A19 19 0 1 1 36 40 A19 19 0 0 1 50 8 Z',
};
