// Đo cân bằng Bản mở rộng.  Chạy: node tests/balance-ex.js <gen|strat> [ván] [ms] [id,id,...]
// gen:   bên có Danh Tướng X (không perk, không Quân Sư) đấu với bên không có gì.
// strat: bên có Quân Sư X đấu với bên không có gì.
// Điểm 0.5 = không tạo khác biệt. Mục tiêu: các lựa chọn cùng nhóm có điểm gần nhau.
require('../js/config.js'); require('../js/data.js'); require('../js/expansion.js'); require('../js/engine.js'); require('../js/ai.js');
const CTQ = globalThis.CTQ, E = CTQ.Engine, AI = CTQ.AI;

const KIND = process.argv[2] || 'gen';
const GAMES = +process.argv[3] || 24;
const MS = +process.argv[4] || 40;
const ONLY = process.argv[5] ? new Set(process.argv[5].split(',')) : null;
const NONE = { K: '', A: '', E: '', R: '', C: '', H: '', P: '' };

let seed = 4242;
const rng = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

function mk(exR, exB) {
  const st = E.createState({}, {}, null, { r: exR, b: exB });
  st.perks = { r: { ...NONE }, b: { ...NONE } };
  delete st.sets;
  return st;
}

function playGame(exR, exB, maxPly) {
  const st = mk(exR, exB);
  const seen = new Map();
  for (let ply = 0; ply < maxPly; ply++) {
    const s = E.status(st);
    if (s.over) return s.winner === 'r' ? 1 : 0;
    const key = E.positionKey(st);
    seen.set(key, (seen.get(key) || 0) + 1);
    if (seen.get(key) >= 3) return 0.5;
    const res = AI.search(st, { maxDepth: 3, timeMs: MS, noise: ply < 6 ? 60 : 8, rng });
    E.makeMove(st, res.move);
  }
  const ev = AI.evaluate(st, 'r');
  return ev > 150 ? 1 : ev < -150 ? 0 : 0.5;
}

const list = KIND === 'gen' ? CTQ.GENERALS : CTQ.STRATEGISTS;
console.log(`${KIND === 'gen' ? 'Danh Tướng' : 'Quân Sư'}: ${GAMES} ván, ${MS}ms/nước. Điểm của bên có (0.5 = không khác biệt)`);
for (const item of list) {
  if (ONLY && !ONLY.has(item.id)) continue;
  const lo = KIND === 'gen' ? { general: { id: item.id, slot: CTQ.defaultSlot(item.type) % CTQ.slotSquares(item.type, 'r').length } } : { strategist: item.id };
  let score = 0;
  const t0 = Date.now();
  for (let g = 0; g < GAMES; g++) {
    if (g % 2 === 0) score += playGame(lo, {}, 160);
    else score += 1 - playGame({}, lo, 160);
  }
  console.log(`  ${item.name.padEnd(20)} ${(score / GAMES).toFixed(2)}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
