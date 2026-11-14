// Chạy: node tests/engine.test.js
require('../js/config.js'); require('../js/data.js'); require('../js/expansion.js'); require('../js/engine.js'); require('../js/ai.js');
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
t('Pháo: Song Ngòi, Cận Chiến, Pháo Chéo', () => {
  const b = kings(empty()); put(b, 9, 0, 'C', 'r'); put(b, 8, 0, 'P', 'b'); put(b, 6, 0, 'P', 'r'); put(b, 3, 0, 'R', 'b');
  const st = raw({}, {}, b);
  assert.deepStrictEqual(tos(st, 9, 0).filter((x) => x.startsWith('3') || x.startsWith('8') || x.startsWith('6')), []);
  assert.ok(tos(raw({ C: 'c_songngoi' }, {}, b), 9, 0).includes('3,0'));
  assert.ok(tos(raw({ C: 'c_canchien' }, {}, b), 9, 0).includes('8,0'));
  const b2 = kings(empty()); put(b2, 9, 0, 'C', 'r'); put(b2, 8, 1, 'P', 'r'); put(b2, 6, 3, 'H', 'b'); put(b2, 5, 4, 'H', 'b');
  const pc = tos(raw({ C: 'c_phaocheo' }, {}, b2), 9, 0);
  assert.ok(pc.includes('6,3') && !pc.includes('5,4')); // tầm chéo tối đa 3 ô
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

// ---------------- Perk mới & Bản mở rộng ----------------
t('Voi Giày: Tượng ăn quân giẫm chết Tốt quanh đó', () => {
  const b = kings(empty()); put(b, 7, 4, 'E', 'r'); put(b, 5, 2, 'H', 'b'); put(b, 5, 1, 'P', 'b'); put(b, 4, 3, 'P', 'b'); put(b, 5, 3, 'R', 'b');
  const st = raw({ E: 'e_voigiay' }, {}, b);
  const u = E.makeMove(st, { from: E.idx(7, 4), to: E.idx(5, 2) });
  assert.strictEqual(u.extra.length, 2); // 2 Tốt, không giẫm Xe
  assert.ok(st.board[E.idx(5, 3)]);
  E.unmakeMove(st, u);
  assert.ok(st.board[E.idx(5, 1)] && st.board[E.idx(4, 3)] && st.board[E.idx(7, 4)]);
});
t('Hoả Công: bắn xuyên quân phía sau mục tiêu', () => {
  const b = kings(empty()); put(b, 9, 0, 'C', 'r'); put(b, 7, 0, 'P', 'r'); put(b, 4, 0, 'H', 'b'); put(b, 3, 0, 'R', 'b');
  const st = raw({ C: 'c_hoacong' }, {}, b);
  const u = E.makeMove(st, { from: E.idx(9, 0), to: E.idx(4, 0) });
  assert.ok(u.extra.length === 1 && !st.board[E.idx(3, 0)]);
});
t('Phá Trận: Xe đi xuyên quân mình', () => {
  const b = kings(empty()); put(b, 9, 0, 'R', 'r'); put(b, 6, 0, 'P', 'r');
  assert.ok(!tos(raw({}, {}, b), 9, 0).includes('4,0'));
  assert.ok(tos(raw({ R: 'r_phatran' }, {}, b), 9, 0).includes('4,0'));
});
t('Hãn Mã: Pháo không ăn được Mã', () => {
  const b = kings(empty()); put(b, 9, 0, 'C', 'b'); put(b, 7, 0, 'P', 'r'); put(b, 5, 0, 'H', 'r');
  assert.ok(tos(raw({}, {}, b), 9, 0).includes('5,0'));
  assert.ok(!tos(raw({ H: 'h_hanma' }, {}, b), 9, 0).includes('5,0'));
});

const exState = (rLo, bLo) => E.createState((rLo && rLo.perks) || {}, (bLo && bLo.perks) || {}, null, { r: rLo || {}, b: bLo || {} });
t('Danh Tướng thay đúng 1 quân, mang perk riêng', () => {
  const st = exState({ general: { id: 'quanvu', slot: 1 } });
  const sq = CTQ.slotSquares('H', 'r')[1];
  assert.strictEqual(st.board[sq].g, 'quanvu');
  assert.strictEqual(st.board[CTQ.slotSquares('H', 'r')[0]].g, undefined);
  // Thiên Lý Mã: Mã không bị Tượng cản chân
  assert.ok(E.legalMovesFrom(st, sq).some((m) => m.to === E.idx(8, 5)));
});
t('Achilles: Xe không ăn được, Tốt thì được', () => {
  const b = kings(empty()); put(b, 5, 0, 'R', 'r'); b[E.idx(5, 0)].g = 'achilles'; put(b, 2, 0, 'R', 'b'); put(b, 4, 0, 'P', 'b');
  const st = exStateBoard(b, { general: { id: 'achilles' } });
  assert.ok(!tos(st, 2, 0).includes('5,0'));
  st.turn = 'b';
  assert.ok(E.legalMovesFrom(st, E.idx(4, 0)).some((m) => m.to === E.idx(5, 0)));
});
function exStateBoard(board, rLo, bLo) {
  const st = E.createState({}, {}, board, { r: {}, b: {} });
  st.ex.gen.r = rLo && rLo.general ? rLo.general.id : null;
  st.ex.strat.r = rLo && rLo.strategist || null;
  st.ex.strat.b = bLo && bLo.strategist || null;
  delete st.sets; return st;
}
t('Lê Lai thế thân Tướng khi bị chiếu', () => {
  const b = empty(); put(b, 9, 4, 'K', 'r'); put(b, 8, 4, 'A', 'r'); b[E.idx(8, 4)].g = 'lelai'; put(b, 0, 3, 'K', 'b'); put(b, 9, 0, 'R', 'b');
  const st = exStateBoard(b, { general: { id: 'lelai' } });
  assert.ok(E.inCheck(st, 'r'));
  assert.ok(E.legalMovesFrom(st, E.idx(8, 4)).some((m) => m.swap && m.to === E.idx(9, 4)));
});
t('Bát Trận Đồ vô hiệu Thiên Lý Mã của địch', () => {
  const b = kings(empty()); put(b, 7, 4, 'H', 'r'); put(b, 6, 4, 'P', 'r');
  assert.ok(tos(raw({ H: 'h_thienly' }, {}, b), 7, 4).includes('5,3'));
  const st = exStateBoard(b, null, { strategist: 'giacatluong' }); st.perks.r.H = 'h_thienly';
  assert.ok(!tos(st, 7, 4).includes('5,3'));
});
t('Phong Toả: quân địch đứng yên 2 lượt, hoàn tác đúng', () => {
  const st = exState({ strategist: 'giacatluong' }, {});
  const target = E.idx(0, 0); // Xe Đen
  const m = E.genSkillMoves(st, 'r', 'phongtoa').find((x) => x.from === target);
  const key0 = E.positionKey(st);
  const u = E.makeMove(st, m);
  assert.ok(!E.legalMoves(st).some((x) => x.from === target));
  E.makeMove(st, E.legalMoves(st)[0]); // Đen đi lượt 1
  E.makeMove(st, E.legalMoves(st).find((x) => !x.skill)); // Đỏ
  assert.ok(!E.legalMoves(st).some((x) => x.from === target)); // vẫn bị phong toả lượt 2
  E.makeMove(st, E.legalMoves(st).find((x) => x.from !== target));
  E.makeMove(st, E.legalMoves(st).find((x) => !x.skill));
  assert.ok(E.legalMoves(st).some((x) => x.from === target)); // hết phong toả
  // chiêu 1 lần: không dùng lại được
  assert.strictEqual(E.genSkillMoves(st, 'b', 'phongtoa').length, 0);
  const st2 = exState({ strategist: 'giacatluong' }, {});
  const u2 = E.makeMove(st2, m); E.unmakeMove(st2, u2);
  assert.strictEqual(E.positionKey(st2), key0);
});
t('Hồi chiêu: Điều Binh dùng lại sau 3 lượt', () => {
  const st = exState({ strategist: 'ngothinham' }, {});
  const ok = () => E.genSkillMoves(st, 'r', 'dieubinh').length > 0;
  assert.ok(ok());
  E.makeMove(st, E.genSkillMoves(st, 'r', 'dieubinh')[0]);
  let waits = 0;
  while (true) {
    E.makeMove(st, E.legalMoves(st).find((x) => !x.skill)); // Đen
    if (ok()) break;
    waits++;
    E.makeMove(st, E.legalMoves(st).find((x) => !x.skill)); // Đỏ đi thường
  }
  assert.strictEqual(waits, 3);
});
t('Chiêu Binh, Tâm Công, Salamis', () => {
  const mk = () => { const b = kings(empty()); put(b, 6, 0, 'P', 'r'); put(b, 6, 4, 'P', 'b'); put(b, 7, 2, 'P', 'b'); return b; };
  const st = exStateBoard(mk(), { strategist: 'nguyentrai' });
  assert.ok(E.genSkillMoves(st, 'r', 'chieubinh').length === 3);
  const tm = E.genSkillMoves(st, 'r', 'tamcong');
  assert.strictEqual(tm.length, 2);
  E.makeMove(st, tm[0]);
  assert.strictEqual(st.board[tm[0].from].s, 'r');
  const st3 = exStateBoard(mk(), { strategist: 'themistocles' });
  const u = E.makeMove(st3, E.genSkillMoves(st3, 'r', 'salamis')[0]);
  assert.strictEqual(u.extra.length, 2);
});
t('Thử ngẫu nhiên: 40 ván bản mở rộng, hoàn tác luôn khớp', () => {
  let seed = 3; const rng = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  let plies = 0, skills = 0;
  for (let g = 0; g < 40; g++) {
    const st = exState(CTQ.randomExLoadout(rng), CTQ.randomExLoadout(rng));
    for (let ply = 0; ply < 120; ply++) {
      const moves = E.legalMoves(st);
      if (!moves.length) break;
      const sk = moves.filter((m) => m.skill);
      const m = sk.length && rng() < 0.3 ? sk[Math.floor(rng() * sk.length)] : moves[Math.floor(rng() * moves.length)];
      const before = E.positionKey(st), boardBefore = st.board.slice();
      const u = E.makeMove(st, m); E.unmakeMove(st, u);
      assert.strictEqual(E.positionKey(st), before);
      assert.ok(st.board.every((p, i) => p === boardBefore[i]));
      E.makeMove(st, m); plies++; if (m.skill) skills++;
      assert.ok(E.findKing(st, 'r') >= 0 && E.findKing(st, 'b') >= 0);
    }
  }
  assert.ok(skills > 50, 'chiêu được dùng ' + skills);
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
