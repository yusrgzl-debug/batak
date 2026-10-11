import { RANKS, SUITS } from '../engine/cards';
import { PlayingCard } from './components/PlayingCard';

/** Dev-only overview of every card face (open the app with #kartlar). */
export function CardSheet() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 6, padding: 12, background: '#0b3d2e', minHeight: '100%' }}>
      {SUITS.flatMap((suit) => [14, ...RANKS.filter((r) => r !== 14)].map((rank) => <PlayingCard key={suit + rank} card={{ suit, rank: rank as 14 }} />))}
      {SUITS.map((s) => (
        <PlayingCard key={s} faceDown />
      ))}
    </div>
  );
}
