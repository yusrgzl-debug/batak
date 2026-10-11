// Turns dist-web/index.html (a full document) into a body fragment for hosting as a claude.ai
// Artifact, which supplies its own <!doctype>/<head>/<body> skeleton.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('dist-web/index.html', 'utf8');
const grab = (re) => [...html.matchAll(re)].map((m) => m[0]).join('\n');
const out = [
  '<title>Batak</title>',
  grab(/<link[^>]+fonts\.googleapis[^>]*>/g),
  grab(/<style[^>]*>[\s\S]*?<\/style>/g),
  '<style>:root{color-scheme:dark}</style>',
  '<div id="root"></div>',
  grab(/<script[^>]*>[\s\S]*?<\/script>/g),
].join('\n');
writeFileSync('dist-web/batak.html', out);
console.log(`dist-web/batak.html ${(out.length / 1024).toFixed(0)} KB`);
