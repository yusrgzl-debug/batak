import { Card, rankLabel } from '../../engine/cards';
import { backImage, cardImage } from './deck';

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

/** A playing card drawn from the classic deck artwork (see deck.ts). */
export function PlayingCard({ card, faceDown, playable, glow, selected, fresh, dimmed, small, hiddenRight = 0, onClick, style }: Props) {
  const cls = [
    'card',
    small && 'card--small',
    playable && 'card--tappable',
    glow && 'card--playable',
    selected && 'card--selected',
    fresh && 'card--fresh',
    dimmed && 'card--dimmed',
    (faceDown || !card) && 'card--back',
  ]
    .filter(Boolean)
    .join(' ');
  if (faceDown || !card) {
    return (
      <div className={cls} style={style}>
        <img className="card-img" src={backImage} alt="" draggable={false} />
      </div>
    );
  }
  return (
    <div
      className={cls}
      style={style}
      onClick={playable ? onClick : undefined}
      role={playable ? 'button' : undefined}
      aria-label={`${rankLabel(card.rank)}${card.suit}`}
    >
      <img className="card-img" src={cardImage(card)} alt="" draggable={false} />
      {fresh && (
        <span className="card-fresh" style={{ right: hiddenRight + 3 }}>
          YENİ
        </span>
      )}
    </div>
  );
}
