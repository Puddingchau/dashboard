import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dashHtml = readFileSync(new URL('../dashboard.html', import.meta.url), 'utf8');

function between(html, start, end) {
  const i = html.indexOf(start);
  const j = html.indexOf(end, i + start.length);
  assert.ok(i >= 0 && j > i, start);
  return html.slice(i, j);
}

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

function marker(html, start, end) {
  const block = between(html, start, end);
  assert.ok(block.length > 100, start);
  return block;
}

const notesBlock = marker(indexHtml, '/* NOTES_START', '/* NOTES_END */');
const attachBlock = marker(indexHtml, '/* EVENT_ATTACHMENTS_START', '/* EVENT_ATTACHMENTS_END */');

test('both pages share the Notes feature and leave sync limits alone', () => {
  assert.equal(marker(dashHtml, '/* NOTES_START', '/* NOTES_END */'), notesBlock);
  assert.equal(marker(dashHtml, '/* EVENT_ATTACHMENTS_START', '/* EVENT_ATTACHMENTS_END */'), attachBlock);
  for (const html of [indexHtml, dashHtml]) {
    const notesAt = html.indexOf('<span class="block-label">Notes</span>');
    const trainAt = html.indexOf('<span class="block-label">培訓</span>');
    assert.ok(notesAt > 0 && notesAt < trainAt);
    assert.match(html, /id="notes"[\s\S]{0,2500}id="training"/);
    assert.match(html, /const ENABLE_DRIVE_SYNC = false;/);
    assert.doesNotMatch(html, /ENABLE_DRIVE_SYNC = true/);
    assert.doesNotMatch(html, /firebase-storage-compat\.js|firebase\.storage\(|uploadBytes|getDownloadURL/);
    assert.match(html, /const SCHEMA_VERSION = 13;/);
    assert.match(html, /notes: normalizeNotes\(state && state\.notes\)/);
    assert.match(html, /noteWithoutPublicFiles\(note\)/);
    assert.match(html, /id="notesDriveConnect">連接 Drive（附件）/);
    assert.match(html, /id="btnAddNote">上載</);
    assert.match(html, /mergeNotesPreferNewer\(/);
    assert.match(extractFn(html, 'buildShareWire'), /shareNoteRow/);
    assert.doesNotMatch(extractFn(html, 'buildShareWire'), /attachments/);
    assert.doesNotMatch(extractFn(html, 'eventToGcalBody'), /state\.notes/);
  }
  assert.match(notesBlock, /const DRIVE_NOTES_FOLDER_NAME = 'Notes';/);
  assert.match(notesBlock, /driveAttachRootFolder\(/);
  assert.match(notesBlock, /requestDriveAttachToken\(/);
  assert.match(notesBlock, /EVENT_ATTACHMENT_MAX_BYTES/);
  assert.match(notesBlock, /請輸入 Note 名/);
  assert.match(notesBlock, /未命名/);
  assert.match(notesBlock, /moveNotesInOrder\(/);
  assert.match(notesBlock, /orderUpdatedAt/);
  assert.match(notesBlock, /openEventAttachment\(/);
  assert.match(notesBlock, /class="note-tile-face event-thumb"/);
  assert.match(notesBlock, /refreshOpenAttachmentThumbs\(/);
  assert.doesNotMatch(notesBlock, /標籤（可留空）|會用檔名|note-file-meta/);
  assert.doesNotMatch(notesBlock, /標題必填|備註（選填）|新增筆記/);
  assert.doesNotMatch(notesBlock, /anyoneWithLink|firebase\.storage|uploadBytes|initTokenClient|prompt:\s*'none'|ENABLE_DRIVE_SYNC/);
  const upload = extractFn(indexHtml, 'uploadFilesOntoNotes');
  assert.ok(upload.indexOf('askNoteName') < upload.indexOf('uploadNoteAttachment'));
  assert.ok(upload.indexOf('askNoteName') < upload.indexOf('addNoteRecord'));
  for (const page of [indexHtml, dashHtml]) {
    assert.match(page, /class="note-grid" id="noteList"/);
    assert.match(page, /body \.note-tile\.note-draggable\.reorder-hold/);
    assert.doesNotMatch(between(page, 'id="notesHint"', '</p>'), /檔名/);
  }
  const deleteNote = extractFn(indexHtml, 'deleteNoteById');
  assert.ok(deleteNote.indexOf('confirm(noteDeleteConfirmMessage') < deleteNote.indexOf('rememberNoteDeletion'));
  const preview = extractFn(indexHtml, 'loadAttachmentPreview');
  assert.match(preview, /alt=media/);
  assert.doesNotMatch(preview, /requestDriveAttachToken/);
  assert.match(between(indexHtml, 'const TCS_DATA = {', '\n};\n'), /小學科學/);
  assert.equal(
    between(indexHtml, 'const TCS_DATA = {', '\n};\n'),
    between(dashHtml, 'const TCS_DATA = {', '\n};\n')
  );
});

const store = new Map();
const elements = Object.create(null);
const context = {
  localStorage: {
    getItem(k) { return store.has(k) ? store.get(k) : null; },
    setItem(k, v) { store.set(k, String(v)); },
    removeItem(k) { store.delete(k); }
  },
  document: {
    getElementById(id) {
      if (!elements[id]) elements[id] = { innerHTML: '', textContent: '' };
      return elements[id];
    }
  },
  window: {},
  state: null,
  VIEW_ONLY: false,
  uid(prefix) { return prefix + '_fixed1'; },
  console,
  Date,
  Math,
  JSON,
  Number,
  String,
  Object,
  Array,
  Map,
  encodeURIComponent,
  confirm() { return true; }
};
context.window = context;
vm.createContext(context);

const todoOrder = between(indexHtml, '/* TODO_ORDER_SYNC_START', '/* TODO_ORDER_SYNC_END */') + '/* TODO_ORDER_SYNC_END */';
const deletionConsts = between(indexHtml, 'const DELETED_SYNC_IDS_KEY', 'function loadDeletionRecords');

vm.runInContext(
  [
    'const SCHEMA_VERSION = 13;',
    'const SHARE_TTL_MS = 3 * 60 * 60 * 1000;',
    attachBlock,
    notesBlock,
    deletionConsts,
    todoOrder,
    extractFn(indexHtml, 'itemSyncTs'),
    extractFn(indexHtml, 'mergeByIdPreferNewer'),
    extractFn(indexHtml, 'deletionRecordMatchesItem'),
    extractFn(indexHtml, 'newestDeletionAt'),
    extractFn(indexHtml, 'filterRemoteItemsByDeletions'),
    extractFn(indexHtml, 'clearDeletionRecordsForItems'),
    extractFn(indexHtml, 'pruneAbsentFromAuthoritativeRemote'),
    extractFn(indexHtml, 'deletionRecordsBlockItem'),
    extractFn(indexHtml, 'loadDeletionRecords'),
    extractFn(indexHtml, 'saveDeletionRecords'),
    extractFn(indexHtml, 'rememberDeletion'),
    extractFn(indexHtml, 'mergeDeletionRecordLists'),
    extractFn(indexHtml, 'unionSyncItems'),
    extractFn(indexHtml, 'plainJson'),
    extractFn(indexHtml, 'normalizeShare'),
    extractFn(indexHtml, 'buildExportPayload'),
    extractFn(indexHtml, 'buildSyncPayload'),
    extractFn(indexHtml, 'buildFirebaseSyncDoc'),
    extractFn(indexHtml, 'combineFirebaseSyncDocs'),
    extractFn(indexHtml, 'pagesSyncPayload'),
    extractFn(indexHtml, 'buildShareWire'),
    extractFn(indexHtml, 'expandShareWire'),
    'function cancelQueuedGcalDelete() {}',
    'function eventForExport(event) { return event; }',
    'function escapeHtml(value) {',
    '  return String(value == null ? "" : value)',
    "    .replace(/&/g, '&amp;')",
    "    .replace(/</g, '&lt;')",
    "    .replace(/>/g, '&gt;')",
    '    .replace(/"/g, "&quot;");',
    '}'
  ].join('\n'),
  context
);

function blankState(notes) {
  context.VIEW_ONLY = false;
  context.state = {
    todos: [],
    events: [],
    notes: notes || [],
    shortcuts: [],
    categories: [],
    busStops: [],
    theme: 'rain-cafe',
    syncUpdatedAt: 0,
    share: { enabled: false, salt: '', passwordHash: '', updatedAt: 0, expiresAt: 0 }
  };
}

const driveFile = {
  id: 'a_fixed1',
  name: '尺.pdf',
  mime: 'application/pdf',
  size: 1200,
  uploadedAt: 11,
  store: 'drive',
  driveFileId: '1AbCdefGHIjklMNOpqr',
  downloadURL: 'https://drive.google.com/uc?id=1AbCdefGHIjklMNOpqr&export=download',
  webViewLink: 'https://drive.google.com/file/d/1AbCdefGHIjklMNOpqr/view',
  data: 'data:application/pdf;base64,AAAA'
};

test('a new note requires a name and still stores the file without showing it', () => {
  blankState([]);
  const missing = context.addNoteRecord([], {
    id: 'n_blank',
    label: '   ',
    name: '尺.pdf',
    mime: driveFile.mime,
    size: driveFile.size,
    uploadedAt: driveFile.uploadedAt,
    store: 'drive',
    driveFileId: driveFile.driveFileId
  }, 1000);
  assert.equal(missing.ok, false);
  assert.equal(missing.error, 'name');
  assert.equal(missing.notes.length, 0);
  const added = context.addNoteRecord([], {
    id: 'n_lab',
    label: '  實驗尺  ',
    name: '尺.pdf',
    mime: driveFile.mime,
    size: driveFile.size,
    uploadedAt: driveFile.uploadedAt,
    store: 'drive',
    driveFileId: driveFile.driveFileId
  }, 1000);
  assert.equal(added.ok, true);
  assert.equal(added.note.label, '實驗尺');
  assert.equal(added.note.name, '尺.pdf');
  assert.equal(context.noteDisplayLabel(added.note), '實驗尺');
  assert.equal(added.note.driveFileId, driveFile.driveFileId);
  assert.equal(added.note.label.length <= 80, true);
  assert.equal(JSON.stringify(added.note).includes('data:'), false);
  assert.equal(JSON.stringify(added.note).includes('drive.google.com'), false);
  assert.equal(context.addNoteRecord(added.notes, { name: '   ', label: '有名' }, 2).ok, false);
  const longName = '名'.repeat(90);
  const capped = context.normalizeNote(Object.assign({}, added.note, { label: longName }));
  assert.equal(capped.label.length, 80);
  assert.equal(context.noteDeleteConfirmMessage(), '確定刪除此檔案？');
  const removed = context.deleteNoteRecord(added.notes, 'n_lab');
  assert.equal(removed.ok, true);
  assert.equal(removed.notes.length, 0);
  assert.equal(removed.note.name, '尺.pdf');
});

test('notes stay in the Firebase payload and a deleted note stays tombstoned', () => {
  blankState([]);
  const added = context.addNoteRecord([], {
    id: 'n_lab',
    label: '實驗尺',
    name: '尺.pdf',
    mime: driveFile.mime,
    size: driveFile.size,
    uploadedAt: driveFile.uploadedAt,
    store: 'drive',
    driveFileId: driveFile.driveFileId
  }, 1000);
  context.state.notes = added.notes;
  const live = context.buildFirebaseSyncDoc();
  assert.equal(live.notes.length, 1);
  assert.equal(live.notes[0].label, '實驗尺');
  assert.equal(live.notes[0].name, '尺.pdf');
  assert.equal(live.notes[0].driveFileId, driveFile.driveFileId);
  assert.equal(JSON.stringify(live.notes).includes('drive.google.com'), false);
  assert.equal(JSON.stringify(live.notes).includes('data:'), false);

  context.state.notes = [];
  context.rememberNoteDeletion(added.note);
  const afterDelete = context.buildFirebaseSyncDoc();
  assert.equal(afterDelete.notes.length, 0);
  assert.equal(afterDelete.deletedIds.some(function (row) {
    return row.kind === 'note' && row.id === 'n_lab' && row.blockSync === true;
  }), true);
  const revived = Object.assign({}, added.note, { updatedAt: 1000 });
  const merged = context.combineFirebaseSyncDocs(afterDelete, {
    notes: [revived],
    todos: [],
    events: [],
    deletedIds: []
  });
  assert.equal(merged.notes.length, 0);
  assert.equal(merged.deletedIds.some(function (row) { return row.kind === 'note' && row.id === 'n_lab'; }), true);

  const otherDevice = context.addNoteRecord([], {
    id: 'n_other',
    label: '另一則',
    name: '另一.pdf',
    mime: 'application/pdf',
    size: 100,
    uploadedAt: 20,
    store: 'drive',
    driveFileId: '1OtherDeviceFileId99'
  }, 3000);
  assert.equal(otherDevice.ok, true);
  const union = context.mergeNotesPreferNewer(merged.notes, otherDevice.notes, merged.deletedIds, {
    allowAdds: true,
    unionFiles: true
  });
  assert.deepEqual(Array.from(union.arr.map(function (note) { return note.id; })), ['n_other']);
});

test('a deleted locker file stays tombstoned when the other device still has it', () => {
  blankState([]);
  const item = context.normalizeNote({
    id: 'n_photo',
    label: '課堂相',
    name: '課堂.jpg',
    mime: 'image/jpeg',
    size: 1200,
    uploadedAt: 11,
    store: 'drive',
    driveFileId: driveFile.driveFileId,
    createdAt: 10,
    updatedAt: 50,
    sortOrder: 0
  });
  context.rememberNoteDeletion(item);
  const remote = Object.assign({}, item, { label: '課堂相（已改）', updatedAt: 5000 });
  const merged = context.mergeNotesPreferNewer([], [remote], context.loadDeletionRecords(), {
    allowAdds: true,
    unionFiles: true
  });
  assert.equal(merged.arr.length, 0);
  assert.equal(JSON.stringify(merged.arr).includes(driveFile.driveFileId), false);
});

test('share and public snapshots keep note names only', () => {
  blankState([]);
  const added = context.addNoteRecord([], {
    id: 'n_lab',
    label: '實驗尺',
    name: '尺.pdf',
    mime: driveFile.mime,
    size: driveFile.size,
    uploadedAt: driveFile.uploadedAt,
    store: 'drive',
    driveFileId: driveFile.driveFileId,
    downloadURL: driveFile.downloadURL
  }, 1000);
  context.state.notes = added.notes;
  const pub = context.pagesSyncPayload();
  assert.equal(pub.notes[0].label, '實驗尺');
  assert.equal(pub.notes[0].name, undefined);
  assert.equal(pub.notes[0].driveFileId, undefined);
  const pubText = JSON.stringify(pub.notes);
  assert.equal(pubText.includes('尺.pdf'), false);
  assert.equal(pubText.includes(driveFile.driveFileId), false);
  assert.equal(pubText.includes('drive.google.com'), false);
  assert.equal(pubText.includes('alt=media'), false);
  assert.equal(pubText.includes('data:'), false);

  const wire = context.buildShareWire(pub, { includeNotes: true, includeWork: true });
  const wireText = JSON.stringify(wire);
  assert.deepEqual(Array.from(wire.n[0]), ['n_lab', '實驗尺']);
  assert.equal(wireText.includes('尺.pdf'), false);
  assert.equal(wireText.includes(driveFile.driveFileId), false);
  assert.equal(wireText.includes('drive.google.com'), false);
  assert.equal(wireText.includes('attachments'), false);

  const expanded = context.expandShareWire(wire);
  assert.equal(expanded.notes[0].label, '實驗尺');
  assert.equal(expanded.notes[0].name, undefined);
  assert.equal(JSON.stringify(expanded.notes).includes('尺.pdf'), false);

  const legacy = context.expandShareWire({
    u: 1000,
    t: [],
    e: [],
    n: [['n_old', '', 'secret-file.pdf']]
  });
  assert.equal(legacy.notes[0].label, '');
  assert.equal(legacy.notes[0].name, undefined);
  assert.equal(JSON.stringify(legacy.notes).includes('secret-file.pdf'), false);

  context.VIEW_ONLY = true;
  const viewNote = context.normalizeNoteForSync(added.note);
  assert.equal(viewNote.label, '實驗尺');
  assert.equal(viewNote.name, undefined);
  assert.equal(JSON.stringify(viewNote).includes(driveFile.driveFileId), false);
  assert.equal(JSON.stringify(viewNote).includes('尺.pdf'), false);
  context.VIEW_ONLY = false;
});

test('tiles show the note name, not the filename, and an empty label stays unnamed', () => {
  const storedName = '26-27結石避免進食食物.pdf';
  const existing = context.normalizeNote({
    id: 'n_old',
    label: '',
    name: storedName,
    mime: 'application/pdf',
    size: 1200,
    uploadedAt: 11,
    store: 'drive',
    driveFileId: driveFile.driveFileId,
    createdAt: 10,
    updatedAt: 10,
    sortOrder: 1024,
    orderUpdatedAt: 10
  });
  assert.equal(existing.label, '');
  assert.equal(existing.name, storedName);
  assert.equal(context.noteDisplayLabel(existing), '未命名');
  blankState([existing]);
  context.VIEW_ONLY = false;
  context.renderNotes();
  const unnamedHtml = elements.noteList.innerHTML;
  assert.equal(unnamedHtml.includes('note-tile'), true);
  assert.equal(unnamedHtml.includes('placeholder="未命名"'), true);
  assert.equal(unnamedHtml.includes('data-note-name="n_old"'), true);
  assert.equal(unnamedHtml.includes(storedName), false);
  assert.equal(unnamedHtml.includes('標籤'), false);

  const renamed = context.renameNoteRecord([existing], 'n_old', '  結石食物  ', 50);
  assert.equal(renamed.ok, true);
  assert.equal(renamed.note.label, '結石食物');
  assert.equal(renamed.note.name, storedName);
  assert.equal(renamed.note.sortOrder, 1024);
  assert.equal(renamed.note.orderUpdatedAt, 10);
  assert.equal(context.renameNoteRecord([renamed.note], 'n_old', '   ', 60).ok, false);
  context.state.notes = renamed.notes;
  context.renderNotes();
  const namedHtml = elements.noteList.innerHTML;
  assert.equal(namedHtml.includes('結石食物'), true);
  assert.equal(namedHtml.includes('改名'), true);
  assert.equal(namedHtml.includes('刪除'), true);
  assert.equal(namedHtml.includes(storedName), false);
  assert.equal(namedHtml.includes('未命名'), false);
  assert.equal(namedHtml.includes('http'), false);

  const picture = context.addNoteRecord([], {
    id: 'n_pic',
    label: '課堂相',
    name: '課堂.jpg',
    mime: 'image/jpeg',
    size: 1200,
    uploadedAt: 11,
    store: 'drive',
    driveFileId: driveFile.driveFileId
  }, 1000);
  context.state.notes = picture.notes;
  context.renderNotes();
  const ownerHtml = elements.noteList.innerHTML;
  assert.equal(ownerHtml.includes('event-thumb'), true);
  assert.equal(ownerHtml.includes('data-note-open="n_pic"'), true);
  assert.equal(ownerHtml.includes('課堂相'), true);
  assert.equal(ownerHtml.includes('課堂.jpg'), false);
  assert.equal(ownerHtml.includes(driveFile.driveFileId), false);

  context.VIEW_ONLY = true;
  context.renderNotes();
  const viewHtml = elements.noteList.innerHTML;
  assert.equal(viewHtml.includes('課堂相'), true);
  assert.equal(viewHtml.includes('課堂.jpg'), false);
  assert.equal(viewHtml.includes('<button'), false);
  assert.equal(viewHtml.includes('data-note-open'), false);
  assert.equal(viewHtml.includes('刪除'), false);
  assert.equal(viewHtml.includes('上載'), false);
  assert.equal(viewHtml.includes('改名'), false);
  assert.equal(viewHtml.includes(driveFile.driveFileId), false);
  assert.equal(viewHtml.includes('http'), false);
  assert.equal(elements.notesHint.textContent, '只顯示 Note 名。');
  context.VIEW_ONLY = false;
});

test('reorder stamps sortOrder and a newer stamp wins over a newer rename', () => {
  blankState([]);
  const first = context.addNoteRecord([], {
    id: 'n_a',
    label: '甲',
    name: '甲.pdf',
    mime: 'application/pdf',
    size: 100,
    uploadedAt: 11,
    store: 'drive',
    driveFileId: '1AAAAAAAAAAAAAAA111'
  }, 1000);
  const second = context.addNoteRecord(first.notes, {
    id: 'n_b',
    label: '乙',
    name: '乙.pdf',
    mime: 'application/pdf',
    size: 100,
    uploadedAt: 12,
    store: 'drive',
    driveFileId: '1BBBBBBBBBBBBBB222'
  }, 2000);
  assert.deepEqual(Array.from(second.notes.map(function (note) { return note.id; })), ['n_b', 'n_a']);
  const moved = context.moveNotesInOrder(second.notes, 'n_a', 'n_b', 9000);
  assert.equal(moved.changed, true);
  assert.deepEqual(Array.from(moved.arr.map(function (note) { return note.id; })), ['n_a', 'n_b']);
  assert.equal(moved.arr[0].orderUpdatedAt, 9000);
  assert.equal(moved.arr[1].orderUpdatedAt, 9000);
  assert.ok(moved.arr[0].sortOrder < moved.arr[1].sortOrder);
  context.state.notes = moved.arr;
  const doc = context.buildFirebaseSyncDoc();
  assert.deepEqual(Array.from(doc.notes.map(function (note) { return note.id; })), ['n_a', 'n_b']);
  assert.equal(doc.notes[0].orderUpdatedAt, 9000);
  assert.equal(doc.notes[0].name, '甲.pdf');

  const remote = doc.notes.map(function (note) { return Object.assign({}, note); });
  remote[0] = Object.assign({}, remote[0], {
    label: '甲改',
    updatedAt: 12000,
    sortOrder: 8000,
    orderUpdatedAt: 1000
  });
  remote[1] = Object.assign({}, remote[1], { sortOrder: 1000, orderUpdatedAt: 1000 });
  const merged = context.mergeNotesPreferNewer(doc.notes, remote, [], {
    allowAdds: true,
    preferRemoteOrder: true
  });
  const byId = new Map(merged.arr.map(function (note) { return [note.id, note]; }));
  assert.equal(byId.get('n_a').label, '甲改');
  assert.equal(byId.get('n_a').name, '甲.pdf');
  assert.equal(byId.get('n_a').orderUpdatedAt, 9000);
  assert.ok(byId.get('n_a').sortOrder < byId.get('n_b').sortOrder);
  assert.deepEqual(Array.from(merged.arr.map(function (note) { return note.id; })), ['n_a', 'n_b']);

  const stale = moved.arr.map(function (note, i) {
    return Object.assign({}, note, {
      sortOrder: (moved.arr.length - i) * 1024,
      orderUpdatedAt: 1000
    });
  });
  context.state.notes = moved.arr;
  const changed = context.applyRemoteNotes({ notes: stale, updatedAt: 20000 }, {
    authoritative: true,
    unionLists: true,
    allowAdds: true
  });
  assert.equal(changed, false);
  assert.deepEqual(Array.from(context.state.notes.map(function (note) { return note.id; })), ['n_a', 'n_b']);
});
