import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const gameHtml = readFileSync(new URL('../games/feed-monster/index.html', import.meta.url), 'utf8');
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dashHtml = readFileSync(new URL('../dashboard.html', import.meta.url), 'utf8');
const rules = readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8');

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

function inlineScript(html) {
  const marker = '<script>\n(function () {';
  const start = html.indexOf(marker);
  assert.ok(start >= 0, 'missing inline script');
  const end = html.indexOf('</script>', start);
  return html.slice(start + '<script>\n'.length, end);
}

const DEFAULT_NAMES = ['第一組', '第二組', '第三組', '第四組', '第五組', '第六組'];

function loadMerge() {
  const src = [
    'const GROUP_COUNT = 6;',
    'const MAX_COOKIES = 25;',
    'const DEFAULT_NAMES = ' + JSON.stringify(DEFAULT_NAMES) + ';',
    extractFn(gameHtml, 'normalizeClassName'),
    extractFn(gameHtml, 'normalizeScores'),
    extractFn(gameHtml, 'normalizeNames'),
    extractFn(gameHtml, 'tsMillis'),
    extractFn(gameHtml, 'normalizeCumulEntry'),
    extractFn(gameHtml, 'cumulMapForSave'),
    extractFn(gameHtml, 'normalizePayload'),
    extractFn(gameHtml, 'serializeState'),
    extractFn(gameHtml, 'clonePayload'),
    extractFn(gameHtml, 'contentKey'),
    extractFn(gameHtml, 'sameContent'),
    extractFn(gameHtml, 'cumulRichness'),
    extractFn(gameHtml, 'richnessScore'),
    extractFn(gameHtml, 'sessionScore'),
    extractFn(gameHtml, 'isBlankPayload'),
    extractFn(gameHtml, 'blankPayload'),
    extractFn(gameHtml, 'mergeCumulMaps'),
    extractFn(gameHtml, 'decideLww'),
    extractFn(gameHtml, 'decideLegacyUnion'),
    extractFn(gameHtml, 'decideInitialMerge')
  ].join('\n');
  const context = {
    state: {
      className: '',
      names: DEFAULT_NAMES.slice(),
      todayScores: [0, 0, 0, 0, 0, 0],
      soundOn: true,
      cumulativeByClass: {},
      updatedAt: 0
    }
  };
  vm.createContext(context);
  vm.runInContext(src, context);
  return context;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function board(scores, updatedAt, className) {
  return {
    className: className == null ? '3A' : className,
    names: DEFAULT_NAMES.slice(),
    todayScores: scores,
    soundOn: true,
    cumulativeByClass: {},
    updatedAt: updatedAt
  };
}

test('inline script parses', () => {
  new vm.Script(inlineScript(gameHtml));
});

test('every signed-in account uses the same shared document', () => {
  const seen = [];
  const context = {
    cloudUser: { uid: 'teacher-a' },
    firebase: {
      firestore() {
        return {
          doc(path) {
            seen.push(path);
            return { path: path };
          },
          collection(name) {
            return {
              doc(id) {
                return {
                  collection(sub) {
                    return {
                      doc(leaf) {
                        return { path: [name, id, sub, leaf].join('/') };
                      }
                    };
                  }
                };
              }
            };
          }
        };
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(extractFn(gameHtml, 'cloudDocRef') + '\n' + extractFn(gameHtml, 'legacyPersonalRef'), context);
  const first = context.cloudDocRef();
  context.cloudUser = { uid: 'student-b' };
  const second = context.cloudDocRef();
  assert.equal(first.path, 'shared/feed-monster');
  assert.equal(second.path, 'shared/feed-monster');
  assert.deepEqual(seen, ['shared/feed-monster', 'shared/feed-monster']);
  assert.equal(context.legacyPersonalRef('teacher-a').path, 'users/teacher-a/games/feed-monster');
  assert.equal(context.legacyPersonalRef('student-b').path, 'users/student-b/games/feed-monster');
  assert.equal(gameHtml.includes('.collection("users").doc(cloudUser.uid)'), false);
  assert.equal(gameHtml.includes('writeUidCache'), false);
  assert.equal(gameHtml.includes('firstForUid'), false);
});

test('two accounts merge against one shared board', () => {
  const merge = loadMerge();
  const teacher = board([4, 0, 0, 0, 0, 0], 1000);
  const seeded = merge.decideInitialMerge(teacher, null, { firstSync: true, now: 1000 });
  assert.equal(seeded.push, true);
  assert.deepEqual(plain(seeded.payload.todayScores), [4, 0, 0, 0, 0, 0]);

  const studentLocal = board([0, 0, 0, 0, 0, 0], 0, '');
  const joined = merge.decideInitialMerge(studentLocal, seeded.payload, { firstSync: true, now: 2000 });
  assert.equal(joined.apply, true);
  assert.equal(joined.push, false);
  assert.equal(joined.fromRemote, true);
  assert.deepEqual(plain(joined.payload.todayScores), [4, 0, 0, 0, 0, 0]);
  assert.equal(joined.payload.className, '3A');

  const studentEdit = board([4, 2, 0, 0, 0, 0], 3000);
  const backToTeacher = merge.decideInitialMerge(teacher, studentEdit, { firstSync: false, now: 3000 });
  assert.equal(backToTeacher.fromRemote, true);
  assert.equal(backToTeacher.push, false);
  assert.deepEqual(plain(backToTeacher.payload.todayScores), [4, 2, 0, 0, 0, 0]);

  const blankNewer = board([0, 0, 0, 0, 0, 0], 99999, '');
  const kept = merge.decideInitialMerge(blankNewer, studentEdit, { firstSync: false, now: 100000 });
  assert.equal(kept.push, false);
  assert.equal(kept.apply, true);
  assert.deepEqual(plain(kept.payload.todayScores), [4, 2, 0, 0, 0, 0]);
});

test('signed-out copy stays local and the board is labelled shared', () => {
  assert.match(gameHtml, /共用計分板/);
  assert.match(gameHtml, /登入共用/);
  assert.match(gameHtml, /共用中/);
  assert.match(gameHtml, /登出之後，呢部電腦嘅改動只留喺本地，唔會寫入共用計分板/);
  assert.match(gameHtml, /已登出，之後嘅改動只留喺呢部電腦/);
  assert.equal(gameHtml.includes('已載入呢個帳戶嘅分數'), false);
  assert.match(extractFn(gameHtml, 'cloudSignOut'), /cloudHoldWrites = true/);
  assert.match(extractFn(gameHtml, 'scheduleCloudPush'), /cloudHoldWrites/);
  assert.equal(extractFn(gameHtml, 'cloudSignOut').includes('writeCloudPayload'), false);
  assert.match(gameHtml, /localStorage\.setItem\(STORAGE_KEY/);
});

test('dashboard sync path is unchanged', () => {
  for (const html of [indexHtml, dashHtml]) {
    assert.match(html, /collection\('users'\)\.doc\(firebaseAuthUser\.uid\)\s*\.collection\('dashboard'\)\.doc\('sync'\)/);
  }
  assert.equal(gameHtml.includes("collection('dashboard').doc('sync')"), false);
  assert.equal(gameHtml.includes('collection("dashboard").doc("sync")'), false);
});

test('rules open only the shared feed-monster doc to signed-in users', () => {
  assert.match(rules, /match \/shared\/feed-monster \{\s*allow read, write: if request\.auth != null;\s*\}/);
  assert.match(rules, /match \/users\/\{uid\}\/\{document=\*\*\} \{\s*allow read, write: if request\.auth != null && request\.auth\.uid == uid;\s*\}/);
  assert.equal(rules.includes('match /shared/{'), false);
  assert.equal(/allow\s+read\s*,\s*write\s*:\s*if\s+true/.test(rules), false);
  assert.equal(/allow\s+read\s*,\s*write\s*:\s*if\s+request\.auth\s*==\s*null/.test(rules), false);
  assert.match(rules, /cell_quiz_scores/);
});
