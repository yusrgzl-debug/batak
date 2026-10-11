import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
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

/** Width of the element (not the window), so the hand also fits inside the desktop phone frame. */
function useWidth(ref: React.RefObject<HTMLElement>) {
  const [w, setW] = useState(() => window.innerWidth);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

/**
 * The player's hand. Big hands are shown as two staggered rows (altlı üstlü) so every card is
 * large enough to tap; the bottom row overlaps the lower half of the top row.
 */
export function Hand({ cards, isActive, dimInactive, selected, fresh, onTap }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const width = Math.min(useWidth(ref), 760);
  const rows = arrangeHand(cards);
  const twoRows = rows.length === 2;
  const cardW = width < 420 ? (twoRows ? 70 : 64) : 88;
  const cardH = cardW * 1.44;
  const rowGap = cardH * 0.5;
  const longest = Math.max(1, ...rows.map((r) => r.length));
  const step = longest > 1 ? Math.min(cardW * 0.72, (width - cardW - 28) / (longest - 1)) : 0;
  const height = cardH + (twoRows ? rowGap : 0) + 26;

  return (
    <div className="hand" ref={ref} style={{ height }}>
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
                // kitty cards fly in from the middle of the table, the rest are dealt from below
                initial={isFresh ? { x: -cardW / 2, y: -260, opacity: 0, scale: 0.7 } : { y: 160, opacity: 0 }}
                animate={{
                  x: -total / 2 + i * step,
                  y: r * rowGap + (sel || isFresh ? -16 : active && dimInactive ? -8 : 0),
                  opacity: 1,
                  scale: 1,
                }}
                exit={{ y: -160, opacity: 0, transition: { duration: 0.2 } }}
                // re-sorting slides cards into place without bouncing across rows
                transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: isFresh ? 0.55 : 0.35 }}
                style={{ width: cardW, zIndex: r * 100 + i }}
              >
                <PlayingCard
                  card={c}
                  playable={active}
                  glow={dimInactive && active}
                  selected={sel}
                  fresh={isFresh}
                  hiddenRight={i < row.length - 1 ? Math.max(0, cardW - step) : 0}
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
