/* Cờ Tướng Quân — AI: negamax alpha-beta + tìm kiếm tĩnh (quiescence),
 * đào sâu dần theo thời gian. Hiểu perk vì dùng chung bộ sinh nước của engine.
 */
(function (root) {
  const CTQ = (root.CTQ = root.CTQ || {});
  const E = CTQ.Engine;
  const AI = (CTQ.AI = {});

  // Giá trị quân (thang Xe = 900). Nguồn: bảng giá trị truyền thống
  // Xe 9, Pháo 4.5, Mã 4, Sĩ 2, Tượng 2, Tốt 1 (2 khi qua sông).
  const VAL = { K: 0, A: 200, E: 200, R: 900, C: 450, H: 400, P: 100 };

  // Phần thưởng giá trị khi quân mang perk (đo bằng scripts cân bằng,
  // xem tests/balance.js). Giúp AI biết đổi quân hợp lý.
  AI.PERK_BONUS = {
    k_batquai: 0, k_khinhcong: 0, k_ngugia: 0, k_hoanvi: 0,
    a_canve: 25, a_tuantra: 20, a_kimcuong: 30, a_tusi: 30,
    e_vuotgiang: 10, e_voichien: 15, e_tieubo: 10, e_voigiay: 15,
    r_thietgiap: 50, r_chienxa: 40, r_phaoxa: 40, r_phatran: 40,
    c_songngoi: 70, c_canchien: 60, c_phaocheo: 60, c_hoacong: 60,
    h_thienly: 60, h_chienma: 70, h_otruy: 70, h_hanma: 50,
    p_linhhoat: 20, p_xungphong: 15, p_lienhoan: 20, p_thangcap: 20,
  };

  // Giá trị cộng thêm của quân Danh Tướng (đo bằng tests/balance-ex.js)
  AI.GEN_BONUS = {
    tranhungdao: 0, leonidas: 0, lelai: 150, hachu: 150, batrieu: 200, hannibal: 200,
    lubo: 250, achilles: 350, honguyentrung: 200, archimedes: 200,
    quanvu: 200, richard: 200, yetkieu: 150, spartacus: 150,
  };

  const MATE = 100000;

  function pieceScore(state, p, i) {
    const r = E.rowOf(i), c = E.colOf(i);
    const perk = state.perks[p.s][p.t];
    let v = VAL[p.t] + (p.g ? AI.GEN_BONUS[p.g] || 150 : AI.PERK_BONUS[perk] || 0);
    const adv = p.s === 'r' ? 9 - r : r; // số hàng đã tiến (0..9)
    const center = 4 - Math.abs(c - 4);
    switch (p.t) {
      case 'P':
        if (adv >= 5) {
          v += 90 + center * 8;
          // Tốt sát cung địch nguy hiểm hơn, Tốt ở hàng cuối gần như vô dụng
          if (adv >= 7 && adv <= 8) v += 30;
          if (adv === 9) v -= 70;
          if (perk === 'p_thangcap' && adv >= 6) v += 40;
        }
        break;
      case 'H':
        v += center * 8 + (adv >= 5 ? 20 : 0) - (adv === 0 ? 20 : 0);
        break;
      case 'C':
        v += (c === 4 ? 20 : 0) + (adv >= 3 && adv <= 7 ? 10 : 0);
        break;
      case 'K':
        // an toàn Tướng: rời hàng cuối hoặc ra cột biên cung đều bị trừ điểm
        v -= adv * 25 + (c !== 4 ? 8 : 0);
        break;
      case 'R':
        v += (adv >= 4 ? 15 : 0) + (adv === 0 && (c === 0 || c === 8) ? -15 : 0);
        break;
    }
    return v;
  }

  // Đánh giá theo góc nhìn bên `side`
  function evaluate(state, side) {
    let sr = 0, sb = 0;
    const B = state.board;
    for (let i = 0; i < 90; i++) {
      const p = B[i];
      if (!p) continue;
      if (p.s === 'r') sr += pieceScore(state, p, i); else sb += pieceScore(state, p, i);
    }
    return side === 'r' ? sr - sb : sb - sr;
  }
  AI.evaluate = evaluate;

  function moveOrderScore(state, m) {
    if (m.skill) return 50;
    const tgt = state.board[m.to];
    if (tgt && !m.swap) return 10 * VAL[tgt.t] - VAL[state.board[m.from].t] / 10 + 10000;
    return 0;
  }

  class Timeout extends Error {}

  AI.search = function (rootState, opts) {
    opts = opts || {};
    const maxDepth = opts.maxDepth || 4;
    const timeMs = opts.timeMs || 1500;
    const noise = opts.noise || 0;
    const rng = opts.rng || Math.random;
    const state = E.cloneState(rootState);
    const side = state.turn;
    const start = Date.now();
    let nodes = 0;
    const killers = [];

    function checkTime() {
      if ((++nodes & 1023) === 0 && Date.now() - start > timeMs) throw new Timeout();
    }

    function quiesce(alpha, beta, qd) {
      checkTime();
      const me = state.turn;
      const stand = evaluate(state, me);
      if (stand >= beta) return stand;
      if (stand > alpha) alpha = stand;
      if (qd >= 6) return stand;
      const moves = E.genPseudo(state, me, true);
      moves.sort((a, b) => moveOrderScore(state, b) - moveOrderScore(state, a));
      for (const m of moves) {
        const u = E.makeMove(state, m);
        if (E.inCheck(state, me)) { E.unmakeMove(state, u); continue; }
        const sc = -quiesce(-beta, -alpha, qd + 1);
        E.unmakeMove(state, u);
        if (sc >= beta) return sc;
        if (sc > alpha) alpha = sc;
      }
      return alpha;
    }

    function negamax(depth, alpha, beta, ply) {
      checkTime();
      const me = state.turn;
      const inChk = E.inCheck(state, me);
      if (inChk && ply < 12) depth++; // gia hạn khi bị chiếu
      if (depth <= 0) return quiesce(alpha, beta, 0);
      const moves = E.genPseudo(state, me, false);
      const k = killers[ply];
      moves.sort((a, b) => {
        const sa = moveOrderScore(state, a) + (k && a.from === k.from && a.to === k.to ? 5000 : 0);
        const sb = moveOrderScore(state, b) + (k && b.from === k.from && b.to === k.to ? 5000 : 0);
        return sb - sa;
      });
      let best = -Infinity, legal = 0;
      for (const m of moves) {
        const u = E.makeMove(state, m);
        if (E.inCheck(state, me)) { E.unmakeMove(state, u); continue; }
        legal++;
        const sc = -negamax(depth - 1, -beta, -alpha, ply + 1);
        E.unmakeMove(state, u);
        if (sc > best) best = sc;
        if (sc > alpha) alpha = sc;
        if (alpha >= beta) {
          if (!state.board[m.to] || m.swap) killers[ply] = m;
          break;
        }
      }
      // Cờ tướng: hết nước đi (bị chiếu bí hoặc vây chết) đều là thua
      if (legal === 0) return -MATE + ply;
      return best;
    }

    // Nước đi hợp lệ ở gốc
    let rootMoves = E.genPseudo(state, side, false).filter((m) => E.isLegal(state, m));
    if (rootMoves.length === 0) return null;
    if (opts.exclude) {
      const filtered = rootMoves.filter((m) => !opts.exclude(m));
      if (filtered.length) rootMoves = filtered;
    }
    rootMoves.sort((a, b) => moveOrderScore(state, b) - moveOrderScore(state, a));
    const noiseOf = new Map(rootMoves.map((m) => [m, noise ? (rng() * 2 - 1) * noise : 0]));

    let bestMove = rootMoves[0], bestScore = -Infinity, depthDone = 0;
    for (let d = 1; d <= maxDepth; d++) {
      let curBest = null, curScore = -Infinity;
      try {
        for (const m of rootMoves) {
          const u = E.makeMove(state, m);
          let sc = -negamax(d - 1, -MATE - 1, -curScore + (noise ? noise * 2 : 0), 1);
          E.unmakeMove(state, u);
          sc += noiseOf.get(m);
          if (sc > curScore) { curScore = sc; curBest = m; }
        }
      } catch (e) {
        if (e instanceof Timeout) {
          // Phục hồi trạng thái nếu bị ngắt giữa chừng
          break;
        }
        throw e;
      }
      bestMove = curBest; bestScore = curScore; depthDone = d;
      // nước tốt nhất lên đầu để lần lặp sau cắt tỉa tốt hơn
      rootMoves = [curBest].concat(rootMoves.filter((m) => m !== curBest));
      if (Math.abs(curScore) > MATE / 2) break;
      if (Date.now() - start > timeMs * 0.5) break;
    }
    return { move: bestMove, score: bestScore, depth: depthDone, nodes };
  };

  AI.LEVELS = {
    easy: { name: 'Tân binh', maxDepth: 2, timeMs: 500, noise: 120 },
    normal: { name: 'Hiệu uý', maxDepth: 3, timeMs: 1200, noise: 15 },
    hard: { name: 'Đại tướng', maxDepth: 6, timeMs: 2500, noise: 0 },
  };
})(typeof window !== 'undefined' ? window : globalThis);
