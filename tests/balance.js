// Đo cân bằng perk.  Chạy: node tests/balance.js [số ván mỗi perk] [ms mỗi nước]
// 1) Độ cơ động: số nước đi tăng thêm trung bình của mỗi quân khi mang perk,
//    đo trên các thế cờ trung cuộc lấy từ ván AI tự đấu.
// 2) Tự đấu: bên có perk (chỉ 1 loại quân) đấu với bên không perk, đổi màu luân phiên.
require('../js/data.js'); require('../js/engine.js'); require('../js/ai.js');
const CTQ = globalThis.CTQ, E = CTQ.Engine, AI = CTQ.AI;

const GAMES = +process.argv[2] || 16;
const MS = +process.argv[3] || 60;
const ONLY = process.argv[4] || '';
const NONE = { K: '', A: '', E: '', R: '', C: '', H: '', P: '' };

let seed = 12345;
const rng = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

function mk(pr, pb) {
  return { board: E.initialBoard(), turn: 'r', perks: { r: { ...NONE, ...pr }, b: { ...NONE, ...pb } }, swapUsed: { r: false, b: false } };
}

function playGame(pr, pb, maxPly, collect) {
  const st = mk(pr, pb);
  const seen = new Map();
  for (let ply = 0; ply < maxPly; ply++) {
    const s = E.status(st);
    if (s.over) return s.winner === 'r' ? 1 : 0;
    const key = E.positionKey(st);
    seen.set(key, (seen.get(key) || 0) + 1);
    if (seen.get(key) >= 3) return 0.5;
    if (collect && ply >= 12 && ply % 6 === 0) collect.push(E.cloneState(st));
    // vài nước đầu nhiễu mạnh để đa dạng khai cuộc
    const res = AI.search(st, { maxDepth: 3, timeMs: MS, noise: ply < 6 ? 60 : 8, rng });
    E.makeMove(st, res.move);
  }
  // Xử theo thế cờ khi quá dài
  const ev = AI.evaluate(st, 'r');
  return ev > 150 ? 1 : ev < -150 ? 0 : 0.5;
}

// ---- 1) Độ cơ động ----
const samples = [];
for (let g = 0; g < 6; g++) playGame({}, {}, 90, samples);
console.log(`Độ cơ động (trên ${samples.length} thế cờ trung cuộc): số nước tăng thêm / mỗi quân`);
for (const t of CTQ.PIECE_ORDER) {
  const base = { n: 0, cnt: 0 };
  const rows = [];
  for (const perk of CTQ.PERKS[t]) {
    let delta = 0, cnt = 0;
    for (const s0 of samples) {
      for (const side of ['r', 'b']) {
        const a = E.cloneState(s0); a.perks[side][t] = '';
        const b = E.cloneState(s0); b.perks[side][t] = perk.id;
        for (let i = 0; i < 90; i++) {
          const p = a.board[i];
          if (!p || p.s !== side || p.t !== t) continue;
          delta += E.genPieceMoves(b, i).length - E.genPieceMoves(a, i).length;
          cnt++;
        }
      }
    }
    rows.push(`${perk.name} +${(delta / Math.max(cnt, 1)).toFixed(2)}`);
  }
  console.log(`  ${CTQ.PIECES[t].name.padEnd(6)} ${rows.join(' | ')}`);
}

// ---- 2) Tự đấu ----
if (GAMES > 0) {
  console.log(`\nTự đấu: ${GAMES} ván / perk, ${MS}ms mỗi nước. Điểm của bên có perk (0.5 = cân bằng)`);
  // Mốc chuẩn: không perk vs không perk
  const types = ONLY ? ONLY.split(',') : CTQ.PIECE_ORDER;
  for (const t of types) {
    for (const perk of CTQ.PERKS[t]) {
      let score = 0;
      const t0 = Date.now();
      for (let g = 0; g < GAMES; g++) {
        const loud = { [t]: perk.id };
        if (g % 2 === 0) score += playGame(loud, {}, 160);
        else score += 1 - playGame({}, loud, 160);
      }
      console.log(`  ${CTQ.PIECES[t].name.padEnd(6)} ${perk.name.padEnd(20)} ${(score / GAMES).toFixed(2)}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
  }
}
