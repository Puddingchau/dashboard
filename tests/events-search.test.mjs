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

const FNS = [
  'normalizeEventsQuery',
  'currentEventsQuery',
  'eventsSearchHistoryStorageKey',
  'readEventsSearchHistory',
  'writeEventsSearchHistory',
  'rememberEventsSearchQuery',
  'forgetEventsSearchQuery',
  'clearEventsSearchHistory',
  'commitEventsSearchHistory',
  'commitActiveEventsSearch',
  'hideEventsSearchHistory',
  'placeEventsSearchHistory',
  'renderEventsSearchHistory',
  'handleEventsSearchHistoryActivate',
  'eventMatchesQuery',
  'eventPassesEventsView',
  'eventsFilterHintText',
  'eventsFilterEmptyText',
  'clearEventsQuery',
  'syncEventsSearchUI'
];

test('index.html and dashboard.html share the events search helpers', () => {
  for (const name of FNS) {
    assert.equal(extractFn(indexHtml, name), extractFn(dashHtml, name), name);
  }
  for (const html of [indexHtml, dashHtml]) {
    assert.match(html, /id="eventsSearchInput"/);
    assert.match(html, /id="eventsSearchClear"/);
    assert.match(html, /eventPassesEventsView\(ev, kind, filter, query\)/);
    assert.match(html, /if \(currentEventsQuery\(\)\) return;/);
    assert.match(html, /ENABLE_DRIVE_SYNC = false/);
    assert.match(html, /確定刪除此活動/);
    assert.doesNotMatch(extractFn(html, 'saveState'), /eventsQuery|sessionEventsQuery|dash-events-search-history/);
    assert.doesNotMatch(extractFn(html, 'buildExportPayload'), /eventsQuery|sessionEventsQuery|dash-events-search-history/);
    assert.doesNotMatch(extractFn(html, 'buildSyncPayload'), /eventsQuery|sessionEventsQuery|dash-events-search-history/);
    assert.doesNotMatch(html, /id="todosSearchInput"/);
    assert.match(html, /id="eventsSearchHistory"/);
    assert.match(html, /最近搜尋/);
    assert.match(html, /清除全部/);
    assert.equal(extractFn(html, 'eventsSearchHistoryStorageKey').includes('dash-events-search-history-v1'), true);
  }
});

function memoryStorage() {
  const data = Object.create(null);
  return {
    getItem(k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
    setItem(k, v) { data[k] = String(v); },
    removeItem(k) { delete data[k]; }
  };
}

function loadSearch(html) {
  const context = {
    eventKindOf(ev) { return ev && ev.kind === 'school' ? 'school' : 'personal'; },
    normalizeEventsKind(raw) { return raw === 'school' ? 'school' : 'personal'; },
    eventInFilter(ev, filter) { return !!(ev && ev.bucket === filter); },
    eventsKindLabel(kind) { return kind === 'school' ? '學校活動' : '個人活動'; },
    normalizeEventsFilter(raw) { return raw || 'today'; },
    getEventsFilterRange() { return { label: '今天' }; },
    state: { eventsKind: 'personal', eventsFilter: 'today' },
    sessionEventsQuery: '',
    localStorage: memoryStorage(),
    saveState() { throw new Error('saveState'); },
    scheduleCloudSync() { throw new Error('scheduleCloudSync'); }
  };
  vm.createContext(context);
  vm.runInContext(
    FNS.map(name => extractFn(html, name)).join('\n'),
    context
  );
  return context;
}

for (const [file, html] of [['index.html', indexHtml], ['dashboard.html', dashHtml]]) {
  test(file + ' matches title, notes, and location without caring about case', () => {
    const api = loadSearch(html);
    const ev = {
      kind: 'personal',
      title: 'Gov Dr 營養',
      work: '帶血液報告',
      location: '中環診所',
      bucket: 'later'
    };
    assert.equal(api.eventMatchesQuery(ev, '  營養 '), true);
    assert.equal(api.eventMatchesQuery(ev, 'gov'), true);
    assert.equal(api.eventMatchesQuery(ev, 'GOV DR'), true);
    assert.equal(api.eventMatchesQuery(ev, '血液'), true);
    assert.equal(api.eventMatchesQuery(ev, '診所'), true);
    assert.equal(api.eventMatchesQuery(ev, '疫苗'), false);
    assert.equal(api.eventMatchesQuery({ title: 'Dr choi Vaccinate', work: '' }, 'vaccinate'), true);
    assert.equal(api.eventMatchesQuery({ title: 'Dr choi Vaccinate', work: '' }, 'VAC'), true);
    assert.equal(api.normalizeEventsQuery('   '), '');
  });

  test(file + ' searches every date of the current kind, then restores the day filter', () => {
    const api = loadSearch(html);
    const later = { kind: 'personal', title: 'Gov Dr 營養', bucket: 'later' };
    const today = { kind: 'personal', title: '今日覆診', bucket: 'today' };
    const school = { kind: 'school', title: 'Gov Dr 營養', work: '學校備註', bucket: 'later' };

    assert.equal(api.eventPassesEventsView(later, 'personal', 'today', ''), false);
    assert.equal(api.eventPassesEventsView(today, 'personal', 'today', ''), true);
    assert.equal(api.eventPassesEventsView(later, 'personal', 'today', '營養'), true);
    assert.equal(api.eventPassesEventsView(school, 'personal', 'today', '營養'), false);
    assert.equal(api.eventPassesEventsView(school, 'school', 'today', '備註'), true);
    assert.equal(api.eventPassesEventsView(school, 'school', 'today', '   '), false);

    api.sessionEventsQuery = '營養';
    api.state.eventsKind = 'personal';
    assert.equal(api.eventsFilterHintText(), '搜尋全部個人活動（不限日期）');
    api.state.eventsKind = 'school';
    assert.equal(api.eventsFilterEmptyText(), '找不到符合「營養」的學校活動');
    api.sessionEventsQuery = '';
    api.state.eventsFilter = 'today';
    api.state.eventsKind = 'personal';
    assert.equal(api.eventsFilterHintText(), '顯示今天的個人活動');
    assert.equal(api.eventsFilterEmptyText(), '今天暫無個人活動');
  });

  test(file + ' keeps the newest 10 searches and moves a repeat to the top', () => {
    const api = loadSearch(html);
    assert.equal(api.eventsSearchHistoryStorageKey(), 'dash-events-search-history-v1');
    assert.equal(JSON.stringify(api.rememberEventsSearchQuery('   ')), '[]');
    assert.equal(JSON.stringify(api.rememberEventsSearchQuery('  生態   閣保養  ')), '["生態 閣保養"]');

    api.rememberEventsSearchQuery('魚缸');
    api.rememberEventsSearchQuery('生態閣保養');
    api.rememberEventsSearchQuery('eco');
    api.rememberEventsSearchQuery('ECO');
    const topped = JSON.parse(JSON.stringify(api.readEventsSearchHistory()));
    assert.equal(topped[0], 'ECO');
    assert.equal(topped.filter(item => item.toLowerCase() === 'eco').length, 1);
    assert.deepEqual(topped.slice(1), ['生態閣保養', '魚缸', '生態 閣保養']);

    for (let i = 1; i <= 12; i++) api.rememberEventsSearchQuery('q' + i);
    const capped = api.readEventsSearchHistory();
    assert.equal(capped.length, 10);
    assert.equal(capped[0], 'q12');
    assert.equal(capped[9], 'q3');
    assert.equal(capped.includes('q1'), false);
    assert.equal(capped.includes('q2'), false);
    assert.equal(capped.includes('生態閣保養'), false);

    const dropped = JSON.parse(JSON.stringify(api.forgetEventsSearchQuery('Q12')));
    assert.equal(dropped[0], 'q11');
    assert.equal(dropped.includes('q12'), false);
    assert.equal(JSON.stringify(api.clearEventsSearchHistory()), '[]');
    assert.equal(api.localStorage.getItem('dash-hub-v1'), null);
    const stored = JSON.parse(api.localStorage.getItem('dash-events-search-history-v1'));
    assert.deepEqual(stored, { items: [] });
  });

  test(file + ' replaces an in-progress prefix instead of storing every pause', () => {
    const api = loadSearch(html);
    let step = api.commitEventsSearchHistory('生', '');
    assert.equal(JSON.stringify(step.items), '["生"]');
    step = api.commitEventsSearchHistory('生態閣保養', step.burst);
    assert.equal(JSON.stringify(step.items), '["生態閣保養"]');
    assert.equal(step.burst, '生態閣保養');
    step = api.commitEventsSearchHistory('魚缸', step.burst);
    assert.equal(JSON.stringify(step.items), '["魚缸","生態閣保養"]');
    step = api.commitEventsSearchHistory('   ', step.burst);
    assert.equal(JSON.stringify(step.items), '["魚缸","生態閣保養"]');
    api.localStorage.setItem('dash-events-search-history-v1', JSON.stringify({
      items: ['生態閣保養', '生態閣保養', 12, '  ', '魚缸']
    }));
    assert.equal(JSON.stringify(api.readEventsSearchHistory()), '["生態閣保養","魚缸"]');
  });
}
