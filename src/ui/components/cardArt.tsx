import { Card, Suit, rankLabel } from '../../engine/cards';

/**
 * Card faces after the reference deck the owner picked: cream stock with a soft vignette, a tall
 * condensed rank (slab serif for J/Q/K/A) over its suit in the top-left and, upside down, the
 * bottom-right corner, a thin inner frame that leaves room for both indices, one large centre
 * pip on number cards, and classic double-ended court figures split on a diagonal.
 * Everything is drawn on a 200×280 grid.
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

const RED_INK = '#e01e25';
const BLACK_INK = '#111111';
const ink = (s: Suit) => (s === 'H' || s === 'D' ? RED_INK : BLACK_INK);
const frameInk = (s: Suit) => (s === 'H' || s === 'D' ? '#efa8a8' : '#bdbdb6');

// classic court palette
const Y = '#f5c21b';
const R = '#e2231a';
const B = '#28509f';
const K = '#141414';
const FACE = '#fffaf0';
const PAPER = '#f4f1e8';
const GOLD = '#f0b93a';

export function SuitShape({ suit, x, y, size, color, flip }: { suit: Suit; x: number; y: number; size: number; color?: string; flip?: boolean }) {
  const s = size / 100;
  const t = `translate(${x - size / 2} ${y - size / 2}) scale(${s})${flip ? ' rotate(180 50 50)' : ''}`;
  return <path d={SUIT_PATH[suit]} transform={t} fill={color ?? ink(suit)} />;
}

/* ---------- index & frame ---------- */

const DIGIT_FONT = "'Oswald', 'Arial Narrow', sans-serif";
const LETTER_FONT = "'Roboto Slab', 'Rockwell', Georgia, serif";

function IndexMark({ card }: { card: Card }) {
  const label = rankLabel(card.rank);
  const letter = card.rank > 10;
  return (
    <g>
      <text
        x="24"
        y="55"
        textAnchor="middle"
        fontFamily={letter ? LETTER_FONT : DIGIT_FONT}
        fontWeight={letter ? 700 : 400}
        fontSize={letter ? 48 : 58}
        letterSpacing={label === '10' ? -3 : 0}
        fill={ink(card.suit)}
      >
        {label}
      </text>
      <SuitShape suit={card.suit} x={24} y={77} size={28} />
    </g>
  );
}

/** Thin inner frame with openings for the two corner indices. */
function Frame({ suit }: { suit: Suit }) {
  const d = 'M50 17 H174 Q183 17 183 26 V188 M150 263 H26 Q17 263 17 254 V96';
  return <path d={d} fill="none" stroke={frameInk(suit)} strokeWidth="1.3" strokeLinecap="round" />;
}

/* ---------- number cards and aces: one large centre pip ---------- */

function CentrePip({ card }: { card: Card }) {
  const ace = card.rank === 14;
  return (
    <g>
      {ace && card.suit === 'S' && <circle cx="100" cy="140" r="56" fill="none" stroke={K} strokeWidth="1" opacity="0.25" />}
      <SuitShape suit={card.suit} x={100} y={140} size={ace ? 96 : 74} />
    </g>
  );
}

/* ---------- court cards ---------- */

// panel the double-ended figure is drawn in, and the diagonal that splits the two halves
const PX0 = 48; // symmetric around x = 100 so the rotated half lines up
const PX1 = 152;
const PY0 = 44;
const PY1 = 236;
const TOP_HALF = `${PX0},${PY0} ${PX1},${PY0} ${PX1},120 ${PX0},160`;

/** Greek-key strip (blue with white steps) along the robe edges. */
function KeyBand({ x, y, h }: { x: number; y: number; h: number }) {
  const steps = [];
  for (let yy = y + 3; yy < y + h - 6; yy += 10) steps.push(`M${x + 2} ${yy} h7 v5 h-5 v4`);
  return (
    <g>
      <rect x={x} y={y} width="11" height={h} fill={B} />
      <path d={steps.join(' ')} fill="none" stroke="#fff" strokeWidth="1.3" />
    </g>
  );
}

function Checker({ y }: { y: number }) {
  return (
    <g>
      <path d={`M70 ${y} Q100 ${y + 14} 130 ${y} L130 ${y - 8} Q100 ${y + 6} 70 ${y - 8} Z`} fill={Y} stroke={K} strokeWidth="1" />
      <path d={`M72 ${y - 4} Q100 ${y + 10} 128 ${y - 4}`} fill="none" stroke={K} strokeWidth="3.5" strokeDasharray="3.5 3.5" />
    </g>
  );
}

const HAIR = { fill: 'none', stroke: B, strokeWidth: 1.1, strokeLinecap: 'round' as const };

function CourtHalf({ card }: { card: Card }) {
  const king = card.rank === 13;
  const queen = card.rank === 12;
  const jack = card.rank === 11;
  // vary the robe a little per suit, as printed decks do
  const [main, side] = card.suit === 'H' || card.suit === 'S' ? [R, K] : [K, R];
  return (
    <g>
      {/* item held behind the shoulder */}
      {king && (
        <g>
          <path d="M132 112 L146 50" stroke="#e9edf2" strokeWidth="5" strokeLinecap="round" />
          <path d="M132 112 L146 50" stroke={K} strokeWidth="0.8" />
          <path d="M124 100 L142 106" stroke={Y} strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {queen && (
        <g>
          <path d="M130 108 C134 96 136 86 136 76" fill="none" stroke={K} strokeWidth="1.6" />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={136 + 6 * Math.cos((a * Math.PI) / 180)} cy={70 + 6 * Math.sin((a * Math.PI) / 180)} r="4.4" fill={R} stroke={K} strokeWidth="0.8" />
          ))}
          <circle cx="136" cy="70" r="3.2" fill={Y} stroke={K} strokeWidth="0.6" />
        </g>
      )}
      {jack && (
        <g>
          <path d="M132 112 L146 52" stroke={Y} strokeWidth="3.4" strokeLinecap="round" />
          <path d="M142 62 C154 60 156 50 150 44 C148 52 144 54 140 54 Z" fill="#fff" stroke={B} strokeWidth="1" />
        </g>
      )}

      {/* robe */}
      <path d="M52 108 C68 100 84 98 100 98 C116 98 132 100 152 108 L152 170 L52 170 Z" fill={side} stroke={K} strokeWidth="1.2" />
      <KeyBand x={52} y={106} h={64} />
      <KeyBand x={141} y={106} h={64} />
      <path d="M80 106 L120 106 L127 170 L73 170 Z" fill={main} stroke={K} strokeWidth="1" />
      <rect x="97" y="106" width="6" height="64" fill={Y} stroke={K} strokeWidth="0.8" />
      <path d="M78 140 C92 128 108 150 122 134" fill="none" stroke={Y} strokeWidth="3" />
      {[70, 131].map((x) => (
        <g key={x}>
          <circle cx={x} cy="122" r="4.5" fill={Y} stroke={K} strokeWidth="0.8" />
          <SuitShape suit={card.suit} x={x} y={146} size={11} color={Y} />
        </g>
      ))}
      <Checker y={104} />

      {/* hair / veil behind the face */}
      {queen && <path d="M84 56 C74 74 74 94 80 104 L92 100 C86 88 86 72 92 58 Z" fill={K} />}
      <path d="M86 60 C80 72 81 86 85 96 M114 60 C120 72 119 86 115 96 M89 62 C85 72 86 84 88 92 M111 62 C115 72 114 84 112 92" {...HAIR} />

      {/* face */}
      <ellipse cx="100" cy="76" rx="12.5" ry="15" fill={FACE} stroke={B} strokeWidth="1.3" />
      <g {...HAIR} strokeWidth={1.2}>
        <path d="M93 72 q2.5 -2 5 0 M102 72 q2.5 -2 5 0" />
        <path d="M100 74 L98 82 L101 82" />
      </g>
      <circle cx="95.5" cy="74" r="1.1" fill={B} />
      <circle cx="104.5" cy="74" r="1.1" fill={B} />
      {king ? (
        <g {...HAIR}>
          <path d="M93 85 q7 -4 14 0" strokeWidth={1.5} />
          <path d="M88 84 C88 98 112 98 112 84" fill={FACE} />
          <path d="M92 89 C94 95 106 95 108 89 M96 92 v4 M100 92 v5 M104 92 v4" />
        </g>
      ) : (
        <path d="M96.5 86 q3.5 2 7 0" fill="none" stroke={R} strokeWidth="1.6" strokeLinecap="round" />
      )}

      {/* headwear */}
      {king && (
        <g>
          <path d="M84 62 L84 50 L116 50 L116 62 Z" fill={Y} stroke={K} strokeWidth="1.2" />
          <path d="M84 50 q4 -7 8 0 q4 -7 8 0 q4 -7 8 0 q4 -7 8 0 Z" fill={K} />
          {[89, 96, 104, 111].map((x) => (
            <circle key={x} cx={x} cy="56" r="1.8" fill={R} />
          ))}
        </g>
      )}
      {queen && (
        <g>
          <path d="M88 62 L89 52 L94 57 L100 48 L106 57 L111 52 L112 62 Z" fill={Y} stroke={K} strokeWidth="1.1" />
          <circle cx="100" cy="56" r="2" fill={R} />
        </g>
      )}
      {jack && (
        <g>
          <path d="M83 64 C83 48 117 48 117 64 Z" fill={R} stroke={K} strokeWidth="1.2" />
          <rect x="83" y="60" width="34" height="5" fill={Y} stroke={K} strokeWidth="0.9" />
          <path d="M114 54 C122 42 132 40 138 34 C134 46 126 52 116 58 Z" fill={K} />
        </g>
      )}

      {/* hand */}
      <ellipse cx="130" cy="106" rx="5.5" ry="4.5" fill={FACE} stroke={B} strokeWidth="1" />
      {/* suit mark in the panel corner */}
      <SuitShape suit={card.suit} x={PX0 + 9} y={PY0 + 10} size={12} />
    </g>
  );
}

function Court({ card }: { card: Card }) {
  const id = `court-${card.suit}${card.rank}`;
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <polygon points={TOP_HALF} />
        </clipPath>
      </defs>
      <rect x={PX0} y={PY0} width={PX1 - PX0} height={PY1 - PY0} fill="#fff" />
      <g clipPath={`url(#${id})`}>
        <CourtHalf card={card} />
      </g>
      <g transform="rotate(180 100 140)" clipPath={`url(#${id})`}>
        <CourtHalf card={card} />
      </g>
      <path d={`M${PX1} 120 L${PX0} 160`} stroke={K} strokeWidth="1.4" />
      <rect x={PX0} y={PY0} width={PX1 - PX0} height={PY1 - PY0} fill="none" stroke={K} strokeWidth="1.4" />
    </g>
  );
}

/* ---------- full card ---------- */

export function CardFace({ card }: { card: Card }) {
  const court = card.rank >= 11 && card.rank <= 13;
  return (
    <svg className="card-face-svg" viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" aria-hidden>
      <Frame suit={card.suit} />
      {court ? <Court card={card} /> : <CentrePip card={card} />}
      <IndexMark card={card} />
      <g transform={`rotate(180 ${W / 2} ${H / 2})`}>
        <IndexMark card={card} />
      </g>
    </svg>
  );
}

/** Classic red back: white border, diamond lattice and an oval medallion. */
export function CardBack() {
  return (
    <svg className="card-back-svg" viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" aria-hidden>
      <defs>
        <pattern id="batak-back-lattice" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="14" height="14" fill="#c8102e" />
          <path d="M0 7 H14 M7 0 V14" stroke="#f6d4d8" strokeWidth="1.2" />
          <circle cx="7" cy="7" r="2" fill="#fff" />
        </pattern>
      </defs>
      <rect x="0" y="0" width={W} height={H} rx="12" fill={PAPER} />
      <rect x="11" y="11" width={W - 22} height={H - 22} rx="6" fill="url(#batak-back-lattice)" stroke="#8e0b20" strokeWidth="2" />
      <rect x="17" y="17" width={W - 34} height={H - 34} rx="4" fill="none" stroke="#fff" strokeWidth="1.2" />
      <ellipse cx="100" cy="140" rx="36" ry="48" fill="#c8102e" stroke="#fff" strokeWidth="3" />
      <ellipse cx="100" cy="140" rx="28" ry="39" fill="none" stroke={GOLD} strokeWidth="1.6" />
      <SuitShape suit="S" x={100} y={140} size={34} color="#fff" />
    </svg>
  );
}
