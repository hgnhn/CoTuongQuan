/* Cờ Tướng Quân — luật chơi và sinh nước đi (kể cả hiệu ứng perk).
 *
 * Toạ độ: ô = r * 9 + c, r = 0..9 (hàng 0 là hàng cuối của Đen, ở trên),
 * c = 0..8 (trái sang phải theo góc nhìn của Đỏ). Đỏ đi lên (r giảm).
 * Quân cờ: { t: 'K'|'A'|'E'|'R'|'C'|'H'|'P', s: 'r'|'b', promo?: true }
 * Nước đi: { from, to, swap?: true }
 */
(function (root) {
  const CTQ = (root.CTQ = root.CTQ || {});
  const E = (CTQ.Engine = {});

  const ROWS = 10, COLS = 9;
  const idx = (r, c) => r * COLS + c;
  const rowOf = (i) => (i / COLS) | 0;
  const colOf = (i) => i % COLS;
  const onBoard = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
  const other = (s) => (s === 'r' ? 'b' : 'r');

  E.ROWS = ROWS; E.COLS = COLS; E.idx = idx; E.rowOf = rowOf; E.colOf = colOf; E.other = other;

  const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const KNIGHT = [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [1, -2], [-1, 2], [1, 2]];
  const CAMEL = [[-3, -1], [-3, 1], [3, -1], [3, 1], [-1, -3], [1, -3], [-1, 3], [1, 3]];

  const fwd = (s) => (s === 'r' ? -1 : 1);
  const ownHalf = (s, r) => (s === 'r' ? r >= 5 : r <= 4);
  const lastRank = (s) => (s === 'r' ? 0 : 9);

  function inPalace(s, r, c, extended) {
    if (c < 3 || c > 5) return false;
    if (s === 'r') return r >= (extended ? 6 : 7) && r <= 9;
    return r >= 0 && r <= (extended ? 3 : 2);
  }
  // Cung mở rộng của perk Ngự Giá: thêm 1 hàng phía trước và 1 cột mỗi bên
  function inGrandPalace(s, r, c) {
    if (c < 2 || c > 6) return false;
    return s === 'r' ? r >= 6 && r <= 9 : r >= 0 && r <= 3;
  }
  // Các điểm nằm trên đường chéo của cung (4 góc + tâm)
  function isDiagPoint(s, r, c) {
    const top = s === 'r' ? 7 : 0;
    const dr = r - top;
    if (dr < 0 || dr > 2 || c < 3 || c > 5) return false;
    return (dr === 1 && c === 4) || (dr !== 1 && c !== 4);
  }

  E.perkOf = (state, side, type) => state.perks[side][type];
  const has = (state, side, type, id) => state.perks[side][type] === id;

  // ---------- Khởi tạo ----------
  const BACK = ['R', 'H', 'E', 'A', 'K', 'A', 'E', 'H', 'R'];
  E.initialBoard = function () {
    const b = new Array(ROWS * COLS).fill(null);
    for (let c = 0; c < COLS; c++) {
      b[idx(0, c)] = { t: BACK[c], s: 'b' };
      b[idx(9, c)] = { t: BACK[c], s: 'r' };
    }
    for (const c of [1, 7]) { b[idx(2, c)] = { t: 'C', s: 'b' }; b[idx(7, c)] = { t: 'C', s: 'r' }; }
    for (const c of [0, 2, 4, 6, 8]) { b[idx(3, c)] = { t: 'P', s: 'b' }; b[idx(6, c)] = { t: 'P', s: 'r' }; }
    return b;
  };

  E.createState = function (perksRed, perksBlack, board) {
    return {
      board: board || E.initialBoard(),
      turn: 'r',
      perks: { r: CTQ.sanitizeLoadout(perksRed), b: CTQ.sanitizeLoadout(perksBlack) },
      swapUsed: { r: false, b: false },
    };
  };

  E.cloneState = function (st) {
    return {
      board: st.board.slice(),
      turn: st.turn,
      perks: { r: { ...st.perks.r }, b: { ...st.perks.b } },
      swapUsed: { ...st.swapUsed },
    };
  };

  // ---------- Bắt quân ----------
  // Kiểm tra quân `att` có được phép ăn quân `tgt` không (miễn nhiễm do perk)
  // Tốt có Tốt mình đứng sát ngang (perk Liên Hoàn)
  function pawnLinked(state, sq, side) {
    const r = rowOf(sq), c = colOf(sq);
    for (const dc of [-1, 1]) {
      if (c + dc < 0 || c + dc >= COLS) continue;
      const q = state.board[idx(r, c + dc)];
      if (q && q.s === side && q.t === 'P') return true;
    }
    return false;
  }

  function canCapture(state, att, tgt, tsq) {
    if (!tgt || tgt.s === att.s) return false;
    if (tgt.t === 'R' && att.t === 'C' && has(state, tgt.s, 'R', 'r_thietgiap')) return false;
    if (tgt.t === 'A' && (att.t === 'C' || att.t === 'P') && has(state, tgt.s, 'A', 'a_kimcuong')) return false;
    if (tgt.t === 'P' && (att.t === 'R' || att.t === 'H' || att.t === 'C') && has(state, tgt.s, 'P', 'p_lienhoan') && pawnLinked(state, tsq, tgt.s)) return false;
    return true;
  }
  E.canCapture = canCapture;

  // ---------- Sinh nước đi giả hợp lệ (chưa xét tự chiếu) ----------
  function genPiece(state, from, out, capOnly) {
    const B = state.board;
    const p = B[from];
    const s = p.s;
    const r = rowOf(from), c = colOf(from);
    const perk = state.perks[s][p.t];

    // thêm nước tới (tr, tc): ô trống thì đi, ô địch thì ăn (nếu được phép)
    const add = (tr, tc) => {
      if (!onBoard(tr, tc)) return;
      const to = idx(tr, tc);
      const q = B[to];
      if (!q) { if (!capOnly) out.push({ from, to }); }
      else if (canCapture(state, p, q, to)) out.push({ from, to });
    };
    const addIf = (tr, tc, ok) => { if (ok) add(tr, tc); };
    // chỉ đi tới ô trống (không ăn quân)
    const step = (tr, tc) => {
      if (!capOnly && onBoard(tr, tc) && !B[idx(tr, tc)]) out.push({ from, to: idx(tr, tc) });
    };

    switch (p.t) {
      case 'K': {
        const ext = perk === 'k_ngugia';
        for (const [dr, dc] of ORTH) {
          const tr = r + dr, tc = c + dc;
          addIf(tr, tc, ext ? inGrandPalace(s, tr, tc) : inPalace(s, tr, tc, false));
          if (perk === 'k_khinhcong') {
            const r2 = r + 2 * dr, c2 = c + 2 * dc;
            if (inPalace(s, r2, c2, false) && onBoard(tr, tc) && !B[idx(tr, tc)]) add(r2, c2);
          }
        }
        if (perk === 'k_batquai') {
          for (const [dr, dc] of DIAG) {
            const tr = r + dr, tc = c + dc;
            addIf(tr, tc, inPalace(s, tr, tc, false));
          }
        }
        if (perk === 'k_hoanvi' && !state.swapUsed[s] && !capOnly) {
          for (const [dr, dc] of ORTH.concat(DIAG)) {
            const tr = r + dr, tc = c + dc;
            if (!inPalace(s, tr, tc, false)) continue;
            const q = B[idx(tr, tc)];
            if (q && q.s === s) out.push({ from, to: idx(tr, tc), swap: true });
          }
        }
        break;
      }
      case 'A': {
        for (const [dr, dc] of DIAG) {
          const tr = r + dr, tc = c + dc;
          if (perk === 'a_tuantra') addIf(tr, tc, onBoard(tr, tc) && (ownHalf(s, tr) || isDiagPoint(s, tr, tc)));
          else addIf(tr, tc, isDiagPoint(s, r, c) && isDiagPoint(s, tr, tc));
        }
        if (perk === 'a_canve') {
          for (const [dr, dc] of ORTH) {
            const tr = r + dr, tc = c + dc;
            addIf(tr, tc, inPalace(s, tr, tc, false));
          }
        }
        break;
      }
      case 'E': {
        const crossOk = perk === 'e_vuotgiang';
        for (const [dr, dc] of DIAG) {
          const tr = r + 2 * dr, tc = c + 2 * dc;
          if (!onBoard(tr, tc)) continue;
          if (!crossOk && !ownHalf(s, tr)) continue;
          if (perk !== 'e_voichien' && B[idx(r + dr, c + dc)]) continue;
          add(tr, tc);
        }
        if (perk === 'e_tieubo') {
          for (const [dr, dc] of DIAG) {
            const tr = r + dr, tc = c + dc;
            addIf(tr, tc, onBoard(tr, tc) && ownHalf(s, tr));
          }
        }
        break;
      }
      case 'H': {
        for (const [dr, dc] of KNIGHT) {
          const tr = r + dr, tc = c + dc;
          if (!onBoard(tr, tc)) continue;
          if (perk !== 'h_thienly') {
            const lr = Math.abs(dr) === 2 ? r + dr / 2 : r;
            const lc = Math.abs(dc) === 2 ? c + dc / 2 : c;
            if (B[idx(lr, lc)]) continue;
          }
          add(tr, tc);
        }
        if (perk === 'h_chienma') for (const [dr, dc] of ORTH) step(r + dr, c + dc);
        if (perk === 'h_otruy') {
          // nhảy dài: 2 ô thẳng đầu tiên phải trống
          for (const [dr, dc] of CAMEL) {
            const ur = Math.abs(dr) === 3 ? Math.sign(dr) : 0, uc = Math.abs(dc) === 3 ? Math.sign(dc) : 0;
            if (!onBoard(r + dr, c + dc)) continue;
            if (B[idx(r + ur, c + uc)] || B[idx(r + 2 * ur, c + 2 * uc)]) continue;
            add(r + dr, c + dc);
          }
        }
        break;
      }
      case 'R': {
        for (const [dr, dc] of ORTH) {
          let tr = r + dr, tc = c + dc;
          while (onBoard(tr, tc)) {
            const q = B[idx(tr, tc)];
            if (!q) { if (!capOnly) out.push({ from, to: idx(tr, tc) }); }
            else { if (canCapture(state, p, q, idx(tr, tc))) out.push({ from, to: idx(tr, tc) }); break; }
            tr += dr; tc += dc;
          }
          if (perk === 'r_phaoxa' && onBoard(tr, tc) && B[idx(tr, tc)].s === s) {
            // ngòi là quân mình: quân đầu tiên phía sau là mục tiêu
            tr += dr; tc += dc;
            while (onBoard(tr, tc)) {
              const q = B[idx(tr, tc)];
              if (q) { if (canCapture(state, p, q, idx(tr, tc))) out.push({ from, to: idx(tr, tc) }); break; }
              tr += dr; tc += dc;
            }
          }
        }
        if (perk === 'r_chienxa') for (const [dr, dc] of DIAG) step(r + dr, c + dc);
        break;
      }
      case 'C': {
        for (const [dr, dc] of ORTH) {
          let tr = r + dr, tc = c + dc;
          let screens = 0;
          const maxScreens = perk === 'c_songngoi' ? 2 : 1;
          let first = true;
          while (onBoard(tr, tc)) {
            const to = idx(tr, tc);
            const q = B[to];
            if (screens === 0) {
              if (!q) { if (!capOnly) out.push({ from, to }); }
              else {
                if (first && perk === 'c_canchien' && canCapture(state, p, q, to)) out.push({ from, to });
                screens = 1;
              }
            } else {
              if (!q) {
                if (screens === 1 && perk === 'c_phaobay' && !capOnly) out.push({ from, to });
              } else {
                if (canCapture(state, p, q, to)) out.push({ from, to });
                screens++;
                if (screens > maxScreens) break;
              }
            }
            first = false;
            tr += dr; tc += dc;
          }
        }
        break;
      }
      case 'P': {
        const f = fwd(s);
        const crossed = !ownHalf(s, r);
        add(r + f, c);
        if (crossed || perk === 'p_linhhoat') { add(r, c - 1); add(r, c + 1); }
        if (perk === 'p_xungphong' && !crossed && onBoard(r + f, c) && !B[idx(r + f, c)]) add(r + 2 * f, c);
        break;
      }
    }
  }

  E.genPseudo = function (state, side, capOnly) {
    const out = [];
    const B = state.board;
    for (let i = 0; i < B.length; i++) {
      const p = B[i];
      if (p && p.s === side) genPiece(state, i, out, capOnly);
    }
    return out;
  };

  E.genPieceMoves = function (state, from) {
    const out = [];
    if (state.board[from]) genPiece(state, from, out, false);
    return out;
  };

  // ---------- Thực hiện / hoàn tác ----------
  E.makeMove = function (state, m) {
    const B = state.board;
    const mover = B[m.from];
    const target = B[m.to];
    const s = mover.s;
    const u = {
      m, from: m.from, to: m.to, fromPiece: mover, toPiece: target,
      turn: state.turn, swapPrev: state.swapUsed[s],
      captured: null, died: false, promoted: false,
    };
    if (m.swap) {
      B[m.to] = mover;
      B[m.from] = target;
      state.swapUsed[s] = true;
    } else {
      B[m.from] = null;
      let placed = mover;
      if (target) {
        u.captured = target;
        if (target.t === 'A' && has(state, target.s, 'A', 'a_tusi')) { placed = null; u.died = true; }
      }
      if (placed && placed.t === 'P' && Math.abs(rowOf(m.to) - lastRank(s)) <= 1 && has(state, s, 'P', 'p_thangcap')) {
        placed = { t: 'R', s, promo: true };
        u.promoted = true;
      }
      B[m.to] = placed;
    }
    state.turn = other(state.turn);
    return u;
  };

  E.unmakeMove = function (state, u) {
    state.board[u.from] = u.fromPiece;
    state.board[u.to] = u.toPiece;
    state.swapUsed[u.fromPiece.s] = u.swapPrev;
    state.turn = u.turn;
  };

  // ---------- Chiếu tướng ----------
  E.findKing = function (state, side) {
    const B = state.board;
    for (let i = 0; i < B.length; i++) {
      const p = B[i];
      if (p && p.t === 'K' && p.s === side) return i;
    }
    return -1;
  };

  E.inCheck = function (state, side) {
    const k = E.findKing(state, side);
    if (k < 0) return true;
    const ok = E.findKing(state, other(side));
    if (ok >= 0 && colOf(ok) === colOf(k)) {
      // lộ mặt tướng
      const c = colOf(k);
      const r1 = Math.min(rowOf(k), rowOf(ok)), r2 = Math.max(rowOf(k), rowOf(ok));
      let blocked = false;
      for (let r = r1 + 1; r < r2; r++) if (state.board[idx(r, c)]) { blocked = true; break; }
      if (!blocked) return true;
    }
    const B = state.board;
    const opp = other(side);
    const buf = [];
    for (let i = 0; i < B.length; i++) {
      const p = B[i];
      if (!p || p.s !== opp) continue;
      buf.length = 0;
      genPiece(state, i, buf, true);
      for (let j = 0; j < buf.length; j++) if (buf[j].to === k && !buf[j].swap) return true;
    }
    return false;
  };

  E.isLegal = function (state, m) {
    const s = state.board[m.from].s;
    const u = E.makeMove(state, m);
    const bad = E.inCheck(state, s);
    E.unmakeMove(state, u);
    return !bad;
  };

  E.legalMoves = function (state, side) {
    side = side || state.turn;
    return E.genPseudo(state, side, false).filter((m) => E.isLegal(state, m));
  };

  E.legalMovesFrom = function (state, from) {
    return E.genPieceMoves(state, from).filter((m) => E.isLegal(state, m));
  };

  // Trạng thái ván: { over, winner, reason }
  E.status = function (state) {
    const side = state.turn;
    if (E.findKing(state, side) < 0) return { over: true, winner: other(side), reason: 'Tướng đã bị hạ' };
    const moves = E.legalMoves(state, side);
    const check = E.inCheck(state, side);
    if (moves.length === 0) {
      return { over: true, winner: other(side), reason: check ? 'Chiếu bí' : 'Hết nước đi' };
    }
    return { over: false, check };
  };

  E.positionKey = function (state) {
    let k = state.turn + (state.swapUsed.r ? '1' : '0') + (state.swapUsed.b ? '1' : '0');
    for (const p of state.board) k += p ? (p.s === 'r' ? p.t : p.t.toLowerCase()) : '.';
    return k;
  };

  // ---------- Ký hiệu nước đi kiểu Việt Nam ----------
  // Cột được đánh số 1–9 từ phải sang trái theo góc nhìn của mỗi bên.
  const colNum = (s, c) => (s === 'r' ? 9 - c : c + 1);
  E.notate = function (u) {
    const p = u.fromPiece;
    const s = p.s;
    const name = CTQ.PIECES[p.t].name;
    const fr = rowOf(u.from), fc = colOf(u.from), tr = rowOf(u.to), tc = colOf(u.to);
    if (u.m.swap) {
      return `${name} ${colNum(s, fc)} hoán vị ${CTQ.PIECES[u.toPiece.t].name} ${colNum(s, tc)}`;
    }
    const forward = (tr - fr) * fwd(s) > 0;
    let txt;
    if (fr === tr) txt = `${name} ${colNum(s, fc)} bình ${colNum(s, tc)}`;
    else if (fc === tc) txt = `${name} ${colNum(s, fc)} ${forward ? 'tiến' : 'thoái'} ${Math.abs(tr - fr)}`;
    else txt = `${name} ${colNum(s, fc)} ${forward ? 'tiến' : 'thoái'} ${colNum(s, tc)}`;
    if (u.captured) txt += ` ăn ${CTQ.PIECES[u.captured.t].name}`;
    if (u.died) txt += ' (tử sĩ)';
    if (u.promoted) txt += ', phong Xe';
    return txt;
  };
})(typeof window !== 'undefined' ? window : globalThis);
