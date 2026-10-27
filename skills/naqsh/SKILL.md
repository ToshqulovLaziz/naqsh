---
name: naqsh
description: Design or redesign frontend UI so it looks deliberately designed, not generated. Two surfaces - `page` (landing, portfolio, marketing, product pages) and `app` (ERP, admin, dashboards, tables, forms). Modes - build, redesign, audit. Use when the user asks to design, build, restyle, redesign, polish or review a web page or app screen, says it looks generic or "AI-made", or names naqsh. Handles uz/ru/en (Latin + Cyrillic) projects.
---

# naqsh

v0.2 (P1). `<skill>` below means this skill's base directory. Scripts need Node ≥ 22 and a local
Chrome/Edge; nothing to install. The direction library and `deal.mjs` arrive in P2.

## 1. Route

State surface and mode in one line before anything else.

| Surface | Signals | Read |
|---|---|---|
| `page` | landing, portfolio, marketing, product, one-pager | `references/page.md` |
| `app` | ERP, admin, dashboard, table, form, settings, CRUD | `references/app.md` |

| Mode | Touches code? | Output |
|---|---|---|
| `build` | yes, new UI | UI + `DESIGN.md` |
| `redesign` | yes; keep behaviour, data and copy | UI + `DESIGN.md` |
| `audit` | **no** | ranked findings with file:line and fix |

Always read `references/rules.md` before running checks. If nobody can answer questions, decide and record why.

## 2. Context

- Stack, styling, existing tokens, fonts and how they load, theme switch (+ its localStorage key), i18n
  (+ locale key), routes, build command.
- What may change and what must not (other pages, shared components, business logic).
- Locales: if any uses Cyrillic, every chosen typeface must cover it.

## 3. Baseline

Run both checks on the current state and keep the output: it is the "before" of the report and often reveals
real bugs (fonts never loading, contrast, overflow).

```
node <skill>/scripts/lint.mjs <projectRoot>
node <skill>/scripts/inspect.mjs http://localhost:PORT --surface <surface> --routes ... --locales ... --themes ...
```

`audit` mode stops here: rank findings (floor first), group by cause, give file:line and a concrete fix,
add the judged checks from `references/rules.md`. Do not edit code.

## 4. Inventory

- **Subject:** 8–12 things only this product or person has (names, places, real numbers, real work).
- **Material:** for each visual slot mark `real`, `picture` (honestly sourceable) or `absent`.
  Never invent proof: no fake logos, testimonials, metrics or screenshots.
- **Audience and job:** who looks, what they must do or learn first.

## 5. Direction

`page`: three directions per `references/page.md`, competitor test, choose one, spend boldness in one place.
`app`: decide the system per `references/app.md` (shell, density, type, colour, table and form style).
Write the decision into `DESIGN.md` before building.

## 6. Floor (never waived; scripts check most of it)

- Visible text from i18n in every locale; no invented copy.
- Fonts load and cover every locale script; longest locale fits at 375 px.
- Font `@import` above `@import "tailwindcss"`; element styles inside `@layer base`.
- No horizontal page scroll; `overflow-x: clip`, never `hidden`/`100vw`.
- Contrast ≥ 4.5:1 (3:1 large) in every theme; focus visible; targets ≥ 24 px (44 recommended).
- `prefers-reduced-motion` respected; no `transition: all`; animate transform/opacity.
- New tokens scoped so untouched pages do not change.

## 7. Tells to avoid (reflex: waive only with a reason)

Near-black + one neon accent; cream + terracotta; default Tailwind indigo/violet; glow, glass, aurora blobs,
gradient text; tracked-uppercase eyebrows above headings; `01 /` numbering that is not a real sequence;
identical rounded+shadow card grids; a hero band of round metrics; one italic word inside a roman headline.

## 8. Build loop

1. Tokens (scoped) → main screen / hero → the rest.
2. After each step: `lint`. After the main screen and at the end: build, preview, `inspect`, **open the
   screenshots and look**. Fix, repeat — at most 3 rounds after the first full pass.
3. Finish with 0 floor FAIL, every reflex fixed or waived, and the project's build passing. Stop the preview server.

## 9. Report

Write `DESIGN.md` in the project root (or where the user says): direction and idea sentence, tokens, type,
key decisions, before → after check counts, waivers with reasons, judged checks, open items.
