# Checks: how to run and read them

Two scripts, Node ≥ 22, no npm install. `<skill>` = this skill's base directory.

## lint (static, seconds)

```
node <skill>/scripts/lint.mjs <projectRoot> [--dir src] [--json]
```

Run after every batch of edits. Exit code 1 = at least one FAIL.

## inspect (real browser, ~4 s per run)

Needs a running server. Build, start `preview` (or dev) on a free port **in the background**, inspect, then stop it.

```
node <skill>/scripts/inspect.mjs http://localhost:PORT \
  --surface page|app --routes /,/orders --widths 1440,768,390 \
  --locales uz,ru,en --locale-key <localStorage key the app reads> \
  --themes "dark:<key>=<val>,light:<key>=<val>" --out .naqsh/inspect
```

- Find the locale and theme keys in the app's i18n / theme code before running. Omit `--themes` if there is no theme switch.
- Extra locales are checked at the narrowest width only; add `--full` for every width.
- Screenshots land in `--out` as `<route>-<width>-<locale>-<theme>-{fold,full}.png`. **Look at them** — the checks
  measure, they do not judge.
- Browser lookup: Chrome, Edge, Chromium, Brave, Playwright's Chromium. Set `CHROME_PATH` if none is found.

## Reading findings

`SEVERITY TIER RULE  where — detail`, then one fix line per rule.

| Tier | Meaning |
|---|---|
| floor | Must be fixed. Waivers are ignored. |
| reflex | Fix, or waive with a written reason that the direction justifies. |

A `contrast` WARN near 1:1 means the real background is a pseudo-element or sibling layer: check the screenshot.
`i18n-hardcoded` is a heuristic: brand names and symbols are fine; real copy is not.

## Waivers

`.naqsh/waivers.json` in the project root:

```json
[{ "id": "glass", "where": "src/components/Header.tsx", "reason": "Direction 'night console' uses one frosted bar by design" }]
```

`where` is an optional substring of the finding location. List every waiver in `DESIGN.md`.

## Judged checks (no script — answer them in the report)

- First screen: does a stranger know whose/what this is and what to do next?
- One idea: can the direction be said in one sentence, and is it visible without scrolling?
- Hierarchy: one dominant element per screen; nothing competes with it.
- Consistency (`app`): same pattern looks and behaves the same on every screen.
- Copy: every visible string is real, specific and translated; nothing invented.
