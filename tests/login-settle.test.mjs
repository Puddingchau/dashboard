import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('index.html and dashboard.html share the login-settle helpers', () => {
  for (const name of ['foregroundSyncPlan', 'dashboardVisibleSig', 'tryGdriveSilentRestore', 'refreshGcalAccessToken', 'scheduleGcalSync', 'holdDashBoot', 'reRenderAfterSyncNow', 'startFirebaseSync', 'ensureFirebasePersistence', 'firebaseSignIn', 'takeStoredGcalToken', 'storeGdriveToken', 'restoreGdriveTokenFromSession']) {
    assert.equal(extractFn(indexHtml, name), extractFn(dashHtml, name), name);
  }
});

test('status pills stay one fixed row so login labels cannot change header height', () => {
  for (const html of [indexHtml, dashHtml]) {
    assert.match(html, /\.sync-actions \{[^}]*flex-wrap:\s*nowrap;/s);
    assert.match(html, /\.sync-actions \{[^}]*height:\s*32px;/s);
    assert.match(html, /\.sync-actions \{[^}]*max-height:\s*32px;/s);
    assert.match(html, /html\.sync-settling/);
  }
});

test('a saved Calendar token does not open another silent popup', () => {
  for (const html of [indexHtml, dashHtml]) {
    const fn = extractFn(html, 'tryGdriveSilentRestore');
    const early = fn.indexOf('if (gdriveAccessToken)');
    const popup = fn.indexOf('refreshGcalAccessToken()');
    assert.ok(early > 0 && popup > early);
    assert.match(fn, /return;\s*\}\s*\n\s*\/\/ No saved token/);
    const sched = fn.indexOf('scheduleGcalSync', early);
    const ret = fn.indexOf('return;', early);
    assert.ok(ret > early && (sched === -1 || sched > ret));
  }
});

test('cold open paints one flat theme, then the photo and the UI together', () => {
  for (const html of [indexHtml, dashHtml]) {
    assert.match(html, /html\.dash-booting\.theme-sunny-beach body::before/);
    assert.match(html, /background-image:\s*none !important/);
    assert.match(html, /function waitForBootImage/);
    assert.match(html, /localStorage\.setItem\(GDRIVE_TOKEN_SESSION_KEY/);
    assert.equal(html.includes('transition: background 0.4s ease'), false);
    assert.match(html, /id="dash-fonts"/);
    assert.match(html, /media="print"/);
    assert.match(html, /waitDashBootHolds\(2500\)/);
  }
});

test('open stays covered until the first pull, and the root scroller does not bounce', () => {
  for (const html of [indexHtml, dashHtml]) {
    assert.equal(html.includes('setTimeout(ready, 1800)'), false);
    assert.match(html, /scrollRestoration/);
    assert.match(html, /scroll-behavior:\s*auto;/);
    assert.equal(html.includes('scroll-behavior: smooth'), false);
    assert.match(html, /flex-wrap:\s*nowrap;/);
    assert.match(html, /function holdDashBoot/);
    assert.match(html, /waitDashBootHolds\(2500\)/);
    assert.match(extractFn(html, 'reRenderAfterSyncNow'), /minHeight/);
  }
});

test('user-visible brand is 小布丁', () => {
  for (const html of [indexHtml, dashHtml]) {
    const visible = html.replace(/布丁仔-sync\.json/g, '');
    assert.equal(visible.includes('布丁仔'), false);
    assert.match(html, /<title>小布丁<\/title>/);
    assert.match(html, /<h1 class="font-display">小布丁<\/h1>/);
    assert.match(html, /本機儲存；列表經 Firebase 自動同步 · 小布丁/);
    assert.match(html, /只睇模式 · 改動唔會儲存 · 小布丁/);
    assert.match(html, /const GDRIVE_SYNC_FILENAME = '布丁仔-sync\.json';/);
  }
});

test('cold open restores Firebase and Calendar without the Google sign-in page', () => {
  for (const html of [indexHtml, dashHtml]) {
    const refresh = extractFn(html, 'refreshGcalAccessToken');
    assert.match(refresh, /prompt:\s*'none'/);
    assert.equal(refresh.includes("prompt: ''"), false);
    assert.equal(refresh.includes("prompt: 'consent'"), false);
    assert.equal(refresh.includes("prompt: 'select_account'"), false);
    assert.match(refresh, /win === window/);
    assert.match(refresh, /if \(VIEW_ONLY \|\| !gdriveHasClientId\(\)\) return false;/);
    const signIn = extractFn(html, 'firebaseSignIn');
    assert.match(signIn, /if \(VIEW_ONLY \|\| !firebaseSdkReady\(\)\) return;/);
    assert.match(signIn, /setCustomParameters\(\{ login_hint: GCAL_ACCOUNT_EMAIL \}\)/);
    assert.equal(signIn.includes("prompt: 'select_account'"), false);
    assert.match(signIn, /ensureFirebasePersistence\(\)/);
    assert.match(extractFn(html, 'ensureFirebasePersistence'), /Persistence\.LOCAL/);
    assert.match(extractFn(html, 'startFirebaseSync'), /ensureFirebasePersistence\(\)/);
    assert.match(extractFn(html, 'startFirebaseSync'), /if \(VIEW_ONLY\) return Promise\.resolve\(\);/);
    assert.match(extractFn(html, 'tryGdriveSilentRestore'), /if \(VIEW_ONLY\) return;/);
    assert.match(html, /const ENABLE_DRIVE_SYNC = false;/);
  }
});

test('an expired Calendar token is dropped and a live one is reused', () => {
  const src = extractFn(indexHtml, 'takeStoredGcalToken');
  const context = {};
  vm.createContext(context);
  vm.runInContext(
    'const GDRIVE_TOKEN_SESSION_KEY = "dash-hub-gdrive-token";\n' + src + '\nthis.take = takeStoredGcalToken;\n',
    context
  );
  const key = 'dash-hub-gdrive-token';
  const mem = {
    data: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this.data, k) ? this.data[k] : null; },
    removeItem(k) { delete this.data[k]; }
  };
  mem.data[key] = JSON.stringify({ token: 'ya29.fresh', exp: Date.now() + 60000 });
  assert.equal(context.take(mem), 'ya29.fresh');
  assert.equal(mem.data[key].includes('ya29.fresh'), true);
  mem.data[key] = JSON.stringify({ token: 'ya29.stale', exp: Date.now() - 1000 });
  assert.equal(context.take(mem), '');
  assert.equal(Object.prototype.hasOwnProperty.call(mem.data, key), false);
  mem.data[key] = 'ya29.legacy';
  assert.equal(context.take(mem), 'ya29.legacy');
});

test('Drive file sync stays off and default filters stay 今天 / 個人活動', () => {
  for (const html of [indexHtml, dashHtml]) {
    assert.match(html, /const ENABLE_DRIVE_SYNC = false;/);
    assert.match(html, /data-todotab="today"/);
    assert.match(html, /data-events-kind="personal"/);
    assert.match(html, /base\.todoTab = 'today'/);
    assert.match(html, /base\.eventsKind = 'personal'/);
  }
});

const planSrc = extractFn(indexHtml, 'foregroundSyncPlan');
const sigSrc = extractFn(indexHtml, 'dashboardVisibleSig');
const context = { state: null };
vm.createContext(context);
vm.runInContext(planSrc + '\n' + sigSrc + '\n', context);

test('foreground sync ignores OAuth noise and throttles Calendar with Firestore', () => {
  const plan = context.foregroundSyncPlan;
  const base = {
    viewOnly: false,
    oauthBlocking: false,
    hidden: false,
    firebaseCanWrite: true,
    firebaseAt: 0,
    gcalToken: true,
    gcalAt: 0,
    gapMs: 10000
  };
  assert.equal(plan(20_000, base), 'firebase');
  assert.equal(plan(20_000, Object.assign({}, base, { oauthBlocking: true })), 'skip');
  assert.equal(plan(20_000, Object.assign({}, base, { hidden: true })), 'skip');
  assert.equal(plan(20_000, Object.assign({}, base, { viewOnly: true })), 'skip');
  assert.equal(plan(20_000, Object.assign({}, base, { firebaseAt: 15_000 })), 'gcal');
  assert.equal(plan(20_000, Object.assign({}, base, { firebaseAt: 15_000, gcalAt: 15_000 })), 'skip');
  assert.equal(plan(20_000, Object.assign({}, base, {
    firebaseCanWrite: false,
    firebaseAt: 15_000,
    gcalAt: 0
  })), 'gcal');
  assert.equal(plan(20_000, Object.assign({}, base, {
    firebaseCanWrite: false,
    gcalToken: false
  })), 'skip');
});

test('Calendar ids and the sync watermark do not count as a visible change', () => {
  context.state = {
    todos: [{ id: 't1', title: '交數卷', due: '2026-10-20', done: false, sortOrder: 1024 }],
    events: [{ id: 'e1', title: '覆診', date: '2026-10-21', time: '10:00', work: '', done: false, kind: 'personal', sortOrder: 1024, gcalEventId: 'g1', gcalUpdated: 1 }],
    shortcuts: [],
    categories: [],
    busStops: [],
    theme: 'rain-cafe',
    todoTab: 'today',
    eventsFilter: 'today',
    eventsKind: 'personal',
    trainingExpanded: false,
    busExpanded: false,
    share: { enabled: false, expiresAt: 0, updatedAt: 0 },
    syncUpdatedAt: 10
  };
  const before = context.dashboardVisibleSig();
  context.state.events[0].gcalEventId = 'g2';
  context.state.events[0].gcalUpdated = 999;
  context.state.syncUpdatedAt = 50;
  context.state.events[0].updatedAt = 50;
  assert.equal(context.dashboardVisibleSig(), before);
  context.state.todos[0].sortOrder = 2048;
  assert.notEqual(context.dashboardVisibleSig(), before);
});
