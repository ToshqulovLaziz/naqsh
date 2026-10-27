// Minimal Chrome DevTools Protocol client: finds a Chromium browser, launches it headless,
// talks CDP over Node's built-in WebSocket (Node >= 22). No npm dependencies.
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir, homedir, platform } from 'node:os';
import { join } from 'node:path';

function playwrightBrowsers() {
  const base = platform() === 'win32'
    ? join(process.env.LOCALAPPDATA ?? '', 'ms-playwright')
    : platform() === 'darwin' ? join(homedir(), 'Library', 'Caches', 'ms-playwright') : join(homedir(), '.cache', 'ms-playwright');
  if (!existsSync(base)) return [];
  const rel = platform() === 'win32' ? ['chrome-win', 'chrome.exe']
    : platform() === 'darwin' ? ['chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'] : ['chrome-linux', 'chrome'];
  return readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse().map((d) => join(base, d, ...rel));
}

export function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  let candidates = [];
  if (platform() === 'win32') {
    const roots = [process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)'], process.env.LOCALAPPDATA].filter(Boolean);
    const apps = ['Google\\Chrome\\Application\\chrome.exe', 'Microsoft\\Edge\\Application\\msedge.exe',
      'Chromium\\Application\\chrome.exe', 'BraveSoftware\\Brave-Browser\\Application\\brave.exe'];
    candidates = roots.flatMap((r) => apps.map((a) => join(r, a)));
  } else if (platform() === 'darwin') {
    candidates = ['Google Chrome', 'Microsoft Edge', 'Chromium', 'Brave Browser']
      .map((n) => `/Applications/${n}.app/Contents/MacOS/${n}`);
  } else {
    for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge']) {
      try { candidates.push(execFileSync('which', [bin], { encoding: 'utf8' }).trim()); } catch {}
    }
  }
  const found = [...candidates, ...playwrightBrowsers()].find((p) => p && existsSync(p));
  if (!found) throw new Error('No Chrome/Edge/Chromium found. Install one or set CHROME_PATH.');
  return found;
}

export async function launch() {
  const exe = findBrowser();
  const userDataDir = mkdtempSync(join(tmpdir(), 'naqsh-chrome-'));
  const proc = spawn(exe, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${userDataDir}`,
    '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
    '--mute-audio', '--disable-extensions', 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const wsUrl = await new Promise((resolve, reject) => {
    let buf = '';
    const timer = setTimeout(() => reject(new Error(`Browser did not start: ${exe}\n${buf.slice(-500)}`)), 20000);
    proc.stderr.on('data', (d) => {
      buf += d;
      const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
      if (m) { clearTimeout(timer); resolve(m[1]); }
    });
    proc.on('exit', (code) => { clearTimeout(timer); reject(new Error(`Browser exited (${code}): ${exe}\n${buf.slice(-500)}`)); });
  });

  const cdp = await CDP.connect(wsUrl);
  cdp.browserPath = exe;
  cdp.dispose = async () => {
    try { await cdp.send('Browser.close'); } catch {}
    cdp.close();
    proc.kill();
    // Chrome may hold files briefly after exit on Windows.
    for (let i = 0; i < 10; i++) {
      try { rmSync(userDataDir, { recursive: true, force: true }); break; } catch { await new Promise((r) => setTimeout(r, 300)); }
    }
  };
  return cdp;
}

export class CDP {
  #ws; #id = 0; #pending = new Map(); #listeners = new Map();

  static connect(url) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      ws.onopen = () => resolve(new CDP(ws));
      ws.onerror = (e) => reject(new Error(`CDP connect failed: ${e.message ?? e.type}`));
    });
  }

  constructor(ws) {
    this.#ws = ws;
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.#pending.has(msg.id)) {
        const { resolve, reject, method } = this.#pending.get(msg.id);
        this.#pending.delete(msg.id);
        msg.error ? reject(new Error(`${method}: ${msg.error.message}`)) : resolve(msg.result);
      } else if (msg.method) {
        for (const fn of this.#listeners.get(msg.method) ?? []) fn(msg.params, msg.sessionId);
      }
    };
  }

  send(method, params = {}, sessionId) {
    const id = ++this.#id;
    return new Promise((resolve, reject) => {
      this.#pending.set(id, { resolve, reject, method });
      this.#ws.send(JSON.stringify({ id, method, params, ...(sessionId && { sessionId }) }));
    });
  }

  on(method, fn) {
    if (!this.#listeners.has(method)) this.#listeners.set(method, new Set());
    this.#listeners.get(method).add(fn);
    return () => this.#listeners.get(method).delete(fn);
  }

  // Resolve on the first matching event for this session, or after timeoutMs.
  waitFor(method, sessionId, timeoutMs = 20000) {
    return new Promise((resolve) => {
      const off = this.on(method, (params, sid) => {
        if (sid !== sessionId) return;
        off(); clearTimeout(t); resolve(params);
      });
      const t = setTimeout(() => { off(); resolve(null); }, timeoutMs);
    });
  }

  close() { this.#ws.close(); }

  // Open a page target and return a session-bound helper.
  async newPage() {
    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    const page = {
      sessionId,
      send: (m, p) => this.send(m, p, sessionId),
      on: (m, fn) => this.on(m, (p, sid) => sid === sessionId && fn(p)),
      waitFor: (m, ms) => this.waitFor(m, sessionId, ms),
      close: () => this.send('Target.closeTarget', { targetId }).catch(() => {}),
    };
    return page;
  }
}
