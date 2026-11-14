// Kiểm tra chính handler Cloud Functions, với Firestore transaction trong bộ nhớ.
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
for (const f of ['data', 'expansion', 'engine', 'mastery']) require('../js/' + f + '.js');
const C = globalThis.CTQ, records = new Map(); let sequence = 0;
const snap = (key) => ({ exists: records.has(key), data: () => records.get(key) });
function doc(key) { return { key, id: key.split('/').pop(), get: async () => snap(key), collection: (name) => collection(key + '/' + name) }; }
function collection(key) {
  return { doc: (id) => doc(key + '/' + id), add: async (value) => { const ref = doc(key + '/m' + (++sequence)); records.set(ref.key, value); return ref; },
    orderBy: () => ({ limit: (count) => ({ get: async () => ({ docs: [...records.entries()].filter(([k]) => k.startsWith(key + '/')).sort((a, b) => b[1].points - a[1].points).slice(0, count).map(([k]) => ({ id: k.split('/').pop(), data: () => records.get(k) })) }) }) }) };
}
let queue = Promise.resolve();
const db = { collection, runTransaction: (fn) => {
  const work = queue.then(async () => {
    const pending = [];
    const result = await fn({ get: async (ref) => snap(ref.key), set: (ref, value) => pending.push(() => records.set(ref.key, value)), update: (ref, value) => pending.push(() => records.set(ref.key, { ...records.get(ref.key), ...value })) });
    pending.forEach((write) => write()); return result;
  }); queue = work.catch(() => {}); return work;
} };
class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
const exported = {};
const mocks = {
  'firebase-functions/v2/https': { onCall: (_, fn) => fn, HttpsError },
  'firebase-admin/app': { initializeApp() {} },
  'firebase-admin/firestore': { getFirestore: () => db, FieldValue: { serverTimestamp: () => 1 }, Timestamp: { fromMillis: (n) => ({ toMillis: () => n }) } },
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../server/index.js'), 'utf8'), {
  CTQ: C, exports: exported, console,
  require: (name) => mocks[name] || (name.startsWith('./shared/') ? {} : require(path.join(__dirname, '../server', name))),
});
const auth = (uid) => ({ uid }), players = { r: { uid: 'red', name: 'Đỏ' }, b: { uid: 'black', name: 'Đen' } };
const lineups = { r: C.defaultExLoadout(), b: C.defaultExLoadout() };
const winner = { kind: 'resign', resignedBy: 'b', winner: 'r' };
let checks = 0;
(async () => {
  await assert.rejects(exported.openMasteryMatch({ data: { players, lineups } }), /đăng nhập/); checks++;
  await assert.rejects(exported.openMasteryMatch({ auth: auth('red'), data: { players: { r: players.r, b: players.r }, lineups } }), /khác nhau/); checks++;
  const opened = await exported.openMasteryMatch({ auth: auth('red'), data: { players, lineups } });
  const request = { matchId: opened.id, moves: [], outcome: winner, points: 1000000 };
  await assert.rejects(exported.submitMasteryMatch({ auth: auth('stranger'), data: request }), /không tham gia/); checks++;
  const first = await exported.submitMasteryMatch({ auth: auth('red'), data: request });
  assert.equal(first.awarded, false); assert.equal([...records.keys()].filter((k) => k.startsWith('masteryBoards/')).length, 0); checks++;
  const second = await exported.submitMasteryMatch({ auth: auth('black'), data: request }); assert.equal(second.awarded, true);
  assert.equal(records.get('masteryBoards/g:quanvu/players/red').points, 120); // bỏ qua số điểm client khai
  assert.equal(records.get('masteryBoards/g:quanvu/players/black').points, 0); checks++;
  await Promise.all([exported.submitMasteryMatch({ auth: auth('red'), data: request }), exported.submitMasteryMatch({ auth: auth('black'), data: request })]);
  assert.equal(records.get('masteryBoards/g:quanvu/players/red').points, 120); checks++;
  const board = await exported.getMasteryLeaderboard({ data: { key: 'g:quanvu' } }); assert.equal(board.rows[0].name, 'Đỏ'); checks++;
  await assert.rejects(exported.getMasteryLeaderboard({ data: { key: 'g:unknown' } }), /không hợp lệ/); checks++;
  const disputed = await exported.openMasteryMatch({ auth: auth('red'), data: { players, lineups } });
  await exported.submitMasteryMatch({ auth: auth('red'), data: { ...request, matchId: disputed.id } });
  await assert.rejects(exported.submitMasteryMatch({ auth: auth('black'), data: { ...request, matchId: disputed.id, outcome: { kind: 'resign', resignedBy: 'r', winner: 'b' } } }), /khác nhau/); checks++;
  assert.equal(records.get('masteryBoards/g:quanvu/players/red').points, 120);
  const expired = await exported.openMasteryMatch({ auth: auth('red'), data: { players, lineups } }); records.get('masteryMatches/' + expired.id).expiresAt = { toMillis: () => 0 };
  await assert.rejects(exported.submitMasteryMatch({ auth: auth('red'), data: { ...request, matchId: expired.id } }), /quá thời gian/); checks++;
  console.log(`${checks} Cloud Functions checks passed`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
