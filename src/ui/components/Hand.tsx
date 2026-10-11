import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Card, cardId } from '../../engine/cards';
import { arrangeHand } from '../handLayout';
import { PlayingCard } from './PlayingCard';

interface Props {
  cards: Card[];
  /** cards the player may tap right now */
  isActive: (c: Card) => boolean;
  /** grey out cards that are not active (Kart Gösterici) */
  dimInactive: boolean;
  /** ids of selected cards (bury mode) */
  selected?: Set<string>;
  /** ids to mark as freshly received (the Gömmeli kitty) */
  fresh?: Set<string>;
  onTap: (c: Card) => void;
}

function useWidth() {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return w;
}

/**
 * The player's hand. Big hands are shown as two staggered rows (altlı üstlü) so every card is
 * large enough to tap; the bottom row overlaps the lower half of the top row.
 */
export function Hand({ cards, isActive, dimInactive, selected, fresh, onTap }: Props) {
  const width = Math.min(useWidth(), 760);
  const rows = arrangeHand(cards);
  const twoRows = rows.length === 2;
  const cardW = width < 420 ? (twoRows ? 70 : 64) : 88;
  const cardH = cardW * 1.44;
  const rowGap = cardH * 0.5;
  const longest = Math.max(1, ...rows.map((r) => r.length));
  const step = longest > 1 ? Math.min(cardW * 0.72, (width - cardW - 28) / (longest - 1)) : 0;
  const height = cardH + (twoRows ? rowGap : 0) + 26;

  return (
    <div className="hand" style={{ height }}>
      <AnimatePresence>
        {rows.flatMap((row, r) => {
          const total = cardW + step * (row.length - 1);
          return row.map((c, i) => {
            const id = cardId(c);
            const active = isActive(c);
            const sel = selected?.has(id) ?? false;
            const isFresh = fresh?.has(id) ?? false;
            return (
              <motion.div
                key={id}
                className="hand-slot"
                initial={{ y: 160, opacity: 0 }}
                animate={{
                  x: -total / 2 + i * step,
                  y: r * rowGap + (sel || isFresh ? -22 : active && dimInactive ? -8 : 0),
                  scale: isFresh ? 1.06 : 1,
                  opacity: 1,
                }}
                exit={{ y: -160, opacity: 0, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                style={{ width: cardW, zIndex: r * 100 + i + (isFresh ? 50 : 0) }}
              >
                <PlayingCard
                  card={c}
                  playable={active}
                  glow={dimInactive && active}
                  selected={sel}
                  fresh={isFresh}
                  hiddenRight={i < row.length - 1 && !isFresh ? Math.max(0, cardW - step) : 0}
                  dimmed={dimInactive && !active}
                  onClick={() => onTap(c)}
                />
              </motion.div>
            );
          });
        })}
      </AnimatePresence>
    </div>
  );
}
