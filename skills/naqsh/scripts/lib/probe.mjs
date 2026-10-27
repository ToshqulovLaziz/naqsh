// Runs inside the page (serialized with Function.prototype.toString). Must stay self-contained.
// Returns raw measurements; inspect.mjs turns them into findings.
export function probe(opts) {
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const LIMIT = 15;

  const desc = (el) => {
    let s = el.tagName.toLowerCase();
    if (el.id) s += `#${el.id}`;
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
    if (cls.length) s += `.${cls.join('.')}`;
    const text = (el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ');
    return text ? `${s} "${text.slice(0, 30)}"` : s;
  };
  // Fully clipped by an overflow ancestor (e.g. a collapsed max-h-0 menu) counts as hidden.
  const clippedAway = (el, r) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
      const pr = p.getBoundingClientRect();
      if (Math.min(r.right, pr.right) - Math.max(r.left, pr.left) <= 0 || Math.min(r.bottom, pr.bottom) - Math.max(r.top, pr.top) <= 0) return true;
    }
    return false;
  };
  // Entirely beside the viewport (closed off-canvas drawer) counts as hidden, not as overflow.
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.right > 0 && r.left < vw
      && el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && !clippedAway(el, r);
  };
  const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
  const clippedByAncestor = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (/(hidden|clip|auto|scroll)/.test(getComputedStyle(p).overflowX)) return true;
    }
    return false;
  };

  const all = [...document.body.querySelectorAll('*')];
  // HTML only: SVG text (charts) has no innerText and its own contrast rules.
  const textEls = all.filter((el) => el instanceof HTMLElement && ownText(el) && visible(el));
  const out = { vw, vh };

  // Horizontal overflow
  const sw = document.documentElement.scrollWidth;
  out.overflowX = sw > vw + 1
    ? { scrollWidth: sw, offenders: all.filter((el) => visible(el) && el.getBoundingClientRect().right > vw + 1 && !clippedByAncestor(el))
        .sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right).slice(0, 3).map(desc) }
    : null;

  out.offscreen = textEls.filter((el) => {
    const r = el.getBoundingClientRect();
    return (r.right > vw + 1 || r.left < -1) && !clippedByAncestor(el);
  }).slice(0, LIMIT).map(desc);

  // Touch targets, mobile only
  out.tiny = []; out.small = [];
  if (vw <= 480) {
    const controls = all.filter((el) => el.matches('a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=tab],[role=switch]') && visible(el));
    // An input's hit area is the larger of itself and its label (wrapping or linked by for=): a checkbox counts
    // its label, a 44px field is not shrunk to the text line of a label above it.
    const hitArea = (el) => {
      const label = el.matches('input') ? (el.closest('label') || (el.id && document.querySelector(`label[for="${CSS.escape(el.id)}"]`))) : null;
      const own = el.getBoundingClientRect();
      if (!label) return own;
      const lr = label.getBoundingClientRect();
      return lr.width * lr.height > own.width * own.height ? lr : own;
    };
    const rects = controls.map(hitArea);
    // WCAG 2.5.8 spacing exception: a small target passes if a 24px box centred on it touches no other target.
    const spaced = (i) => {
      const r = rects[i];
      const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
      const box = { left: Math.min(r.left, cx - 12), right: Math.max(r.right, cx + 12), top: Math.min(r.top, cy - 12), bottom: Math.max(r.bottom, cy + 12) };
      return rects.every((o, j) => j === i || controls[j].contains(controls[i]) || controls[i].contains(controls[j])
        || o.right <= box.left || o.left >= box.right || o.bottom <= box.top || o.top >= box.bottom);
    };
    controls.forEach((el, i) => {
      // Links inside running text are exempt.
      if (el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && ownText(el.parentElement)) return;
      const r = rects[i];
      const item = `${desc(el)} ${Math.round(r.width)}×${Math.round(r.height)}`;
      if ((r.width < 24 || r.height < 24) && !spaced(i)) out.tiny.push(item);
      else if (r.width < 44 || r.height < 44) out.small.push(item);
    });
  }

  // Contrast. Colours are resolved through a canvas so oklch()/color-mix() work too.
  const ctx = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
  const rgba = (c) => {
    ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return [r, g, b, a / 255];
  };
  const lum = ([r, g, b]) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const over = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));
  const backgroundOf = (el) => {
    const layers = [];
    for (let p = el; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.backgroundImage !== 'none') return null; // image/gradient: cannot judge
      const c = rgba(cs.backgroundColor);
      if (c[3] > 0) { layers.push(c); if (c[3] >= 1) break; }
    }
    let base = [255, 255, 255];
    for (const l of layers.reverse()) base = over(l, base);
    return base;
  };
  const seen = new Set();
  out.contrast = [];
  for (const el of textEls) {
    const cs = getComputedStyle(el);
    const bg = backgroundOf(el);
    if (!bg) continue;
    const fgRaw = rgba(cs.color);
    // Transparent or stroked text is a deliberate effect, not body copy.
    if (fgRaw[3] < 0.1 || parseFloat(cs.webkitTextStrokeWidth) > 0) continue;
    const fg = over(fgRaw, bg);
    const [l1, l2] = [lum(fg), lum(bg)].sort((a, b) => b - a);
    const ratio = (l1 + 0.05) / (l2 + 0.05);
    const size = parseFloat(cs.fontSize);
    const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
    const need = large ? 3 : 4.5;
    if (ratio < need) {
      const key = `${cs.color}|${bg}|${size}`;
      if (seen.has(key)) continue;
      seen.add(key);
      // Floor, not round: 4.497 must not print as 4.50.
      out.contrast.push({ text: `${desc(el)} ${(Math.floor(ratio * 100) / 100).toFixed(2)}:1 (needs ${need}:1, ${size}px)`, ratio });
      if (out.contrast.length >= LIMIT) break;
    }
  }

  // Eyebrow: small tracked uppercase text right before a heading.
  out.eyebrows = textEls.filter((el) => {
    const cs = getComputedStyle(el);
    const size = parseFloat(cs.fontSize);
    const tracking = parseFloat(cs.letterSpacing) || 0;
    const upper = cs.textTransform === 'uppercase' || (el.innerText.length > 3 && el.innerText === el.innerText.toUpperCase() && /\p{L}/u.test(el.innerText));
    if (!(upper && size <= 14 && tracking >= 0.05 * size)) return false;
    const next = el.nextElementSibling ?? el.parentElement?.nextElementSibling;
    return !!next && (next.matches('h1,h2,h3') || !!next.querySelector(':scope > h1, :scope > h2, :scope > h3'));
  }).slice(0, LIMIT).map(desc);

  out.fontFamilies = [...new Set([...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/["']/g, '')))];

  const h1 = document.querySelector('h1');
  out.heroBottom = h1 && visible(h1) ? Math.round(h1.getBoundingClientRect().bottom + window.scrollY) : null;

  out.imgsNoAlt = all.filter((el) => el.tagName === 'IMG' && !el.hasAttribute('alt') && visible(el)).slice(0, LIMIT).map((el) => el.getAttribute('src')?.slice(-50) ?? 'img');

  // Numeric table columns
  out.tableNum = []; out.tableTab = [];
  const DATE = /^\d{1,4}[./-]\d{1,2}[./-]\d{1,4}$/;
  const NUM = /^[-+−]?[\d\s .,]*\d[\d\s .,]*(%|\s?[\p{L}'’$€₽]{1,6})?$/u;
  document.querySelectorAll('table').forEach((table, ti) => {
    const cols = new Map();
    table.querySelectorAll('tbody tr').forEach((tr) => [...tr.cells].forEach((td, ci) => {
      const t = td.innerText.trim();
      if (!t || !NUM.test(t) || DATE.test(t) || (t.match(/\d/g) || []).length < 2) return;
      const cs = getComputedStyle(td);
      const c = cols.get(ci) ?? { n: 0, misaligned: 0, proportional: 0, sample: t };
      c.n++;
      if (!['right', 'end'].includes(cs.textAlign)) c.misaligned++;
      if (!cs.fontVariantNumeric.includes('tabular-nums')) c.proportional++;
      cols.set(ci, c);
    }));
    for (const [ci, c] of cols) {
      if (c.n < 2) continue;
      const head = table.querySelectorAll('thead th')[ci]?.innerText.replace(/\s+/g, ' ').trim() || `col ${ci + 1}`;
      if (c.misaligned > c.n / 2) out.tableNum.push(`table ${ti + 1} "${head}" (e.g. ${c.sample})`);
      if (c.proportional > c.n / 2) out.tableTab.push(`table ${ti + 1} "${head}"`);
    }
  });

  // Native, unstyled controls: browser-default select, date/number fields, checkboxes, radios.
  out.native = all.filter((el) => el.matches('select, input[type=date], input[type=time], input[type=datetime-local], input[type=month], input[type=number], input[type=checkbox], input[type=radio]')
    && visible(el) && !['none'].includes(getComputedStyle(el).appearance))
    .map((el) => `${el.tagName === 'SELECT' ? 'select' : `input[type=${el.type}]`} ${desc(el)}`)
    .filter((s, i, a) => a.findIndex((x) => x.split(' ')[0] === s.split(' ')[0]) === i).slice(0, LIMIT);

  // Text cut by a container: partly outside an ancestor that clips or scrolls (e.g. a table cell under the edge).
  out.clipped = [];
  for (const el of textEls) {
    const r = el.getBoundingClientRect();
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      if (!/(hidden|clip|auto|scroll)/.test(getComputedStyle(p).overflowX)) continue;
      const pr = p.getBoundingClientRect();
      if (r.right > pr.right + 1 && r.left < pr.right - 1) { out.clipped.push(`${desc(el)} cut at ${Math.round(r.right - pr.right)}px`); }
      break;
    }
    if (out.clipped.length >= LIMIT) break;
  }

  return out;
}
