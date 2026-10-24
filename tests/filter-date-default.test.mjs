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

const HELPERS = ['addDaysToYmd', 'defaultDueForTodoTab', 'defaultDateForEventsFilter'];

test('index.html and dashboard.html share the filter date helpers', () => {
  for (const name of HELPERS) {
    assert.equal(extractFn(indexHtml, name), extractFn(dashHtml, name));
  }
  assert.equal(extractFn(indexHtml, 'openTodoAddModal'), extractFn(dashHtml, 'openTodoAddModal'));
  assert.equal(extractFn(indexHtml, 'openEventAddModal'), extractFn(dashHtml, 'openEventAddModal'));
});

function loadHelpers(html) {
  const context = { hkTodayYMD() { return '2026-10-24'; } };
  vm.createContext(context);
  vm.runInContext(
    'function pad2(n) { return String(n).padStart(2, "0"); }\n' +
      HELPERS.map(name => extractFn(html, name)).join('\n'),
    context
  );
  return context;
}

for (const [file, html] of [['index.html', indexHtml], ['dashboard.html', dashHtml]]) {
  test(file + ' maps the active tab to a Hong Kong calendar day', () => {
    const api = loadHelpers(html);
    assert.equal(api.addDaysToYmd('2026-10-31', 1), '2026-11-01');
    assert.equal(api.addDaysToYmd('2026-03-01', -1), '2026-02-28');
    assert.equal(api.defaultDueForTodoTab('today'), '2026-10-24');
    assert.equal(api.defaultDueForTodoTab('tomorrow'), '2026-10-25');
    assert.equal(api.defaultDueForTodoTab('dayAfter'), '2026-10-26');
    // 七天內 is today…today+6. First day of that range is today.
    assert.equal(api.defaultDueForTodoTab('week'), '2026-10-24');
    // 未完成 has no single day. Today stays editable.
    assert.equal(api.defaultDueForTodoTab('overdue'), '2026-10-24');
    assert.equal(api.defaultDueForTodoTab('nope'), '2026-10-24');

    assert.equal(api.defaultDateForEventsFilter('today'), '2026-10-24');
    assert.equal(api.defaultDateForEventsFilter('tomorrow'), '2026-10-25');
    assert.equal(api.defaultDateForEventsFilter('dayAfter'), '2026-10-26');
    // 一周內 starts today. 全部 has no window, so today is the editable default.
    assert.equal(api.defaultDateForEventsFilter('week'), '2026-10-24');
    assert.equal(api.defaultDateForEventsFilter('all'), '2026-10-24');
    assert.equal(api.defaultDateForEventsFilter(null), '2026-10-24');
  });

  test(file + ' prefills add forms only', () => {
    const addTodo = extractFn(html, 'openTodoAddModal');
    const editTodo = extractFn(html, 'openTodoEditModal');
    const addEvent = extractFn(html, 'openEventAddModal');
    const editEvent = extractFn(html, 'openEventEditModal');

    assert.match(addTodo, /defaultDueForTodoTab\(sessionTodoTab \|\| todoTab\)/);
    assert.match(addTodo, /name="due" value="/);
    assert.doesNotMatch(editTodo, /defaultDueForTodoTab/);
    assert.match(editTodo, /name="due" value="' \+ escapeHtml\(t\.due \|\| ''\)/);

    assert.match(addEvent, /defaultDateForEventsFilter\(sessionEventsFilter \|\| \(state && state\.eventsFilter\)\)/);
    assert.match(addEvent, /name="date" required value="/);
    assert.doesNotMatch(editEvent, /defaultDateForEventsFilter/);
    assert.match(editEvent, /name="date" required value="' \+ escapeHtml\(ev\.date\)/);

    assert.match(html, /const ENABLE_DRIVE_SYNC = false;/);
    assert.match(html, /base\.eventsFilter = 'today';/);
    assert.match(html, /base\.eventsKind = 'personal';/);
    assert.match(html, /base\.todoTab = 'today';/);
  });
}
