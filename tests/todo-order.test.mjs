import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dashHtml = readFileSync(new URL('../dashboard.html', import.meta.url), 'utf8');

function between(html, start, end) {
  const i = html.indexOf(start);
  const j = html.indexOf(end, i + start.length);
  assert.ok(i >= 0 && j > i, 'missing marker ' + start);
  return html.slice(i, j + end.length);
}

const START = '/* TODO_ORDER_SYNC_START';
const END = '/* TODO_ORDER_SYNC_END */';
const indexBlock = between(indexHtml, START, END);
const dashBlock = between(dashHtml, START, END);

test('index.html and dashboard.html share the todo order sync block', () => {
  assert.equal(indexBlock, dashBlock);
});

test('filter tabs are still in place for a later overdue tab', () => {
  assert.match(indexHtml, /data-todotab="today"/);
  assert.match(indexHtml, /data-todotab="tomorrow"/);
  assert.match(indexHtml, /data-todotab="dayAfter"/);
  assert.match(indexHtml, /data-todotab="week"/);
  assert.match(dashHtml, /data-todotab="today"/);
  assert.match(dashHtml, /data-todotab="tomorrow"/);
  assert.match(dashHtml, /data-todotab="week"/);
  assert.match(indexHtml, /function matchesTodoTab/);
  assert.match(dashHtml, /function matchesTodoTab/);
});

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

const itemSyncSrc = extractFn(indexHtml, 'itemSyncTs');
const mergeByIdSrc = extractFn(indexHtml, 'mergeByIdPreferNewer');
const unionSrc = extractFn(indexHtml, 'unionSyncItems');
assert.equal(extractFn(dashHtml, 'unionSyncItems'), unionSrc);
assert.equal(extractFn(dashHtml, 'mergeByIdPreferNewer'), mergeByIdSrc);

const context = {
  uid(prefix) { return prefix + '_gen'; },
  // Mirrors deletionRecordsBlockItem for a todo id: a blocking tombstone at
  // least as new as the row drops it. Order fields are not part of that check.
  deletionRecordsBlockItem(records, item, kind) {
    let at = 0;
    (records || []).forEach(function (rec) {
      if (!rec || rec.blockSync === false) return;
      if (!rec || rec.kind !== kind || !item || String(rec.id) !== String(item.id)) return;
      at = Math.max(at, Number(rec.at) || 0);
    });
    const ts = Number(item && item.updatedAt) || Number(item && item.createdAt) || 0;
    return !!(at && ts <= at);
  }
};
vm.createContext(context);
vm.runInContext(
  itemSyncSrc + '\n' + indexBlock + '\n' + mergeByIdSrc + '\n' + unionSrc + '\n',
  context
);

const PHONE = [
  '早宣',
  'Send P3信息',
  '致電CL客戶',
  '衛蘭演唱會10:00',
  '聯絡機電取相',
  '通知泳觀課',
  '交數卷'
];

function rows(titles, extra) {
  return titles.map(function (title, i) {
    const canonical = PHONE.indexOf(title);
    const n = canonical >= 0 ? canonical : i;
    const row = {
      id: 't' + (n + 1),
      title: title,
      due: '2026-10-20',
      done: false,
      createdAt: 1_000_000 + n,
      updatedAt: 2_000_000 + n
    };
    if (extra) Object.assign(row, extra(row, i));
    return row;
  });
}

function titlesOf(list) {
  return list.map(function (t) { return t.title; });
}

function clone(list) {
  return list.map(function (t) { return Object.assign({}, t); });
}

test('legacy id-union adopts the synced array order for 今天', () => {
  const phone = rows(PHONE);
  const web = rows(PHONE.slice().reverse());
  // Web pulls Firestore. Remote is the phone array. Neither side has a stamp.
  const pulled = context.mergeTodosPreferNewer(clone(web), clone(phone), {
    allowAdds: true,
    preferRemoteOrder: true
  });
  assert.deepEqual(titlesOf(pulled.arr), PHONE);
  assert.equal(pulled.changed, true);
  assert.deepEqual(pulled.arr.map(function (t) { return t.sortOrder; }), [1024, 2048, 3072, 4096, 5120, 6144, 7168]);
  pulled.arr.forEach(function (t) { assert.equal(t.orderUpdatedAt, undefined); });

  // The other direction is the push: local phone, remote web, tie keeps remote.
  const pushed = context.unionSyncItems(clone(phone), clone(web), [], 'todo');
  assert.deepEqual(titlesOf(pushed), PHONE.slice().reverse());
});

test('newer orderUpdatedAt wins over the synced array and over a newer title', () => {
  const phone = rows(PHONE, function (_row, i) {
    return { sortOrder: (i + 1) * 1024, orderUpdatedAt: 5_000, updatedAt: 3_000 };
  });
  const web = rows(PHONE.slice().reverse(), function (_row, i) {
    return {
      sortOrder: (i + 1) * 1024,
      orderUpdatedAt: 1_000,
      updatedAt: 9_000,
      title: PHONE.slice().reverse()[i]
    };
  });
  // Fix titles: rows() already uses the reversed titles as the title field.
  // Give web a newer title on 早宣 only, and confirm the phone order is kept.
  const webEdited = clone(web);
  const zao = webEdited.find(function (t) { return t.id === 't1'; });
  zao.title = '早宣（已改）';
  zao.updatedAt = 9_000;
  zao.orderUpdatedAt = 1_000;

  const merged = context.mergeTodosPreferNewer(clone(phone), webEdited, {
    allowAdds: true,
    preferRemoteOrder: true
  });
  assert.deepEqual(titlesOf(merged.arr), [
    '早宣（已改）',
    'Send P3信息',
    '致電CL客戶',
    '衛蘭演唱會10:00',
    '聯絡機電取相',
    '通知泳觀課',
    '交數卷'
  ]);
  const first = merged.arr[0];
  assert.equal(first.sortOrder, 1024);
  assert.equal(first.orderUpdatedAt, 5_000);
  assert.equal(first.updatedAt, 9_000);
  assert.equal(merged.arr.length, 7);
});

test('a drag stamp syncs to the other device and an older snapshot does not undo it', () => {
  const phone = rows(PHONE);
  const dragged = context.moveTodoInOrder(clone(phone), 't7', 't1', 8_000);
  assert.equal(dragged.changed, true);
  assert.equal(dragged.arr[0].title, '交數卷');
  assert.equal(dragged.arr[0].orderUpdatedAt, 8_000);
  dragged.arr.forEach(function (t) { assert.equal(t.orderUpdatedAt, 8_000); });

  const web = rows(PHONE);
  const after = context.mergeTodosPreferNewer(clone(web), clone(dragged.arr), {
    allowAdds: true,
    preferRemoteOrder: true
  });
  assert.equal(after.arr[0].title, '交數卷');
  assert.deepEqual(titlesOf(after.arr), titlesOf(dragged.arr));

  const stale = context.mergeTodosPreferNewer(clone(dragged.arr), clone(web), {
    allowAdds: false,
    preferRemoteOrder: false
  });
  assert.deepEqual(titlesOf(stale.arr), titlesOf(dragged.arr));
});

test('union keeps every id and still honors deletedIds tombstones', () => {
  const phone = rows(PHONE);
  const extra = {
    id: 't-web-only',
    title: 'Web only',
    due: '2026-10-20',
    done: false,
    createdAt: 50,
    updatedAt: 50
  };
  const web = rows(PHONE.slice(0, 6)).concat([extra]);
  const tombs = [{ kind: 'todo', id: 't4', at: 9_000_000, blockSync: true }];
  const merged = context.unionSyncItems(clone(web), clone(phone), tombs, 'todo');
  const titles = titlesOf(merged);
  assert.equal(titles.includes('衛蘭演唱會10:00'), false);
  assert.equal(titles.includes('Web only'), true);
  assert.equal(titles.includes('交數卷'), true);
  assert.equal(merged.length, 7);

  const revived = phone.find(function (t) { return t.id === 't4'; });
  revived.updatedAt = 9_000_001;
  const back = context.unionSyncItems(clone(web), clone(phone), tombs, 'todo');
  assert.equal(titlesOf(back).includes('衛蘭演唱會10:00'), true);
});

test('normalize keeps order fields and backfills legacy array order', () => {
  const legacy = rows(PHONE);
  const normalized = context.normalizeTodoList(legacy);
  assert.deepEqual(titlesOf(normalized), PHONE);
  assert.equal(normalized[3].sortOrder, 4096);
  const round = context.normalizeTodoRecord({
    id: 't1',
    title: '早宣',
    due: '2026-10-20',
    done: false,
    createdAt: 10,
    updatedAt: 20,
    sortOrder: 7,
    orderUpdatedAt: 99
  });
  assert.equal(round.sortOrder, 7);
  assert.equal(round.orderUpdatedAt, 99);
  assert.equal(round.title, '早宣');
});

test('a new top item sorts first without dropping the others', () => {
  const list = context.normalizeTodoList(rows(PHONE));
  const top = context.nextTopTodoSortOrder(list);
  assert.ok(top < list[0].sortOrder);
  list.unshift({
    id: 't-new',
    title: '最新',
    due: '2026-10-20',
    done: false,
    createdAt: 99,
    updatedAt: 99,
    sortOrder: top,
    orderUpdatedAt: 99
  });
  const sorted = context.sortTodosByOrder(list);
  assert.equal(sorted[0].title, '最新');
  assert.equal(sorted.length, 8);
});

test('completed rows are not drag targets and events do not use todo order merge', () => {
  const list = rows(PHONE);
  list[0].done = true;
  const moved = context.moveTodoInOrder(list, 't1', 't2', 10);
  assert.equal(moved.changed, false);
  assert.match(unionSrc, /kind === 'todo'/);
  assert.match(unionSrc, /mergeTodosPreferNewer/);
  assert.match(unionSrc, /deletionRecordsBlockItem/);
  assert.match(indexHtml, /deletionRecordsBlockItem\(records, item, kind\)/);
});
