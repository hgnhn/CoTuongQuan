const assert = require('node:assert/strict');
for (const name of ['data', 'expansion', 'engine', 'mastery']) require('../js/' + name + '.js');
const C = globalThis.CTQ, E = C.Engine, M = C.Mastery, sq = E.idx;
let passed = 0;
const test = (name, fn) => { fn(); passed++; console.log('  ok', name); };
function fixture(general, strategist, pieces, perks = {}) {
  const b = new Array(90).fill(null);
  b[sq(9, 4)] = { t: 'K', s: 'r' }; b[sq(0, 3)] = { t: 'K', s: 'b' };
  for (const [r, c, t, s, g] of pieces) b[sq(r, c)] = { t, s, ...(g ? { g: general } : {}) };
  const lineups = { r: { general: { id: general, slot: 0 }, strategist, perks }, b: C.defaultExLoadout() };
  const st = E.createState(perks, { R: 'r_phatran', H: 'h_thienly' }, b, { r: { strategist }, b: {} });
  st.ex.gen.r = general; delete st.sets; delete st.flags;
  return { st, lineups };
}
function play(f, move, mode = 'online') {
  const { st, lineups } = f, before = E.cloneState(st), key = E.positionKey(st);
  const exBefore = JSON.stringify(before.ex);
  const legal = move.skill ? E.genSkillMoves(st, st.turn, move.skill) : E.legalMovesFrom(st, move.from);
  const actual = legal.find((m) => m.from === move.from && m.to === move.to && (m.skill || null) === (move.skill || null));
  assert.ok(actual, 'fixture must use a legal move');
  const u = E.makeMove(st, actual), afterKey = E.positionKey(st);
  const awards = M.calculate({ mode, ex: true, side: 'r', lineups, history: [{ before, u }], result: { winner: null } });
  assert.equal(E.positionKey(st), afterKey, 'attribution must not mutate actual position');
  assert.equal(E.positionKey(before), key, 'attribution must not mutate before-position');
  assert.equal(JSON.stringify(before.ex), exBefore, 'attribution must not mutate strategist/general/effect data');
  E.unmakeMove(st, u); assert.equal(E.positionKey(st), key);
  return awards;
}
test('Archimedes: ăn chéo được 20 cơ bản + 10 perk', () => {
  const f = fixture('archimedes', 'tontu', [[9,0,'C','r',true],[8,1,'P','r'],[7,2,'H','b']]);
  const [g, s] = play(f, { from: sq(9,0), to: sq(7,2) });
  assert.equal(g.points, 30); assert.equal(g.perkCaptures, 1); assert.equal(g.perkBonus, 10); assert.equal(s.points, 10); assert.equal(s.perkCaptures, 0);
});
test('Archimedes: Song Ngòi được thưởng, ăn qua một ngòi không có thưởng perk', () => {
  let f = fixture('archimedes', 'tontu', [[9,0,'C','r',true],[8,0,'P','r'],[6,0,'P','b'],[3,0,'H','b']]);
  assert.equal(play(f, { from: sq(9,0), to: sq(3,0) })[0].points, 30);
  f = fixture('archimedes', 'tontu', [[9,0,'C','r',true],[8,0,'P','r'],[3,0,'H','b']]);
  const g = play(f, { from: sq(9,0), to: sq(3,0) })[0]; assert.equal(g.points, 20); assert.equal(g.perkCaptures, 0);
});
test('Quan Vũ: Thiên Lý Mã chỉ nhận thưởng khi thực sự vượt cản chân', () => {
  let f = fixture('quanvu', 'tontu', [[7,4,'H','r',true],[6,4,'P','r'],[5,3,'R','b']]);
  assert.equal(play(f, { from: sq(7,4), to: sq(5,3) })[0].points, 30);
  f = fixture('quanvu', 'tontu', [[7,4,'H','r',true],[5,3,'R','b']]);
  assert.equal(play(f, { from: sq(7,4), to: sq(5,3) })[0].points, 20);
});
test('Gia Cát Lượng: diệt Tốt bằng chiêu được 10 cơ bản + 10 perk', () => {
  const f = fixture('quanvu', 'giacatluong', [[6,0,'P','b']]);
  const [g, s] = play(f, { skill: 'hoacong', from: sq(6,0), to: sq(6,0) });
  assert.equal(g.points, 0); assert.equal(s.points, 20); assert.equal(s.perkCaptures, 1);
});
test('Salamis: thưởng từng quân bị diệt, không cộng cho quân mình', () => {
  const f = fixture('quanvu', 'themistocles', [[6,0,'P','b'],[7,2,'P','b'],[5,8,'P','b'],[6,4,'P','r']]);
  const s = play(f, { skill: 'salamis', from: -1, to: -1 })[1];
  assert.equal(s.points, 60); assert.equal(s.captures, 3); assert.equal(s.perkCaptures, 3);
});
test('Ngô Thì Nhậm: perk Xung Phong ban thêm nhận điểm cho Quân Sư', () => {
  const f = fixture('quanvu', 'ngothinham', [[6,0,'P','r'],[4,0,'H','b']]);
  const [g, s] = play(f, { from: sq(6,0), to: sq(4,0) });
  assert.equal(g.points, 0); assert.equal(s.points, 20); assert.equal(s.perkCaptures, 1);
});
test('Ngô Thì Nhậm: lùi ăn quân sau sông nhận điểm perk', () => {
  const f = fixture('quanvu', 'ngothinham', [[4,0,'P','r'],[5,0,'H','b']]);
  assert.equal(play(f, { from: sq(4,0), to: sq(5,0) })[1].points, 20);
});
test('perk trùng với perk thường không được tính hai lần', () => {
  const f = fixture('quanvu', 'ngothinham', [[6,0,'P','r'],[4,0,'H','b']], { P: 'p_xungphong' });
  const s = play(f, { from: sq(6,0), to: sq(4,0) })[1]; assert.equal(s.points, 10); assert.equal(s.perkCaptures, 0);
});
test('Lê Lai: phản kích Tử Sĩ nhận điểm đúng bên khi địch đi', () => {
  const f = fixture('lelai', 'tontu', [[8,4,'A','r',true],[8,0,'R','b']]); f.st.turn = 'b';
  const [g, s] = play(f, { from: sq(8,0), to: sq(8,4) });
  assert.equal(g.points, 30); assert.equal(g.captures, 1); assert.equal(g.perkCaptures, 1); assert.equal(s.points, 10);
});
test('Phong Toả chỉ có thưởng khi giúp nước ăn thành hợp lệ', () => {
  let f = fixture('quanvu', 'giacatluong', [[7,3,'H','r',true],[5,2,'P','b'],[4,4,'R','b']]);
  f.st.ex.frz.b = { sq: sq(4,4), n: 2 };
  let a = play(f, { from: sq(7,3), to: sq(5,2) }); assert.equal(a[0].points, 20); assert.equal(a[1].points, 20);
  f = fixture('quanvu', 'giacatluong', [[7,3,'H','r',true],[5,2,'P','b'],[4,0,'R','b']]);
  f.st.ex.frz.b = { sq: sq(4,0), n: 2 };
  a = play(f, { from: sq(7,3), to: sq(5,2) }); assert.equal(a[1].points, 10);
});
test('Tư Mã Ý: Kiên Thủ giúp ăn quân mà không bị tự chiếu', () => {
  const f = fixture('quanvu', 'tumay', [[7,3,'H','r',true],[5,2,'P','b'],[4,4,'C','b'],[6,4,'P','r']]);
  assert.equal(play(f, { from: sq(7,3), to: sq(5,2) })[1].points, 20);
});
test('chiêu không hạ quân và Tâm Công không có thưởng ăn quân', () => {
  let f = fixture('quanvu', 'giacatluong', [[4,0,'H','b']]);
  assert.equal(play(f, { skill: 'phongtoa', from: sq(4,0), to: sq(4,0) })[1].points, 0);
  f = fixture('quanvu', 'nguyentrai', [[6,0,'P','b']]);
  assert.equal(play(f, { skill: 'tamcong', from: sq(6,0), to: sq(6,0) })[1].points, 0);
});
test('Hoả Công của Pháo thường không bị nhận nhầm là perk Quân Sư', () => {
  const f = fixture('quanvu', 'tontu', [[7,0,'C','r'],[6,0,'P','r'],[4,0,'H','b'],[3,0,'R','b'],[3,1,'P','b']], { C: 'c_hoacong' });
  const [g, s] = play(f, { from: sq(7,0), to: sq(4,0) });
  assert.equal(g.points, 0); assert.equal(s.points, 30); assert.equal(s.perkCaptures, 0);
});
test('đấu máy áp dụng 50% cho cả điểm cơ bản và thưởng perk', () => {
  const f = fixture('archimedes', 'tontu', [[9,0,'C','r',true],[8,1,'P','r'],[7,2,'H','b']]);
  const g = play(f, { from: sq(9,0), to: sq(7,2) }, 'ai')[0]; assert.equal(g.points, 15); assert.equal(g.perkBonus, 5);
});
console.log(`${passed} perk mastery checks passed`);
