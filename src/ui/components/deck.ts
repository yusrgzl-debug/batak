import { Card, rankLabel } from '../../engine/cards';

/**
 * The card artwork: the classic deck with Poppins indices (SVG) (based on htdebeer's SVG-cards,
 * LGPL-2.1 — see src/assets/deck/LICENSE-LGPL-2.1.txt). Files are named like S_A, H_10, C_K, BACK.
 */
const files = import.meta.glob('../../assets/deck/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const byName: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) byName[path.slice(path.lastIndexOf('/') + 1, -4)] = url;

export const cardImage = (c: Card) => byName[`${c.suit}_${rankLabel(c.rank)}`];
export const backImage = byName.BACK;

/** Width / height of the artwork (420 × 620). */
export const CARD_RATIO = 420 / 620;
