#!/usr/bin/env node
// naqsh inspect: loads pages in headless Chrome/Edge, measures floor/reflex rules, saves screenshots.
//
// Usage: node inspect.mjs <baseUrl> [options]
//   --routes /,/orders            routes to check (default /)
//   --widths 1440,768,390         viewport widths (default 1440,768,390)
//   --locales uz,ru,en            extra locales; checked at the narrowest width unless --full
//   --locale-key i18nextLng       localStorage key the app reads the locale from
//   --themes dark:theme=dark,light:theme=light
//                                 named localStorage presets (key=value;key=value), each checked
//   --surface page|app            page enables the hero-in-first-screen check (default page)
//   --out .naqsh/inspect          screenshot folder (default)
//   --no-shots                    skip screenshots
//   --full                        every locale at every width
//   --json                        machine-readable findings
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { launch } from './lib/cdp.mjs';
import { probe } from './lib/probe.mjs';
import { finding, loadWaivers, applyWaivers, print, exitCode } from './lib/report.mjs';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : dflt;
};
const has = (name) => args.includes(name);
const list = (s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []);

const base = args[0];
if (!base || base.startsWith('--')) {
  console.error('Usage: node inspect.mjs <baseUrl> [--routes /,/x] [--widths 1440,768,390] [--locales uz,ru,en] [--themes name:k=v,...]');
  process.exit(2);
}
const routes = list(opt('--routes', '/'));
const widths = list(opt('--widths', '1440,768,390')).map(Number).sort((a, b) => b - a);
const locales = list(opt('--locales', ''));
const localeKey = opt('--locale-key', 'i18nextLng');
const themes = list(opt('--themes', '')).map((t) => {
  const [name, kv = ''] = t.split(':');
  return { name, storage: Object.fromEntries(kv.split(';').filter(Boolean).map((p) => p.split('='))) };
});
const surface = opt('--surface', 'page');
const outDir = resolve(opt('--out', join('.naqsh', 'inspect')));
const shots = !has('--no-shots');

const heightFor = (w) => (w <= 480 ? 844 : w <= 1024 ? 1024 : 900);
const slug = (r) => (r === '/' ? 'home' : r.replace(/^\/|\/$/g, '').replace(/[^\w-]+/g, '-'));

// Build the run matrix: widths × themes at the first locale; other locales at the narrowest width.
const runs = [];
const themeList = themes.length ? themes : [{ name: '', storage: {} }];
const [firstLocale, ...otherLocales] = locales.length ? locales : [''];
for (const route of routes) {
  for (const w of widths) for (const th of themeList) runs.push({ route, w, locale: firstLocale, theme: th });
  for (const loc of otherLocales) {
    for (const w of has('--full') ? widths : [widths.at(-1)]) runs.push({ route, w, locale: loc, theme: themeList[0] });
  }
}

const GENERIC = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-sans-serif|ui-serif|ui-monospace|ui-rounded|-apple-system|blinkmacsystemfont|emoji|math|inherit|initial)$/i;
const FONT_SELECTORS = ['h1', 'h2', 'h3', 'p', 'a', 'button', 'label', 'th', 'td', 'input'];

async function fontChecks(page) {
  // Grouped by problem so one missing font is one finding, listing the selectors it affects.
  const groups = new Map();
  const add = (problem, sel) => groups.set(problem, new Set([...(groups.get(problem) ?? []), sel]));
  const { root } = await page.send('DOM.getDocument', { depth: 0 });
  for (const sel of FONT_SELECTORS) {
    const { nodeIds } = await page.send('DOM.querySelectorAll', { nodeId: root.nodeId, selector: sel });
    let checked = 0;
    for (const nodeId of nodeIds) {
      if (checked >= 3) break;
      try {
        // Only leaf text elements: a parent's platform fonts would include its children's fonts.
        const { node } = await page.send('DOM.describeNode', { nodeId, depth: 1 });
        const kids = node.children ?? [];
        if (!kids.length || kids.some((k) => k.nodeType !== 3) || !kids.some((k) => k.nodeValue.trim())) continue;
        checked++;
        const { computedStyle } = await page.send('CSS.getComputedStyleForNode', { nodeId });
        const family = computedStyle.find((p) => p.name === 'font-family')?.value ?? '';
        const declared = family.split(',')[0].trim().replace(/["']/g, '');
        if (!declared || GENERIC.test(declared)) continue;
        const { fonts } = await page.send('CSS.getPlatformFontsForNode', { nodeId });
        if (!fonts.length) continue;
        const norm = (s) => s.toLowerCase().replace(/\s+(variable|vf)$/, '');
        const own = fonts.filter((f) => norm(f.familyName).startsWith(norm(declared)));
        const other = fonts.filter((f) => !own.includes(f) && f.glyphCount >= 3);
        if (!own.length) add(`"${declared}" not loaded, renders "${fonts[0].familyName}"`, sel);
        else if (other.length) add(`"${declared}" missing glyphs, falls back to ${other.map((f) => `"${f.familyName}"`).join(', ')}`, sel);
      } catch { /* node vanished between queries */ }
    }
  }
  return [...groups].map(([problem, sels]) => `${problem} (${[...sels].join(', ')})`);
}

async function scrollThrough(page) {
  // Real wheel events so IntersectionObserver-based reveal animations fire before measuring.
  for (let i = 0; i < 80; i++) {
    await page.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 100, y: 100, deltaX: 0, deltaY: 400 });
    await new Promise((r) => setTimeout(r, 120));
    const { result } = await page.send('Runtime.evaluate', { expression: 'innerHeight + scrollY >= document.documentElement.scrollHeight - 2', returnByValue: true });
    if (result.value) break;
  }
  await new Promise((r) => setTimeout(r, 1000));
  // 'instant' overrides CSS scroll-behavior: smooth, otherwise the fold shot lands mid-animation.
  await page.send('Runtime.evaluate', { expression: "window.scrollTo({ top: 0, left: 0, behavior: 'instant' })" });
  await new Promise((r) => setTimeout(r, 600));
}

const findings = [];
const browser = await launch();
if (shots) mkdirSync(outDir, { recursive: true });

try {
  for (const run of runs) {
    const label = [run.route, `@${run.w}`, run.locale, run.theme.name].filter(Boolean).join(' ');
    const page = await browser.newPage();
    const errors = [];
    page.on('Runtime.exceptionThrown', (p) => errors.push(p.exceptionDetails.exception?.description?.split('\n')[0] ?? p.exceptionDetails.text));
    page.on('Runtime.consoleAPICalled', (p) => p.type === 'error' && errors.push(p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 160)));
    await Promise.all(['Page.enable', 'Runtime.enable', 'DOM.enable', 'CSS.enable'].map((m) => page.send(m)));

    const storage = { ...run.theme.storage, ...(run.locale && { [localeKey]: run.locale }) };
    if (Object.keys(storage).length) {
      await page.send('Page.addScriptToEvaluateOnNewDocument', {
        source: `try { for (const [k, v] of Object.entries(${JSON.stringify(storage)})) localStorage.setItem(k, v); } catch {}`,
      });
    }
    await page.send('Emulation.setDeviceMetricsOverride', { width: run.w, height: heightFor(run.w), deviceScaleFactor: 1, mobile: run.w <= 480 });

    const loaded = page.waitFor('Page.loadEventFired', 30000);
    await page.send('Page.navigate', { url: new URL(run.route, base).href });
    if (!(await loaded)) findings.push(finding('js-error', 'FAIL', label, 'page did not finish loading in 30 s'));
    await new Promise((r) => setTimeout(r, 1500));
    await scrollThrough(page);

    const { result, exceptionDetails } = await page.send('Runtime.evaluate', {
      expression: `(${probe.toString()})(${JSON.stringify({ surface })})`, returnByValue: true, awaitPromise: true,
    });
    if (exceptionDetails) throw new Error(`probe failed on ${label}: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
    const m = result.value;

    for (const e of errors) findings.push(finding('js-error', 'FAIL', label, e));
    if (m.overflowX) findings.push(finding('page-overflow-x', 'FAIL', label, `scrollWidth ${m.overflowX.scrollWidth} > ${m.vw}; ${m.overflowX.offenders.join('; ')}`));
    for (const o of m.offscreen) findings.push(finding('element-offscreen', 'FAIL', label, o));
    for (const t of m.tiny) findings.push(finding('touch-target-min', 'FAIL', label, t));
    if (m.small.length) findings.push(finding('touch-target', 'WARN', label, `${m.small.length} controls < 44px, e.g. ${m.small.slice(0, 3).join('; ')}`));
    // Near 1:1 usually means the real background is a pseudo-element or sibling layer the probe cannot see.
    for (const c of m.contrast) {
      findings.push(c.ratio < 1.3
        ? finding('contrast', 'WARN', label, `${c.text} — background likely layered, verify on screenshot`)
        : finding('contrast', 'FAIL', label, c.text));
    }
    for (const e of m.eyebrows) findings.push(finding('eyebrow', 'WARN', label, e));
    for (const i of m.imgsNoAlt) findings.push(finding('img-missing-alt', 'FAIL', label, i));
    for (const t of m.tableNum) findings.push(finding('table-numeric-align', 'WARN', label, t));
    for (const t of m.tableTab) findings.push(finding('table-tabular-nums', 'WARN', label, t));
    if (m.fontFamilies.length > 3) findings.push(finding('font-count', 'WARN', label, m.fontFamilies.join(', ')));
    if (surface === 'page' && run.w >= 1024 && m.heroBottom && m.heroBottom > m.vh) {
      findings.push(finding('hero-below-fold', 'WARN', label, `h1 bottom at ${m.heroBottom}px, viewport ${m.vh}px`));
    }
    for (const f of await fontChecks(page)) findings.push(finding('font-fallback', 'FAIL', label, f));

    if (shots) {
      const name = [slug(run.route), run.w, run.locale, run.theme.name].filter(Boolean).join('-');
      const fold = await page.send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(outDir, `${name}-fold.png`), Buffer.from(fold.data, 'base64'));
      const { cssContentSize } = await page.send('Page.getLayoutMetrics');
      const full = await page.send('Page.captureScreenshot', {
        format: 'png', captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: run.w, height: Math.min(Math.ceil(cssContentSize.height), 16000), scale: 1 },
      });
      writeFileSync(join(outDir, `${name}-full.png`), Buffer.from(full.data, 'base64'));
    }
    await page.close();
    if (!has('--json')) console.error(`checked ${label}`);
  }
} finally {
  await browser.dispose();
}

// Merge identical findings seen in several runs into one line.
const merged = new Map();
for (const f of findings) {
  const key = `${f.id}|${f.severity}|${f.detail}`;
  const prev = merged.get(key);
  if (prev) prev.runs.push(f.where);
  else merged.set(key, { ...f, runs: [f.where] });
}
const collapsed = [...merged.values()].map(({ runs, ...f }) => ({
  ...f, where: runs.length > 3 ? `${runs.slice(0, 3).join(', ')} +${runs.length - 3}` : runs.join(', '),
}));

const result = applyWaivers(collapsed, loadWaivers(process.cwd()));
print(result, { json: has('--json'), title: `naqsh inspect (${runs.length} runs${shots ? `, screenshots in ${outDir}` : ''})` });
process.exit(exitCode(result));
