// Shared finding model, waivers and output for lint.mjs and inspect.mjs.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ruleMeta } from './rules.mjs';

// A finding: { id, severity: 'FAIL' | 'WARN', where, detail }
export const finding = (id, severity, where, detail = '') => ({ id, severity, where, detail });

// .naqsh/waivers.json: [{ "id": "glass", "where": "src/x.tsx" (optional substring), "reason": "..." }]
export function loadWaivers(root) {
  const p = join(root, '.naqsh', 'waivers.json');
  if (!existsSync(p)) return [];
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    console.error(`naqsh: cannot parse ${p}: ${e.message}`);
    return [];
  }
}

// Floor rules ignore waivers; reflex findings with a matching waiver become WAIVED.
export function applyWaivers(findings, waivers) {
  return findings.map((f) => {
    if (ruleMeta(f.id).tier === 'floor') return f;
    const w = waivers.find((w) => w.id === f.id && w.reason && (!w.where || f.where.includes(w.where)));
    return w ? { ...f, severity: 'WAIVED', detail: `${f.detail} [waived: ${w.reason}]` } : f;
  });
}

const ORDER = { FAIL: 0, WARN: 1, WAIVED: 2 };

export function print(findings, { json = false, title = 'naqsh' } = {}) {
  if (json) {
    console.log(JSON.stringify(findings, null, 2));
    return;
  }
  const sorted = [...findings].sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || a.id.localeCompare(b.id));
  for (const f of sorted) {
    const m = ruleMeta(f.id);
    console.log(`${f.severity.padEnd(6)} ${m.tier.padEnd(6)} ${f.id}  ${f.where}${f.detail ? `  — ${f.detail}` : ''}`);
  }
  const ids = new Set(sorted.filter((f) => f.severity !== 'WAIVED').map((f) => f.id));
  if (ids.size) {
    console.log('\nFixes:');
    for (const id of ids) console.log(`  ${id}: ${ruleMeta(id).fix}`);
  }
  const n = (s) => findings.filter((f) => f.severity === s).length;
  console.log(`\n${title}: ${n('FAIL')} FAIL, ${n('WARN')} WARN, ${n('WAIVED')} WAIVED`);
}

export const exitCode = (findings) => (findings.some((f) => f.severity === 'FAIL') ? 1 : 0);
