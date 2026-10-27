#!/usr/bin/env node
// naqsh deal: scores library directions against the user's taste profile and recent picks,
// then deals N options from different families. --pick prints the full sheet and logs the choice.
//
// Usage:
//   node deal.mjs --surface page|app [--options 3] [--seed N] [--project <root>]
//   node deal.mjs --pick <id> [--project <root>] [--no-log]
//   node deal.mjs --list [--surface page|app]
//   node deal.mjs --taste [--project <root>]      show the merged taste profile and where it lives
//   node deal.mjs --validate                      check library palettes for contrast
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const library = JSON.parse(readFileSync(join(here, '..', 'library', 'directions.json'), 'utf8')).directions;

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : dflt;
};
const has = (name) => args.includes(name);

const userDir = join(homedir(), '.naqsh');
const project = resolve(opt('--project', process.cwd()));
const tastePaths = [join(userDir, 'taste.json'), join(project, '.naqsh', 'taste.json')];
const logPath = join(userDir, 'log.json');

const DEFAULT_TASTE = { boldness: 4, temperature: 'any', typeStyles: [], likes: [], avoid: [], notes: '' };
const readJson = (p, dflt) => {
  try { return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : dflt; } catch (e) {
    console.error(`naqsh: cannot parse ${p}: ${e.message}`); return dflt;
  }
};
// Project profile overrides the user profile key by key.
const taste = tastePaths.reduce((t, p) => ({ ...t, ...readJson(p, {}) }), DEFAULT_TASTE);
const baseTaste = taste;
const log = readJson(logPath, []);

// ---------- contrast helpers (for --validate) ----------
const lum = (hex) => {
  const [r, g, b] = hex.replace('#', '').match(/../g).map((h) => parseInt(h, 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

if (has('--validate')) {
  let bad = 0;
  const pairs = [['ink', 'ground', 7], ['quiet', 'ground', 4.5], ['ink', 'surface', 4.5], ['quiet', 'surface', 4.5], ['accentInk', 'accent', 4.5]];
  for (const d of library) {
    for (const [mode, p] of Object.entries(d.palette)) {
      for (const [fg, bg, need] of pairs) {
        const r = ratio(p[fg], p[bg]);
        if (r < need) { bad++; console.log(`${d.id} ${mode}: ${fg} on ${bg} = ${r.toFixed(2)} (needs ${need})`); }
      }
    }
  }
  console.log(bad ? `\n${bad} palette pairs below target` : `all ${library.length} palettes pass`);
  process.exit(bad ? 1 : 0);
}

if (has('--taste')) {
  console.log(`Taste files (later overrides earlier):\n  ${tastePaths.map((p) => `${p}${existsSync(p) ? '' : ' (missing)'}`).join('\n  ')}\n`);
  console.log(JSON.stringify(taste, null, 2));
  process.exit(0);
}

// ---------- scoring ----------
const lc = (xs) => (xs ?? []).map((x) => String(x).toLowerCase());
const overlap = (tags, words) => lc(tags).filter((t) => lc(words).some((w) => t.includes(w) || w.includes(t)));

function score(d) {
  // A surface block (taste.page / taste.app) overrides the general profile key by key.
  const taste = { ...baseTaste, ...(baseTaste[d.surface] ?? {}) };
  const why = [];
  let s = -2 * Math.abs(d.boldness - (taste.boldness ?? 4));
  if (taste.temperature && taste.temperature !== 'any') {
    if (d.temperature === taste.temperature) { s += 2; why.push(`${d.temperature} palette`); }
    else if (d.temperature !== 'neutral') s -= 2;
  }
  if (lc(taste.typeStyles).includes(d.typeStyle)) { s += 2; why.push(d.typeStyle); }
  const liked = overlap(d.tags, taste.likes);
  s += 1.5 * liked.length; why.push(...liked);
  const avoided = overlap(d.tags, taste.avoid);
  s -= 3 * avoided.length;
  // Rotation: recent picks for this surface are pushed down so consecutive builds differ.
  const recent = log.filter((l) => l.surface === d.surface).slice(-3).map((l) => l.id);
  if (recent.includes(d.id)) { s -= 4; why.push('(used recently)'); }
  return { d, s, why: [...new Set(why)] };
}

// Small seeded PRNG so a run can be reproduced with --seed.
const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

function sheet(d, full) {
  const p = (m) => d.palette[m] ? Object.entries(d.palette[m]).map(([k, v]) => `${k} ${v}`).join(' · ') : '';
  const lines = [
    `### ${d.id} — "${d.idea}"`,
    `family ${d.family} · boldness ${d.boldness}/5 · ${d.temperature} · ${d.typeStyle} · tags: ${d.tags.join(', ')}`,
    `type: display ${d.type.display}; text ${d.type.text}${d.type.mono ? `; mono ${d.type.mono}` : ''}`,
    `dark: ${p('dark')}`,
    `light: ${p('light')}`,
  ];
  if (d.hero) lines.push(`hero: ${d.hero}`);
  if (d.system) lines.push(...Object.entries(d.system).map(([k, v]) => `${k}: ${v}`));
  if (!full) return lines.join('\n');
  if (d.sections) lines.push('sections:', ...d.sections.map((s) => `  - ${s}`));
  if (d.motion) lines.push(`motion: ${d.motion}`);
  if (d.allowed?.length) lines.push(`allowed in this direction (waive the matching reflex with this reason): ${d.allowed.join('; ')}`);
  const css = (m) => Object.entries(d.palette[m]).map(([k, v]) => `  --nq-${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}: ${v};`).join('\n');
  const first = d.palette.light ? 'light' : 'dark';
  const second = first === 'light' ? 'dark' : 'light';
  lines.push('',
    'Fonts (put this line ABOVE @import "tailwindcss", or use <link> in index.html):',
    `@import url("https://fonts.googleapis.com/css2?${d.type.google.map((g) => `family=${g}`).join('&')}&display=swap");`,
    '',
    `Tokens (adapt the selector to the project's theme switch; ${first} first):`,
    `:root {\n${css(first)}\n}`,
    `${second === 'dark' ? ':root.dark' : ':root:not(.dark)'} {\n${css(second)}\n}`,
    '',
    'These are a starting point: tune sizes, roles and layout to the real content; keep the idea.');
  return lines.join('\n');
}

if (has('--list')) {
  const surface = opt('--surface');
  for (const d of library.filter((x) => !surface || x.surface === surface)) {
    console.log(`${d.surface.padEnd(4)} ${d.id.padEnd(20)} ${d.family.padEnd(15)} b${d.boldness} ${d.temperature.padEnd(7)} ${d.idea}`);
  }
  process.exit(0);
}

const pickId = opt('--pick');
if (pickId) {
  const d = library.find((x) => x.id === pickId);
  if (!d) { console.error(`Unknown direction "${pickId}". See --list.`); process.exit(2); }
  console.log(sheet(d, true));
  if (!has('--no-log')) {
    mkdirSync(userDir, { recursive: true });
    log.push({ date: new Date().toISOString(), surface: d.surface, id: d.id, project });
    writeFileSync(logPath, JSON.stringify(log.slice(-50), null, 2));
  }
  process.exit(0);
}

const surface = opt('--surface');
if (!['page', 'app'].includes(surface)) {
  console.error('Usage: node deal.mjs --surface page|app [--options 3] [--seed N]  (or --pick <id>, --list, --taste, --validate)');
  process.exit(2);
}
const n = Number(opt('--options', 3));
const seed = Number(opt('--seed', Date.now() % 1e9));
const rand = mulberry32(seed);

// Weighted draw without replacement, at most one direction per family so the options differ in kind.
let pool = library.filter((d) => d.surface === surface).map(score);
const dealt = [];
while (dealt.length < n && pool.length) {
  const weights = pool.map((c) => Math.exp(c.s / 1.5));
  let r = rand() * weights.reduce((a, b) => a + b, 0);
  const i = weights.findIndex((w) => (r -= w) <= 0);
  const pick = pool[i === -1 ? pool.length - 1 : i];
  dealt.push(pick);
  pool = pool.filter((c) => c.d.family !== pick.d.family);
}

const shown = { ...taste, ...(taste[surface] ?? {}) };
console.log(`Dealt ${dealt.length} ${surface} directions (seed ${seed}). Taste: boldness ${shown.boldness}, ${shown.temperature}${shown.typeStyles?.length ? `, ${shown.typeStyles.join('/')}` : ''}.\n`);
for (const { d, why } of dealt) console.log(`${sheet(d, false)}\nfits taste: ${why.join(', ') || '—'}\n`);
console.log('Choose one (or reroll with a new --seed), then: node deal.mjs --pick <id>');
