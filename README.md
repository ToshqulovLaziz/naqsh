# naqsh

Design skill for Claude Code. Covers web pages (`page`) and ERP/admin screens (`app`), in `build`, `redesign`
and `audit` modes. Built for uz/ru/en projects and Windows-friendly (Node only).

Status: **v0.5**: "answer, don't display" rules for app screens, achromatic app directions, per-surface taste profile, fresh-context reviewer, read-only `audit` mode, `deal.mjs`, `lint.mjs` and `inspect.mjs`. See the roadmap below.

## Install

```
claude plugin marketplace add ToshqulovLaziz/naqsh
claude plugin install naqsh@naqsh
```

Then restart Claude Code and ask it to design or redesign a page, or say "use naqsh".

## Roadmap

| Phase | Scope |
|---|---|
| P0 | Plugin skeleton, marketplace, workflow skill |
| P1 | Rules, static `lint.mjs`, real-browser `inspect.mjs` (CDP), page + app workflows |
| P2 | Direction library and `deal.mjs` with rotation log |
| P3 | Fresh-context reviewer agent, `redesign` / `audit` modes, `DESIGN.md` |
| P4 | Eval against other design skills (ERP: same brief, same checks) |
| v0.5 | Lessons from P4: derived-information rules, achromatic app directions, per-surface taste, cheaper check loop |

## License

MIT. See `LICENSE` and `NOTICE`.
