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
  for (const name of ['foregroundSyncPlan', 'dashboardVisibleSig', 'tryGdriveSilentRestore', 'refreshGcalAccessToken', 'scheduleGcalSync', 'holdDashBoot', 'reRenderAfterSyncNow', 'startFirebaseSync']) {
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
