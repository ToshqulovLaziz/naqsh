# Surface: app (ERP, admin, dashboards)

People work here for hours. Optimise for scanning, entering data and not making mistakes. Novelty lives in
details (type, numbers, states), not in layout tricks.

## System first

Decide once, write in `DESIGN.md`, apply everywhere:

- **Shell:** sidebar (many modules) or topbar (few). Mobile: drawer that closes on navigation.
- **Density:** comfortable (40 px rows) or compact (32 px rows). One choice for the whole app.
- **Type:** one UI family with tabular figures and Cyrillic (Inter, IBM Plex Sans, Golos Text, Manrope, Onest).
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

- 3–5 KPIs max, each with period and comparison; no decorative icons in gradient blobs.
- Charts: one message per chart, labelled axes, theme-aware colours (charts must change in dark mode).
- Tables and lists on a dashboard link to their full screen.

## States and feedback

Every async action shows progress and result (toast or inline). Toasts do not bounce. Focus moves sensibly
after dialogs close and after navigation.

## Consistency check

Before finishing, open every screen at the same width and compare: page title position, filter bar, primary
action placement, table style, empty state style. Any difference needs a reason.
