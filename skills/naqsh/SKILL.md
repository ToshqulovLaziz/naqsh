---
name: naqsh
description: Design or redesign frontend UI so it looks deliberately designed, not generated. Two surfaces - `page` (landing, portfolio, marketing, product pages) and `app` (ERP, admin, dashboards, tables, forms). Modes - build, redesign, audit. Use when the user asks to design, build, restyle, redesign, polish or review a web page or app screen, says it looks generic or "AI-made", or names naqsh. Handles uz/ru/en (Latin + Cyrillic) projects.
---

# naqsh

Status: v0.1 (P0). The workflow below is complete as guidance. Scripts (`deal`, `lint`, `inspect`)
and the direction library arrive in P1–P2; until then do the marked steps by hand and say so in the report.

## 1. Route

Pick one **surface** and one **mode** before anything else, and state them in one line.

| Surface | Signals | Goal |
|---|---|---|
| `page` | landing, portfolio, marketing, product, one-pager | One memorable idea, a point of view |
| `app` | ERP, admin, dashboard, table, form, settings, CRUD | Density, legibility, consistency across screens |

| Mode | Touches code? | Output |
|---|---|---|
| `build` | yes, new UI | UI + `DESIGN.md` |
| `redesign` | yes, existing UI, keep behaviour and copy | UI + `DESIGN.md` |
| `audit` | **no** | ranked findings with file:line and fix |

If the user is not available to answer, decide yourself and record the decision.

## 2. Context (all modes)

- Stack, styling system, existing tokens, fonts, theme switch, i18n setup, routes.
- What may change and what must not (other pages, shared components, business logic).
- Locales in use. If any locale is Cyrillic (ru, uz-Cyrl), every chosen typeface must cover Cyrillic.

## 3. Inventory

- **Subject:** 8–12 things only this product or person has (names, places, real numbers, real work).
- **Material:** for each visual slot, mark `real` (exists), `picture` (can be sourced honestly) or `absent`.
  Never invent proof: no fake logos, testimonials, metrics or screenshots.
- **Audience and job:** who looks, what they must do or learn in the first screen.

## 4. Direction

`page`:
- (P2: `scripts/deal.mjs --surface page --options 3`. Until then:) write 3 distinct directions, each with
  idea sentence `"[subject thing] becomes [device]"`, type pairing, 4–6 named hex values, hero shape.
  At least one must come from the subject's own world (its trade, city, culture, tools).
- Competitor test: would a typical site in this category get the same result? If yes, discard it.
- Choose one. Spend boldness in **one** place; everything else stays quiet.

`app`:
- One shell (sidebar / topbar / split), one density level, one table style, one form style.
- Consistency beats novelty: the same pattern looks and behaves the same on every screen.

## 5. Floor rules (never waived)

- Visible text comes from i18n; no hardcoded copy. New keys go into every locale file.
- Fonts cover every locale's script. Test the longest locale (usually ru) at 375px: no overflow.
- `overflow-x: clip`, never `hidden` or `100vw` widths.
- CSS: font `@import` lines come **before** `@import "tailwindcss"`; base element styles live in `@layer base`.
- Focus ring on every control; touch targets ≥ 44px; text contrast ≥ 4.5:1 (≥ 3:1 for large text).
- `prefers-reduced-motion` respected; no `transition: all`; animate transform/opacity only.
- Light and dark themes both checked if the project has a theme switch.
- Scope new tokens so untouched pages do not change.
- `app`: tables keep header visible, numbers right-aligned with tabular figures, empty/loading/error states exist.

## 6. Tells to avoid (unless the direction argues for them)

- Near-black + one neon accent; cream + terracotta; default Tailwind indigo/violet.
- Glow, glass, aurora blobs, gradient text, orbiting icons, shimmer buttons.
- Tracked-uppercase mono eyebrows above every heading; `01 /` section numbers that are not a real sequence.
- Identical card grids with soft shadows; a hero-metrics band of round numbers.
- One accented or italic word inside a roman headline.

## 7. Build

1. Tokens first (scoped), then the hero / main screen, then the rest.
2. (P1: `scripts/lint.mjs` + `scripts/inspect.mjs` at 1440/768/390 per locale. Until then:) build, run the
   dev or preview server, take screenshots at 1440, 768 and 390, look at them, fix, repeat — max 3 rounds.
3. The project's build command must pass.

## 8. Review and report

- (P3: spawn `naqsh-reviewer` in a fresh context.) Re-read the brief and the screenshots as a stranger.
- Write `DESIGN.md`: direction, idea sentence, tokens, type, decisions, waivers with reasons, open items.
