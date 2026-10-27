# Surface: page

For landing, portfolio, marketing and product pages. The page must make one argument and be remembered for one idea.

## Argument

Write the page as claims in order. Each section must carry one claim and its proof (real work, real numbers,
real quotes). A section with no claim is cut. Typical order: who/what → proof (the work) → how/what you get →
what others say → objections (FAQ) → one action.

## Direction

Write three directions that differ in kind, not in colour:

1. **Subject world** — something from the subject's own trade, tools, city or culture
   (a frontend developer: the inspector, the grid, the console; a Tashkent business: its streets, crafts, signage).
2. **Typographic** — the words carry the page: scale, crop, rhythm.
3. **Work-first** — the real product, screenshots or objects lead; chrome stays quiet.

For each: idea sentence `"[subject thing] becomes [device]"`, one live element (real data that changes:
local time, status, latest item), type pairing, 4–6 named hex values with roles, hero sketch.

Kill any direction that a typical site in the category would also produce. Choose one and write why.

## Type

- Two families at most (+ one mono only for real data). Both must cover every locale script.
- Cyrillic-safe display faces: Unbounded, Onest, Manrope, Inter Display, Golos Text, Montserrat Alternates, PT Serif,
  Literata, Playfair Display, Cormorant, IBM Plex Sans/Serif/Mono, JetBrains Mono, Geologica, Raleway.
  No Cyrillic: Instrument Serif, Boska, Clash Display, Satoshi, General Sans. Anything else: verify the
  font's character sets before choosing; `inspect --locales ru` confirms it.
- Load fonts **before** `@import "tailwindcss"` (or via `<link>` in index.html) and confirm with `inspect`.
- Set the hero size for the longest locale at 375 px, not for English at 1440 px.

## Colour

Name roles: ground, surface, ink, quiet ink, rule, accent, accent-ink. Accent covers < 10 % of a screen.
Define light and dark as the same roles. Check `contrast` in both themes.

## Motion

One authored moment (load, or the live element). Everything else responds to the user: hover, focus, open.
No infinite background animation. Respect `prefers-reduced-motion`.

## Hero

The first screen at 1440×900 and 390×844 shows: who/what, the one idea, one primary action, and a glimpse of proof.
`inspect --surface page` warns when the h1 does not fit the first screen.
