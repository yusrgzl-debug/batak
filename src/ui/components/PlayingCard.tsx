import { Card, rankLabel } from '../../engine/cards';
import { CardBack, CardFace } from './cardArt';

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
  /** px of the card's right side hidden under the next card; keeps the YENİ tag visible */
  hiddenRight?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/** A playing card: flat illustrated faces (see cardArt.tsx) on an off-white stock. */
export function PlayingCard({ card, faceDown, playable, glow, selected, fresh, dimmed, small, hiddenRight = 0, onClick, style }: Props) {
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
  return (
    <div
      className={cls.filter(Boolean).join(' ')}
      style={style}
      onClick={playable ? onClick : undefined}
      role={playable ? 'button' : undefined}
      aria-label={`${rankLabel(card.rank)}${card.suit}`}
    >
      <CardFace card={card} />
      {fresh && (
        <span className="card-fresh" style={{ right: hiddenRight + 3 }}>
          YENİ
        </span>
      )}
    </div>
  );
}
