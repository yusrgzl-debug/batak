// Builds a one-page review of the card deck: `npx vite-node scripts/card-preview.tsx`
import { readFileSync, writeFileSync } from 'node:fs';
import { Card, RANKS, Suit, rankLabel } from '../src/engine/cards';

const svg = (name: string) => `data:image/svg+xml;base64,${readFileSync(`src/assets/deck/${name}.svg`).toString('base64')}`;
const img = (name: string) => `<div class="card"><img src="${svg(name)}" alt=""></div>`;

const order: Suit[] = ['S', 'H', 'C', 'D'];
const NAMES: Record<Suit, string> = { S: 'Maça', H: 'Kupa', C: 'Sinek', D: 'Karo' };
const ranks = [14, ...RANKS.filter((r) => r !== 14)];
const face = (c: Card) => img(`${c.suit}_${rankLabel(c.rank)}`);

const rows = order
  .map((s) => `<h2>${NAMES[s]}</h2><div class="row">${ranks.map((r) => face({ suit: s, rank: r as Card['rank'] })).join('')}</div>`)
  .join('');

// a sample 16-card Gömmeli hand in two rows, laid out like the game does
const hand: Card[] = [
  ...[3, 8, 11, 12].map((r) => ({ suit: 'H' as Suit, rank: r as Card['rank'] })),
  ...[4, 6, 7, 8, 9].map((r) => ({ suit: 'S' as Suit, rank: r as Card['rank'] })),
  ...[3, 5, 9].map((r) => ({ suit: 'D' as Suit, rank: r as Card['rank'] })),
  ...[6, 8, 12, 13].map((r) => ({ suit: 'C' as Suit, rank: r as Card['rank'] })),
];
const top = hand.slice(0, 8);
const bottom = hand.slice(8);
const handRow = (cards: Card[], y: number) =>
  cards.map((c, i) => `<div class="hc" style="left:${i * 11.2}%;top:${y}px;z-index:${y + i}">${face(c)}</div>`).join('');
const fontLink = readFileSync('index.html', 'utf8').match(/<link href="https:\/\/fonts.googleapis[^>]+>/)![0];

const html = `<title>Kart Tasarımı</title>
${fontLink}
<style>
:root{color-scheme:dark;--bg:#0d3b4a;--fg:#eef2f2;--muted:#9fb6bd}
body{background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif;margin:0;padding:16px}
main{max-width:1100px;margin:0 auto}
h1{font-size:22px;margin:4px 0 4px}p{color:var(--muted);margin:0 0 12px;font-size:14px}
h2{font-size:15px;margin:18px 0 8px;color:var(--muted);font-weight:600}
.row{display:grid;grid-template-columns:repeat(13,minmax(0,1fr));gap:8px}
@media (max-width:760px){.row{grid-template-columns:repeat(5,minmax(0,1fr))}}
.big{display:grid;grid-template-columns:repeat(4,minmax(0,220px));gap:16px}
@media (max-width:760px){.big{grid-template-columns:repeat(2,minmax(0,1fr))}}
.card{position:relative;aspect-ratio:420/620;border-radius:8.1%/5.5%;overflow:hidden;box-shadow:-2px 2px 6px rgba(0,0,0,.35)}
.card img{display:block;width:100%;height:100%}
.backs{display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:10px;max-width:180px}
.hand{position:relative;height:280px;max-width:420px;margin-top:8px;background:linear-gradient(#5a3218,#2a1407);border-top:2px solid #8a5a2b;border-radius:10px;padding:10px}
.hc{position:absolute;width:21%}
.hc .card{box-shadow:0 0 0 .5px rgba(0,0,0,.35),-3px 2px 6px rgba(0,0,0,.45)}
</style>
<main>
<h1>Kart Tasarımı</h1>
<p>Yüklediğin Poppins indeksli deste (SVG). Oyunda bu kartlar kullanılıyor.</p>
<h2>Yakın plan</h2>
<div class="big">${[
  { suit: 'H', rank: 12 },
  { suit: 'C', rank: 6 },
  { suit: 'C', rank: 10 },
  { suit: 'S', rank: 13 },
].map((c) => face(c as Card)).join('')}</div>
${rows}
<h2>Kart arkası</h2><div class="backs">${img('BACK')}</div>
<h2>Elde görünüm (16 kart, iki sıra)</h2>
<div class="hand">${handRow(top, 10)}${handRow(bottom, 120)}</div>
</main>`;
writeFileSync('dist-web/kartlar.html', html);
console.log('dist-web/kartlar.html', (html.length / 1024).toFixed(0), 'KB');
