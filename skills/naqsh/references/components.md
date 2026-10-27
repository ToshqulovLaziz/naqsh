# Components and craft

The difference between "designed" and "wow" is in the controls people touch every minute. Every control below is
**built to the sheet** — never left as the browser default (`inspect` flags `native-control`). Values are defaults
for `app`; a sheet may override them, `page` uses them for its forms and switchers.

## Tokens (decide once, write in DESIGN.md)

- **Spacing:** 4 px base; gaps 8 / 12 / 16 / 24 / 32; card padding 20 (16 on phones); page margin ≥ 16 on phones,
  24–32 on desktop; no text closer than 12 px to the edge of its card.
- **Radius:** pick a family and stay in it — tight (4 / 6 / 8) or soft (12 / 16 / 24). Nested radius = outer minus
  padding. At most 3 radii on a screen.
- **Lines:** three steps from the sheet's `rule`: card edge, row divider (lighter), control border (darker).
  A border **or** a shadow, never both; shadows only on things that float (menus, dialogs, toasts).
- **Type (app):** 12 / 14 / 16 / 20–24, answer figure 28–32; at most 3 weights, the heaviest for one job only;
  −0.02 em tracking from 24 px up; nothing below 11 px; `tabular-nums` on every figure.
- **Heights:** toolbar controls 32–36, form fields 40, primary buttons 36–40; **controls in one row share one height**.
  Touch: 44 px hit area on phones (padding or an invisible extension, not bigger visuals).
- **Motion:** press 120 ms, hover 150 ms, UI 200 ms, `cubic-bezier(.22,1,.36,1)`; exit ≈ 70 % of entry. Hover only
  under `@media (hover:hover) and (pointer:fine)`; hover raises contrast, never changes weight or layout.
  `:active { transform: translateY(1px) }`. No entrance animations on app screens. Reduced motion: no transforms.
- **Focus:** `:focus-visible` only — 2 px outline in the accent, 2 px offset; composite fields use `:focus-within`
  on the wrapper.

## Controls

**Language switcher** (the most-skipped detail). A compact control in the sidebar footer or top-right:
- Desktop: segmented `UZ · RU · EN` (32 px track, active segment on `surface` with a 1 px border, others `quiet`),
  or a button showing the current code that opens a small menu listing native names ("O'zbekcha", "Русский",
  "English") with a check on the current one.
- Phone: inside the menu sheet as a full-width segmented control.
- No flags (languages are not countries). `aria-label` from i18n; the current one `aria-pressed`/`aria-current`.
- Switching keeps scroll position and focus; text width changes must not shift the layout (reserve width).

**Theme toggle.** Icon button (sun/moon) or a 32×20 switch with a 16 px knob; the icon cross-fades/rotates in 200 ms.
Respects the system theme until the user chooses. Label from i18n.

**Select / dropdown.** `appearance:none` with a custom 12–14 px chevron, same height/border/radius as inputs.
For ≤ 7 options or rich rows (counts, colours, avatars) build a listbox popover: 8 px radius, shadow, 4 px inner
padding, rows 32–36 px, check on the selected, keyboard (↑↓ Enter Esc, type-ahead), closes on outside click.

**Date field.** Never the bare native picker in the product's look. Either a masked text field in the locale's
format (`dd.mm.yyyy`) with a calendar-button popover, or the native input restyled (`appearance:none`, own icon) and
a format hint under it. Today/quick ranges ("Bugun", "7 kun", "Shu oy") as chips where filtering by date.

**Number / money field.** Right-aligned, `tabular-nums`, no spinners (`appearance:textfield`), unit as a quiet
suffix inside the field ("so'm", "dona"), thousands grouped on blur. Steppers only where ±1 is the common action.

**Checkbox / radio.** `appearance:none`; 16–18 px, 1.5–2 px stroke in the control border colour, 4 px radius
(radio round); checked = accent fill with a drawn check (SVG, 120 ms stroke); indeterminate = bar. Hit area 44 px
via the label/cell on phones.

**Switch.** 32×20 (34×20 max), knob 16, on-colour = accent or semantic green; text label beside it, not inside.

**Search.** 32–36 px, leading 14–16 px icon, placeholder says what is searched, a clear (×) button when filled,
a `/` or `Ctrl K` hint on desktop. Results update as you type (debounced 150 ms) with the count visible.

**Buttons.** One filled primary per screen; secondary = surface + 1 px border; tertiary = text. Icon 16 px with an
8 px gap. Loading: keeps its width, spinner replaces the icon, disabled. Destructive actions in the bad colour and
confirmed. No gradients, glows or shadows on buttons.

**Status pills.** 20–22 px tall, 12 px / 500, pale tint with same-hue dark ink (light) or dark tint with light ink
(dark); a 6 px dot or a shape that differs per state so colour is not the only signal; `white-space:nowrap`;
one status per row.

**Tables.** Header 12 px `quiet`, sentence case, no fill band, sticky. Rows 40–48 px; hover = faint row tint or 1 px
outline, never a jump; selected = accent edge + tint. Numbers right, `tabular-nums`, unit in the header. IDs in mono,
truncated with a copy button on hover. Empty and "no results" rows span all columns with an action ("Filtrni
tozalash"). Phones: two-line rows (primary + meta | figure + status) — never cut columns at the edge.

**People.** Initials in a 24–28 px circle, pale tint of a stable per-person hue (hash of the name), 8 px gap to the
name. Real photos only if the data has them.

**Product mark.** An SVG drawn from the product's object (a shelf, a sack, a scale, a ledger), in ink + one accent,
16–24 px, beside the name. Never a letter in a box.

**Feedback.** Toast: bottom-right (top on phones), shadow, icon + one sentence + optional Undo, `aria-live="polite"`,
no focus steal, auto-dismiss 4 s (paused on hover), slides 8 px + fades. Loading: flat skeleton bars at the real
size of the values, no shimmer, no layout shift. Error: inside the failed block, with Retry. Empty: one sentence +
one action in a dashed 1 px box. Missing value: a `quiet` dash.

**Menus, popovers, tooltips.** 8 px radius, 1 px border + shadow, 4 px padding, 150 ms fade/scale from 0.98 at the
trigger's side; tooltips on icon-only buttons after 400 ms; Esc closes and returns focus.

## Dark theme recipe

Elevation by lightness (ground < surface < raised, about 4–6 % L apart), not by shadow. Text two greys that read
apart (ink ≈ 95 % L, quiet ≈ 68 % L). Accents one step lighter and less saturated than light mode. Charts, pills,
skeletons and focus rings all have dark values.

## Signature moment (required)

Each build ships **one** moment a visitor remembers, chosen from the sheet's idea and the data — not decoration:
- app: the answer figure counts up once on first load (600 ms, reduced-motion: none); the current-period bar draws
  in; a stock bar fills to its minimum line; the seam band carries the active status colour; a command palette
  (`Ctrl K`) for search + navigation + "new order".
- page: the hero type set at monument scale with one deliberate crop or overlap; a scroll-linked reveal of the
  real work; a cursor-aware detail on the signature element.
Name it in `DESIGN.md`. One only; everything else stays still and precise.

## Detail pass (after the floor is clean)

Run `inspect ... --details` and open every crop in `<out>/details/`. For each control kind ask: built to the sheet?
same height as its row-mates? focus and hover designed? dark mode designed? text aligned to the 4 px grid?
Fix until every crop looks intentional at 2x. The reviewer receives the same crops.
