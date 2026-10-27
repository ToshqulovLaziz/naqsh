---
name: naqsh
description: Design or redesign frontend UI so it looks deliberately designed, not generated. Two surfaces - `page` (landing, portfolio, marketing, product pages) and `app` (ERP, admin, dashboards, tables, forms). Modes - build, redesign, audit. Use when the user asks to design, build, restyle, redesign, polish or review a web page or app screen, says it looks generic or "AI-made", or names naqsh. Handles uz/ru/en (Latin + Cyrillic) projects.
---

# naqsh

v0.4 (P3). `<skill>` below means this skill's base directory. Scripts need Node ≥ 22 and a local
Chrome/Edge; nothing to install.

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

`audit` mode: follow `references/audit.md` from here and stop. Do not edit project files.

## 4. Inventory

- **Subject:** 8–12 things only this product or person has (names, places, real numbers, real work).
- **Material:** for each visual slot mark `real`, `picture` (honestly sourceable) or `absent`.
  Never invent proof: no fake logos, testimonials, metrics or screenshots.
- **Audience and job:** who looks, what they must do or learn first.

## 5. Direction (dealt, taste-driven)

```
node <skill>/scripts/deal.mjs --surface <page|app> --options 3 --project <projectRoot>
```

The script scores the library against the user's **taste profile** (`~/.naqsh/taste.json`, overridable per project
in `<project>/.naqsh/taste.json`) and recent picks, and deals 3 directions from different families.
- If the user is present, show the three (idea, type, palette, hero) and let them choose. Otherwise choose the best
  fit for the content and say why.
- `deal.mjs --pick <id>` prints the full sheet (sections, motion, font import, light/dark tokens) and logs the pick.
  Build **from the sheet**: its type, palette and hero are the contract. Adapt sizes and sections to the real
  content; deviate only with a written reason (e.g. missing material).
- `page`: also read `references/page.md`. `app`: also read `references/app.md`; the sheet's `system` block decides
  shell, density, KPI, table, status and chart style.

**Taste feedback.** When the user says what they like or dislike about a result, update `~/.naqsh/taste.json`
(`boldness` 1–5, `temperature` warm|cool|neutral|any, `typeStyles`, `likes`, `avoid`, `notes`) and tell them.

## 6. Floor (never waived; scripts check most of it)

- Visible text from i18n in every locale; no invented copy.
- Fonts load and cover every locale script; longest locale fits at 375 px.
- Font `@import` above `@import "tailwindcss"`; element styles inside `@layer base`.
- No horizontal page scroll; `overflow-x: clip`, never `hidden`/`100vw`.
- Contrast ≥ 4.5:1 (3:1 large) in every theme; focus visible; targets ≥ 24 px (44 recommended).
- `prefers-reduced-motion` respected; no `transition: all`; animate transform/opacity.
- New tokens scoped so untouched pages do not change.

## 7. Generated-UI tells (reflex: waive only when the dealt sheet allows it)

Default Tailwind indigo/violet; glow, glass, aurora blobs, orbiting icons, shimmer buttons, gradient text;
tracked-uppercase eyebrows above every heading; identical rounded+shadow card grids; a hero band of round metrics;
the same name or title repeated in one screen. Bold scale, strong colour and serif/sans contrast are **not**
tells — timidity is a failure too: if the result could pass for a template, push the sheet's idea harder.

## 8. Build loop

1. Tokens (scoped) → main screen / hero → the rest.
2. After each step: `lint`. After the main screen and at the end: build, preview, `inspect`, **open the
   screenshots and look**. Fix, repeat — at most 3 rounds after the first full pass.
3. When the first full pass is at 0 floor FAIL, write `DESIGN.md` (draft) and spawn the reviewer in a fresh
   context — Agent tool, `subagent_type: "naqsh:naqsh-reviewer"` — with: project root, surface, mode, direction id,
   `<skill>` path, screenshot folder, preview URL and the inspect flags. Apply its `floor`, `idea` and `fidelity`
   fixes (others at your judgement), rerun the checks. One review round; a second only if the verdict was `rework`.
   If no Agent tool is available, do the review yourself from `agents/naqsh-reviewer.md` after rereading the screenshots.
4. Finish with 0 floor FAIL, every reflex fixed or waived, and the project's build passing. Stop the preview server.

## 9. Report

Write `DESIGN.md` in the project root (or where the user says): dealt options and the pick, idea sentence,
tokens, type, key decisions, before → after check counts, waivers with reasons, judged checks, open items.
End by asking the user what they like and dislike, so the taste profile improves.
