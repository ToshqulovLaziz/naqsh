#!/usr/bin/env node
// naqsh static lint: scans source for floor/reflex rules that do not need a browser.
// Usage: node lint.mjs [projectRoot] [--dir src] [--json]
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { finding, loadWaivers, applyWaivers, print, exitCode } from './lib/report.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const root = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--dir') ?? process.cwd();
const scanDir = join(root, opt('--dir', existsSync(join(root, 'src')) ? 'src' : '.'));

const EXT = new Set(['.css', '.scss', '.tsx', '.jsx', '.ts', '.js', '.html', '.vue', '.svelte', '.astro']);
const SKIP = new Set(['node_modules', 'dist', 'build', '.next', '.naqsh', '.git', 'coverage']);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXT.has(extname(name))) out.push(p);
  }
  return out;
}

const files = walk(scanDir);
if (existsSync(join(root, 'index.html')) && !files.includes(join(root, 'index.html'))) files.push(join(root, 'index.html'));

const pkg = existsSync(join(root, 'package.json')) ? JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) : {};
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
const hasI18n = ['i18next', 'react-i18next', 'react-intl', 'vue-i18n', 'next-intl'].some((d) => d in deps);
const hasMotionLib = ['framer-motion', 'motion', 'gsap'].some((d) => d in deps);

const findings = [];
const rel = (p) => relative(root, p).replaceAll('\\', '/');
const lineOf = (text, index) => text.slice(0, index).split('\n').length;
// Strip CSS/JS block comments but keep newlines so line numbers stay right.
const stripBlockComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));

// :root and html are left out: they usually hold variables/scroll settings that no utility competes with.
const BASE_ELEMENTS = /^(body|\*|h[1-6]|p|a|button|input|select|textarea|ul|ol|li|img|table|th|td|label|span|div|section|header|footer|main|nav)\b/;

function lintCss(path, raw) {
  const text = stripBlockComments(raw);
  const lines = text.split('\n');
  const where = (i) => `${rel(path)}:${i + 1}`;

  // css-import-order
  const twIndex = lines.findIndex((l) => /@import\s+["']tailwindcss["']|@tailwind\s+base/.test(l));
  if (twIndex >= 0) {
    lines.forEach((l, i) => {
      if (i > twIndex && /@import\s+(url\(|["']https?:)/.test(l)) findings.push(finding('css-import-order', 'FAIL', where(i), l.trim().slice(0, 80)));
    });
  }

  lines.forEach((l, i) => {
    if (/transition\s*:\s*all\b/.test(l)) findings.push(finding('transition-all', 'FAIL', where(i)));
    if (/overflow-x\s*:\s*hidden/.test(l) || /\bwidth\s*:\s*100vw/.test(l)) findings.push(finding('overflow-x-hidden', 'FAIL', where(i), l.trim()));
    if (/backdrop-filter\s*:/.test(l)) findings.push(finding('glass', 'WARN', where(i)));
    if (/background-clip\s*:\s*text/.test(l)) findings.push(finding('gradient-text', 'WARN', where(i)));
  });

  // css-unlayered-base: element selectors outside any @layer, only matters when Tailwind v4 is imported.
  if (twIndex < 0 || !/@import\s+["']tailwindcss["']/.test(text)) return;
  const stack = [];
  let prelude = '';
  let preludeStart = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '{') {
      const sel = prelude.trim();
      const inLayer = stack.some((s) => s.startsWith('@layer'));
      if (sel && !sel.startsWith('@') && !inLayer && stack.every((s) => s.startsWith('@media') || s.startsWith('@supports'))) {
        const hit = sel.split(',').map((s) => s.trim()).find((s) => BASE_ELEMENTS.test(s));
        if (hit) findings.push(finding('css-unlayered-base', 'FAIL', `${rel(path)}:${lineOf(text, preludeStart)}`, sel.replace(/\s+/g, ' ').slice(0, 60)));
      }
      stack.push(sel);
      prelude = '';
    } else if (c === '}') {
      stack.pop();
      prelude = '';
    } else if (c === ';' && !prelude.includes('{')) {
      prelude = '';
    } else {
      if (!prelude.trim()) preludeStart = i;
      prelude += c;
    }
  }
}

let cardKitCount = 0;
const cardKitSamples = [];

function lintMarkup(path, raw) {
  const text = stripBlockComments(raw);
  const lines = text.split('\n');
  const where = (i) => `${rel(path)}:${i + 1}`;
  let paletteHits = 0;
  let paletteFirst = -1;

  lines.forEach((l, i) => {
    if (/\btransition-all\b/.test(l) || /transition\s*:\s*['"]?all\b/.test(l)) findings.push(finding('transition-all', 'FAIL', where(i)));
    if (/\boverflow-x-hidden\b|\bw-screen\b|100vw/.test(l)) findings.push(finding('overflow-x-hidden', 'FAIL', where(i), (l.match(/overflow-x-hidden|w-screen|100vw/) ?? [''])[0]));
    if (/\bbg-clip-text\b/.test(l) && /\btext-transparent\b/.test(l)) findings.push(finding('gradient-text', 'WARN', where(i)));
    if (/\bbackdrop-blur/.test(l)) findings.push(finding('glass', 'WARN', where(i)));
    if (/shadow-\[0_0_|drop-shadow-\[0_0_|shadow-\w+-\d{3}\/\d+/.test(l)) findings.push(finding('glow', 'WARN', where(i)));
    if (/\boutline-none\b/.test(l) && !/focus(-visible)?:(ring|outline|border|shadow)/.test(l)) findings.push(finding('outline-none', 'FAIL', where(i)));
    const pal = l.match(/\b(bg|text|from|to|via|border|ring|fill|stroke)-(indigo|violet|purple)-\d{2,3}\b/g);
    if (pal) {
      paletteHits += pal.length;
      if (paletteFirst < 0) paletteFirst = i;
    }
    if (/\brounded-(xl|2xl|3xl)\b/.test(l) && /\bshadow-(md|lg|xl|2xl)\b/.test(l)) {
      cardKitCount++;
      if (cardKitSamples.length < 3) cardKitSamples.push(where(i));
    }

    if (hasI18n && /\.(tsx|jsx|vue|svelte|astro)$/.test(path)) {
      // JSX text between tags: >Some words<
      for (const m of l.matchAll(/>([^<>{}`]+)</g)) {
        const t = m[1].trim();
        if (/\p{L}{2,}/u.test(t) && !/=>|&&|\|\||[;=()]/.test(t) && !/^&\w+;$/.test(t)) {
          findings.push(finding('i18n-hardcoded', 'WARN', where(i), JSON.stringify(t.slice(0, 50))));
        }
      }
      // Visible attributes with literal text
      for (const m of l.matchAll(/\b(placeholder|aria-label|title|alt)="([^"{}]*\p{L}{2,}[^"{}]*)"/gu)) {
        findings.push(finding('i18n-hardcoded', 'WARN', where(i), `${m[1]}=${JSON.stringify(m[2].slice(0, 40))}`));
      }
    }
  });

  if (paletteHits >= 3) findings.push(finding('default-palette', 'WARN', where(paletteFirst), `${paletteHits} indigo/violet/purple classes in file`));

  for (const m of text.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt\s*=/.test(m[0])) findings.push(finding('img-alt', 'FAIL', `${rel(path)}:${lineOf(text, m.index)}`));
  }
}

let usesReducedMotion = false;
for (const f of files) {
  const raw = readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
  if (/MotionConfig|useReducedMotion|prefers-reduced-motion|reducedMotion/.test(raw)) usesReducedMotion = true;
  if (/\.(css|scss)$/.test(f)) lintCss(f, raw);
  else lintMarkup(f, raw);
}

if (cardKitCount >= 6) findings.push(finding('card-kit', 'WARN', cardKitSamples.join(', '), `${cardKitCount} rounded+shadow cards`));
if (hasMotionLib && !usesReducedMotion) findings.push(finding('reduced-motion', 'FAIL', 'project', 'animation library installed, no reduced-motion handling found'));

const result = applyWaivers(findings, loadWaivers(root));
print(result, { json: flag('--json'), title: `naqsh lint (${files.length} files)` });
process.exit(exitCode(result));
