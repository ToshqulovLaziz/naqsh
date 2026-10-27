# Surface: app (ERP, admin, dashboards)

People work here for hours. Optimise for scanning, entering data and not making mistakes — and still make it
look like **this company's** product, not a template.

Tokens, every control (language switcher, select, date, checkbox, toasts...), dark recipe and the signature
moment: `references/components.md`. Read it before building controls.

## Answer, don't display (most important)

A work screen wins on what it tells the user, not on decoration. Before styling, write for each screen the question
it answers ("how is this month going, and what needs action?") and derive from the **existing** mock/real data:

- **Title subline = the finding**, not a greeting: "5 products below minimum · 6 orders awaiting payment".
- **Shortfalls and deltas** next to raw numbers: stock vs minimum with "15 short", worst first; KPI deltas vs period.
- **Breakdowns that navigate:** status counts (with %) that link to the filtered list (`/orders?status=new`).
- **Filters that count:** status filter as count cards or chips whose numbers follow the search.
- **Forms that help:** selecting a customer shows their city/phone; a line shows stock and warns (not blocks) when
  quantity exceeds it; the total is the largest figure in a sticky summary.
- **People and codes:** stable pale initials for managers/users; IDs and SKUs in mono.

Only derive what the data supports; never invent numbers. New labels go through i18n in every locale.

## Character (from the dealt sheet)

- Titles 22–32 px; the one **answer figure** per screen (revenue, order total) ~1.3× its siblings and the boldest
  weight. Big type is for that figure, not for every heading.
- Colour follows the sheet's budget: on achromatic sheets the chrome is ink and ground, and colour appears only on
  data (current period, warnings, critical). On expressive sheets the sidebar or a tile may carry the colour.
- One recognisable detail repeated everywhere (seam band, pale pills, hairline strips, a product mark).
- A small product mark/wordmark built from the product name (inline SVG), not a letter in a box.
- Neutral surfaces are tinted on purpose (stone, sand), never default Tailwind gray/slate.
- Serif faces are for pages, not for app UI, unless the sheet says otherwise.

## System first

Decide once, write in `DESIGN.md`, apply everywhere:

- **Shell:** sidebar (many modules) or topbar (few). Put search, language, theme and user in the sidebar so the
  content area has no second bar. One primary action per screen, top right of the title row. Mobile: a 48 px bar
  (menu, mark, screen name, one action) opening a full-screen sheet that closes on navigation and Esc.
- **Density:** comfortable (40 px rows) or compact (32 px rows). One choice for the whole app.
- **Type:** one UI family with tabular figures and Cyrillic (Geist, Inter, IBM Plex Sans, Golos Text, Manrope, Onest).
  Mono only for codes/IDs if it helps scanning.
- **Colour:** neutral ground; one brand accent for primary actions and selection; status colours reserved for status.
  Status = colour **and** text/icon, never colour alone.
- **Radius, border, shadow:** one radius scale; prefer 1 px borders and dividers over shadows; shadows only for
  overlays (menus, dialogs, toasts).

## Tables

- Header row sticky; column headers short; sort state visible on the sorted column only.
- Numbers, money, quantities: right-aligned, `tabular-nums`, same decimals per column; currency in the header
  or as a quiet suffix. Dates and IDs: left-aligned, tabular.
- Row hover is subtle; selection is clear (checkbox + tint). Bulk actions appear only when rows are selected.
- Empty, loading (skeleton rows, not spinners over the page), error and "no results for filter" states exist.
- Pagination or virtualisation shows the total and the current range.
- On mobile: priority columns + row tap to detail, or horizontal scroll inside the table container only.

## Forms

- One column for data entry; labels above fields; required marked once (legend explains the mark).
- Validation on blur and on submit; message under the field, in i18n, saying how to fix it.
- Primary action bottom-right (or sticky footer on long forms); destructive actions separated and confirmed.
- Computed values (subtotal, VAT, total) right-aligned, tabular, visibly read-only.

## Dashboards

- 3–5 KPIs max in one strip, each with period and comparison; no decorative icons in gradient blobs.
- Next to the chart, the list that needs action (low stock, overdue); below, recent items and a status breakdown.
- Charts: one message per chart, labelled axes, theme-aware colours (charts must change in dark mode).
- Tables and lists on a dashboard link to their full screen.

## States and feedback

Every async action shows progress and result (toast or inline). Toasts do not bounce. Focus moves sensibly
after dialogs close and after navigation.

## Consistency check

Before finishing, open every screen at the same width and compare: page title position, filter bar, primary
action placement, table style, empty state style. Any difference needs a reason.
