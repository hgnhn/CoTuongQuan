// Phân tích kết quả tests/balance-meta.js.
// Mô hình Bradley–Terry (hồi quy logistic): P(A thắng) = σ(lợi thế Đỏ + Σθ(A) − Σθ(B)),
// với θ cho từng Danh Tướng, Quân Sư và perk. Nhờ đó sức mạnh mỗi lựa chọn được đo trong bối cảnh
// cả đội hình, đã trừ đi sức mạnh của đối thủ gặp phải.
// Chạy: node tests/balance-meta-report.js /tmp/meta-*.jsonl
require('../js/config.js'); require('../js/data.js'); require('../js/expansion.js');
const fs = require('fs');
const CTQ = globalThis.CTQ;

const rows = [];
for (const f of process.argv.slice(2)) {
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) if (line.trim()) rows.push(JSON.parse(line));
}
if (!rows.length) { console.log('Không có dữ liệu.'); process.exit(0); }

const feats = (c) => ['g:' + c.general.id, 's:' + c.strategist].concat(Object.values(c.perks).map((p) => 'p:' + p));
const names = new Set();
for (const r of rows) for (const k of feats(r.a).concat(feats(r.b))) names.add(k);
const theta = Object.fromEntries([...names].map((k) => [k, 0]));
let redAdv = 0;
const sig = (x) => 1 / (1 + Math.exp(-x));

// Gradient descent, chuẩn hoá L2 nhẹ để ước lượng ổn định với ít ván
const L2 = 0.02, LR = 0.05;
for (let it = 0; it < 3000; it++) {
  const grad = Object.fromEntries(Object.keys(theta).map((k) => [k, 0]));
  let gRed = 0;
  for (const r of rows) {
    const fa = feats(r.a), fb = feats(r.b);
    let z = (r.aRed ? 1 : -1) * redAdv;
    for (const k of fa) z += theta[k];
    for (const k of fb) z -= theta[k];
    const err = r.scoreA - sig(z);
    for (const k of fa) grad[k] += err;
    for (const k of fb) grad[k] -= err;
    gRed += (r.aRed ? 1 : -1) * err;
  }
  for (const k in theta) theta[k] += LR * (grad[k] / rows.length * 50 - L2 * theta[k]);
  redAdv += LR * gRed / rows.length * 50;
}
// căn giữa từng nhóm: 0 = trung bình nhóm
const center = (prefix, keys) => {
  const ks = keys.filter((k) => k in theta);
  const m = ks.reduce((a, k) => a + theta[k], 0) / ks.length;
  for (const k of ks) theta[k] -= m;
};
center('g', CTQ.GENERALS.map((g) => 'g:' + g.id));
center('s', CTQ.STRATEGISTS.map((s) => 's:' + s.id));
for (const t of CTQ.PIECE_ORDER) center('p', CTQ.PERKS[t].map((p) => 'p:' + p.id));

const count = {}, raw = {};
for (const r of rows) {
  for (const [c, sc] of [[r.a, r.scoreA], [r.b, 1 - r.scoreA]]) {
    for (const k of feats(c)) { count[k] = (count[k] || 0) + 1; raw[k] = (raw[k] || 0) + sc; }
  }
}
const pct = (x) => (sig(x) * 100).toFixed(0) + '%';
const line = (label, k) => !(k in theta) ? `  ${label.padEnd(22)}  —   (chưa có ván)` : `  ${label.padEnd(22)} ${pct(theta[k]).padStart(4)}   (thô ${(raw[k] / count[k]).toFixed(2)}, ${count[k]} lần)`;

console.log(`${rows.length} ván. Lợi thế đi trước của Đỏ: ${pct(redAdv)}`);
console.log('Tỉ lệ thắng ước tính khi gặp đội hình trung bình (50% = cân bằng):\n');
console.log('Danh Tướng:');
for (const g of [...CTQ.GENERALS].sort((a, b) => theta['g:' + b.id] - theta['g:' + a.id])) console.log(line(g.name, 'g:' + g.id));
console.log('\nQuân Sư:');
for (const s of [...CTQ.STRATEGISTS].sort((a, b) => theta['s:' + b.id] - theta['s:' + a.id])) console.log(line(s.name, 's:' + s.id));
console.log('\nPerk (so với các perk cùng loại quân):');
for (const t of CTQ.PIECE_ORDER) {
  console.log(`  ${CTQ.PIECES[t].name}: ` + CTQ.PERKS[t].map((p) => `${p.name} ${pct(theta['p:' + p.id])}`).join(' | '));
}

// Cặp cộng hưởng: điểm thực tế của cặp trừ điểm mô hình dự đoán (cộng dồn từng ván)
const pair = {};
for (const r of rows) {
  for (const [c, o, sc, sideRed] of [[r.a, r.b, r.scoreA, r.aRed], [r.b, r.a, 1 - r.scoreA, !r.aRed]]) {
    let z = (sideRed ? 1 : -1) * redAdv;
    for (const k of feats(c)) z += theta[k];
    for (const k of feats(o)) z -= theta[k];
    const key = c.general.id + '+' + c.strategist;
    const p = pair[key] || (pair[key] = { n: 0, res: 0 });
    p.n++; p.res += sc - sig(z);
  }
}
const pairs = Object.entries(pair).filter(([, v]) => v.n >= 6).map(([k, v]) => [k, v.res / v.n, v.n]);
pairs.sort((a, b) => b[1] - a[1]);
const pname = (k) => { const [g, s] = k.split('+'); return `${CTQ.generalById(g).name} + ${CTQ.strategistById(s).name}`; };
console.log('\nCặp cộng hưởng mạnh nhất (điểm vượt dự đoán, ≥6 ván):');
for (const [k, d, n] of pairs.slice(0, 5)) console.log(`  ${pname(k).padEnd(40)} ${d >= 0 ? '+' : ''}${(d * 100).toFixed(0)}%  (${n} ván)`);
console.log('Cặp kém nhất:');
for (const [k, d, n] of pairs.slice(-5).reverse()) console.log(`  ${pname(k).padEnd(40)} ${d >= 0 ? '+' : ''}${(d * 100).toFixed(0)}%  (${n} ván)`);
