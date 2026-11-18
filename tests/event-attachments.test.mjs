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

function sliceFn(html, name, nextName) {
  const start = html.indexOf('function ' + name + '(');
  const end = html.indexOf('function ' + nextName + '(', start + 1);
  assert.ok(start >= 0 && end > start, name);
  return html.slice(start, end);
}

test('both entry points share the attachment block and leave Drive list sync and TCS alone', () => {
  const block = marker(indexHtml);
  assert.equal(marker(dashHtml), block);
  assert.equal(tcsSlice(indexHtml), tcsSlice(dashHtml));
  for (const html of [indexHtml, dashHtml]) {
    assert.match(html, /const ENABLE_DRIVE_SYNC = false;/);
    assert.doesNotMatch(html, /ENABLE_DRIVE_SYNC = true/);
    assert.doesNotMatch(html, /firebase-storage-compat\.js/);
    assert.doesNotMatch(html, /firebase\.storage\(/);
    assert.doesNotMatch(html, /uploadBytes|getDownloadURL/);
    assert.match(html, /applyEventAttachments\(out, e\)/);
    assert.match(html, /eventWithoutPublicFiles\(eventForExport\(ev\)\)/);
    assert.match(html, /normalizeEventForSync/);
    assert.match(html, /queueEventAttachmentDeletes\(ev\)/);
    assert.match(html, /id="eventAttachPick">上載</);
    assert.match(html, /連接 Drive（附件）/);
    assert.match(html, /請先登入 Firebase。未登入唔會把檔案留喺這部瀏覽器。/);
    assert.doesNotMatch(html, /readAsDataURL/);
    assert.doesNotMatch(marker(html), /localStorage\.setItem\([^)]*data:/);
    assert.match(html, /include_granted_scopes: !!ENABLE_DRIVE_SYNC/);
  }
  assert.match(block, /dash-hub-drive-attach-token/);
  assert.match(block, /小布丁活動附件/);
  assert.match(block, /uploadType=multipart/);
  assert.match(block, /uploadType=resumable/);
  assert.match(block, /prompt:\s*'select_account'/);
  assert.match(block, /scope:\s*GDRIVE_SCOPE/);
  assert.match(block, /include_granted_scopes:\s*false/);
  assert.match(block, /sessionStorage\.setItem\(DRIVE_ATTACH_TOKEN_KEY/);
  assert.doesNotMatch(block, /localStorage\.setItem\(DRIVE_ATTACH_TOKEN_KEY/);
  assert.doesNotMatch(block, /GDRIVE_TOKEN_SESSION_KEY/);
  assert.doesNotMatch(block, /prompt:\s*'none'/);
  assert.doesNotMatch(block, /prompt:\s*''/);
  assert.doesNotMatch(block, /gdriveApi|gdrivePull|gdrivePush|布丁仔-sync|ENABLE_DRIVE_SYNC/);
  assert.doesNotMatch(block, /anyoneWithLink|type:\s*'anyone'|\/permissions/);
  assert.doesNotMatch(block, /firebase\.storage|uploadBytes|getDownloadURL/);
  const restoreStart = block.indexOf('function restoreDriveAttachToken');
  const restoreEnd = block.indexOf('async function driveAttachApi', restoreStart);
  assert.ok(restoreEnd > restoreStart);
  assert.doesNotMatch(block.slice(restoreStart, restoreEnd), /requestAccessToken/);
  const silent = indexHtml.slice(indexHtml.indexOf('function refreshGcalAccessToken'), indexHtml.indexOf('async function gcalApi'));
  assert.match(silent, /prompt:\s*'none'/);
  assert.match(silent, /scope:\s*GCAL_SCOPE/);
  assert.doesNotMatch(silent, /drive\.file/);
  assert.doesNotMatch(silent, /GDRIVE_SCOPE/);
  const boot = indexHtml.slice(indexHtml.indexOf('function tryGdriveSilentRestore'), indexHtml.indexOf('function bindSyncUi'));
  assert.doesNotMatch(boot, /drive\.file/);
  assert.doesNotMatch(boot, /requestDriveAttachToken/);
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

const store = new Map();
const context = {
  localStorage: {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); }
  },
  window: {},
  VIEW_ONLY: false,
  firebaseAuthUser: null,
  firebaseCanWrite() { return false; },
  uid(prefix) { return prefix + '_fixed1'; },
  escapeHtml(s) { return String(s); },
  showShareToast() {},
  modalOnDismiss: null,
  console,
  Date,
  Math,
  JSON,
  Blob,
  encodeURIComponent
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

const driveGood = {
  id: 'a_9',
  name: '通告.pdf',
  mime: 'application/pdf',
  size: 1200,
  uploadedAt: 11,
  store: 'drive',
  driveFileId: '1AbCdefGHIjklMNOpqr',
  path: good.path,
  downloadURL: 'https://drive.google.com/uc?id=1AbCdefGHIjklMNOpqr&export=download',
  webViewLink: 'https://drive.google.com/file/d/1AbCdefGHIjklMNOpqr/view',
  webContentLink: 'https://drive.google.com/uc?id=1AbCdefGHIjklMNOpqr',
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
    uploadedAt: 10,
    path: 'users/uid1/events/e_1/a_1/通告.pdf'
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
  assert.equal(JSON.stringify(pub.attachments), JSON.stringify([{ id: 'a_1', name: '通告.pdf' }]));
  assert.equal(pub.downloadURL, undefined);
  assert.equal(JSON.stringify(pub).includes('users/uid1'), false);
  assert.equal(JSON.stringify(pub).includes('firebasestorage'), false);
});

test('drive metadata keeps the file id and drops download links', () => {
  context.VIEW_ONLY = false;
  const event = context.normalizeEvent({
    id: 'e_1',
    title: '家教會',
    date: '2026-11-20',
    kind: 'school',
    attachments: [
      driveGood,
      { id: 'a_bad', name: 'link.pdf', mime: 'application/pdf', size: 10, store: 'drive', driveFileId: 'https://drive.google.com/file/d/abc/view' }
    ]
  });
  assert.equal(event.attachments.length, 1);
  assert.equal(JSON.stringify(event.attachments[0]), JSON.stringify({
    id: 'a_9',
    name: '通告.pdf',
    mime: 'application/pdf',
    size: 1200,
    uploadedAt: 11,
    path: good.path,
    store: 'drive',
    driveFileId: '1AbCdefGHIjklMNOpqr'
  }));
  const packed = JSON.stringify(event);
  assert.equal(packed.includes('drive.google.com'), false);
  assert.equal(packed.includes('webViewLink'), false);
  assert.equal(packed.includes('webContentLink'), false);
  assert.equal(packed.includes('data:'), false);
  const pub = context.eventWithoutPublicFiles(context.eventForExport(event));
  assert.equal(JSON.stringify(pub.attachments), JSON.stringify([{ id: 'a_9', name: '通告.pdf' }]));
  const pubText = JSON.stringify(pub);
  assert.equal(pubText.includes('1AbCdefGHIjklMNOpqr'), false);
  assert.equal(pubText.includes('drive.google.com'), false);
  assert.equal(pubText.includes('users/uid1'), false);
  assert.equal(pubText.includes('alt=media'), false);
});

test('public sync helper strips drive links from personal events too', () => {
  const event = context.eventForExport({
    id: 'e_9',
    title: '覆診',
    date: '2026-12-01',
    time: '',
    work: '帶報告',
    kind: 'personal',
    gcalEventId: 'gcal-1',
    attachments: [driveGood]
  });
  assert.equal(event.kind, 'personal');
  assert.equal(event.gcalEventId, 'gcal-1');
  assert.equal(event.attachments[0].driveFileId, driveGood.driveFileId);
  const pub = context.eventWithoutPublicFiles(event);
  assert.equal(JSON.stringify(pub.attachments), JSON.stringify([{ id: 'a_9', name: '通告.pdf' }]));
  assert.equal(pub.work, '帶報告');
  assert.equal(pub.gcalEventId, 'gcal-1');
  assert.equal(JSON.stringify(pub).includes(driveGood.driveFileId), false);
});

test('share view keeps filenames and drops drive links', () => {
  context.VIEW_ONLY = true;
  const n = context.normalizeEventForSync({
    id: 'e_1',
    title: '家教會',
    date: '2026-11-20',
    kind: 'school',
    attachments: [driveGood]
  });
  assert.equal(JSON.stringify(n.attachments), JSON.stringify([{ id: 'a_9', name: '通告.pdf' }]));
  assert.equal(JSON.stringify(n).includes(driveGood.driveFileId), false);
  assert.equal(JSON.stringify(n).includes('drive.google.com'), false);
  assert.equal(JSON.stringify(n).includes('users/uid1'), false);
  context.VIEW_ONLY = false;
  const owner = context.normalizeEventForSync({
    id: 'e_1',
    title: '家教會',
    date: '2026-11-20',
    kind: 'school',
    attachments: [driveGood]
  });
  assert.equal(owner.attachments.length, 1);
  assert.equal(owner.attachments[0].driveFileId, driveGood.driveFileId);
  assert.equal(owner.attachments[0].store, 'drive');
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

test('drive delete queue stores file ids only', () => {
  context.rememberDriveFileId(driveGood.driveFileId);
  context.rememberDriveFileId('https://drive.google.com/file/d/1AbCdefGHIjklMNOpqr/view');
  context.rememberDriveFileId('short');
  const raw = context.localStorage.getItem('dash-hub-drive-attach-delete-ids');
  assert.equal(JSON.stringify(JSON.parse(raw)), JSON.stringify([driveGood.driveFileId]));
  assert.equal(raw.includes('http'), false);
  assert.equal(raw.includes('token='), false);
});

test('event cards use a compact file icon and share view shows text only', () => {
  context.VIEW_ONLY = false;
  const html = context.eventAttachmentCardHtml({ attachments: [driveGood] });
  assert.match(html, /通告\.pdf/);
  assert.match(html, /event-attach-chip/);
  assert.match(html, /has-name/);
  assert.match(html, /is-file/);
  assert.match(html, /data-attachment="a_9"/);
  assert.match(html, /type="button"/);
  assert.match(html, /開啟附件/);
  assert.doesNotMatch(html, /event-thumb/);
  assert.doesNotMatch(html, /<img/);
  assert.equal(html.includes('href='), false);
  assert.equal(html.includes('http'), false);
  assert.equal(html.includes('data:'), false);
  assert.equal(html.includes(driveGood.driveFileId), false);
  context.VIEW_ONLY = true;
  const share = context.eventAttachmentCardHtml({ attachments: [driveGood] });
  assert.match(share, /通告\.pdf/);
  assert.match(share, /event-attach-name/);
  assert.match(share, /event-attach-chip/);
  assert.match(share, /is-file/);
  assert.doesNotMatch(share, /event-thumb/);
  assert.equal(share.includes('<button'), false);
  assert.equal(share.includes('href='), false);
  assert.equal(share.includes(driveGood.driveFileId), false);
  assert.equal(share.includes('http'), false);
  assert.equal(share.includes('drive.google.com'), false);
  context.VIEW_ONLY = false;
});

test('image attachments render a compact icon and share view stays non-clickable', () => {
  context.VIEW_ONLY = false;
  const image = {
    id: 'a_img',
    name: '通告.jpg',
    mime: 'image/jpeg',
    size: 1200,
    uploadedAt: 12,
    store: 'drive',
    driveFileId: '1ImgFileIdForThumb99'
  };
  const html = context.eventAttachmentCardHtml({ attachments: [image, driveGood] });
  assert.match(html, /event-attach-chips/);
  assert.match(html, /is-icon-only is-image/);
  assert.match(html, /is-icon-only is-file/);
  assert.doesNotMatch(html, /has-name/);
  assert.match(html, /data-attachment="a_img"/);
  assert.match(html, /開啟圖片/);
  assert.match(html, /data-attachment="a_9"/);
  assert.match(html, /通告\.pdf/);
  assert.doesNotMatch(html, /event-thumb/);
  assert.doesNotMatch(html, /event-thumbs/);
  assert.doesNotMatch(html, /<img/);
  assert.equal(html.includes('href='), false);
  assert.equal(html.includes('http'), false);
  assert.equal(html.includes(image.driveFileId), false);
  assert.equal(html.includes(driveGood.driveFileId), false);
  const single = context.eventAttachmentCardHtml({ attachments: [image] });
  assert.match(single, /has-name is-image/);
  assert.match(single, /event-attach-name/);
  assert.match(single, /通告\.jpg/);
  assert.match(single, /data-attachment="a_img"/);
  assert.doesNotMatch(single, /event-thumb/);
  assert.doesNotMatch(single, /<img/);
  const edit = context.eventAttachmentEditRowHtml(image);
  assert.match(edit, /event-attach-open/);
  assert.match(edit, /event-attach-name/);
  assert.match(edit, /通告\.jpg/);
  assert.match(edit, /移除/);
  assert.match(edit, /data-open-attachment="a_img"/);
  assert.match(edit, /開啟圖片/);
  assert.doesNotMatch(edit, /event-thumb/);
  assert.doesNotMatch(edit, /<img/);
  assert.equal(edit.includes('href='), false);
  assert.equal(edit.includes(image.driveFileId), false);
  context.VIEW_ONLY = true;
  const share = context.eventAttachmentCardHtml({ attachments: [image] });
  assert.match(share, /event-attach-chip/);
  assert.match(share, /has-name is-image/);
  assert.match(share, /event-attach-name/);
  assert.match(share, /通告\.jpg/);
  assert.doesNotMatch(share, /event-thumb-placeholder/);
  assert.doesNotMatch(share, /event-thumb/);
  assert.equal(share.includes('<button'), false);
  assert.equal(share.includes('href='), false);
  assert.equal(share.includes(image.driveFileId), false);
  assert.equal(share.includes('http'), false);
  const shareMany = context.eventAttachmentCardHtml({ attachments: [image, { id: 'a_9', name: '通告.pdf' }] });
  assert.match(shareMany, /is-icon-only is-image/);
  assert.match(shareMany, /is-icon-only is-file/);
  assert.doesNotMatch(shareMany, /has-name/);
  assert.equal(shareMany.includes('<button'), false);
  assert.equal(shareMany.includes(image.driveFileId), false);
  context.VIEW_ONLY = false;
  const preview = indexHtml.slice(indexHtml.indexOf('function loadAttachmentPreview'), indexHtml.indexOf('function paintAttachmentThumb'));
  assert.match(preview, /alt=media/);
  assert.doesNotMatch(preview, /requestDriveAttachToken/);
  for (const page of [indexHtml, dashHtml]) {
    assert.match(page, /活動卡只顯示小圖示/);
    assert.doesNotMatch(page, /圖片會顯示縮圖/);
    assert.match(page, /\.event-attach-chip/);
    assert.match(page, /class="note-tile-face event-thumb"/);
    assert.match(page, /const ENABLE_DRIVE_SYNC = false;/);
    assert.match(page, /const SCHEMA_VERSION = 13;/);
  }
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

test('upload is refused without Firebase sign-in and without a Drive token', async () => {
  let fetches = 0;
  context.fetch = function () {
    fetches += 1;
    throw new Error('fetch');
  };
  context.VIEW_ONLY = false;
  context.firebaseCanWrite = function () { return false; };
  context.driveAttachAccessToken = '';
  context.driveAttachTokenExp = 0;
  const file = { name: '通告.pdf', type: 'application/pdf', size: 1200 };
  await assert.rejects(
    () => context.uploadEventAttachment('e_1', file),
    (err) => err && err.code === 'signed-out'
  );
  context.firebaseCanWrite = function () { return true; };
  context.firebaseAuthUser = { uid: 'uid1' };
  await assert.rejects(
    () => context.uploadEventAttachment('e_1', file),
    (err) => err && err.code === 'drive-signed-out'
  );
  assert.equal(fetches, 0);
  context.firebaseCanWrite = function () { return false; };
});

test('a signed-in upload sends the file to Drive multipart and not Storage', async () => {
  const calls = [];
  context.VIEW_ONLY = false;
  context.firebaseCanWrite = function () { return true; };
  context.firebaseAuthUser = { uid: 'uid1' };
  context.gdriveAccessToken = 'calendar-token';
  context.driveAttachAccessToken = 'ya29.test';
  context.driveAttachTokenExp = Date.now() + 3600000;
  context.Blob = Blob;
  function jsonResponse(obj) {
    return {
      ok: true,
      status: 200,
      json: async function () { return obj; },
      text: async function () { return JSON.stringify(obj); },
      headers: { get: function () { return ''; } }
    };
  }
  context.fetch = async function (url, opts) {
    calls.push({ url: String(url), opts: opts || {} });
    const u = String(url);
    assert.equal(u.includes('firebasestorage'), false);
    assert.equal(u.includes('uploadBytes'), false);
    if (u.includes('/upload/drive/v3/files')) {
      assert.match(u, /uploadType=multipart/);
      assert.equal(opts.headers.Authorization, 'Bearer ya29.test');
      assert.match(opts.headers['Content-Type'], /multipart\/related/);
      assert.equal(opts.body instanceof Blob, true);
      return jsonResponse({ id: 'driveFile1234567890', name: '通告.pdf' });
    }
    if (opts.method === 'POST') {
      const body = JSON.parse(opts.body);
      assert.equal(body.mimeType, 'application/vnd.google-apps.folder');
      assert.equal(JSON.stringify(body).includes('anyone'), false);
      const id = body.name === '小布丁活動附件' ? 'rootFolder123456' : 'eventFolder12345';
      return jsonResponse({ id: id, name: body.name, mimeType: body.mimeType, parents: body.parents });
    }
    return jsonResponse({ files: [] });
  };
  const file = new File([new Uint8Array(32)], '通告.pdf', { type: 'application/pdf' });
  const att = await context.uploadEventAttachment('e_1', file);
  assert.equal(att.store, 'drive');
  assert.equal(att.driveFileId, 'driveFile1234567890');
  assert.equal(att.name, '通告.pdf');
  assert.equal(att.id, 'a_fixed1');
  assert.equal(att.path, undefined);
  assert.equal(calls.some((c) => c.url.includes('uploadType=multipart')), true);
  assert.equal(calls.some((c) => c.url.includes('firebasestorage')), false);
  assert.equal(calls.some((c) => c.opts.headers && c.opts.headers.Authorization === 'Bearer calendar-token'), false);
  const saved = JSON.stringify(Array.from(store.values()));
  assert.equal(saved.includes('base64'), false);
  assert.equal(saved.includes('ya29.test'), false);
  context.firebaseCanWrite = function () { return false; };
  context.driveAttachAccessToken = '';
  context.driveAttachTokenExp = 0;
});

test('a drive.file 403 or 404 opens the private viewer for the connected owner', async () => {
  const toasts = [];
  const originalToast = context.showShareToast;
  const originalOpen = context.window.open;
  context.showShareToast = function (msg) { toasts.push(String(msg)); };
  context.VIEW_ONLY = false;
  context.driveAttachAccessToken = 'ya29.owner';
  context.driveAttachTokenExp = Date.now() + 3600000;
  context.gdriveAccessToken = 'calendar-token';
  const att = {
    id: 'a_9',
    name: '通告.pdf',
    mime: 'application/pdf',
    size: 1200,
    store: 'drive',
    driveFileId: '1AbCdefGHIjklMNOpqr'
  };
  const note = {
    id: 'n_lab',
    label: '實驗尺',
    name: '尺.pdf',
    mime: 'application/pdf',
    size: 1200,
    store: 'drive',
    driveFileId: '1NotesFileFromOtherApp'
  };
  function httpError(status) {
    return { ok: false, status: status };
  }
  async function openWith(status, email, target) {
    const replaced = [];
    const fetched = [];
    let tab = null;
    toasts.length = 0;
    context.driveAttachEmail = email;
    context.window.open = function (url, winTarget, features) {
      tab = {
        closed: false,
        opened: { url: String(url), target: winTarget || '', features: features || '' },
        location: {
          replace(next) { replaced.push(String(next)); }
        },
        close() { this.closed = true; }
      };
      return tab;
    };
    context.fetch = async function (url, opts) {
      const href = String(url);
      fetched.push(href);
      assert.equal(href.includes('/permissions'), false);
      assert.equal(href.includes('anyone'), false);
      assert.equal((opts && opts.headers && opts.headers.Authorization) || '', 'Bearer ya29.owner');
      return httpError(status);
    };
    await context.openEventAttachment(target);
    return { replaced: replaced, fetched: fetched, tab: tab };
  }
  try {
    const denied = await openWith(403, 'puddingchau1125@gmail.com', att);
    assert.deepEqual(denied.fetched, [
      'https://www.googleapis.com/drive/v3/files/1AbCdefGHIjklMNOpqr?alt=media'
    ]);
    assert.deepEqual(denied.replaced, [
      'https://drive.google.com/file/d/1AbCdefGHIjklMNOpqr/view?authuser=puddingchau1125%40gmail.com'
    ]);
    assert.equal(denied.tab.closed, false);
    assert.equal(denied.tab.opened.url, 'about:blank');
    assert.equal(toasts.length, 0);

    const hidden = await openWith(404, '', note);
    assert.deepEqual(hidden.fetched, [
      'https://www.googleapis.com/drive/v3/files/1NotesFileFromOtherApp?alt=media'
    ]);
    assert.deepEqual(hidden.replaced, [
      'https://drive.google.com/file/d/1NotesFileFromOtherApp/view'
    ]);
    assert.equal(hidden.replaced[0].includes('authuser='), false);
    assert.equal(hidden.tab.closed, false);
    assert.equal(toasts.length, 0);

    context.URL = {
      createObjectURL() { return 'blob:preview'; },
      revokeObjectURL() {}
    };
    const replaced = [];
    context.driveAttachEmail = 'puddingchau1125@gmail.com';
    context.window.open = function () {
      return {
        closed: false,
        location: { replace(next) { replaced.push(String(next)); } },
        close() { this.closed = true; }
      };
    };
    context.fetch = async function () {
      return {
        ok: true,
        status: 200,
        blob: async function () { return { size: 4 }; }
      };
    };
    await context.openEventAttachment(att);
    assert.deepEqual(replaced, ['blob:preview']);

    toasts.length = 0;
    context.window.open = undefined;
    context.fetch = async function () { return httpError(403); };
    await context.openEventAttachment(att);
    assert.deepEqual(toasts, ['找不到呢個檔案。可能連咗另一個 Google 帳戶，或者檔案已喺 Drive 刪除。']);
  } finally {
    context.showShareToast = originalToast;
    context.window.open = originalOpen;
    context.fetch = undefined;
    context.URL = undefined;
    context.driveAttachEmail = '';
    context.driveAttachAccessToken = '';
    context.driveAttachTokenExp = 0;
    context.gdriveAccessToken = '';
    context.VIEW_ONLY = false;
  }
});
