import { Card, Suit, isRed, rankLabel } from '../../engine/cards';

/**
 * Flat, illustrated card faces: serif indices in all four corners, clean pip layouts and
 * double-ended court figures whose heads take the shape of their suit (a heart-headed King of
 * Hearts, a spade-headed Queen of Spades…). Everything is drawn on a 200×280 grid.
 */

export const W = 200;
export const H = 280;

/** Suit silhouettes on a 100×100 box, point-down for hearts like a real pip. */
export const SUIT_PATH: Record<Suit, string> = {
  H: 'M50 90 C22 70 4 52 9 32 C13 15 33 9 44 20 C47 23 49 26 50 30 C51 26 53 23 56 20 C67 9 87 15 91 32 C96 52 78 70 50 90 Z',
  D: 'M50 4 Q64 28 86 50 Q64 72 50 96 Q36 72 14 50 Q36 28 50 4 Z',
  S: 'M50 6 C36 26 8 40 10 61 C11 76 27 84 41 75 C43 74 45 72 46 70 C45 82 40 90 32 95 L68 95 C60 90 55 82 54 70 C55 72 57 74 59 75 C73 84 89 76 90 61 C92 40 64 26 50 6 Z',
  C: 'M50 8 A19 19 0 0 1 64 40 A19 19 0 1 1 57 66 C57 80 61 89 68 95 L32 95 C39 89 43 80 43 66 A19 19 0 1 1 36 40 A19 19 0 0 1 50 8 Z',
};

interface Palette {
  main: string;
  light: string;
  dark: string;
  pip: string;
}

const PALETTE: Record<Suit, Palette> = {
  H: { main: '#e3262f', light: '#f48a98', dark: '#8f1b2a', pip: '#e3262f' },
  D: { main: '#ef4a2c', light: '#f9a27c', dark: '#9a2a15', pip: '#e3262f' },
  S: { main: '#2b3160', light: '#7d8bd0', dark: '#151935', pip: '#1d2034' },
  C: { main: '#24493f', light: '#6fb39c', dark: '#11251f', pip: '#1d2034' },
};

const INK = '#1d2034';
const SKIN = '#f6c4ad';
const TEAL = '#1fa587';
const GOLD = '#f2a93b';
const PAPER = '#f8f5ee';

export function SuitShape({ suit, x, y, size, color, flip }: { suit: Suit; x: number; y: number; size: number; color?: string; flip?: boolean }) {
  const s = size / 100;
  const t = `translate(${x - size / 2} ${y - size / 2}) scale(${s})${flip ? ' rotate(180 50 50)' : ''}`;
  return <path d={SUIT_PATH[suit]} transform={t} fill={color ?? PALETTE[suit].pip} />;
}

/* ---------- pips ---------- */

const C1 = 66;
const C2 = 100;
const C3 = 134;
// [x, y] — pips below the middle are drawn upside down, as on real cards
const LAYOUT: Record<number, [number, number][]> = {
  2: [[C2, 70], [C2, 210]],
  3: [[C2, 70], [C2, 140], [C2, 210]],
  4: [[C1, 70], [C3, 70], [C1, 210], [C3, 210]],
  5: [[C1, 70], [C3, 70], [C2, 140], [C1, 210], [C3, 210]],
  6: [[C1, 70], [C3, 70], [C1, 140], [C3, 140], [C1, 210], [C3, 210]],
  7: [[C1, 70], [C3, 70], [C2, 105], [C1, 140], [C3, 140], [C1, 210], [C3, 210]],
  8: [[C1, 70], [C3, 70], [C2, 105], [C1, 140], [C3, 140], [C2, 175], [C1, 210], [C3, 210]],
  9: [[C1, 66], [C3, 66], [C1, 115], [C3, 115], [C2, 140], [C1, 165], [C3, 165], [C1, 214], [C3, 214]],
  10: [[C1, 66], [C3, 66], [C2, 91], [C1, 115], [C3, 115], [C1, 165], [C3, 165], [C2, 189], [C1, 214], [C3, 214]],
};

function Pips({ card }: { card: Card }) {
  if (card.rank === 14) {
    return (
      <g>
        <SuitShape suit={card.suit} x={100} y={140} size={92} />
        {/* a little sprig, echoing the court cards */}
        <path d="M100 196 C100 214 112 222 124 224" fill="none" stroke={TEAL} strokeWidth="3" strokeLinecap="round" />
        <SuitShape suit="H" x={128} y={222} size={14} color={TEAL} />
      </g>
    );
  }
  return (
    <g>
      {LAYOUT[card.rank].map(([x, y], i) => (
        <SuitShape key={i} suit={card.suit} x={x} y={y} size={card.rank >= 9 ? 30 : 34} flip={y > 140} />
      ))}
    </g>
  );
}

/* ---------- court figures ---------- */

function Face({ smile = true }: { smile?: boolean }) {
  return (
    <g stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="none">
      <circle cx="93" cy="80" r="1.9" fill={INK} stroke="none" />
      <circle cx="107" cy="80" r="1.9" fill={INK} stroke="none" />
      <path d="M100 80 C97 86 98 89 101 89" />
      {smile && <path d="M96 94 Q100 97 104 94" />}
    </g>
  );
}

function Crown({ suit, y, w, tall }: { suit: Suit; y: number; w: number; tall: number }) {
  const l = 100 - w / 2;
  const r = 100 + w / 2;
  const d = `M${l} ${y} L${l - 2} ${y - tall} L${l + w * 0.25} ${y - tall * 0.55} L100 ${y - tall - 4} L${r - w * 0.25} ${y - tall * 0.55} L${r + 2} ${y - tall} L${r} ${y} Z`;
  return (
    <g>
      <path d={d} fill="#fff" stroke={GOLD} strokeWidth="2.4" strokeLinejoin="round" />
      <SuitShape suit={suit} x={100} y={y - tall - 8} size={11} color={GOLD} />
      {[-1, 0, 1].map((k) => (
        <SuitShape key={k} suit={suit} x={100 + k * w * 0.26} y={y - tall * 0.3} size={7} color={GOLD} />
      ))}
    </g>
  );
}

/** One half of a court card (top half); drawn twice, the second rotated 180° about the centre. */
function CourtHalf({ suit, rank }: { suit: Suit; rank: number }) {
  const p = PALETTE[suit];
  const king = rank === 13;
  const queen = rank === 12;
  return (
    <g>
      {/* shoulders / robe with stripes */}
      <path d="M44 140 C44 112 66 104 100 104 C134 104 156 112 156 140 Z" fill={p.main} />
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M${54 + i * 6} 140 C${56 + i * 6} ${122 - i * 3} ${74} ${112 + i} 100 ${112 + i}`}
          fill="none"
          stroke={p.light}
          strokeWidth="2.2"
          opacity="0.75"
        />
      ))}
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          d={`M${146 - i * 6} 140 C${144 - i * 6} ${122 - i * 3} ${126} ${112 + i} 100 ${112 + i}`}
          fill="none"
          stroke={p.light}
          strokeWidth="2.2"
          opacity="0.75"
        />
      ))}
      {/* dotted sash */}
      <path d="M50 128 C70 120 130 120 150 128 L150 136 C130 128 70 128 50 136 Z" fill="#fff" />
      {[62, 76, 90, 104, 118, 132].map((x) => (
        <circle key={x} cx={x + 3} cy={128.5} r="1.6" fill={p.light} />
      ))}
      {/* collar */}
      <path d="M74 110 C80 102 120 102 126 110 C122 116 78 116 74 110 Z" fill={p.dark} />

      {/* head: suit-shaped hair/beard behind the face */}
      {king && <SuitShape suit={suit} x={100} y={82} size={66} color={p.main} />}
      {queen && (
        <g>
          <path d="M70 70 C68 96 72 110 80 114 L120 114 C128 110 132 96 130 70 C128 52 72 52 70 70 Z" fill={p.dark} />
          <SuitShape suit={suit} x={100} y={70} size={46} color={p.main} />
        </g>
      )}
      {rank === 11 && <path d="M78 66 C78 52 122 52 122 66 L120 76 L80 76 Z" fill={p.dark} />}

      <ellipse cx="100" cy={king ? 82 : 84} rx="16" ry={king ? 14 : 17} fill={SKIN} />
      <Face />
      {king && (
        <path d="M86 92 C90 104 110 104 114 92 C108 98 92 98 86 92 Z" fill={p.main} />
      )}

      {/* headwear */}
      {king && <Crown suit={suit} y={58} w={40} tall={16} />}
      {queen && <Crown suit={suit} y={62} w={30} tall={10} />}
      {rank === 11 && (
        <g>
          <path d="M72 66 C74 50 126 50 128 66 C118 62 82 62 72 66 Z" fill={p.main} />
          <path d="M118 58 C126 46 134 44 140 38 C136 50 128 56 120 61 Z" fill={TEAL} />
          <circle cx="100" cy="56" r="3" fill={GOLD} />
        </g>
      )}

      {/* arm + hand holding a sprig (King), a flower (Queen) or a staff (Jack) */}
      <path d="M150 136 C142 128 132 124 122 124" fill="none" stroke={p.dark} strokeWidth="9" strokeLinecap="round" />
      {king && (
        <g>
          <path d="M122 124 C128 108 134 96 138 82" fill="none" stroke={TEAL} strokeWidth="3" strokeLinecap="round" />
          <SuitShape suit="H" x={140} y={74} size={20} color={TEAL} flip />
          <SuitShape suit="H" x={131} y={100} size={9} color={TEAL} flip />
        </g>
      )}
      {queen && (
        <g>
          <path d="M122 124 C128 110 134 100 138 88" fill="none" stroke={TEAL} strokeWidth="3" strokeLinecap="round" />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={138 + 7 * Math.cos((a * Math.PI) / 180)} cy={82 + 7 * Math.sin((a * Math.PI) / 180)} r="5" fill={p.light} />
          ))}
          <circle cx="138" cy="82" r="4" fill={GOLD} />
        </g>
      )}
      {rank === 11 && (
        <g>
          <path d="M122 126 L140 80" stroke={GOLD} strokeWidth="3.5" strokeLinecap="round" />
          <SuitShape suit={suit} x={142} y={74} size={15} color={GOLD} />
        </g>
      )}
      <ellipse cx="121" cy="124" rx="7" ry="6" fill={SKIN} />
    </g>
  );
}

function Court({ card }: { card: Card }) {
  const p = PALETTE[card.suit];
  return (
    // scaled up so the figure fills the card between the corner indices
    <g transform="translate(100 140) scale(1.22) translate(-100 -140)">
      <CourtHalf suit={card.suit} rank={card.rank} />
      <g transform="rotate(180 100 140)">
        <CourtHalf suit={card.suit} rank={card.rank} />
      </g>
      {/* belt where both halves meet */}
      <rect x="44" y="134" width="112" height="12" fill={p.dark} />
    </g>
  );
}

/* ---------- full card ---------- */

function Index({ card }: { card: Card }) {
  const color = PALETTE[card.suit].pip;
  const label = rankLabel(card.rank);
  const narrow = label === '10';
  const one = (
    <g>
      <text
        x="22"
        y="40"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="900"
        fontSize={narrow ? 30 : 36}
        letterSpacing={narrow ? -2 : 0}
        fill={color}
      >
        {label}
      </text>
      <SuitShape suit={card.suit} x={22} y={58} size={20} />
    </g>
  );
  return (
    <g>
      {one}
      <g transform={`translate(${W - 44} 0)`}>{one}</g>
      <g transform={`rotate(180 ${W / 2} ${H / 2})`}>
        {one}
        <g transform={`translate(${W - 44} 0)`}>{one}</g>
      </g>
    </g>
  );
}

export function CardFace({ card }: { card: Card }) {
  const court = card.rank >= 11 && card.rank <= 13;
  return (
    <svg className="card-face-svg" viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" aria-hidden>
      <rect x="0" y="0" width={W} height={H} rx="14" fill={PAPER} />
      {court ? <Court card={card} /> : <Pips card={card} />}
      <Index card={card} />
    </svg>
  );
}

export function CardBack() {
  const marks: [number, number, Suit][] = [];
  const order: Suit[] = ['H', 'S', 'D', 'C'];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 6; c++) marks.push([34 + c * 26.4, 36 + r * 26, order[(r + c) % 4]]);
  return (
    <svg className="card-back-svg" viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" aria-hidden>
      <rect x="0" y="0" width={W} height={H} rx="14" fill={PAPER} />
      <rect x="12" y="12" width={W - 24} height={H - 24} rx="8" fill="#e3262f" />
      {marks.map(([x, y, s], i) => (
        <SuitShape key={i} suit={s} x={x} y={y} size={12} color={isRed(s) ? '#f48a98' : '#b81c26'} />
      ))}
      <circle cx="100" cy="140" r="34" fill={PAPER} />
      <circle cx="100" cy="140" r="28" fill="none" stroke={GOLD} strokeWidth="3" />
      <text x="100" y="153" textAnchor="middle" fontFamily="'Playfair Display', Georgia, serif" fontWeight="900" fontSize="38" fill="#e3262f">
        B
      </text>
    </svg>
  );
}
