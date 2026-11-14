// Đo cân bằng TỔNG THỂ bản mở rộng: cả hai bên đều mang đội hình đầy đủ
// (Danh Tướng + Quân Sư + 7 perk). Bên A lần lượt thử mọi cặp Danh Tướng × Quân Sư,
// bên B là đội hình ngẫu nhiên. Mỗi ván ghi 1 dòng JSON để tests/balance-meta-report.js phân tích.
//
// Chạy: node tests/balance-meta.js <số ván> <ms/nước> <seed> <file kết quả .jsonl>
// Ví dụ chạy song song 4 nhân:
//   for s in 1 2 3 4; do node tests/balance-meta.js 180 40 $s /tmp/meta-$s.jsonl & done; wait
//   node tests/balance-meta-report.js /tmp/meta-*.jsonl
require('../js/config.js'); require('../js/data.js'); require('../js/expansion.js'); require('../js/engine.js'); require('../js/ai.js');
const fs = require('fs');
const CTQ = globalThis.CTQ, E = CTQ.Engine, AI = CTQ.AI;

const GAMES = +process.argv[2] || 60;
const MS = +process.argv[3] || 40;
const SEED = +process.argv[4] || 1;
const OUT = process.argv[5] || `/tmp/meta-${SEED}.jsonl`;

let seed = 7919 * SEED + 17;
const rng = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const combos = [];
for (const g of CTQ.GENERALS) for (const s of CTQ.STRATEGISTS) combos.push([g.id, s.id]);

function comp(gid, sid) {
  const g = CTQ.generalById(gid);
  const n = CTQ.slotSquares(g.type, 'r').length;
  return { perks: CTQ.randomLoadout(rng), general: { id: gid, slot: Math.floor(rng() * n) }, strategist: sid };
}
function randomComp() {
  const g = CTQ.GENERALS[Math.floor(rng() * CTQ.GENERALS.length)];
  const s = CTQ.STRATEGISTS[Math.floor(rng() * CTQ.STRATEGISTS.length)];
  return comp(g.id, s.id);
}

// trả về điểm của Đỏ
function play(red, black) {
  const st = E.createState(red.perks, black.perks, null, { r: red, b: black });
  const seen = new Map();
  for (let ply = 0; ply < 160; ply++) {
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

const out = fs.createWriteStream(OUT, { flags: 'a' });
const t0 = Date.now();
for (let i = 0; i < GAMES; i++) {
  const [gid, sid] = combos[(i * 4 + SEED - 1) % combos.length];
  const A = comp(gid, sid), B = randomComp();
  const aRed = (i + SEED) % 2 === 0;
  const r = aRed ? play(A, B) : play(B, A);
  const scoreA = aRed ? r : 1 - r;
  out.write(JSON.stringify({ a: A, b: B, aRed, scoreA }) + '\n');
  if ((i + 1) % 20 === 0) console.log(`seed ${SEED}: ${i + 1}/${GAMES} ván, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
out.end();
