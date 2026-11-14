const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const path = require('node:path');
function runtime(initial) {
  const data = new Map(initial ? [['ctq.mastery.v1', initial]] : []);
  const ctx = { localStorage: { getItem: (k) => data.get(k) || null, setItem: (k, v) => data.set(k, v) }, crypto: { randomUUID: () => 'unique-match' } };
  vm.createContext(ctx);
  for (const file of ['data', 'expansion', 'mastery']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/' + file + '.js'), 'utf8'), ctx);
  return { M: ctx.CTQ.Mastery, ctx, data };
}
let passed = 0;
function test(name, fn) { fn(); console.log('  ok', name); passed++; }
const user = { uid: 'a', name: 'An' }, opponent = { uid: 'b', name: 'Bình' };
const lineups = { r: { general: { id: 'quanvu' }, strategist: 'giacatluong' }, b: { general: { id: 'archimedes' }, strategist: 'tontu' } };
const victim = { t: 'P', s: 'b' };
function match(overrides = {}) {
  return { id: 'm1', user, mode: 'online', ex: true, side: 'r', lineups,
    history: [
      { u: { side: 'r', m: {}, fromPiece: { g: 'quanvu' }, captured: victim, extra: [{ t: 'R', s: 'b' }, { t: 'H', s: 'r' }] } },
      { u: { side: 'r', m: { skill: 'hoacong' }, captured: null, extra: [victim] } },
      { u: { side: 'r', m: { skill: 'tamcong' }, captured: null, converted: victim, extra: [] } },
      { u: { side: 'b', m: {}, captured: { t: 'P', s: 'r' }, extra: [] } },
    ], result: { winner: 'r' }, ...overrides };
}
test('8 cấp đúng mốc, cấp 8 vẫn tích điểm', () => {
  const { M } = runtime();
  for (const [i, t] of M.LEVELS.entries()) { assert.equal(M.tier(t.min).level, i + 1); if (i) assert.equal(M.tier(t.min - 1).level, i); }
  assert.equal(M.tier(99999).level, 8); assert.equal(M.tier(99999).progress, 1); assert.equal(M.tier(99999).points, 99999);
  assert.equal(M.tier(-1).level, 1); assert.equal(M.tier(Infinity).points, 0);
});
test('tách điểm Danh Tướng/Quân Sư; ăn lan, chiêu hàng, quân mình', () => {
  const { M } = runtime(), [g, s] = M.calculate(match());
  assert.equal(g.captures, 2); assert.equal(g.points, 160);
  assert.equal(s.captures, 3); assert.equal(s.points, 150);
});
test('thua/hoà vẫn nhận điểm ăn quân, máy nhận 50%, loại trận không tính', () => {
  const { M } = runtime();
  assert.equal(M.calculate(match({ result: { winner: 'b' } }))[0].points, 40);
  assert.equal(M.calculate(match({ result: { winner: null } }))[1].points, 30);
  assert.equal(M.calculate(match({ mode: 'ai' }))[0].points, 80);
  assert.equal(M.calculate(match({ mode: 'local' })), null); assert.equal(M.calculate(match({ ex: false })), null);
});
test('chốt đúng một lần; tính theo lịch sử sau khi đi lại', () => {
  const { M } = runtime();
  M.award(match({ history: [] })); assert.equal(M.get(user, 'g:quanvu').points, 120);
  assert.equal(M.award(match()), null); assert.equal(M.get(user, 's:giacatluong').matches, 1);
});
test('tách hồ sơ và nhân vật, lưu qua tải lại, không đổi luật/perk', () => {
  const { M, ctx, data } = runtime(), before = JSON.stringify(ctx.CTQ.GENERALS);
  M.award(match()); M.equip(user, 's:giacatluong');
  assert.equal(M.get(opponent, 'g:quanvu').points, 0); assert.equal(M.get(user, 'g:archimedes').points, 0);
  assert.equal(JSON.stringify(ctx.CTQ.GENERALS), before);
  const next = runtime(data.get('ctq.mastery.v1')).M;
  assert.equal(next.get(user, 'g:quanvu').points, 160); assert.equal(next.profile(user).showcase, 's:giacatluong');
  assert.equal(next.award(match()), null);
});
test('lên cấp, trang bị, bảng xếp hạng từng nhân vật', () => {
  const { M } = runtime();
  M.award(match()); const receipt = M.award(match({ id: 'm2' })); assert.equal(receipt.awards[0].levelUp, true);
  M.award(match({ id: 'm3', user: opponent, result: { winner: 'b' } }));
  assert.equal(M.localBoard('g:quanvu')[0].name, 'An'); assert.equal(M.localBoard('s:giacatluong').length, 2);
  assert.equal(M.localBoard('g:archimedes').length, 0); assert.equal(M.equip(user, 'g:unknown'), false);
});
test('dữ liệu hỏng, storage bị chặn và snapshot đối thủ không làm lỗi ứng dụng', () => {
  let { M } = runtime('{broken'); assert.equal(M.get(null, 'g:quanvu').points, 0);
  const fresh = runtime(); fresh.ctx.localStorage.setItem = () => { throw new Error('quota'); };
  assert.equal(fresh.M.award(match()).saved, false); assert.equal(fresh.M.get(user, 'g:quanvu').points, 160);
  const snap = M.sanitizeSnapshot({ heroes: { 'g:unknown': { points: 999 }, 'g:quanvu': { points: -100 } }, showcase: { key: '<script>' } });
  assert.equal(snap.showcase, null); assert.equal(Object.keys(snap.heroes).length, 1); assert.equal(snap.heroes['g:quanvu'].points, 0);
});
console.log(`${passed} mastery checks passed`);
