import { Card, SUIT_SYMBOL, isRed, rankLabel } from '../../engine/cards';

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

const FACE_TITLE: Record<number, string> = { 11: 'VALE', 12: 'KIZ', 13: 'PAPAZ' };

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
        <div className="card-back-inner" />
      </div>
    );
  }
  const sym = SUIT_SYMBOL[card.suit];
  const label = rankLabel(card.rank);
  const color = isRed(card.suit) ? 'card--red' : 'card--black';
  const face = card.rank >= 11 && card.rank <= 13;

  return (
    <div
      className={[...cls, color].filter(Boolean).join(' ')}
      style={style}
      onClick={playable ? onClick : undefined}
      role={playable ? 'button' : undefined}
      aria-label={`${label}${sym}`}
    >
      <div className="card-corner card-corner--tl">
        <span className="card-rank">{label}</span>
        <span className="card-suit">{sym}</span>
      </div>
      <div className="card-center">
        {face ? (
          <div className="card-face">
            <svg viewBox="0 0 40 20" className="card-crown" aria-hidden>
              <path d="M2 18 L6 4 L13 12 L20 2 L27 12 L34 4 L38 18 Z" />
            </svg>
            <span className="card-face-letter">{label}</span>
            <span className="card-face-suit">{sym}</span>
            <span className="card-face-title">{FACE_TITLE[card.rank]}</span>
          </div>
        ) : (
          <span className={card.rank === 14 ? 'card-pip card-pip--ace' : 'card-pip'}>{sym}</span>
        )}
      </div>
      {fresh && <span className="card-fresh">YENİ</span>}
      <div className="card-corner card-corner--br">
        <span className="card-rank">{label}</span>
        <span className="card-suit">{sym}</span>
      </div>
    </div>
  );
}
