# Surface: page

For landing, portfolio, marketing and product pages. The page makes one argument and is remembered for one idea.
The dealt sheet gives the idea, type, palette and hero; this file says how to carry it.

## Argument

Write the page as claims in order. Each section carries one claim and its proof (real work, real numbers,
real quotes). A section with no claim is cut. Typical order: who/what → proof (the work) → how/what you get →
what others say → objections (FAQ) → one action.

## Carry the idea at full strength

- The first screen must show the idea **unmistakably** at 1440×900 and 390×844: scale, crop, colour or motion
  that a template would never use. If a stranger could not tell this page from a theme demo, it is not done.
- Display type is big: the hero heading is usually 10–20vw on desktop, sized for the longest locale at 375 px
  (measure, use `clamp()`, or fit-to-width with JS for monument names).
- Use the full palette: ground, surface and accent are all allowed to take whole sections (inverted bands,
  full-bleed accent blocks). Keep text contrast; scripts check it.
- Contrast between type roles is welcome: serif italic against grotesk, huge against tiny, mono only for real data.
- Each section gets its own composition from the sheet's blueprints; never repeat one card grid down the page.

## Type

- Use the sheet's fonts; two families (+ one mono for real data). The sheet's `@import` line goes **above**
  `@import "tailwindcss"` (or use `<link>` in index.html). Confirm with `inspect` that they render.
- Cyrillic-safe faces in the library are verified; if you swap a font, check its Cyrillic and run
  `inspect --locales ru`. No Cyrillic: Instrument Serif, Boska, Clash Display, Satoshi, General Sans.

## Colour

Use the sheet's roles as CSS variables scoped to what you change, light and dark. Accent may be loud;
body text stays `ink`/`quiet` on `ground`/`surface`.

## Motion

The sheet's signature motion, done well, plus responsive feedback (hover, focus, open). No infinite background
animation unless the sheet asks for it. Respect `prefers-reduced-motion`.

## Material

Use the real screenshots, names and numbers. Mark placeholder numbers as placeholders in `DESIGN.md`.
The name or page title appears once per screen.
