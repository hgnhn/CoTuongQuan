/* Thuần logic: máy chủ phát lại ván cờ và tự tính điểm, không nhận điểm do client khai. */
const crypto = require('node:crypto');
function validateReplay(C, lineups, moves, outcome) {
  if (!Array.isArray(moves) || moves.length > 1200 || !outcome || !['board', 'resign'].includes(outcome.kind)) throw new Error('Ván cờ không hợp lệ.');
  const E = C.Engine, st = E.createState(lineups.r.perks, lineups.b.perks, null, lineups);
  const history = [], keys = [E.positionKey(st)], canonical = [];
  let quiet = 0, terminal = null;
  for (const input of moves) {
    if (terminal) throw new Error('Có nước đi sau khi trận đã kết thúc.');
    if (!input || !Number.isInteger(input.from) || !Number.isInteger(input.to)) throw new Error('Nước đi không hợp lệ.');
    const move = E.legalMoves(st).find((m) => m.from === input.from && m.to === input.to && !!m.swap === !!input.swap && (m.skill || null) === (input.skill || null));
    if (!move) throw new Error('Nước đi trái luật.');
    const u = E.makeMove(st, move), key = E.positionKey(st), gaveCheck = E.inCheck(st, st.turn);
    history.push({ u, mover: u.side, gaveCheck }); canonical.push({ from: move.from, to: move.to, swap: !!move.swap, skill: move.skill || null }); keys.push(key);
    quiet = u.captured || u.extra.length || u.converted ? 0 : quiet + 1;
    const status = E.status(st);
    if (status.over) terminal = { winner: status.winner };
    else if (keys.filter((k) => k === key).length >= 3) {
      const cycle = history.slice(keys.indexOf(key));
      const checks = (side) => { const mine = cycle.filter((h) => h.mover === side); return mine.length && mine.every((h) => h.gaveCheck); };
      const r = !!checks('r'), b = !!checks('b');
      terminal = { winner: r !== b ? (r ? 'b' : 'r') : null };
    } else if (quiet >= 120) terminal = { winner: null };
  }
  let winner;
  if (outcome.kind === 'resign') {
    if (terminal || !['r', 'b'].includes(outcome.resignedBy)) throw new Error('Đầu hàng không hợp lệ.');
    winner = E.other(outcome.resignedBy);
  } else {
    if (!terminal) throw new Error('Ván cờ chưa kết thúc.');
    winner = terminal.winner;
  }
  if (outcome.winner !== winner) throw new Error('Kết quả không khớp ván cờ.');
  const normalized = { kind: outcome.kind, winner, resignedBy: outcome.kind === 'resign' ? outcome.resignedBy : null };
  const digest = crypto.createHash('sha256').update(JSON.stringify({ moves: canonical, outcome: normalized })).digest('hex');
  return { digest, awards: Object.fromEntries(['r', 'b'].map((side) => [side, C.Mastery.calculate({ mode: 'online', ex: true, side, lineups, history, result: { winner } })])) };
}
module.exports = { validateReplay };
