// Chạy: node tests/engine.test.js
require('../js/data.js'); require('../js/engine.js'); require('../js/ai.js');
const CTQ = globalThis.CTQ, E = CTQ.Engine;
const assert = require('assert');
const NONE = { K: '', A: '', E: '', R: '', C: '', H: '', P: '' };
function raw(pr, pb, board) {
  return { board: board || E.initialBoard(), turn: 'r', perks: { r: { ...NONE, ...pr }, b: { ...NONE, ...pb } }, swapUsed: { r: false, b: false } };
}
function perft(st, d) {
  if (d === 0) return 1;
  let n = 0;
  for (const m of E.genPseudo(st, st.turn, false)) {
    const me = st.turn; const u = E.makeMove(st, m);
    if (!E.inCheck(st, me)) n += perft(st, d - 1);
    E.unmakeMove(st, u);
  }
  return n;
}
let pass = 0;
function t(name, fn) { fn(); pass++; console.log('  ok', name); }
const empty = () => new Array(90).fill(null);
const put = (b, r, c, t, s) => { b[E.idx(r, c)] = { t, s }; return b; };
const tos = (st, r, c) => E.genPieceMoves(st, E.idx(r, c)).map((m) => `${E.rowOf(m.to)},${E.colOf(m.to)}`).sort();

t('perft chuẩn không perk (44/1920/79666)', () => {
  const st = raw();
  assert.strictEqual(perft(st, 1), 44); assert.strictEqual(perft(st, 2), 1920); assert.strictEqual(perft(st, 3), 79666);
});
function kings(b) { put(b, 9, 4, 'K', 'r'); put(b, 0, 3, 'K', 'b'); return b; }
t('Mã bị cản chân / Thiên Lý Mã', () => {
  const b = kings(empty()); put(b, 5, 4, 'H', 'r'); put(b, 4, 4, 'P', 'r');
  assert.strictEqual(tos(raw({}, {}, b), 5, 4).length, 6);
  assert.strictEqual(tos(raw({ H: 'h_thienly' }, {}, b), 5, 4).length, 8);
});
t('Pháo: Song Ngòi, Cận Chiến, Pháo Bay', () => {
  const b = kings(empty()); put(b, 9, 0, 'C', 'r'); put(b, 8, 0, 'P', 'b'); put(b, 6, 0, 'P', 'r'); put(b, 3, 0, 'R', 'b');
  const st = raw({}, {}, b);
  assert.deepStrictEqual(tos(st, 9, 0).filter((x) => x.startsWith('3') || x.startsWith('8') || x.startsWith('6')), []);
  assert.ok(tos(raw({ C: 'c_songngoi' }, {}, b), 9, 0).includes('3,0'));
  assert.ok(tos(raw({ C: 'c_canchien' }, {}, b), 9, 0).includes('8,0'));
  assert.ok(tos(raw({ C: 'c_phaobay' }, {}, b), 9, 0).includes('7,0'));
});
t('Thiết Giáp: Xe miễn nhiễm Pháo', () => {
  const b = kings(empty()); put(b, 9, 0, 'C', 'b'); put(b, 7, 0, 'P', 'r'); put(b, 5, 0, 'R', 'r');
  assert.ok(tos(raw({}, {}, b), 9, 0).includes('5,0'));
  assert.ok(!tos(raw({ R: 'r_thietgiap' }, {}, b), 9, 0).includes('5,0'));
});
t('Tử Sĩ: quân ăn Sĩ chết theo, Tướng không thể ăn Sĩ', () => {
  const b = kings(empty()); put(b, 1, 4, 'A', 'b'); put(b, 5, 4, 'R', 'r'); put(b, 9, 4, null, null);
  b[E.idx(9, 4)] = null; put(b, 9, 5, 'K', 'r'); put(b, 0, 4, null); b[E.idx(0, 4)] = null;
  const st = raw({}, { A: 'a_tusi' }, b);
  const u = E.makeMove(st, { from: E.idx(5, 4), to: E.idx(1, 4) });
  assert.ok(u.died && !st.board[E.idx(1, 4)]);
  E.unmakeMove(st, u);
  // Tướng đen ăn Sĩ đỏ có Tử Sĩ là nước không hợp lệ
  const b2 = empty(); put(b2, 0, 4, 'K', 'b'); put(b2, 1, 4, 'A', 'r'); put(b2, 9, 3, 'K', 'r');
  const st2 = raw({ A: 'a_tusi' }, {}, b2); st2.turn = 'b';
  assert.ok(!E.legalMovesFrom(st2, E.idx(0, 4)).some((m) => m.to === E.idx(1, 4)));
});
t('Liên Hoàn: Tốt sát ngang miễn nhiễm Xe', () => {
  const b = kings(empty()); put(b, 4, 3, 'P', 'r'); put(b, 4, 4, 'P', 'r'); put(b, 1, 3, 'R', 'b');
  assert.ok(tos(raw({}, {}, b), 1, 3).includes('4,3'));
  assert.ok(!tos(raw({ P: 'p_lienhoan' }, {}, b), 1, 3).includes('4,3'));
});
t('Kim Cương: Sĩ miễn nhiễm Pháo', () => {
  const b = kings(empty()); put(b, 8, 4, 'A', 'r'); put(b, 6, 4, 'P', 'r'); put(b, 4, 4, 'C', 'b');
  b[E.idx(9, 4)] = null; put(b, 9, 5, 'K', 'r');
  assert.ok(tos(raw({}, {}, b), 4, 4).includes('8,4'));
  assert.ok(!tos(raw({ A: 'a_kimcuong' }, {}, b), 4, 4).includes('8,4'));
});
t('Thăng Cấp: Tốt phong Xe', () => {
  const b = kings(empty()); put(b, 2, 0, 'P', 'r');
  const st = raw({ P: 'p_thangcap' }, {}, b);
  const u = E.makeMove(st, { from: E.idx(2, 0), to: E.idx(1, 0) });
  assert.ok(u.promoted && st.board[E.idx(1, 0)].t === 'R');
});
t('Kim Thiền Thoát Xác: đổi chỗ hai lần', () => {
  const st = E.createState({ K: 'k_hoanvi' }, {});
  const sw = E.legalMovesFrom(st, E.idx(9, 4)).filter((m) => m.swap);
  assert.strictEqual(sw.length, 2); // 2 Sĩ
  E.makeMove(st, sw[0]); st.turn = 'r';
  const sw2 = E.legalMovesFrom(st, E.idx(9, 3)).filter((m) => m.swap);
  assert.ok(sw2.length > 0);
  E.makeMove(st, sw2[0]); st.turn = 'r';
  assert.strictEqual(E.legalMovesFrom(st, E.idx(9, 3)).filter((m) => m.swap).length, 0);
});
t('Lộ mặt tướng là không hợp lệ', () => {
  const b = empty(); put(b, 9, 4, 'K', 'r'); put(b, 0, 3, 'K', 'b');
  const st = raw({}, {}, b);
  assert.ok(!E.legalMovesFrom(st, E.idx(9, 4)).some((m) => m.to === E.idx(9, 3)));
});
t('Ngự Giá: Tướng mình được đối mặt, Tướng địch bị chiếu', () => {
  const b = empty(); put(b, 9, 4, 'K', 'r'); put(b, 0, 3, 'K', 'b');
  const st = raw({ K: 'k_ngugia' }, {}, b);
  assert.ok(E.legalMovesFrom(st, E.idx(9, 4)).some((m) => m.to === E.idx(9, 3)));
  E.makeMove(st, { from: E.idx(9, 4), to: E.idx(9, 3) });
  assert.ok(E.inCheck(st, 'b') && !E.inCheck(st, 'r'));
});
t('Song Ngòi không chiếu qua 2 ngòi', () => {
  const b = empty(); put(b, 9, 4, 'C', 'r'); put(b, 7, 4, 'P', 'r'); put(b, 5, 4, 'P', 'b'); put(b, 0, 4, 'K', 'b'); put(b, 9, 3, 'K', 'r');
  const st = raw({ C: 'c_songngoi' }, {}, b); st.turn = 'b';
  assert.ok(!E.inCheck(st, 'b'));
});
t('Chiếu bí bằng Xe đôi', () => {
  const b = empty(); put(b, 0, 4, 'K', 'b'); put(b, 9, 3, 'K', 'r'); put(b, 1, 0, 'R', 'r'); put(b, 0, 8, 'R', 'r');
  const st = raw({}, {}, b); st.turn = 'b';
  const s = E.status(st); assert.ok(s.over && s.winner === 'r');
});
t('AI tìm ra nước chiếu bí', () => {
  const b = empty(); put(b, 0, 4, 'K', 'b'); put(b, 9, 3, 'K', 'r'); put(b, 1, 0, 'R', 'r'); put(b, 5, 8, 'R', 'r');
  const st = raw({}, {}, b);
  const res = CTQ.AI.search(st, { maxDepth: 3, timeMs: 3000 });
  E.makeMove(st, res.move);
  assert.ok(E.status(st).over);
});
console.log(`${pass} bài kiểm tra đạt`);
