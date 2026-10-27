// Rule catalogue shared by lint.mjs (static) and inspect.mjs (rendered page).
// tier: "floor" can never be waived; "reflex" can be waived with a written reason in .naqsh/waivers.json.
// kind: "static" = source scan, "render" = measured in a real browser.

export const RULES = {
  // Floor: static
  'css-import-order': { tier: 'floor', kind: 'static', title: 'Font @import after @import "tailwindcss" is dropped from the build', fix: 'Move every @import url(...) above @import "tailwindcss".' },
  'css-unlayered-base': { tier: 'floor', kind: 'static', title: 'Unlayered element styles override Tailwind utilities', fix: 'Wrap element selectors (html, body, h1-h6, p, a, button...) in @layer base { }.' },
  'transition-all': { tier: 'floor', kind: 'static', title: 'transition: all animates layout properties', fix: 'List the properties: transition-colors / transition-transform / transition-opacity.' },
  'overflow-x-hidden': { tier: 'floor', kind: 'static', title: 'overflow-x: hidden or 100vw width hides overflow bugs and breaks sticky', fix: 'Use overflow-x: clip (Tailwind overflow-x-clip) and w-full instead of 100vw / w-screen.' },
  'img-alt': { tier: 'floor', kind: 'static', title: '<img> without alt', fix: 'Add alt text from i18n, or alt="" for decorative images.' },
  'i18n-hardcoded': { tier: 'floor', kind: 'static', title: 'Visible text not from i18n (heuristic, verify)', fix: 'Move the text into every locale file and render it with t().' },
  'reduced-motion': { tier: 'floor', kind: 'static', title: 'Animation library used without a reduced-motion path', fix: 'Wrap in <MotionConfig reducedMotion="user"> or gate with prefers-reduced-motion.' },
  'outline-none': { tier: 'floor', kind: 'static', title: 'Focus outline removed without a visible replacement', fix: 'Add focus-visible:ring-* or focus-visible:outline-* on the same element.' },

  // Floor: render
  'page-overflow-x': { tier: 'floor', kind: 'render', title: 'Page scrolls horizontally', fix: 'Find the element wider than the viewport (see offenders) and constrain it.' },
  'element-offscreen': { tier: 'floor', kind: 'render', title: 'Text element sticks out of the viewport', fix: 'Reduce size / allow wrapping / use clamp() for the longest locale.' },
  'font-fallback': { tier: 'floor', kind: 'render', title: 'Declared font is not the one rendered (missing glyphs or not loaded)', fix: 'Load the font correctly and pick a family that covers every locale script (Latin + Cyrillic).' },
  'contrast': { tier: 'floor', kind: 'render', title: 'Text contrast below WCAG AA', fix: 'Raise contrast to 4.5:1 (3:1 for text ≥ 24px or ≥ 18.66px bold).' },
  'touch-target-min': { tier: 'floor', kind: 'render', title: 'Control smaller than 24×24 px on mobile', fix: 'Give the control at least 24×24 px (44×44 px recommended).' },
  'js-error': { tier: 'floor', kind: 'render', title: 'Uncaught exception or console error', fix: 'Fix the error; the page must load clean.' },
  'img-missing-alt': { tier: 'floor', kind: 'render', title: 'Rendered image without alt attribute', fix: 'Add alt text, or alt="" if decorative.' },

  // Reflex: static
  'gradient-text': { tier: 'reflex', kind: 'static', title: 'Gradient text', fix: 'Use a solid colour; spend emphasis elsewhere.' },
  'glass': { tier: 'reflex', kind: 'static', title: 'Glassmorphism (backdrop-blur)', fix: 'Use a solid surface unless the direction argues for glass.' },
  'glow': { tier: 'reflex', kind: 'static', title: 'Coloured glow shadow', fix: 'Remove the glow or use a neutral, low shadow.' },
  'default-palette': { tier: 'reflex', kind: 'static', title: 'Default Tailwind indigo/violet/purple as brand colour', fix: 'Use the direction palette tokens.' },
  'card-kit': { tier: 'reflex', kind: 'static', title: 'Repeated rounded + shadow card kit', fix: 'Vary structure: rules, lists, tables or one featured item instead of identical cards.' },

  // Reflex: render
  'eyebrow': { tier: 'reflex', kind: 'render', title: 'Tracked uppercase label directly above a heading', fix: 'Drop the label or make it part of the heading.' },
  'touch-target': { tier: 'reflex', kind: 'render', title: 'Control smaller than 44×44 px on mobile', fix: 'Increase padding or hit area to 44×44 px.' },
  'font-count': { tier: 'reflex', kind: 'render', title: 'More than 3 font families loaded', fix: 'Limit to 2 families (+1 mono for data).' },
  'hero-below-fold': { tier: 'reflex', kind: 'render', title: 'Main heading not fully visible in the first screen', fix: 'Fit the h1 inside the first viewport at 1440×900.' },
  'table-numeric-align': { tier: 'reflex', kind: 'render', title: 'Numeric table cell not right-aligned', fix: 'text-right on numeric columns (header too).' },
  'table-tabular-nums': { tier: 'reflex', kind: 'render', title: 'Numeric table cell without tabular figures', fix: 'Add tabular-nums to numeric columns.' },
};

export const ruleMeta = (id) => RULES[id] ?? { tier: 'reflex', kind: 'unknown', title: id, fix: '' };
