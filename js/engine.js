/* Cờ Tướng Quân — luật chơi và sinh nước đi (kể cả perk, Danh Tướng, Quân Sư).
 *
 * Toạ độ: ô = r * 9 + c, r = 0..9 (hàng 0 là hàng cuối của Đen, ở trên),
 * c = 0..8 (trái sang phải theo góc nhìn của Đỏ). Đỏ đi lên (r giảm).
 * Quân cờ: { t: 'K'|'A'|'E'|'R'|'C'|'H'|'P', s: 'r'|'b', promo?: true, g?: idDanhTướng }
 * Nước đi: { from, to, swap?: true } hoặc chiêu Quân Sư { skill, from, to }
 *
 * Perk được tính theo từng quân: quân thường dùng perk của loại quân (cộng perk được Quân Sư/
 * Danh Tướng ban thêm), Danh Tướng dùng bộ perk riêng.
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
  const ALL8 = ORTH.concat(DIAG);
  const KNIGHT = [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [1, -2], [-1, 2], [1, 2]];
  const CAMEL = [[-3, -1], [-3, 1], [3, -1], [3, 1]]; // Ô Truy: chỉ nhảy dài theo chiều dọc
  const TYPES = ['K', 'A', 'E', 'R', 'C', 'H', 'P'];
  const EMPTY = new Set();

  const fwd = (s) => (s === 'r' ? -1 : 1);
  const ownHalf = (s, r) => (s === 'r' ? r >= 5 : r <= 4);
  const lastRank = (s) => (s === 'r' ? 0 : 9);
  const backRank = (s) => (s === 'r' ? 9 : 0);
  E.ownHalf = ownHalf;

  function inPalace(s, r, c) {
    if (c < 3 || c > 5) return false;
    return s === 'r' ? r >= 7 && r <= 9 : r >= 0 && r <= 2;
  }
  E.inPalace = inPalace;
  // Các điểm nằm trên đường chéo của cung (4 góc + tâm)
  function isDiagPoint(s, r, c) {
    const top = s === 'r' ? 7 : 0;
    const dr = r - top;
    if (dr < 0 || dr > 2 || c < 3 || c > 5) return false;
    return (dr === 1 && c === 4) || (dr !== 1 && c !== 4);
  }

  // ---------- Bộ perk theo từng quân ----------
  function computeSets(state) {
    const sets = { r: {}, b: {} }, flags = { r: new Set(), b: new Set() };
    for (const s of ['r', 'b']) {
      const grants = {};
      const addGrants = (g) => { if (g) for (const t in g) grants[t] = (grants[t] || []).concat(g[t]); };
      const gen = state.ex && CTQ.generalById(state.ex.gen[s]);
      const strat = state.ex && CTQ.strategistById(state.ex.strat[s]);
      if (strat) { addGrants(strat.passive.grants); if (strat.passive.flag) flags[s].add(strat.passive.flag); }
      if (gen) addGrants(gen.grants);
      for (const t of TYPES) sets[s][t] = new Set([state.perks[s][t]].concat(grants[t] || []).filter(Boolean));
      sets[s].G = gen ? new Set(gen.perks.concat(grants[gen.type] || [])) : EMPTY;
    }
    state.sets = sets;
    state.flags = flags;
  }
  const ensure = (state) => { if (!state.sets) computeSets(state); };
  const pset = (state, p) => (p.g ? state.sets[p.s].G : state.sets[p.s][p.t]);
  E.pieceSet = (state, p) => { ensure(state); return pset(state, p); };
  const flag = (state, side, f) => state.flags[side].has(f);

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

  // ex (tuỳ chọn, bản mở rộng): { r: { general: {id, slot}, strategist }, b: {...} }
  E.createState = function (perksRed, perksBlack, board, ex) {
    const st = {
      board: board || E.initialBoard(),
      turn: 'r',
      perks: { r: CTQ.sanitizeLoadout(perksRed), b: CTQ.sanitizeLoadout(perksBlack) },
      swapUsed: { r: 0, b: 0 },
      ex: null,
    };
    if (ex) {
      st.ex = { gen: { r: null, b: null }, strat: { r: null, b: null }, cd: { r: {}, b: {} }, used: { r: {}, b: {} }, frz: { r: null, b: null }, shd: { r: -1, b: -1 } };
      for (const s of ['r', 'b']) {
        const lo = ex[s] || {};
        const g = lo.general && CTQ.generalById(lo.general.id);
        if (g) {
          const sq = CTQ.slotSquares(g.type, s)[lo.general.slot || 0];
          const p = st.board[sq];
          if (p && p.t === g.type && p.s === s) { st.board[sq] = Object.assign({}, p, { g: g.id }); st.ex.gen[s] = g.id; }
        }
        if (CTQ.strategistById(lo.strategist)) st.ex.strat[s] = lo.strategist;
      }
    }
    computeSets(st);
    return st;
  };

  function cloneEx(x) {
    return {
      gen: x.gen, strat: x.strat,
      cd: { r: { ...x.cd.r }, b: { ...x.cd.b } },
      used: { r: { ...x.used.r }, b: { ...x.used.b } },
      frz: { r: x.frz.r && { ...x.frz.r }, b: x.frz.b && { ...x.frz.b } },
      shd: { ...x.shd },
    };
  }

  E.cloneState = function (st) {
    return {
      board: st.board.slice(),
      turn: st.turn,
      perks: { r: { ...st.perks.r }, b: { ...st.perks.b } },
      swapUsed: { ...st.swapUsed },
      ex: st.ex ? cloneEx(st.ex) : null,
      sets: st.sets,
      flags: st.flags,
    };
  };

  // Nước đi gốc của một quân khi bỏ hết perk của nó (để tô màu nước do perk mở ra)
  E.baseMovesFrom = function (state, sq) {
    ensure(state);
    const p = state.board[sq];
    if (!p) return [];
    const st = E.cloneState(state);
    st.sets = { r: { ...state.sets.r }, b: { ...state.sets.b } };
    if (p.g) st.sets[p.s].G = EMPTY; else st.sets[p.s][p.t] = EMPTY;
    st.ex = null; // không tính chiêu
    return E.genPieceMoves(st, sq);
  };

  const isFrozen = (state, sq, side) => {
    const f = state.ex && state.ex.frz[side];
    return !!(f && f.sq === sq && f.n > 0);
  };
  E.isFrozen = isFrozen;

  // ---------- Bắt quân ----------
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

  // Quân `att` có được phép ăn quân `tgt` đứng ở ô `tsq` không (miễn nhiễm do perk/chiêu)
  function canCapture(state, att, tgt, tsq) {
    if (!tgt || tgt.s === att.s) return false;
    const T = pset(state, tgt);
    const a = att.t;
    if (T.size) {
      if (T.has('g_gotchan') && a !== 'P') return false;
      if (T.has('g_lansong')) { const r = rowOf(tsq); if (r === 4 || r === 5) return false; }
      if (T.has('r_thietgiap') && a === 'C') return false;
      if (T.has('g_thuai') && a === 'C') return false;
      if (T.has('a_kimcuong') && (a === 'C' || a === 'H' || a === 'P')) return false;
      if (T.has('h_hanma') && (a === 'P' || a === 'C')) return false;
      if (tgt.t === 'P' && T.has('p_lienhoan') && (a === 'R' || a === 'H' || a === 'C') && pawnLinked(state, tsq, tgt.s)) return false;
    }
    if (state.ex) {
      if (state.ex.shd[tgt.s] === tsq) return false;
      if (a === 'C' && flag(state, tgt.s, 'kienthu') && inPalace(tgt.s, rowOf(tsq), colOf(tsq))) return false;
    }
    return true;
  }
  E.canCapture = function (state, att, tgt, tsq) { ensure(state); return canCapture(state, att, tgt, tsq); };

  // ---------- Sinh nước đi giả hợp lệ (chưa xét tự chiếu) ----------
  function genPiece(state, from, out, capOnly) {
    const B = state.board;
    const p = B[from];
    const s = p.s;
    const r = rowOf(from), c = colOf(from);
    const P = pset(state, p);

    // ô trống thì đi, ô địch thì ăn (nếu được phép)
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
    // lướt theo hướng, tối đa `max` ô, ăn quân đầu tiên gặp
    const slide = (dr, dc, max, okSq) => {
      let tr = r + dr, tc = c + dc;
      for (let k = 0; k < max && onBoard(tr, tc); k++) {
        if (okSq && !okSq(tr, tc)) break;
        const q = B[idx(tr, tc)];
        if (q) { if (canCapture(state, p, q, idx(tr, tc))) out.push({ from, to: idx(tr, tc) }); break; }
        if (!capOnly) out.push({ from, to: idx(tr, tc) });
        tr += dr; tc += dc;
      }
    };

    switch (p.t) {
      case 'K': {
        const free = P.has('g_xuatcung');
        const area = (tr, tc) => (free ? onBoard(tr, tc) && ownHalf(s, tr) : inPalace(s, tr, tc));
        for (const [dr, dc] of ORTH) {
          const tr = r + dr, tc = c + dc;
          addIf(tr, tc, area(tr, tc));
          if (P.has('k_khinhcong')) {
            const r2 = r + 2 * dr, c2 = c + 2 * dc;
            if (area(r2, c2) && onBoard(tr, tc) && !B[idx(tr, tc)]) add(r2, c2);
          }
        }
        if (P.has('k_batquai') || free) {
          for (const [dr, dc] of DIAG) { const tr = r + dr, tc = c + dc; addIf(tr, tc, area(tr, tc)); }
        }
        if (P.has('k_hoanvi') && (state.swapUsed[s] || 0) < 3 && !capOnly) {
          for (const [dr, dc] of ALL8) {
            const tr = r + dr, tc = c + dc;
            if (!inPalace(s, tr, tc)) continue;
            const to = idx(tr, tc), q = B[to];
            if (q && q.s === s && !isFrozen(state, to, s)) out.push({ from, to, swap: true });
          }
        }
        break;
      }
      case 'A': {
        for (const [dr, dc] of DIAG) {
          const tr = r + dr, tc = c + dc;
          if (P.has('a_tuantra')) add(tr, tc);
          else addIf(tr, tc, isDiagPoint(s, r, c) && isDiagPoint(s, tr, tc));
        }
        if (P.has('a_canve')) {
          for (const [dr, dc] of ORTH) { const tr = r + dr, tc = c + dc; addIf(tr, tc, inPalace(s, tr, tc)); }
        }
        if (P.has('g_hosi')) {
          for (const [dr, dc] of ALL8) { const tr = r + dr, tc = c + dc; addIf(tr, tc, onBoard(tr, tc) && ownHalf(s, tr)); }
        }
        if (P.has('g_thethan') && !capOnly) {
          // Liều Mình Cứu Chúa: đổi chỗ với Tướng đang bị chiếu đứng sát bên
          for (const [dr, dc] of ALL8) {
            const tr = r + dr, tc = c + dc;
            if (!onBoard(tr, tc)) continue;
            const q = B[idx(tr, tc)];
            if (q && q.t === 'K' && q.s === s && inPalace(s, r, c) && E.inCheck(state, s)) out.push({ from, to: idx(tr, tc), swap: true });
          }
        }
        break;
      }
      case 'E': {
        const crossOk = P.has('e_vuotgiang');
        for (const [dr, dc] of DIAG) {
          const tr = r + 2 * dr, tc = c + 2 * dc;
          if (!onBoard(tr, tc)) continue;
          if (!crossOk && !ownHalf(s, tr)) continue;
          const freeEye = P.has('e_voichien') || (crossOk && !ownHalf(s, r));
          if (!freeEye && B[idx(r + dr, c + dc)]) continue;
          add(tr, tc);
        }
        if (P.has('e_tieubo')) {
          for (const [dr, dc] of DIAG) { const tr = r + dr, tc = c + dc; if (onBoard(tr, tc) && ownHalf(s, tr)) step(tr, tc); }
        }
        if (P.has('g_vuotalps')) {
          for (const [dr, dc] of DIAG) slide(dr, dc, 3, crossOk ? null : (tr) => ownHalf(s, tr));
        }
        break;
      }
      case 'H': {
        const battran = flag(state, other(s), 'battran');
        const freeLeg = P.has('h_thienly') && !battran;
        for (const [dr, dc] of KNIGHT) {
          const tr = r + dr, tc = c + dc;
          if (!onBoard(tr, tc)) continue;
          if (!freeLeg) {
            const lr = Math.abs(dr) === 2 ? r + dr / 2 : r;
            const lc = Math.abs(dc) === 2 ? c + dc / 2 : c;
            if (B[idx(lr, lc)]) continue;
          }
          add(tr, tc);
        }
        if (P.has('h_chienma')) {
          // tiến thẳng được ăn quân, các hướng khác chỉ đi tới ô trống
          for (const [dr, dc] of ORTH) (dr === fwd(s) ? add : step)(r + dr, c + dc);
        }
        if (P.has('h_otruy') && !battran) {
          for (const [dr, dc] of CAMEL) {
            const ur = Math.sign(dr);
            if (!onBoard(r + dr, c + dc)) continue;
            if (B[idx(r + ur, c)] || B[idx(r + 2 * ur, c)]) continue;
            add(r + dr, c + dc);
          }
        }
        if (P.has('g_thapchu')) for (const [dr, dc] of DIAG) add(r + dr, c + dc);
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
          if (!onBoard(tr, tc) || B[idx(tr, tc)].s !== s) continue;
          // sau một quân mình
          if (P.has('r_phaoxa') && dc === 0) {
            // ngòi là quân mình: quân đầu tiên phía sau là mục tiêu
            let ar = tr + dr, ac = tc + dc;
            while (onBoard(ar, ac)) {
              const q = B[idx(ar, ac)];
              if (q) { if (canCapture(state, p, q, idx(ar, ac))) out.push({ from, to: idx(ar, ac) }); break; }
              ar += dr; ac += dc;
            }
          }
          if (P.has('r_phatran') && !capOnly) {
            // đi xuyên qua 1 quân mình tới các ô trống phía sau
            let ar = tr + dr, ac = tc + dc;
            while (onBoard(ar, ac) && !B[idx(ar, ac)]) { out.push({ from, to: idx(ar, ac) }); ar += dr; ac += dc; }
          }
        }
        if (P.has('r_chienxa')) for (const [dr, dc] of DIAG) step(r + dr, c + dc);
        if (P.has('g_vosong')) for (const [dr, dc] of DIAG) add(r + dr, c + dc);
        break;
      }
      case 'C': {
        const dirs = P.has('c_phaocheo') ? ALL8 : ORTH;
        const songngoi = P.has('c_songngoi');
        for (const [dr, dc] of dirs) {
          let tr = r + dr, tc = c + dc;
          let screens = 0;
          const maxScreens = songngoi ? 2 : 1;
          let first = true;
          let dist = 0;
          const diag = dr !== 0 && dc !== 0;
          while (onBoard(tr, tc)) {
            if (diag && ++dist > 3) break; // Pháo Chéo: đường chéo tối đa 3 ô
            const to = idx(tr, tc);
            const q = B[to];
            if (screens === 0) {
              if (!q) { if (!capOnly) out.push({ from, to }); }
              else {
                if (first && P.has('c_canchien') && q.t !== 'K' && canCapture(state, p, q, to)) out.push({ from, to });
                screens = 1;
              }
            } else if (q) {
              // Song Ngòi không chiếu qua 2 ngòi; Pháo Chéo không chiếu theo đường chéo
              const noCheck = q.t === 'K' && (screens === 2 || diag);
              if ((screens === 1 || songngoi) && !noCheck && canCapture(state, p, q, to)) out.push({ from, to });
              screens++;
              if (screens > maxScreens) break;
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
        if (crossed || P.has('p_linhhoat')) { add(r, c - 1); add(r, c + 1); }
        if (P.has('p_xungphong') && !crossed && onBoard(r + f, c) && !B[idx(r + f, c)]) add(r + 2 * f, c);
        if (crossed && P.has('g_tamdiep')) add(r - f, c);
        if (crossed && P.has('g_khoinghia')) {
          add(r - f, c);
          for (const [dr, dc] of DIAG) add(r + dr, c + dc);
        }
        break;
      }
    }
  }

  // ---------- Chiêu của Quân Sư (mỗi chiêu là một nước đi) ----------
  E.skillCooldown = function (state, side, a) {
    let cd = a.cd || 0;
    if (cd && flag(state, side, 'thantoc')) cd = Math.max(1, cd - 1);
    return cd;
  };
  // Trạng thái 1 chiêu: { ready, left (lần dùng còn lại hoặc null), cd (lượt chờ) }
  E.skillStatus = function (state, side, a) {
    ensure(state);
    const used = state.ex.used[side][a.skill] || 0;
    const cd = state.ex.cd[side][a.skill] || 0;
    const left = a.uses ? a.uses - used : null;
    return { ready: (left === null || left > 0) && cd === 0, left, cd };
  };

  function genSkills(state, s, out, only) {
    const x = state.ex;
    if (!x) return;
    const strat = CTQ.strategistById(x.strat[s]);
    if (!strat) return;
    const B = state.board;
    const o = other(s);
    for (const a of strat.actives) {
      if (only && a.skill !== only) continue;
      if (!E.skillStatus(state, s, a).ready) continue;
      const k = a.skill;
      const push = (from, to) => out.push({ skill: k, from, to: to === undefined ? from : to });
      const plainEnemyPawn = (q, i) => q && q.s === o && q.t === 'P' && !q.g && x.shd[o] !== i;
      if (k === 'phongtoa') {
        for (let i = 0; i < 90; i++) { const q = B[i]; if (q && q.s === o && q.t !== 'K') push(i); }
      } else if (k === 'hothe') {
        for (let i = 0; i < 90; i++) { const q = B[i]; if (q && q.s === s && q.t !== 'K') push(i); }
      } else if (k === 'hoacong') {
        for (let i = 0; i < 90; i++) if (plainEnemyPawn(B[i], i)) push(i);
      } else if (k === 'tamcong') {
        for (let i = 0; i < 90; i++) if (plainEnemyPawn(B[i], i) && ownHalf(s, rowOf(i))) push(i);
      } else if (k === 'chieubinh') {
        let n = 0;
        for (const q of B) if (q && q.s === s && q.t === 'P') n++;
        if (n < 5) for (const sq of CTQ.slotSquares('P', s)) if (!B[sq]) push(sq);
      } else if (k === 'thubinh') {
        const br = backRank(s);
        for (let i = 0; i < 90; i++) {
          const q = B[i];
          if (!q || q.s !== s || q.t === 'K' || isFrozen(state, i, s) || rowOf(i) === br) continue;
          for (let cc = 0; cc < COLS; cc++) if (!B[idx(br, cc)]) push(i, idx(br, cc));
        }
      } else if (k === 'dieubinh') {
        for (let i = 0; i < 90; i++) {
          const q = B[i];
          if (!q || q.s !== s || q.t === 'K' || isFrozen(state, i, s)) continue;
          const r = rowOf(i), c = colOf(i);
          for (const [dr, dc] of ALL8) {
            if (!onBoard(r + dr, c + dc)) continue;
            const j = idx(r + dr, c + dc), q2 = B[j];
            if (j > i && q2 && q2.s === s && q2.t !== 'K' && q2.t !== q.t && !isFrozen(state, j, s)) push(i, j);
          }
        }
      } else if (k === 'salamis') {
        for (let i = 0; i < 90; i++) if (plainEnemyPawn(B[i], i) && ownHalf(s, rowOf(i))) { push(-1, -1); break; }
      }
    }
  }

  E.genPseudo = function (state, side, capOnly) {
    ensure(state);
    const out = [];
    const B = state.board;
    const frz = state.ex && state.ex.frz[side];
    for (let i = 0; i < B.length; i++) {
      const p = B[i];
      if (p && p.s === side && !(frz && frz.sq === i && frz.n > 0)) genPiece(state, i, out, capOnly);
    }
    if (!capOnly) genSkills(state, side, out);
    return out;
  };

  E.genPieceMoves = function (state, from) {
    ensure(state);
    const out = [];
    const p = state.board[from];
    if (p && !isFrozen(state, from, p.s)) genPiece(state, from, out, false);
    return out;
  };

  E.genSkillMoves = function (state, side, skill) {
    ensure(state);
    const out = [];
    genSkills(state, side, out, skill);
    return out.filter((m) => E.isLegal(state, m));
  };

  // ---------- Thực hiện / hoàn tác ----------
  E.makeMove = function (state, m) {
    ensure(state);
    const B = state.board;
    const s = m.skill ? state.turn : B[m.from].s;
    const mover = m.from >= 0 ? B[m.from] : null;
    const target = m.to >= 0 ? B[m.to] : null;
    const u = {
      m, side: s, from: m.from, to: m.to, fromPiece: mover, toPiece: target,
      turn: state.turn, swapPrev: state.swapUsed[s], ex: state.ex, ch: [],
      captured: null, extra: [], died: false, promoted: false, converted: null,
    };
    const set = (sq, v) => { u.ch.push(sq, B[sq]); B[sq] = v; };

    if (state.ex) {
      const x = (state.ex = cloneEx(state.ex));
      for (const k in x.cd[s]) if (x.cd[s][k] > 0) x.cd[s][k]--;
      if (x.frz[s]) { x.frz[s].n--; if (x.frz[s].n <= 0) x.frz[s] = null; }
      x.shd[s] = -1;
    }

    if (m.skill) {
      applySkill(state, m, s, u, set);
    } else if (m.swap) {
      set(m.to, mover);
      set(m.from, target);
      if (mover.t === 'K') state.swapUsed[s] = (state.swapUsed[s] || 0) + 1;
    } else {
      set(m.from, null);
      let placed = mover;
      const MP = pset(state, mover);
      if (target) {
        u.captured = target;
        if (state.ex && state.ex.frz[target.s] && state.ex.frz[target.s].sq === m.to) state.ex.frz[target.s] = null;
        if (pset(state, target).has('a_tusi')) { placed = null; u.died = true; }
      }
      if (placed && placed.t === 'P' && !placed.g && Math.abs(rowOf(m.to) - lastRank(s)) <= 1 && MP.has('p_thangcap')) {
        placed = { t: 'R', s, promo: true };
        u.promoted = true;
      }
      set(m.to, placed);
      if (target) {
        // Hoả Công: tiêu diệt quân địch ngay sau mục tiêu theo hướng bắn
        if (mover.t === 'C' && MP.has('c_hoacong')) {
          const dr = Math.sign(rowOf(m.to) - rowOf(m.from)), dc = Math.sign(colOf(m.to) - colOf(m.from));
          const br = rowOf(m.to) + dr, bc = colOf(m.to) + dc;
          if (onBoard(br, bc)) {
            const b = idx(br, bc), q = B[b];
            if (q && q.s !== s && q.t !== 'K' && canCapture(state, mover, q, b)) { set(b, null); u.extra.push(q); }
          }
        }
        // Voi Giày: giẫm chết Tốt địch quanh ô vừa ăn
        if (mover.t === 'E' && MP.has('e_voigiay')) {
          const r = rowOf(m.to), c = colOf(m.to);
          for (const [dr, dc] of ALL8) {
            if (!onBoard(r + dr, c + dc)) continue;
            const b = idx(r + dr, c + dc), q = B[b];
            if (q && q.s !== s && q.t === 'P' && canCapture(state, mover, q, b)) { set(b, null); u.extra.push(q); }
          }
        }
      }
    }
    state.turn = other(state.turn);
    return u;
  };

  function applySkill(state, m, s, u, set) {
    const B = state.board, x = state.ex, o = other(s);
    const strat = CTQ.strategistById(x.strat[s]);
    const a = strat.actives.find((v) => v.skill === m.skill);
    x.used[s][m.skill] = (x.used[s][m.skill] || 0) + 1;
    const cd = E.skillCooldown(state, s, a);
    if (cd) x.cd[s][m.skill] = cd;
    switch (m.skill) {
      case 'phongtoa': x.frz[o] = { sq: m.from, n: 2 }; break;
      case 'hothe': x.shd[s] = m.from; break;
      case 'hoacong': u.extra.push(B[m.from]); set(m.from, null); break;
      case 'tamcong': u.converted = B[m.from]; set(m.from, { t: 'P', s }); break;
      case 'chieubinh': set(m.from, { t: 'P', s }); break;
      case 'thubinh': { const q = B[m.from]; set(m.from, null); set(m.to, q); break; }
      case 'dieubinh': { const a1 = B[m.from], a2 = B[m.to]; set(m.from, a2); set(m.to, a1); break; }
      case 'salamis':
        for (let i = 0; i < 90; i++) {
          const q = B[i];
          if (q && q.s === o && q.t === 'P' && !q.g && x.shd[o] !== i && ownHalf(s, rowOf(i))) { u.extra.push(q); set(i, null); }
        }
        break;
    }
  }

  E.unmakeMove = function (state, u) {
    const B = state.board, ch = u.ch;
    for (let i = ch.length - 2; i >= 0; i -= 2) B[ch[i]] = ch[i + 1];
    state.swapUsed[u.side] = u.swapPrev;
    state.turn = u.turn;
    state.ex = u.ex;
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
    ensure(state);
    const k = E.findKing(state, side);
    if (k < 0) return true;
    const B = state.board;
    const opp = other(side);
    const ok = E.findKing(state, opp);
    if (ok >= 0 && colOf(ok) === colOf(k)) {
      // lộ mặt tướng
      const c = colOf(k);
      const r1 = Math.min(rowOf(k), rowOf(ok)), r2 = Math.max(rowOf(k), rowOf(ok));
      let blocked = false;
      for (let r = r1 + 1; r < r2; r++) if (B[idx(r, c)]) { blocked = true; break; }
      // Ngự Giá: luật lộ mặt tướng chỉ ràng buộc Tướng địch
      const mine = pset(state, B[k]).has('k_ngugia'), theirs = pset(state, B[ok]).has('k_ngugia');
      if (!blocked && !(mine && !theirs)) return true;
    }
    const frz = state.ex && state.ex.frz[opp];
    const buf = [];
    for (let i = 0; i < B.length; i++) {
      const p = B[i];
      if (!p || p.s !== opp) continue;
      if (frz && frz.sq === i && frz.n > 0) continue; // quân bị Phong Toả không đe doạ được
      buf.length = 0;
      genPiece(state, i, buf, true);
      for (let j = 0; j < buf.length; j++) if (buf[j].to === k && !buf[j].swap) return true;
    }
    return false;
  };

  E.isLegal = function (state, m) {
    const s = m.skill ? state.turn : state.board[m.from].s;
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
    let k = state.turn + (state.swapUsed.r || 0) + (state.swapUsed.b || 0);
    for (const p of state.board) k += p ? (p.s === 'r' ? p.t : p.t.toLowerCase()) + (p.g ? '*' : '') : '.';
    if (state.ex) {
      const x = state.ex;
      k += JSON.stringify([x.cd, x.used, x.frz, x.shd]);
    }
    return k;
  };

  // ---------- Ký hiệu nước đi kiểu Việt Nam ----------
  // Cột được đánh số 1–9 từ phải sang trái theo góc nhìn của mỗi bên.
  const colNum = (s, c) => (s === 'r' ? 9 - c : c + 1);
  const pieceName = (p) => {
    if (p.g) { const g = CTQ.generalById(p.g); return `${g.short} (${CTQ.PIECES[p.t].name})`; }
    return CTQ.PIECES[p.t].name;
  };
  E.pieceName = pieceName;
  E.notate = function (u) {
    if (u.m.skill) {
      const s = u.side;
      const strat = CTQ.strategistById(u.ex.strat[s]);
      const a = strat.actives.find((v) => v.skill === u.m.skill);
      let txt = `${strat.name}: ${CTQ.skillName(a)}`;
      const tp = u.fromPiece;
      if (u.m.skill === 'chieubinh') txt += ` (Tốt mới ở cột ${colNum(s, colOf(u.from))})`;
      else if (u.m.skill === 'thubinh') txt += ` (${pieceName(tp)} ${colNum(s, colOf(u.from))} về hàng cuối)`;
      else if (u.m.skill === 'dieubinh') txt += ` (${pieceName(tp)} ⇄ ${pieceName(u.toPiece)})`;
      else if (u.m.skill === 'salamis') txt += ` (diệt ${u.extra.length} Tốt)`;
      else if (tp) txt += ` → ${pieceName(tp)} ${colNum(tp.s, colOf(u.from))}`;
      return txt;
    }
    const p = u.fromPiece;
    const s = p.s;
    const name = pieceName(p);
    const fr = rowOf(u.from), fc = colOf(u.from), tr = rowOf(u.to), tc = colOf(u.to);
    if (u.m.swap) {
      return `${name} ${colNum(s, fc)} ${p.t === 'K' ? 'hoán vị' : 'thế thân'} ${pieceName(u.toPiece)} ${colNum(s, tc)}`;
    }
    const forward = (tr - fr) * fwd(s) > 0;
    let txt;
    if (fr === tr) txt = `${name} ${colNum(s, fc)} bình ${colNum(s, tc)}`;
    else if (fc === tc) txt = `${name} ${colNum(s, fc)} ${forward ? 'tiến' : 'thoái'} ${Math.abs(tr - fr)}`;
    else txt = `${name} ${colNum(s, fc)} ${forward ? 'tiến' : 'thoái'} ${colNum(s, tc)}`;
    if (u.captured) txt += ` ăn ${pieceName(u.captured)}`;
    if (u.extra.length) txt += `, diệt thêm ${u.extra.length}`;
    if (u.died) txt += ' (tử sĩ)';
    if (u.promoted) txt += ', phong Xe';
    return txt;
  };
})(typeof window !== 'undefined' ? window : globalThis);
