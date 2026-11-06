import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dashHtml = readFileSync(new URL('../dashboard.html', import.meta.url), 'utf8');

function extractFn(html, name) {
  const sig = 'function ' + name;
  const start = html.indexOf(sig);
  assert.ok(start >= 0, 'missing ' + name);
  let i = html.indexOf('{', start);
  let depth = 0;
  for (; i < html.length; i++) {
    const ch = html[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('unclosed ' + name);
}

function headScript(html) {
  const start = html.indexOf('<script>');
  const end = html.indexOf('</script>', start);
  assert.ok(start >= 0 && end > start);
  return html.slice(start + '<script>'.length, end);
}

function bootTheme(html, opts) {
  opts = opts || {};
  const classes = new Set(['dash-booting']);
  const store = Object.assign({}, opts.storage || {});
  let written = false;
  const themeMeta = {
    content: '',
    setAttribute: function (_name, value) { this.content = value; }
  };
  const root = {
    classList: {
      add: function () { for (const c of arguments) classes.add(c); },
      remove: function () { for (const c of arguments) classes.delete(c); },
      contains: function (c) { return classes.has(c); }
    },
    setAttribute: function () {},
    style: {}
  };
  const context = {
    document: {
      documentElement: root,
      head: { appendChild: function () {} },
      querySelector: function () { return themeMeta; },
      createElement: function () { return {}; }
    },
    localStorage: {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
      setItem: function () { written = true; }
    },
    history: {},
    location: { search: opts.search || '', hash: opts.hash || '' },
    URLSearchParams: URLSearchParams,
    window: {},
    fetch: function () { return Promise.resolve({ ok: false, json: function () { return Promise.resolve(null); } }); },
    setTimeout: function () {},
    Number: Number,
    JSON: JSON,
    Promise: Promise,
    Date: Date
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(headScript(html), context);
  return {
    theme: context.window.__DASH_BOOT_THEME,
    classes: classes,
    color: root.style.backgroundColor,
    meta: themeMeta.content,
    written: written
  };
}

for (const [name, html] of [['index', indexHtml], ['dashboard', dashHtml]]) {
  test(name + ' keeps the boot curtain and adds Provence as a flat colour', () => {
    assert.match(html, /html\.dash-booting\.theme-provence-field body::before/);
    assert.match(html, /html\.dash-booting\.theme-sunny-beach body::before/);
    assert.match(html, /html\.dash-booting\.theme-rain-cafe body::before/);
    assert.match(html, /background-image:\s*none !important/);
    assert.match(html, /provence-field-bg\.jpg/);
    assert.match(html, /function waitForBootImage/);
    assert.match(extractFn(html, 'waitForBootImage'), /provence-field-bg\.jpg/);
    assert.match(extractFn(html, 'waitForBootImage'), /sunny-beach-bg\.jpg/);
    assert.match(extractFn(html, 'waitForBootImage'), /rain-cafe-bg\.jpg/);
    assert.equal(html.includes('transition: background 0.4s ease'), false);
    assert.match(html, /if \(persist !== false\) document\.documentElement\.classList\.add\('theme-animate'\)/);
    assert.match(html, /function holdDashBoot/);
    assert.match(html, /waitDashBootHolds\(2500\)/);
    assert.match(html, /localStorage\.setItem\(GDRIVE_TOKEN_SESSION_KEY/);
  });

  test(name + ' defaults to rain-cafe and keeps the other theme dots', () => {
    assert.match(html, /const SCHEMA_VERSION = 13;/);
    assert.match(html, /if \(prevSchema < 13\) base\.theme = 'rain-cafe';/);
    assert.doesNotMatch(html, /if \(prevSchema < 12\) base\.theme = 'provence-field';/);
    assert.match(html, /const THEME_PRESETS = \['provence-field', 'sunny-beach', 'rain-cafe', 'sky', 'cloud', 'clear', 'dusk', 'toy'\];/);
    assert.match(html, /data-theme="provence-field"/);
    assert.match(html, /data-theme="sunny-beach"/);
    assert.match(html, /data-theme="rain-cafe"/);
    assert.match(html, /aria-label="普羅旺斯田野主題"/);
    assert.match(html, /aria-label="雨窗咖啡主題"/);
    assert.match(html, /body\.theme-rain-cafe \{[\s\S]*?background-image:\s*url\('rain-cafe-bg\.jpg'\)/);
    assert.match(html, /body\.theme-rain-cafe::before \{[\s\S]*?url\('rain-cafe-bg\.jpg'\)/);
    assert.match(html, /body\.theme-rain-cafe \.glass-card,[\s\S]*?backdrop-filter:\s*blur\(26px\)/);
    assert.match(html, /html\.view-only:not\(\.share-unlocked\) \.share-lock \{[\s\S]*?url\('rain-cafe-bg\.jpg'\)/);
    const shareTheme = extractFn(html, 'applyShareEntryTheme');
    assert.match(shareTheme, /const t = 'rain-cafe'/);
    assert.doesNotMatch(shareTheme, /provence-field/);
    assert.doesNotMatch(shareTheme, /localStorage/);
    const apply = extractFn(html, 'applyTheme');
    assert.match(apply, /preset = 'rain-cafe'/);
    assert.match(apply, /persist = false/);
    assert.match(html, /--drag-active-bg:\s*#F6C453/);
    assert.match(html, /body\.theme-provence-field \{[\s\S]*?--drag-active-bg:\s*#E4C04A/);
    assert.match(html, /#6B9F3C/);
    assert.match(html, /#D96B4C/);
  });

  test(name + ' head script paints rain-cafe before schema 13 and keeps a later choice', () => {
    const fresh = bootTheme(html);
    assert.equal(fresh.theme, 'rain-cafe');
    assert.equal(fresh.color, '#C5D4E0');
    assert.equal(fresh.written, false);
    assert.equal(fresh.classes.has('theme-rain-cafe'), true);
    assert.equal(fresh.classes.has('theme-provence-field'), false);

    const legacy = bootTheme(html, {
      storage: { 'dash-hub-v1': JSON.stringify({ schemaVersion: 11, theme: 'sunny-beach' }) }
    });
    assert.equal(legacy.theme, 'rain-cafe');
    assert.equal(legacy.written, false);

    const forced = bootTheme(html, {
      storage: { 'dash-hub-v1': JSON.stringify({ schemaVersion: 12, theme: 'provence-field' }) }
    });
    assert.equal(forced.theme, 'rain-cafe');
    assert.equal(forced.written, false);
    assert.equal(forced.classes.has('theme-provence-field'), false);

    const once = bootTheme(html, {
      storage: { 'dash-hub-v1': JSON.stringify({ schemaVersion: 12, theme: 'sunny-beach' }) }
    });
    assert.equal(once.theme, 'rain-cafe');
    assert.equal(once.written, false);

    const kept = bootTheme(html, {
      storage: { 'dash-hub-v1': JSON.stringify({ schemaVersion: 13, theme: 'provence-field' }) }
    });
    assert.equal(kept.theme, 'provence-field');
    assert.equal(kept.color, '#4C9BE0');
    assert.equal(kept.classes.has('theme-provence-field'), true);
    assert.equal(kept.classes.has('theme-rain-cafe'), false);

    const beach = bootTheme(html, {
      storage: { 'dash-hub-v1': JSON.stringify({ schemaVersion: 13, theme: 'sunny-beach' }) }
    });
    assert.equal(beach.theme, 'sunny-beach');
    assert.equal(beach.written, false);

    const share = bootTheme(html, {
      search: '?view=1',
      storage: { 'dash-hub-v1': JSON.stringify({ schemaVersion: 13, theme: 'sunny-beach' }) }
    });
    assert.equal(share.theme, 'rain-cafe');
    assert.equal(share.classes.has('view-only'), true);
    assert.equal(share.classes.has('theme-sunny-beach'), false);
    assert.equal(share.classes.has('theme-rain-window'), false);
    assert.equal(share.written, false);
    assert.equal(share.meta, '#C5D4E0');
  });
}

test('provence background is a reasonably sized jpeg', () => {
  const file = new URL('../provence-field-bg.jpg', import.meta.url);
  const size = statSync(file).size;
  assert.ok(size > 20000 && size < 400000, 'size ' + size);
  const bytes = readFileSync(file);
  assert.equal(bytes[0], 0xff);
  assert.equal(bytes[1], 0xd8);
});

test('rain-cafe background is a reasonably sized jpeg', () => {
  const file = new URL('../rain-cafe-bg.jpg', import.meta.url);
  const size = statSync(file).size;
  assert.ok(size > 20000 && size < 400000, 'size ' + size);
  const bytes = readFileSync(file);
  assert.equal(bytes[0], 0xff);
  assert.equal(bytes[1], 0xd8);
});
