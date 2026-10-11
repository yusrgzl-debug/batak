import * as deck from '@letele/playing-cards';
import { Card, rankLabel } from '../../engine/cards';

interface Props {
  card?: Card;
  faceDown?: boolean;
  playable?: boolean;
  /** highlight as a legal move */
  glow?: boolean;
  selected?: boolean;
  fresh?: boolean;
  dimmed?: boolean;
  small?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/** Component name in @letele/playing-cards: suit letter + rank, e.g. "Hk", "S10", "Da". */
const faceKey = (c: Card) => c.suit + (c.rank <= 10 ? String(c.rank) : rankLabel(c.rank).toLowerCase());

/**
 * Classic (English pattern) card faces from Adrian Kennard's public-domain designs, set on
 * an ivory card stock with a fine gold edge for the premium look.
 */
export function PlayingCard({ card, faceDown, playable, glow, selected, fresh, dimmed, small, onClick, style }: Props) {
  const cls = [
    'card',
    small && 'card--small',
    playable && 'card--tappable',
    glow && 'card--playable',
    selected && 'card--selected',
    dimmed && 'card--dimmed',
  ];
  if (faceDown || !card) {
    return (
      <div className={[...cls, 'card--back'].filter(Boolean).join(' ')} style={style}>
        <CardBack />
      </div>
    );
  }
  const Face = deck[faceKey(card)];
  return (
    <div
      className={cls.filter(Boolean).join(' ')}
      style={style}
      onClick={playable ? onClick : undefined}
      role={playable ? 'button' : undefined}
      aria-label={`${rankLabel(card.rank)}${card.suit}`}
    >
      <Face className="card-face-svg" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
      {fresh && <span className="card-fresh">YENİ</span>}
    </div>
  );
}

/** Red ornamental back with a white margin, in the spirit of classic casino decks. */
function CardBack() {
  return (
    <svg className="card-back-svg" viewBox="0 0 100 140" width="100%" height="100%" aria-hidden>
      <defs>
        <pattern id="cb-lattice" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="#b3122a" />
          <path d="M0 4h8M4 0v8" stroke="#e8606f" strokeWidth="0.9" />
          <circle cx="4" cy="4" r="1.3" fill="#fff3f3" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100" height="140" rx="7" fill="#fffaf2" />
      <rect x="6" y="6" width="88" height="128" rx="4" fill="url(#cb-lattice)" stroke="#8a0d20" strokeWidth="1.2" />
      <rect x="10" y="10" width="80" height="120" rx="3" fill="none" stroke="#fff3f3" strokeWidth="0.8" />
      <g transform="translate(50 70)">
        <ellipse rx="22" ry="28" fill="#b3122a" stroke="#fff3f3" strokeWidth="1.4" />
        <ellipse rx="17" ry="22" fill="none" stroke="#e7c36a" strokeWidth="1" />
        {[0, 45, 90, 135].map((a) => (
          <ellipse key={a} rx="4" ry="13" fill="none" stroke="#fff3f3" strokeWidth="0.9" transform={`rotate(${a})`} />
        ))}
        <circle r="3.2" fill="#e7c36a" />
      </g>
    </svg>
  );
}
