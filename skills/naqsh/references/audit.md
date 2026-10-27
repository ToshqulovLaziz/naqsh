# Mode: audit

Report on an existing UI without changing it. **No edits to project files** — not even formatting. The only files
you may create are under `.naqsh/` (screenshots) and, if the user asks for a file, `NAQSH_AUDIT.md`.

## Steps

1. Context (SKILL §2): stack, routes, locale and theme keys, build command.
2. Build and start a preview in the background; run `lint.mjs` and `inspect.mjs` over all main routes, every
   locale, both themes, at 1440/768/390. Stop the server afterwards.
3. Look at the screenshots. Note what the checks cannot see (hierarchy, template-likeness, consistency, copy).
4. Only if the user wants redesign directions: `deal.mjs --surface <page|app> --options 3` (dealing does not log;
   only `--pick` does, so do not pick during an audit).

## Report

```
# naqsh audit — <project> (<surface>)

Score: floor <n FAIL> · reflex <n WARN> · judged <0-10>/10

## Fix first (floor)
1. <cause> — <n findings> — <file:line or route @width locale theme>
   Fix: <concrete change, with the CSS/Tailwind/i18n edit to make>
...

## Then (reflex and judged)
...

## What works
<two or three lines, specific>

## If redesigning
<one paragraph: what a redesign should keep and change; optional dealt directions>
```

Group findings by **cause**, not by occurrence (one font-loading bug explains every font-fallback finding).
Order by impact on users: broken > inaccessible > inconsistent > generic.
