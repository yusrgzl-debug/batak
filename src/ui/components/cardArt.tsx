import { Card, Suit, rankLabel } from '../../engine/cards';

/**
 * Card faces in a classic layout (index in the top-left and bottom-right corners, standard pip
 * patterns, framed double-ended court figures) drawn in a clean, slightly simplified style that
 * suits the game rather than imitating a printed deck. Everything is drawn on a 200×280 grid.
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
const SKIN = '#f7d2bd';
const GOLD = '#f0b93a';
const RED = '#c8262e';
const BLUE = '#2a4b9b';
const PAPER = '#fdfcf8';
const LINE = { stroke: INK, strokeWidth: 1.4, strokeLinejoin: 'round' as const };

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
    const spade = card.suit === 'S';
    return (
      <g>
        {spade && <ellipse cx="100" cy="140" rx="54" ry="62" fill="none" stroke={GOLD} strokeWidth="3" />}
        {spade && <ellipse cx="100" cy="140" rx="47" ry="55" fill="none" stroke={INK} strokeWidth="1" />}
        <SuitShape suit={card.suit} x={100} y={140} size={spade ? 72 : 64} />
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

function Face({ rank }: { rank: number }) {
  return (
    <g stroke={INK} strokeWidth="1.3" strokeLinecap="round" fill="none">
      <path d="M92 70 q3 -2 6 0 M102 70 q3 -2 6 0" />
      <circle cx="95" cy="72" r="1.2" fill={INK} stroke="none" />
      <circle cx="105" cy="72" r="1.2" fill={INK} stroke="none" />
      <path d="M100 73 L98 80 L101 80" />
      {rank !== 13 && <path d="M96 85 Q100 87 104 85" stroke={RED} strokeWidth="1.8" />}
    </g>
  );
}

const ROBE: Record<Suit, [string, string]> = {
  H: [RED, BLUE],
  D: [BLUE, RED],
  S: [BLUE, INK],
  C: [RED, INK],
};

/** One half of a court card (top half); drawn twice, the second rotated 180° about the centre. */
function CourtHalf({ suit, rank }: { suit: Suit; rank: number }) {
  const [robe, panel] = ROBE[suit];
  const king = rank === 13;
  const queen = rank === 12;
  const jack = rank === 11;
  return (
    <g>
      {/* item held behind the shoulder: sword, flower or halberd */}
      {king && (
        <g>
          <path d="M126 132 L152 44" stroke="#dfe5ee" strokeWidth="5" strokeLinecap="round" />
          <path d="M126 132 L152 44" stroke={INK} strokeWidth="0.8" />
          <path d="M120 116 L140 122" stroke={GOLD} strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {queen && (
        <g>
          <path d="M128 128 C132 112 136 104 138 92" fill="none" stroke="#2f7d4f" strokeWidth="2.5" />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={138 + 6 * Math.cos((a * Math.PI) / 180)} cy={86 + 6 * Math.sin((a * Math.PI) / 180)} r="4.5" fill={RED} {...LINE} strokeWidth="0.8" />
          ))}
          <circle cx="138" cy="86" r="3.5" fill={GOLD} />
        </g>
      )}
      {jack && (
        <g>
          <path d="M128 134 L150 48" stroke={GOLD} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M146 58 C158 56 160 46 154 40 C152 48 148 50 144 50 Z" fill="#dfe5ee" {...LINE} strokeWidth="0.9" />
        </g>
      )}

      {/* robe */}
      <path d="M42 140 L42 118 C42 106 60 100 80 98 L120 98 C140 100 158 106 158 118 L158 140 Z" fill={robe} {...LINE} />
      <path d="M72 140 L78 100 L122 100 L128 140 Z" fill={panel} {...LINE} />
      <path d="M100 100 L100 140" stroke={GOLD} strokeWidth="4" />
      {[106, 118, 130].map((y) => (
        <circle key={y} cx="100" cy={y} r="2" fill={PAPER} />
      ))}
      <path d="M42 126 L72 126 M128 126 L158 126" stroke={GOLD} strokeWidth="3" />
      <circle cx="58" cy="114" r="8" fill={PAPER} {...LINE} strokeWidth="1" />
      <SuitShape suit={suit} x={58} y={114} size={11} />
      {/* collar */}
      <path d="M78 98 Q100 114 122 98 L117 91 Q100 103 83 91 Z" fill={GOLD} {...LINE} />

      {/* hair behind the face */}
      {queen && <path d="M84 62 C78 80 80 94 76 102 L92 100 L108 100 L124 102 C120 94 122 80 116 62 Z" fill={GOLD} {...LINE} />}
      {jack && <path d="M85 64 C82 78 84 88 82 94 L118 94 C116 88 118 78 115 64 Z" fill={GOLD} {...LINE} />}
      {king && <path d="M84 64 C82 76 84 84 84 88 L116 88 C116 84 118 76 116 64 Z" fill="#ece6d6" {...LINE} />}

      <ellipse cx="100" cy="74" rx="14" ry="17" fill={SKIN} {...LINE} />
      <Face rank={rank} />
      {king && (
        <g>
          <path d="M87 80 C88 98 112 98 113 80 C108 86 92 86 87 80 Z" fill="#ece6d6" {...LINE} />
          <path d="M93 81 Q100 78 107 81" fill="none" stroke={INK} strokeWidth="1.2" />
        </g>
      )}

      {/* headwear */}
      {(king || queen) && (
        <g>
          <path
            d={king ? 'M84 58 L82 40 L91 48 L100 34 L109 48 L118 40 L116 58 Z' : 'M88 58 L86 46 L94 52 L100 42 L106 52 L114 46 L112 58 Z'}
            fill={GOLD}
            {...LINE}
          />
          <rect x={king ? 84 : 88} y="54" width={king ? 32 : 24} height="5" fill={panel} {...LINE} strokeWidth="1" />
          <circle cx="100" cy={king ? 46 : 51} r="2.6" fill={king ? RED : BLUE} />
        </g>
      )}
      {jack && (
        <g>
          <path d="M80 62 C80 46 120 46 120 62 Z" fill={panel} {...LINE} />
          <rect x="80" y="58" width="40" height="5" fill={GOLD} {...LINE} strokeWidth="1" />
          <path d="M116 52 C126 38 136 36 142 30 C138 44 128 52 118 56 Z" fill={RED} {...LINE} strokeWidth="1" />
        </g>
      )}

      {/* hand */}
      <ellipse cx="129" cy="122" rx="6" ry="5" fill={SKIN} {...LINE} strokeWidth="1" />
    </g>
  );
}

function Court({ card }: { card: Card }) {
  const frame = PALETTE[card.suit].pip;
  return (
    <g>
      <rect x="38" y="30" width="124" height="220" rx="4" fill="#fff" stroke={frame} strokeWidth="1.6" />
      <svg x="38" y="30" width="124" height="220" viewBox="38 30 124 220">
        <CourtHalf suit={card.suit} rank={card.rank} />
        <g transform="rotate(180 100 140)">
          <CourtHalf suit={card.suit} rank={card.rank} />
        </g>
      </svg>
      <path d="M38 140 L162 140" stroke={GOLD} strokeWidth="2" />
    </g>
  );
}

/* ---------- full card ---------- */

function Index({ card }: { card: Card }) {
  const color = PALETTE[card.suit].pip;
  const label = rankLabel(card.rank);
  const ten = label === '10';
  const one = (
    <g>
      <text
        x="19"
        y="38"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="900"
        fontSize={ten ? 28 : 34}
        letterSpacing={ten ? -2.5 : 0}
        fill={color}
      >
        {label}
      </text>
      <SuitShape suit={card.suit} x={19} y={54} size={18} />
    </g>
  );
  return (
    <g>
      {one}
      <g transform={`rotate(180 ${W / 2} ${H / 2})`}>{one}</g>
    </g>
  );
}

export function CardFace({ card }: { card: Card }) {
  const court = card.rank >= 11 && card.rank <= 13;
  return (
    <svg className="card-face-svg" viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" aria-hidden>
      <rect x="0" y="0" width={W} height={H} rx="12" fill={PAPER} />
      {court ? <Court card={card} /> : <Pips card={card} />}
      <Index card={card} />
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
