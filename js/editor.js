/* Cờ Tướng Quân — trình chỉnh đội hình (dùng ở sảnh và phòng chuẩn bị).
 * Đội hình luôn có dạng { perks, general, strategist }; chế độ thường chỉ dùng perks.
 */
(function () {
  const CTQ = window.CTQ;
  const E = CTQ.Engine;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NONE = { K: '', A: '', E: '', R: '', C: '', H: '', P: '' };

  // Thế cờ minh hoạ cho từng loại quân / perk. Quân: [hàng, cột, loại, bên]
  const DEMOS = {
    K: { focus: [9, 4], pieces: [[9, 4, 'K', 'r'], [9, 3, 'A', 'r'], [9, 5, 'A', 'r'], [0, 3, 'K', 'b']] },
    k_ngugia: { focus: [9, 4], pieces: [[9, 4, 'K', 'r'], [0, 3, 'K', 'b']],
      note: 'Tướng Đỏ được sang cột 4 đối mặt Tướng Đen. Khi đó Tướng Đen bị chiếu và phải tránh.' },
    k_hoanvi: { focus: [9, 4], pieces: [[9, 4, 'K', 'r'], [9, 3, 'A', 'r'], [9, 5, 'A', 'r'], [0, 3, 'K', 'b']],
      note: 'Vòng vàng trên quân mình là ô Tướng có thể đổi chỗ (ba lần mỗi trận).' },
    A: { focus: [9, 3], pieces: [[9, 3, 'A', 'r'], [9, 5, 'K', 'r'], [0, 4, 'K', 'b']] },
    a_tuantra: { focus: [7, 5], pieces: [[7, 5, 'A', 'r'], [9, 4, 'K', 'r'], [0, 3, 'K', 'b']] },
    a_kimcuong: { focus: [4, 4], pieces: [[8, 4, 'A', 'r'], [9, 5, 'K', 'r'], [6, 4, 'P', 'r'], [4, 4, 'C', 'b'], [0, 3, 'K', 'b']],
      note: 'Pháo Đen không còn ăn được Sĩ Đỏ qua ngòi. Mã và Tốt cũng vậy.' },
    a_tusi: { focus: [3, 4], pieces: [[8, 4, 'A', 'r'], [9, 5, 'K', 'r'], [3, 4, 'R', 'b'], [0, 3, 'K', 'b']],
      note: 'Xe Đen ăn Sĩ thì Xe Đen cũng mất theo. Perk bị động, không đổi cách đi.' },
    E: { focus: [5, 2], pieces: [[5, 2, 'E', 'r'], [6, 3, 'P', 'r'], [9, 4, 'K', 'r'], [0, 3, 'K', 'b']] },
    e_vuotgiang: { focus: [3, 2], pieces: [[3, 2, 'E', 'r'], [2, 3, 'P', 'b'], [9, 4, 'K', 'r'], [0, 5, 'K', 'b']] },
    e_voigiay: { focus: [7, 4], pieces: [[7, 4, 'E', 'r'], [5, 2, 'H', 'b'], [5, 1, 'P', 'b'], [4, 3, 'P', 'b'], [9, 3, 'K', 'r'], [0, 5, 'K', 'b']],
      note: 'Tượng ăn Mã ở ô vàng thì 2 Tốt Đen sát bên cũng bị giẫm chết.' },
    R: { focus: [6, 4], pieces: [[6, 4, 'R', 'r'], [4, 4, 'P', 'r'], [2, 4, 'H', 'b'], [9, 3, 'K', 'r'], [0, 5, 'K', 'b']] },
    r_thietgiap: { focus: [2, 0], pieces: [[6, 0, 'R', 'r'], [4, 0, 'P', 'r'], [2, 0, 'C', 'b'], [9, 4, 'K', 'r'], [0, 3, 'K', 'b']],
      note: 'Pháo Đen không còn ăn được Xe Đỏ.' },
    C: { focus: [7, 4], pieces: [[7, 4, 'C', 'r'], [7, 5, 'P', 'b'], [5, 4, 'P', 'r'], [3, 4, 'P', 'r'], [1, 4, 'R', 'b'], [9, 3, 'K', 'r'], [0, 5, 'K', 'b']] },
    c_hoacong: { focus: [9, 4], pieces: [[9, 4, 'C', 'r'], [7, 4, 'P', 'r'], [4, 4, 'H', 'b'], [3, 4, 'R', 'b'], [3, 3, 'P', 'b'], [3, 5, 'H', 'b'], [9, 3, 'K', 'r'], [0, 5, 'K', 'b']],
      note: 'Pháo ăn Mã thì Xe ngay sau và Tốt bên cạnh bị thiêu; Mã ở ô bên còn sống. Pháo chết vì ăn Tử Sĩ thì không phát lửa.' },
    H: { focus: [7, 4], pieces: [[7, 4, 'H', 'r'], [6, 4, 'P', 'r'], [9, 3, 'K', 'r'], [0, 5, 'K', 'b']] },
    h_hanma: { focus: [2, 0], pieces: [[6, 0, 'H', 'r'], [4, 0, 'P', 'r'], [2, 0, 'C', 'b'], [9, 4, 'K', 'r'], [0, 3, 'K', 'b']],
      note: 'Pháo Đen không còn ăn được Mã Đỏ. Tốt Đen cũng vậy.' },
    P: { focus: [6, 2], pieces: [[6, 2, 'P', 'r'], [9, 4, 'K', 'r'], [0, 3, 'K', 'b']] },
    p_lienhoan: { focus: [1, 3], pieces: [[4, 3, 'P', 'r'], [4, 4, 'P', 'r'], [1, 3, 'R', 'b'], [9, 4, 'K', 'r'], [0, 4, 'K', 'b']],
      note: 'Hai Tốt Đỏ đứng sát ngang nhau nên Xe Đen không ăn được.' },
    p_thangcap: { focus: [2, 2], pieces: [[2, 2, 'P', 'r'], [9, 4, 'K', 'r'], [0, 3, 'K', 'b']],
      note: 'Tiến thêm một bước vào 2 hàng cuối của Đen, Tốt sẽ trở thành Xe.' },
  };

  function demoMoves(type, perkId) {
    const demo = DEMOS[perkId] || DEMOS[type];
    const mk = (perks) => {
      const board = new Array(90).fill(null);
      for (const [r, c, t, s] of demo.pieces) board[E.idx(r, c)] = { t, s };
      return { board, turn: 'r', perks: { r: { ...NONE, ...perks }, b: { ...NONE } }, swapUsed: { r: 0, b: 0 } };
    };
    const withP = mk({ [type]: perkId }), without = mk({});
    const fsq = E.idx(demo.focus[0], demo.focus[1]);
    const key = (m) => m.to + (m.swap ? 's' : '');
    const a = E.legalMovesFrom(without, fsq), b = E.legalMovesFrom(withP, fsq);
    const ak = new Set(a.map(key)), bk = new Set(b.map(key));
    const moves = [];
    for (const m of b) moves.push({ to: m.to, kind: ak.has(key(m)) ? 'base' : 'perk' });
    for (const m of a) if (!bk.has(key(m))) moves.push({ to: m.to, kind: 'lost' });
    return { state: withP, moves, focus: fsq, note: demo.note || '' };
  }

  const usesText = (a) => (a.uses ? (a.uses === 1 ? 'Dùng 1 lần' : `Dùng ${a.uses} lần`) : `Hồi chiêu ${a.cd} lượt`);
  CTQ.usesText = usesText;
  const colLabel = (sq) => `cột ${9 - (sq % 9)}`;

  CTQ.createEditor = function (root, opts) {
    let mode = opts.mode || 'normal';
    let tab = 'perk';
    let type = 'H';
    root.classList.add('ed');
    root.innerHTML = `
      <section class="ed-board-wrap">
        <p class="hint ed-hint"></p>
        <div class="board ed-board"></div>
        <div class="army-tools">
          <button type="button" class="ghost-btn ed-random">Ngẫu nhiên</button>
          <button type="button" class="ghost-btn ed-reset">Về mặc định</button>
        </div>
      </section>
      <section class="perk-panel" aria-live="polite">
        <div class="seg ed-tabs" role="tablist" aria-label="Phần đội hình">
          <button type="button" role="tab" class="seg-btn" data-tab="perk">Perk quân</button>
          <button type="button" role="tab" class="seg-btn" data-tab="gen">Danh Tướng</button>
          <button type="button" role="tab" class="seg-btn" data-tab="strat">Quân Sư</button>
        </div>
        <div class="ed-body"></div>
      </section>`;
    const q = (s) => root.querySelector(s);
    const board = new CTQ.BoardView(q('.ed-board'), {
      onSquare: (sq) => {
        const p = board.state.board[sq];
        if (!p) return;
        const lo = opts.get();
        const g = CTQ.generalById(lo.general.id);
        if (mode === 'ex' && tab === 'gen' && g && p.t === g.type) {
          const slot = CTQ.slotSquares(g.type, 'r').indexOf(sq);
          if (slot >= 0) { lo.general.slot = slot; opts.set(lo); }
        } else { type = p.t; tab = 'perk'; }
        render();
      },
    });
    let demoBoard = null;

    q('.ed-random').addEventListener('click', () => {
      const lo = opts.get();
      if (mode === 'ex') opts.set(CTQ.randomExLoadout());
      else opts.set(Object.assign({}, lo, { perks: CTQ.randomLoadout() }));
      render();
    });
    q('.ed-reset').addEventListener('click', () => {
      const lo = opts.get();
      if (mode === 'ex') opts.set(CTQ.defaultExLoadout());
      else opts.set(Object.assign({}, lo, { perks: CTQ.defaultLoadout() }));
      render();
    });
    for (const b of root.querySelectorAll('[data-tab]')) b.addEventListener('click', () => { tab = b.dataset.tab; render(); });

    function boardState(lo) {
      const st = mode === 'ex'
        ? E.createState(lo.perks, {}, null, { r: lo, b: {} })
        : E.createState(lo.perks, {});
      st.board = st.board.map((p) => (p && p.s === 'r' ? p : null));
      return st;
    }

    function render() {
      const lo = opts.get();
      root.classList.toggle('is-ex', mode === 'ex');
      q('.ed-tabs').hidden = mode !== 'ex';
      if (mode !== 'ex') tab = 'perk';
      for (const b of root.querySelectorAll('[data-tab]')) { b.classList.toggle('is-on', b.dataset.tab === tab); b.setAttribute('aria-selected', b.dataset.tab === tab); }

      const st = boardState(lo);
      const dim = new Set();
      const gen = mode === 'ex' && CTQ.generalById(lo.general.id);
      st.board.forEach((p, i) => {
        if (!p) return;
        if (tab === 'perk' && p.t !== type) dim.add(i);
        if (tab === 'gen' && gen && p.t !== gen.type) dim.add(i);
        if (tab === 'strat') dim.add(i);
      });
      board.render(st, { dim });
      q('.ed-hint').textContent = tab === 'gen'
        ? 'Chạm vào một quân cùng loại trên bàn để đổi vị trí đứng của Danh Tướng.'
        : tab === 'strat'
          ? 'Quân Sư không đứng trên bàn: nội tại có hiệu lực cả trận, chiêu dùng thay cho một lượt đi.'
          : 'Chạm vào một quân trên bàn để chọn perk cho cả loại quân đó.';

      const body = q('.ed-body');
      if (tab === 'perk') renderPerks(body, lo);
      else if (tab === 'gen') renderGenerals(body, lo);
      else renderStrategists(body, lo);
    }

    function renderPerks(body, lo) {
      const info = CTQ.PIECES[type];
      const genNote = mode === 'ex' && CTQ.generalById(lo.general.id) && CTQ.generalById(lo.general.id).type === type
        ? `<p class="ed-note">Danh Tướng ${esc(CTQ.generalById(lo.general.id).name)} dùng bộ perk riêng; perk dưới đây áp dụng cho các ${info.name} còn lại.</p>` : '';
      body.innerHTML = `
        <div class="type-strip" role="tablist" aria-label="Loại quân">${CTQ.PIECE_ORDER.map((t) => `
          <button type="button" role="tab" class="type-btn ${t === type ? 'is-on' : ''}" data-type="${t}" aria-selected="${t === type}">
            <span class="mini-glyph side-r">${CTQ.PIECES[t].glyph.r}</span>
            <span class="tb-name">${CTQ.PIECES[t].name}</span>
            <span class="tb-perk">${esc(CTQ.perkById(lo.perks[t]).name)}</span>
          </button>`).join('')}</div>
        <div class="perk-head">
          <span class="perk-head-glyph">${info.glyph.r}</span>
          <div><h2>${info.name}: chọn 1 trong ${CTQ.PERKS[type].length} perk</h2><p class="muted">${esc(info.base)}</p></div>
        </div>
        ${genNote}
        <div class="perk-options" role="radiogroup">${CTQ.PERKS[type].map((p) => `
          <label class="perk-opt ${lo.perks[type] === p.id ? 'is-on' : ''}">
            <input type="radio" name="perk-${opts.name || 'x'}" value="${p.id}" ${lo.perks[type] === p.id ? 'checked' : ''}>
            <span class="po-name">${esc(p.name)}</span><span class="po-desc">${esc(p.desc)}</span>
          </label>`).join('')}</div>
        <div class="demo">
          <div class="board board-mini ed-demo"></div>
          <div class="demo-legend">
            <p><span class="dot dot-base"></span> Nước đi gốc</p>
            <p><span class="dot dot-perk"></span> Nước đi perk mở thêm</p>
            <p><span class="dot dot-lost"></span> Nước đi perk chặn lại</p>
            <p class="muted ed-demo-note"></p>
          </div>
        </div>`;
      for (const b of body.querySelectorAll('.type-btn')) b.addEventListener('click', () => { type = b.dataset.type; render(); });
      for (const inp of body.querySelectorAll('.perk-opt input')) {
        inp.addEventListener('change', () => { const l = opts.get(); l.perks[type] = inp.value; opts.set(l); render(); });
      }
      demoBoard = new CTQ.BoardView(body.querySelector('.ed-demo'), { interactive: false });
      const d = demoMoves(type, lo.perks[type]);
      demoBoard.render(d.state, { moves: d.moves, focus: d.focus });
      body.querySelector('.ed-demo-note').textContent = d.note;
    }

    function renderGenerals(body, lo) {
      const sel = CTQ.generalById(lo.general.id);
      const slots = CTQ.slotSquares(sel.type, 'r');
      body.innerHTML = `
        <div class="gen-detail">
          <div class="gen-portrait">${CTQ.portraitHTML(sel)}</div>
          <div>
            <h2>${esc(sel.name)}</h2>
            <p class="muted">${CTQ.PIECES[sel.type].name} · ${esc(sel.era)}</p>
            <p class="gen-bio">${esc(sel.bio)}</p>
            <p class="mastery-editor">${CTQ.MasteryView.mini(CTQ.Auth.user, 'g:' + sel.id)} <span class="muted">${CTQ.Mastery.get(CTQ.Auth.user, 'g:' + sel.id).points.toLocaleString('vi-VN')} điểm · chỉ trang trí</span></p>
            <ul class="gen-perks">${sel.perks.map((id) => { const p = CTQ.perkById(id); return `<li><strong>${esc(p.name)}</strong> ${esc(p.desc)}</li>`; }).join('')}</ul>
            ${slots.length > 1 ? `<div class="slot-row"><span class="muted">Vị trí:</span>${slots.map((sq, i) => `<button type="button" class="chip ${lo.general.slot === i ? 'is-on' : ''}" data-slot="${i}">${CTQ.PIECES[sel.type].name} ${colLabel(sq)}</button>`).join('')}</div>` : ''}
          </div>
        </div>
        <h3 class="ed-sub">Chọn 1 Danh Tướng cho cả đội</h3>
        <div class="gen-grid">${CTQ.PIECE_ORDER.map((t) => CTQ.GENERALS.filter((g) => g.type === t).map((g) => `
          <button type="button" class="gen-card ${g.id === sel.id ? 'is-on' : ''}" data-gen="${g.id}" aria-pressed="${g.id === sel.id}">
            ${CTQ.portraitHTML(g)}
            <span class="gc-name">${esc(g.name)}</span>
            <span class="gc-type"><span class="mini-glyph side-r">${CTQ.PIECES[t].glyph.r}</span>${CTQ.PIECES[t].name}</span>
          </button>`).join('')).join('')}</div>`;
      for (const b of body.querySelectorAll('[data-gen]')) {
        b.addEventListener('click', () => {
          const g = CTQ.generalById(b.dataset.gen);
          const l = opts.get();
          l.general = { id: g.id, slot: CTQ.defaultSlot(g.type) % CTQ.slotSquares(g.type, 'r').length };
          opts.set(l); render();
        });
      }
      for (const b of body.querySelectorAll('[data-slot]')) {
        b.addEventListener('click', () => { const l = opts.get(); l.general.slot = +b.dataset.slot; opts.set(l); render(); });
      }
    }

    function renderStrategists(body, lo) {
      body.innerHTML = `<h3 class="ed-sub">Chọn 1 Quân Sư cầm quân</h3>
        <div class="strat-list">${CTQ.STRATEGISTS.map((s) => `
          <button type="button" class="strat-card ${s.id === lo.strategist ? 'is-on' : ''}" data-strat="${s.id}" aria-pressed="${s.id === lo.strategist}">
            <span class="sc-portrait">${CTQ.portraitHTML(s)}</span>
            <span class="sc-body">
              <span class="sc-name">${esc(s.name)} <span class="muted">${esc(s.era)}</span></span>
              <span class="mastery-editor">${CTQ.MasteryView.mini(CTQ.Auth.user, 's:' + s.id)} <span class="muted">${CTQ.Mastery.get(CTQ.Auth.user, 's:' + s.id).points.toLocaleString('vi-VN')} điểm</span></span>
              <span class="sc-line"><span class="tag tag-passive">Nội tại</span><strong>${esc(s.passive.name)}</strong> ${esc(s.passive.desc)}</span>
              ${s.actives.map((a) => `<span class="sc-line"><span class="tag">Chiêu</span><strong>${esc(CTQ.skillName(a))}</strong> ${esc(CTQ.SKILLS[a.skill].desc)} <em>${usesText(a)}.</em></span>`).join('')}
            </span>
          </button>`).join('')}</div>`;
      for (const b of body.querySelectorAll('[data-strat]')) {
        b.addEventListener('click', () => { const l = opts.get(); l.strategist = b.dataset.strat; opts.set(l); render(); });
      }
    }

    return {
      render,
      setMode(m) { mode = m; render(); },
    };
  };
})();
