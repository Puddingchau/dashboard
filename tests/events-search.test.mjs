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
    assert.doesNotMatch(extractFn(html, 'saveState'), /eventsQuery|sessionEventsQuery/);
    assert.doesNotMatch(extractFn(html, 'buildExportPayload'), /eventsQuery|sessionEventsQuery/);
    assert.doesNotMatch(html, /id="todosSearchInput"/);
  }
});

function loadSearch(html) {
  const context = {
    eventKindOf(ev) { return ev && ev.kind === 'school' ? 'school' : 'personal'; },
    normalizeEventsKind(raw) { return raw === 'school' ? 'school' : 'personal'; },
    eventInFilter(ev, filter) { return !!(ev && ev.bucket === filter); },
    eventsKindLabel(kind) { return kind === 'school' ? '學校活動' : '個人活動'; },
    normalizeEventsFilter(raw) { return raw || 'today'; },
    getEventsFilterRange() { return { label: '今天' }; },
    state: { eventsKind: 'personal', eventsFilter: 'today' },
    sessionEventsQuery: ''
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
}
