const assert = require('node:assert/strict');
for (const name of ['data', 'expansion', 'engine', 'mastery']) require('../js/' + name + '.js');
const C = globalThis.CTQ, E = C.Engine, { validateReplay } = require('../server/mastery-core.cjs');
const lineups = { r: C.defaultExLoadout(), b: C.defaultExLoadout() };
const moves = [], st = E.createState(lineups.r.perks, lineups.b.perks, null, lineups);
for (let i = 0; i < 6; i++) { const m = E.legalMoves(st)[0]; moves.push(m); E.makeMove(st, m); }
const outcome = { kind: 'resign', resignedBy: 'b', winner: 'r' };
const result = validateReplay(C, lineups, moves, outcome);
assert.equal(result.awards.r[0].wins, 1); assert.equal(result.awards.b[0].wins, 0);
assert.equal(result.digest, validateReplay(C, lineups, moves.map((m) => ({ ...m, ignoredField: 100 })), outcome).digest);
assert.throws(() => validateReplay(C, lineups, [{ from: 500, to: -2 }], outcome), /trái luật/);
assert.throws(() => validateReplay(C, lineups, moves, { kind: 'board', winner: 'r' }), /chưa kết thúc/);
assert.throws(() => validateReplay(C, lineups, moves, { ...outcome, winner: 'b' }), /không khớp/);
assert.throws(() => validateReplay(C, lineups, new Array(1201).fill({}), outcome), /không hợp lệ/);
assert.throws(() => validateReplay(C, lineups, moves, { ...outcome, resignedBy: 'x' }), /không hợp lệ/);
// Ba lần lặp thật: máy chủ tự xử hoà thay vì tin kết quả client.
const loop = [{from:E.idx(9,1),to:E.idx(7,2)}, {from:E.idx(0,1),to:E.idx(2,2)}, {from:E.idx(7,2),to:E.idx(9,1)}, {from:E.idx(2,2),to:E.idx(0,1)}];
const draw = validateReplay(C, lineups, loop.concat(loop), { kind: 'board', winner: null });
assert.equal(draw.awards.r[0].wins, 0); assert.equal(draw.awards.b[1].wins, 0);
console.log('8 server replay checks passed');
