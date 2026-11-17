import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dashHtml = readFileSync(new URL('../dashboard.html', import.meta.url), 'utf8');
const rules = readFileSync(new URL('../storage.rules', import.meta.url), 'utf8');

function marker(html) {
  const start = html.indexOf('/* EVENT_ATTACHMENTS_START');
  const end = html.indexOf('/* EVENT_ATTACHMENTS_END */');
  assert.ok(start >= 0 && end > start);
  return html.slice(start, end);
}

function tcsSlice(html) {
  const start = html.indexOf('const TCS_DATA = {');
  const end = html.indexOf('\n};\n', start);
  assert.ok(start >= 0 && end > start);
  return html.slice(start, end + 3);
}

test('both entry points share the attachment block and leave Drive and TCS alone', () => {
  const block = marker(indexHtml);
  assert.equal(marker(dashHtml), block);
  assert.equal(tcsSlice(indexHtml), tcsSlice(dashHtml));
  for (const html of [indexHtml, dashHtml]) {
    assert.match(html, /const ENABLE_DRIVE_SYNC = false;/);
    assert.doesNotMatch(html, /ENABLE_DRIVE_SYNC = true/);
    assert.match(html, /firebase-storage-compat\.js/);
    assert.match(html, /applyEventAttachments\(out, e\)/);
    assert.match(html, /eventWithoutPublicFiles\(eventForExport\(ev\)\)/);
    assert.match(html, /normalizeEventForSync/);
    assert.match(html, /queueEventAttachmentDeletes\(ev\)/);
    assert.match(html, /id="eventAttachPick">上載</);
    assert.match(html, /請先登入 Firebase。未登入唔會把檔案留喺這部瀏覽器。/);
    assert.doesNotMatch(html, /readAsDataURL/);
    assert.doesNotMatch(marker(html), /localStorage\.setItem\([^)]*data:/);
  }
  assert.match(rules, /users\/\{uid\}\/events\/\{eventId\}\/\{attachmentId\}\/\{fileName\}/);
  assert.match(rules, /request\.auth\.uid == uid/);
  assert.match(rules, /request\.resource\.size <= 10 \* 1024 \* 1024/);
  assert.doesNotMatch(rules, /allow read, write: if true/);
  const gcal = indexHtml.slice(indexHtml.indexOf('function eventToGcalBody'), indexHtml.indexOf('function gcalEventImportable'));
  assert.match(gcal, /description: ev\.work \|\| ''/);
  assert.doesNotMatch(gcal, /attachments/);
  const wire = indexHtml.slice(indexHtml.indexOf('function buildShareWire'), indexHtml.indexOf('function expandShareWire'));
  assert.doesNotMatch(wire, /attachments/);
});

function sliceFn(html, name, nextName) {
  const start = html.indexOf('function ' + name + '(');
  const end = html.indexOf('function ' + nextName + '(', start + 1);
  assert.ok(start >= 0 && end > start, name);
  return html.slice(start, end);
}

const store = new Map();
const context = {
  localStorage: {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); }
  },
  window: {},
  VIEW_ONLY: false,
  firebaseAuthUser: null,
  firebaseCanWrite() { return false; },
  uid(prefix) { return prefix + '_fixed1'; },
  escapeHtml(s) { return String(s); },
  showShareToast() {},
  modalOnDismiss: null,
  console
};
vm.createContext(context);
vm.runInContext(
  [
    sliceFn(indexHtml, 'eventKindOf', 'normalizeEventsKind'),
    sliceFn(indexHtml, 'parseDateOnly', 'daysDiff'),
    sliceFn(indexHtml, 'pad2', 'formatYMD'),
    marker(indexHtml),
    sliceFn(indexHtml, 'normalizeEvent', 'eventForExport'),
    sliceFn(indexHtml, 'eventForExport', 'normalizeEventsFilter')
  ].join('\n'),
  context
);

const good = {
  id: 'a_1',
  name: '通告.pdf',
  mime: 'application/pdf',
  size: 1200,
  path: 'users/uid1/events/e_1/a_1/通告.pdf',
  uploadedAt: 10,
  downloadURL: 'https://firebasestorage.googleapis.com/v0/b/pudding-dashboard-5d8c8.firebasestorage.app/o/x?alt=media&token=secret',
  data: 'data:application/pdf;base64,AAAA'
};

test('event metadata keeps the storage path and drops file bytes and download URLs', () => {
  const event = context.normalizeEvent({
    id: 'e_1',
    title: '家教會',
    date: '2026-11-20',
    time: '09:00',
    work: '帶通告',
    kind: 'school',
    attachments: [
      good,
      { id: 'a_2', name: 'blob', mime: 'text/plain', size: 10, path: 'data:text/plain;base64,aGk=' },
      { id: 'a_3', name: 'link', mime: 'text/plain', size: 10, path: 'https://example.com/secret.pdf' },
      { id: 'a_4', name: 'big', mime: 'application/pdf', size: 11 * 1024 * 1024, path: 'users/uid1/events/e_1/a_4/big.pdf' },
      { id: 'a_1', name: 'duplicate', mime: 'application/pdf', size: 10, path: 'users/uid1/events/e_1/a_1/other.pdf' }
    ]
  });
  assert.equal(event.attachments.length, 1);
  assert.equal(JSON.stringify(event.attachments[0]), JSON.stringify({
    id: 'a_1',
    name: '通告.pdf',
    mime: 'application/pdf',
    size: 1200,
    path: 'users/uid1/events/e_1/a_1/通告.pdf',
    uploadedAt: 10
  }));
  const packed = JSON.stringify(event);
  assert.equal(packed.includes('data:'), false);
  assert.equal(packed.includes('base64'), false);
  assert.equal(packed.includes('firebasestorage'), false);
  assert.equal(packed.includes('alt=media'), false);
  assert.equal(packed.includes('token='), false);
  const exported = context.eventForExport(event);
  assert.equal(exported.attachments[0].path, good.path);
  assert.equal(exported.gcalEventId, '');
  const pub = context.eventWithoutPublicFiles(exported);
  assert.equal(pub.attachments, undefined);
  assert.equal(pub.downloadURL, undefined);
  assert.equal(JSON.stringify(pub).includes('users/uid1'), false);
});

test('public sync helper strips attachments from personal events too', () => {
  const event = context.eventForExport({
    id: 'e_9',
    title: '覆診',
    date: '2026-12-01',
    time: '',
    work: '帶報告',
    kind: 'personal',
    gcalEventId: 'gcal-1',
    attachments: [good]
  });
  assert.equal(event.kind, 'personal');
  assert.equal(event.gcalEventId, 'gcal-1');
  assert.equal(event.attachments.length, 1);
  const pub = context.eventWithoutPublicFiles(event);
  assert.equal(pub.attachments, undefined);
  assert.equal(pub.work, '帶報告');
  assert.equal(pub.gcalEventId, 'gcal-1');
});

test('share view drops attachment metadata even if a snapshot includes it', () => {
  context.VIEW_ONLY = true;
  const n = context.normalizeEventForSync({
    id: 'e_1',
    title: '家教會',
    date: '2026-11-20',
    kind: 'school',
    attachments: [good]
  });
  assert.equal(n.attachments, undefined);
  context.VIEW_ONLY = false;
  const owner = context.normalizeEventForSync({
    id: 'e_1',
    title: '家教會',
    date: '2026-11-20',
    kind: 'school',
    attachments: [good]
  });
  assert.equal(owner.attachments.length, 1);
});

test('delete queue stores paths only', () => {
  context.rememberAttachmentPath(good.path);
  context.rememberAttachmentPath('data:text/plain;base64,aGk=');
  context.rememberAttachmentPath('https://firebasestorage.googleapis.com/v0/b/x/o/y?alt=media&token=abc');
  const raw = context.localStorage.getItem('dash-event-attachment-delete-paths');
  const paths = JSON.parse(raw);
  assert.deepEqual(paths, [good.path]);
  assert.equal(raw.includes('base64'), false);
  assert.equal(raw.includes('token='), false);
});

test('event cards use a button for the filename and share view hides it', () => {
  context.VIEW_ONLY = false;
  const html = context.eventAttachmentCardHtml({ attachments: [good] });
  assert.match(html, /通告\.pdf/);
  assert.match(html, /data-attachment="a_1"/);
  assert.match(html, /type="button"/);
  assert.equal(html.includes('href='), false);
  assert.equal(html.includes('http'), false);
  assert.equal(html.includes('data:'), false);
  context.VIEW_ONLY = true;
  assert.equal(context.eventAttachmentCardHtml({ attachments: [good] }), '');
  context.VIEW_ONLY = false;
});

test('an event keeps at most five attachments', () => {
  const list = [];
  for (let i = 0; i < 8; i++) {
    list.push({
      id: 'a_' + i,
      name: 'f' + i + '.pdf',
      mime: 'application/pdf',
      size: 100,
      path: 'users/uid1/events/e_1/a_' + i + '/f.pdf',
      uploadedAt: i
    });
  }
  const kept = context.normalizeAttachments(list);
  assert.equal(kept.length, 5);
  assert.equal(kept[0].id, 'a_0');
  assert.equal(kept[4].id, 'a_4');
});
