/* Cờ Tướng Quân — điều khiển giao diện: menu, đội hình, trận đấu. */
(function () {
  const CTQ = window.CTQ;
  const E = CTQ.Engine;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SIDE_NAME = { r: 'Đỏ', b: 'Đen' };
  const QUIET_LIMIT = 120; // 60 nước mỗi bên không ăn quân thì hoà

  // ---------------- Lưu trữ ----------------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('ctq.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('ctq.' + k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } },
  };
  const saved = store.get('loadouts', {});
  const loadouts = { main: CTQ.sanitizeLoadout(saved.main), p2: CTQ.sanitizeLoadout(saved.p2) };
  const saveLoadouts = () => store.set('loadouts', loadouts);
  let playerName = store.get('name', '') || '';

  // ---------------- Màn hình ----------------
  function show(id) {
    for (const s of $$('.screen')) s.classList.toggle('is-active', s.id === 'screen-' + id);
    window.scrollTo(0, 0);
    if (id === 'menu') { renderMenu(); renderAccount(); renderInviteBanner(); }
    if (id === 'army') renderArmy();
    if (id === 'rules') renderRules();
  }

  // ---------------- Hộp thoại ----------------
  const dlg = $('#dlg');
  function dialog({ title, body, buttons, onOpen, dismissable = true }) {
    return new Promise((resolve) => {
      const form = $('#dlg-body');
      form.innerHTML = `<h2 class="dlg-title">${esc(title)}</h2><div class="dlg-content">${body || ''}</div>
        <div class="dlg-actions">${(buttons || []).map((b, i) =>
          `<button value="${esc(b.value)}" class="${b.primary ? 'primary-btn' : 'ghost-btn'}" ${b.id ? `id="${b.id}"` : ''} ${i === buttons.length - 1 && b.primary ? 'autofocus' : ''}>${esc(b.label)}</button>`).join('')}</div>`;
      const onClose = () => { dlg.removeEventListener('close', onClose); resolve(dlg.returnValue || 'cancel'); };
      dlg.returnValue = '';
      dlg.addEventListener('close', onClose);
      dlg.oncancel = (e) => { if (!dismissable) e.preventDefault(); };
      dlg.showModal();
      if (onOpen) onOpen(form);
    });
  }
  const closeDialog = (v) => { if (dlg.open) dlg.close(v || ''); };

  // ---------------- Menu ----------------
  function perkSummaryHTML(loadout) {
    return CTQ.PIECE_ORDER.map((t) => {
      const perk = CTQ.perkById(loadout[t]);
      return `<li><span class="mini-glyph side-r">${CTQ.PIECES[t].glyph.r}</span>
        <span class="ps-name">${CTQ.PIECES[t].name}</span><span class="ps-perk">${esc(perk.name)}</span></li>`;
    }).join('');
  }
  function renderMenu() { $('#menu-perk-list').innerHTML = perkSummaryHTML(loadouts.main); }

  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-action]');
    if (!a) return;
    const act = a.dataset.action;
    if (act === 'menu') show('menu');
    else if (act === 'army') show('army');
    else if (act === 'rules') show('rules');
    else if (act === 'ai') setupAI();
    else if (act === 'local') startGame({ mode: 'local', perks: { r: loadouts.main, b: loadouts.p2 }, names: { r: 'Người chơi 1', b: 'Người chơi 2' } });
    else if (act === 'online') setupOnline();
  });

  // ---------------- Đội hình ----------------
  let armySlot = 'main';
  let armyType = 'H';
  let armyBoard = null, demoBoard = null;

  for (const b of $$('[data-army-slot]')) {
    b.addEventListener('click', () => {
      armySlot = b.dataset.armySlot;
      for (const x of $$('[data-army-slot]')) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', x === b); }
      renderArmy();
    });
  }
  $('#army-random').addEventListener('click', () => { loadouts[armySlot] = CTQ.randomLoadout(); saveLoadouts(); renderArmy(); });
  $('#army-reset').addEventListener('click', () => { loadouts[armySlot] = CTQ.defaultLoadout(); saveLoadouts(); renderArmy(); });

  function armyState() {
    const board = E.initialBoard().map((p) => (p && p.s === 'r' ? p : null));
    return { board, turn: 'r', perks: { r: loadouts[armySlot], b: {} }, swapUsed: { r: false, b: false } };
  }

  function renderArmy() {
    const lo = loadouts[armySlot];
    if (!armyBoard) {
      armyBoard = new CTQ.BoardView($('#army-board'), {
        onSquare: (sq) => { const p = armyBoard.state.board[sq]; if (p) { armyType = p.t; renderArmy(); } },
      });
      demoBoard = new CTQ.BoardView($('#demo-board'), { interactive: false });
    }
    const st = armyState();
    const dim = new Set();
    st.board.forEach((p, i) => { if (p && p.t !== armyType) dim.add(i); });
    armyBoard.render(st, { dim });

    $('#type-strip').innerHTML = CTQ.PIECE_ORDER.map((t) => `
      <button role="tab" class="type-btn ${t === armyType ? 'is-on' : ''}" data-type="${t}" aria-selected="${t === armyType}">
        <span class="mini-glyph side-r">${CTQ.PIECES[t].glyph.r}</span>
        <span class="tb-name">${CTQ.PIECES[t].name}</span>
        <span class="tb-perk">${esc(CTQ.perkById(lo[t]).name)}</span>
      </button>`).join('');
    for (const b of $$('.type-btn')) b.addEventListener('click', () => { armyType = b.dataset.type; renderArmy(); });

    const info = CTQ.PIECES[armyType];
    $('#perk-head-glyph').textContent = info.glyph.r;
    $('#perk-head-name').textContent = `${info.name}: chọn 1 trong ${CTQ.PERKS[armyType].length} perk`;
    $('#perk-head-base').textContent = info.base;
    $('#perk-options').innerHTML = CTQ.PERKS[armyType].map((p) => `
      <label class="perk-opt ${lo[armyType] === p.id ? 'is-on' : ''}">
        <input type="radio" name="perk" value="${p.id}" ${lo[armyType] === p.id ? 'checked' : ''}>
        <span class="po-name">${esc(p.name)}</span>
        <span class="po-desc">${esc(p.desc)}</span>
      </label>`).join('');
    for (const inp of $$('#perk-options input')) {
      inp.addEventListener('change', () => { lo[armyType] = inp.value; saveLoadouts(); renderArmy(); });
    }
    renderDemo(armyType, lo[armyType]);
  }

  // Thế cờ minh hoạ cho từng loại quân / perk. Quân: [hàng, cột, loại, bên]
  const DEMOS = {
    K: { focus: [9, 4], pieces: [[9, 4, 'K', 'r'], [9, 3, 'A', 'r'], [9, 5, 'A', 'r'], [0, 3, 'K', 'b']] },
    k_ngugia: { focus: [7, 3], pieces: [[7, 3, 'K', 'r'], [0, 4, 'K', 'b']] },
    A: { focus: [9, 3], pieces: [[9, 3, 'A', 'r'], [9, 5, 'K', 'r'], [0, 4, 'K', 'b']] },
    a_kimcuong: { focus: [4, 4], pieces: [[8, 4, 'A', 'r'], [9, 5, 'K', 'r'], [6, 4, 'P', 'r'], [4, 4, 'C', 'b'], [0, 3, 'K', 'b']],
      note: 'Pháo Đen không còn ăn được Sĩ Đỏ qua ngòi.' },
    a_tusi: { focus: [3, 4], pieces: [[8, 4, 'A', 'r'], [9, 5, 'K', 'r'], [3, 4, 'R', 'b'], [0, 3, 'K', 'b']],
      note: 'Xe Đen ăn Sĩ thì Xe Đen cũng mất theo. Perk bị động, không đổi cách đi.' },
    E: { focus: [5, 2], pieces: [[5, 2, 'E', 'r'], [6, 3, 'P', 'r'], [9, 4, 'K', 'r'], [0, 3, 'K', 'b']] },
    R: { focus: [6, 4], pieces: [[6, 4, 'R', 'r'], [4, 4, 'P', 'r'], [2, 4, 'H', 'b'], [9, 3, 'K', 'r'], [0, 3, 'K', 'b']] },
    r_thietgiap: { focus: [2, 0], pieces: [[6, 0, 'R', 'r'], [4, 0, 'P', 'r'], [2, 0, 'C', 'b'], [9, 4, 'K', 'r'], [0, 3, 'K', 'b']],
      note: 'Pháo Đen không còn ăn được Xe Đỏ.' },
    C: { focus: [7, 4], pieces: [[7, 4, 'C', 'r'], [7, 5, 'P', 'b'], [5, 4, 'P', 'r'], [3, 4, 'P', 'r'], [1, 4, 'R', 'b'], [9, 3, 'K', 'r'], [0, 3, 'K', 'b']] },
    H: { focus: [7, 4], pieces: [[7, 4, 'H', 'r'], [6, 4, 'P', 'r'], [9, 3, 'K', 'r'], [0, 3, 'K', 'b']] },
    P: { focus: [6, 2], pieces: [[6, 2, 'P', 'r'], [9, 4, 'K', 'r'], [0, 3, 'K', 'b']] },
    p_lienhoan: { focus: [1, 3], pieces: [[4, 3, 'P', 'r'], [4, 4, 'P', 'r'], [1, 3, 'R', 'b'], [9, 4, 'K', 'r'], [0, 4, 'K', 'b']],
      note: 'Hai Tốt Đỏ đứng sát ngang nhau nên Xe Đen không ăn được.' },
    p_thangcap: { focus: [2, 2], pieces: [[2, 2, 'P', 'r'], [9, 4, 'K', 'r'], [0, 3, 'K', 'b']],
      note: 'Tiến thêm một bước vào 2 hàng cuối của Đen, Tốt sẽ trở thành Xe.' },
  };

  function renderDemo(type, perkId) {
    const demo = DEMOS[perkId] || DEMOS[type];
    const board = new Array(90).fill(null);
    for (const [r, c, t, s] of demo.pieces) board[E.idx(r, c)] = { t, s };
    const NONE = { K: '', A: '', E: '', R: '', C: '', H: '', P: '' };
    const withP = { board, turn: 'r', perks: { r: { ...NONE, [type]: perkId }, b: { ...NONE } }, swapUsed: { r: false, b: false } };
    const without = { board, turn: 'r', perks: { r: { ...NONE }, b: { ...NONE } }, swapUsed: { r: false, b: false } };
    const fsq = E.idx(demo.focus[0], demo.focus[1]);
    const key = (m) => m.to + (m.swap ? 's' : '');
    const a = E.genPieceMoves(without, fsq), b = E.genPieceMoves(withP, fsq);
    const ak = new Set(a.map(key)), bk = new Set(b.map(key));
    const moves = [];
    for (const m of b) moves.push({ to: m.to, kind: ak.has(key(m)) ? 'base' : 'perk' });
    for (const m of a) if (!bk.has(key(m))) moves.push({ to: m.to, kind: 'lost' });
    demoBoard.render(withP, { moves, focus: fsq, showPerk: false });
    let note = demo.note || '';
    if (perkId === 'k_hoanvi') note = 'Vòng vàng trên quân mình là ô Tướng có thể đổi chỗ (chỉ một lần mỗi trận).';
    $('#demo-note').textContent = note;
  }

  // ---------------- Luật ----------------
  function renderRules() {
    $('#rules-list').innerHTML = CTQ.PIECE_ORDER.map((t) => `
      <section class="rule-block">
        <h2><span class="mini-glyph side-r">${CTQ.PIECES[t].glyph.r}</span><span class="mini-glyph side-b">${CTQ.PIECES[t].glyph.b}</span> ${CTQ.PIECES[t].name}</h2>
        <p class="muted">${esc(CTQ.PIECES[t].base)}</p>
        <dl>${CTQ.PERKS[t].map((p) => `<dt>${esc(p.name)}</dt><dd>${esc(p.desc)}</dd>`).join('')}</dl>
      </section>`).join('');
  }

  // ---------------- Thiết lập trận ----------------
  async function setupAI() {
    const lastLevel = store.get('aiLevel', 'normal');
    const r = await dialog({
      title: 'Đấu với máy',
      body: `
        <fieldset class="choice"><legend>Cấp độ</legend>
          ${Object.entries(CTQ.AI.LEVELS).map(([k, v]) => `<label><input type="radio" name="lvl" value="${k}" ${k === lastLevel ? 'checked' : ''}> ${v.name}</label>`).join('')}
        </fieldset>
        <fieldset class="choice"><legend>Bạn cầm quân</legend>
          <label><input type="radio" name="side" value="r" checked> Đỏ (đi trước)</label>
          <label><input type="radio" name="side" value="b"> Đen</label>
          <label><input type="radio" name="side" value="x"> Ngẫu nhiên</label>
        </fieldset>
        <p class="muted">Máy sẽ mang một đội hình perk ngẫu nhiên.</p>`,
      buttons: [{ label: 'Huỷ', value: 'cancel' }, { label: 'Vào trận', value: 'go', primary: true }],
      onOpen: (form) => {
        form.addEventListener('change', () => {
          form.dataset.lvl = $('input[name=lvl]:checked', form).value;
          form.dataset.side = $('input[name=side]:checked', form).value;
        });
        form.dataset.lvl = lastLevel; form.dataset.side = 'r';
      },
    });
    if (r !== 'go') return;
    const form = $('#dlg-body');
    const level = form.dataset.lvl;
    store.set('aiLevel', level);
    let side = form.dataset.side;
    if (side === 'x') side = Math.random() < 0.5 ? 'r' : 'b';
    const ai = E.other(side);
    const perks = { [side]: loadouts.main, [ai]: CTQ.randomLoadout() };
    const names = { [side]: Auth.user ? Auth.user.name : 'Bạn', [ai]: `Máy (${CTQ.AI.LEVELS[level].name})` };
    startGame({ mode: 'ai', perks, names, mySide: side, aiLevel: level });
  }

  // ---------------- Tài khoản & lời mời ----------------
  const Auth = CTQ.Auth;
  let pendingInvite = null; // mã phòng từ link mời
  let afterLogin = null; // việc cần làm sau khi đăng nhập

  const myName = () => (Auth.user ? Auth.user.name : 'Kỳ thủ');

  function inviteLink(code) {
    const base = /^https?:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname)
      ? location.origin + location.pathname
      : CTQ.CONFIG.siteUrl;
    return `${base}?phong=${code}`;
  }

  function readInviteFromURL() {
    const q = new URLSearchParams(location.search);
    const code = (q.get('phong') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length === 5) pendingInvite = code;
    if (q.has('phong')) history.replaceState(null, '', location.pathname);
  }

  function renderAccount() {
    const el = $('#account');
    if (!Auth.ready) { el.innerHTML = ''; return; }
    el.innerHTML = Auth.user
      ? `<span class="acc-name">${esc(Auth.user.name)}</span><button class="link-btn" id="btn-signout">Đăng xuất</button>`
      : `<button class="ghost-btn" id="btn-signin">Đăng nhập</button>`;
    const so = $('#btn-signout'), si = $('#btn-signin');
    if (so) so.addEventListener('click', () => Auth.signOut());
    if (si) si.addEventListener('click', () => requireLogin(null, 'Đăng nhập để chơi trực tuyến và gửi link mời đối thủ.'));
  }

  function renderInviteBanner() {
    const el = $('#invite-banner');
    if (!pendingInvite) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `<p><strong>Bạn được mời vào phòng ${esc(pendingInvite)}.</strong> Chỉnh đội hình xong rồi vào trận, vì sau khi vào trận sẽ không đổi perk được nữa.</p>
      <div class="ib-actions">
        <button class="primary-btn" id="ib-join">Vào phòng</button>
        <button class="ghost-btn" data-action="army">Chỉnh đội hình</button>
        <button class="link-btn" id="ib-skip">Bỏ qua</button>
      </div>`;
    $('#ib-join').addEventListener('click', () => {
      const code = pendingInvite;
      requireLogin(() => { pendingInvite = null; renderInviteBanner(); joinRoom(code); }, `Đăng nhập để vào phòng ${code}.`);
    });
    $('#ib-skip').addEventListener('click', () => { pendingInvite = null; renderInviteBanner(); });
  }

  // Chạy fn nếu đã đăng nhập, nếu chưa thì mở màn đăng nhập rồi chạy sau
  function requireLogin(fn, reason) {
    if (Auth.user) { if (fn) fn(); return; }
    afterLogin = fn;
    $('#login-reason').textContent = reason || 'Đăng nhập để tiếp tục.';
    $('#login-error').textContent = '';
    $('#login-google').hidden = Auth.mode !== 'firebase';
    $('#login-local').hidden = Auth.mode !== 'local';
    if (Auth.error) $('#login-error').textContent = Auth.error;
    show('login');
    const inp = $('#login-name');
    if (Auth.mode === 'local' && inp) { inp.value = playerName || ''; inp.focus(); }
  }

  Auth.onChange(() => {
    renderAccount();
    if (Auth.user) {
      playerName = Auth.user.name;
      if ($('#screen-login').classList.contains('is-active')) {
        const fn = afterLogin; afterLogin = null;
        show('menu');
        if (fn) fn();
      }
    }
  });

  $('#login-local').addEventListener('submit', (e) => {
    e.preventDefault();
    try { Auth.signInLocal($('#login-name').value); } catch (err) { $('#login-error').textContent = err.message; }
  });
  $('#btn-google').addEventListener('click', async () => {
    $('#login-error').textContent = '';
    try { await Auth.signInGoogle(); } catch (err) { $('#login-error').textContent = err.message; }
  });

  // ---------------- Trực tuyến ----------------
  let room = null;

  function setupOnline() {
    requireLogin(openOnlineDialog, 'Đăng nhập để chơi trực tuyến và gửi link mời đối thủ.');
  }

  async function openOnlineDialog() {
    const r = await dialog({
      title: 'Chơi trực tuyến',
      body: `
        <p>Bạn vào trận với tên <strong>${esc(myName())}</strong> và đội hình hiện tại. Sau khi trận bắt đầu, perk sẽ bị khoá.</p>
        <label class="field">Có mã phòng của bạn bè?<input id="on-code" maxlength="5" autocomplete="off" placeholder="Ví dụ: K7QPA" style="text-transform:uppercase"></label>
        <p class="muted">Hoặc tạo phòng mới để nhận link mời gửi cho đối thủ. Bên cầm Đỏ được bốc ngẫu nhiên.</p>`,
      buttons: [{ label: 'Huỷ', value: 'cancel' }, { label: 'Vào phòng', value: 'join' }, { label: 'Tạo phòng', value: 'host', primary: true }],
      onOpen: (form) => {
        const save = () => { form.dataset.code = $('#on-code', form).value.trim(); };
        form.addEventListener('input', save); save();
      },
    });
    const form = $('#dlg-body');
    if (r === 'host') hostRoom();
    else if (r === 'join') {
      const code = (form.dataset.code || '').toUpperCase();
      if (code.length !== 5) { await dialog({ title: 'Thiếu mã phòng', body: '<p>Nhập đủ 5 ký tự mã phòng mà bạn bè gửi cho bạn.</p>', buttons: [{ label: 'Đóng', value: 'ok', primary: true }] }); return openOnlineDialog(); }
      joinRoom(code);
    }
  }

  function leaveRoom() { if (room) { room.close(); room = null; } }

  async function hostRoom() {
    leaveRoom();
    room = new CTQ.Net.Room();
    const myRoom = room;
    // Khoá đội hình ngay khi mở phòng
    room.myLoadout = CTQ.sanitizeLoadout(loadouts.main);
    let started = false;
    dialog({ title: 'Đang tạo phòng…', body: '<p class="muted">Đang kết nối tới máy chủ môi giới.</p>', buttons: [{ label: 'Huỷ', value: 'cancel' }] })
      .then(() => { if (!started && room === myRoom) leaveRoom(); });
    try {
      const code = await room.host();
      if (room !== myRoom) return;
      const link = inviteLink(code);
      $('#dlg-body').innerHTML = `<h2 class="dlg-title">Phòng đã sẵn sàng</h2>
        <div class="dlg-content"><p>Gửi link mời cho đối thủ. Họ cần đăng nhập rồi mới vào được trận.</p>
        <p class="invite-link"><input id="invite-link" readonly value="${esc(link)}" aria-label="Link mời"></p>
        <p class="muted">Hoặc đọc mã phòng: <span class="room-code-inline">${code}</span></p>
        <p class="muted" id="room-wait">Đang chờ đối thủ vào phòng…</p></div>
        <div class="dlg-actions"><button value="cancel" class="ghost-btn">Huỷ phòng</button>${navigator.share ? '<button type="button" class="ghost-btn" id="share-link">Chia sẻ</button>' : ''}<button type="button" class="primary-btn" id="copy-link">Sao chép link</button></div>`;
      $('#invite-link').addEventListener('focus', (e) => e.target.select());
      $('#copy-link').addEventListener('click', () => {
        const done = () => { $('#copy-link').textContent = 'Đã sao chép'; };
        if (navigator.clipboard) navigator.clipboard.writeText(link).then(done, () => { $('#invite-link').select(); });
        else { $('#invite-link').select(); document.execCommand('copy'); done(); }
      });
      const sh = $('#share-link');
      if (sh) sh.addEventListener('click', () => navigator.share({ title: 'Cờ Tướng Quân', text: `${myName()} mời bạn đấu Cờ Tướng Quân`, url: link }).catch(() => {}));
    } catch (e) {
      closeDialog();
      leaveRoom();
      dialog({ title: 'Không tạo được phòng', body: `<p>${esc(e.message)}</p>`, buttons: [{ label: 'Đóng', value: 'ok', primary: true }] });
      return;
    }
    room.on('message', (msg) => {
      if (msg.type === 'hello' && !started) {
        started = true;
        closeDialog('started');
        room.peerInfo = {
          name: String(msg.name || 'Đối thủ').slice(0, 20),
          loadout: CTQ.sanitizeLoadout(msg.loadout),
        };
        beginOnline(Math.random() < 0.5 ? 'r' : 'b');
      } else onNetMessage(msg);
    });
    bindRoomEvents();
  }

  // Chủ phòng bắt đầu ván (cả ván đầu và ván đấu lại) với đội hình đã khoá
  function beginOnline(hostSide) {
    const guestSide = E.other(hostSide);
    const perks = { [hostSide]: room.myLoadout, [guestSide]: room.peerInfo.loadout };
    const names = { [hostSide]: myName(), [guestSide]: room.peerInfo.name };
    room.send({ type: 'start', hostSide, perks, names });
    startGame({ mode: 'online', perks, names, mySide: hostSide });
  }

  async function joinRoom(code) {
    leaveRoom();
    room = new CTQ.Net.Room();
    const myRoom = room;
    room.myLoadout = CTQ.sanitizeLoadout(loadouts.main);
    let started = false;
    dialog({ title: 'Đang vào phòng ' + code + '…', body: '<p class="muted">Đang tìm phòng và kết nối với chủ phòng.</p>', buttons: [{ label: 'Huỷ', value: 'cancel' }] })
      .then(() => { if (!started && room === myRoom) leaveRoom(); });
    room.on('message', (msg) => {
      if (msg.type === 'start') {
        started = true;
        closeDialog('started');
        const mySide = E.other(msg.hostSide);
        const perks = { r: CTQ.sanitizeLoadout(msg.perks && msg.perks.r), b: CTQ.sanitizeLoadout(msg.perks && msg.perks.b) };
        perks[mySide] = room.myLoadout;
        const names = { r: String((msg.names && msg.names.r) || 'Đỏ').slice(0, 20), b: String((msg.names && msg.names.b) || 'Đen').slice(0, 20) };
        startGame({ mode: 'online', perks, names, mySide });
      } else onNetMessage(msg);
    });
    bindRoomEvents();
    try {
      await room.join(code);
      if (room !== myRoom) return;
      room.send({ type: 'hello', name: myName(), uid: Auth.user && Auth.user.uid, loadout: room.myLoadout, v: 1 });
    } catch (e) {
      if (room !== myRoom) return;
      closeDialog();
      leaveRoom();
      dialog({ title: 'Không vào được phòng', body: `<p>${esc(e.message)}</p>`, buttons: [{ label: 'Đóng', value: 'ok', primary: true }] });
    }
  }

  function bindRoomEvents() {
    room.on('close', () => {
      if (game && game.mode === 'online' && !game.over) {
        endGame({ winner: game.mySide, reason: 'Đối thủ đã rời trận' });
      } else if (game && game.mode === 'online') {
        game.netClosed = true;
        renderGame();
      }
    });
    room.on('error', (e) => {
      if (game && game.mode === 'online') toast(e.message);
    });
  }

  function onNetMessage(msg) {
    if (!game || game.mode !== 'online' || !msg) return;
    if (msg.type === 'move') {
      if (game.over || game.state.turn === game.mySide) return;
      const legal = E.legalMoves(game.state);
      const m = legal.find((x) => x.from === msg.from && x.to === msg.to && !!x.swap === !!msg.swap);
      if (!m) { toast('Nhận được nước đi không hợp lệ từ đối thủ, đã bỏ qua.'); return; }
      doMove(m, true);
    } else if (msg.type === 'resign') {
      if (!game.over) endGame({ winner: game.mySide, reason: 'Đối thủ đầu hàng' });
    } else if (msg.type === 'rematch') {
      game.rematchThem = true;
      if (game.rematchMe && room.isHost) {
        beginOnline(game.mySide === 'r' ? 'b' : 'r');
      } else if (!game.rematchMe) {
        toast('Đối thủ muốn đấu lại. Bấm "Đấu lại" để đồng ý.');
        renderGame();
      }
    }
  }

  // ---------------- Trận đấu ----------------
  let game = null;
  let gameBoard = null;
  let uidSeq = 1;

  function startGame(cfg) {
    const state = E.createState(cfg.perks.r, cfg.perks.b);
    for (const p of state.board) if (p) p.uid = uidSeq++;
    game = {
      mode: cfg.mode,
      state,
      names: cfg.names,
      mySide: cfg.mySide || null,
      aiLevel: cfg.aiLevel,
      cfg,
      history: [],
      startKey: E.positionKey(state),
      quiet: 0,
      over: null,
      selected: -1,
      moves: [],
      thinking: false,
      flip: cfg.mySide === 'b',
      info: null,
    };
    if (!gameBoard) gameBoard = new CTQ.BoardView($('#game-board'), { onSquare: onSquare });
    gameBoard.flip = game.flip;
    show('game');
    renderGame();
    maybeAI();
  }

  const controls = (side) => !game.over && !game.thinking &&
    (game.mode === 'local' || side === game.mySide);

  function onSquare(sq) {
    if (!game || game.over || game.thinking) return;
    const st = game.state;
    const target = game.moves.find((m) => m.to === sq);
    if (game.selected >= 0 && target) { doMove(target.m); return; }
    const p = st.board[sq];
    if (p && p.s === st.turn && controls(p.s)) {
      if (game.selected === sq) { game.selected = -1; game.moves = []; }
      else selectPiece(sq);
    } else {
      game.selected = -1; game.moves = [];
      if (p) game.info = { p };
    }
    renderGame();
  }

  function selectPiece(sq) {
    const st = game.state;
    const p = st.board[sq];
    game.selected = sq;
    game.info = { p };
    const legal = E.legalMovesFrom(st, sq);
    // Nước nào chỉ có nhờ perk thì tô màu riêng
    const alt = E.cloneState(st);
    alt.perks[p.s][p.t] = '';
    const baseSet = new Set(E.genPieceMoves(alt, sq).map((m) => m.to));
    game.moves = legal.map((m) => ({ m, to: m.to, kind: m.swap || !baseSet.has(m.to) ? 'perk' : 'base' }));
  }

  function doMove(m, fromNet) {
    const st = game.state;
    const before = E.cloneState(st);
    const mover = st.turn;
    const u = E.makeMove(st, m);
    const note = E.notate(u);
    const gaveCheck = E.inCheck(st, st.turn);
    const key = E.positionKey(st);
    const quietBefore = game.quiet;
    game.quiet = u.captured ? 0 : game.quiet + 1;
    game.history.push({ before, u, note, key, gaveCheck, mover, quietBefore });
    game.selected = -1; game.moves = [];
    game.info = null;
    if (game.mode === 'online' && !fromNet && room) room.send({ type: 'move', from: m.from, to: m.to, swap: !!m.swap, n: game.history.length });

    const result = judge();
    renderGame();
    if (result) endGame(result);
    else maybeAI();
  }

  // Phân xử: chiếu bí / hết nước / lặp lại / quá nhiều nước không ăn quân
  function judge() {
    const st = game.state;
    const s = E.status(st);
    if (s.over) return { winner: s.winner, reason: s.reason };
    const keys = [game.startKey].concat(game.history.map((h) => h.key));
    const cur = keys[keys.length - 1];
    let count = 0, first = -1;
    keys.forEach((k, i) => { if (k === cur) { count++; if (first < 0) first = i; } });
    if (count >= 3) {
      const cycle = game.history.slice(first); // các nước từ lần xuất hiện đầu tới nay
      const allCheck = (side) => {
        const mine = cycle.filter((h) => h.mover === side);
        return mine.length > 0 && mine.every((h) => h.gaveCheck);
      };
      const rc = allCheck('r'), bc = allCheck('b');
      if (rc && !bc) return { winner: 'b', reason: 'Đỏ chiếu dai' };
      if (bc && !rc) return { winner: 'r', reason: 'Đen chiếu dai' };
      return { winner: null, reason: 'Lặp lại thế cờ ba lần' };
    }
    if (game.quiet >= QUIET_LIMIT) return { winner: null, reason: '60 nước không ăn quân' };
    return null;
  }

  function maybeAI() {
    if (!game || game.mode !== 'ai' || game.over || game.state.turn === game.mySide) return;
    game.thinking = true;
    renderGame();
    const g = game;
    setTimeout(() => {
      if (game !== g || g.over) return;
      const lvl = CTQ.AI.LEVELS[g.aiLevel];
      // Tránh lặp thế cờ lần thứ ba (có thể bị xử thua vì chiếu dai)
      const counts = new Map();
      for (const k of [g.startKey].concat(g.history.map((h) => h.key))) counts.set(k, (counts.get(k) || 0) + 1);
      const exclude = (m) => {
        const s2 = E.cloneState(g.state);
        E.makeMove(s2, m);
        return (counts.get(E.positionKey(s2)) || 0) >= 2;
      };
      const res = CTQ.AI.search(g.state, Object.assign({}, lvl, { exclude }));
      g.thinking = false;
      if (game !== g) return;
      if (res && res.move) doMove(res.move);
      else renderGame();
    }, 380);
  }

  function endGame(result) {
    game.over = result;
    game.selected = -1; game.moves = [];
    renderGame();
    let title;
    if (!result.winner) title = 'Hoà cờ';
    else if (game.mode === 'local') title = `${SIDE_NAME[result.winner]} thắng`;
    else title = result.winner === game.mySide ? 'Bạn thắng' : 'Bạn thua';
    setTimeout(async () => {
      if (!game || game.over !== result) return;
      const v = await dialog({
        title,
        body: `<p>${esc(result.reason)}${result.winner ? ` — ${esc(game.names[result.winner])} (${SIDE_NAME[result.winner]}) giành chiến thắng.` : '.'}</p>`,
        buttons: [{ label: 'Xem lại bàn cờ', value: 'stay' }, { label: 'Về menu', value: 'menu' }, { label: 'Đấu lại', value: 'again', primary: true }],
      });
      if (v === 'menu') leaveGame(true);
      else if (v === 'again') rematch();
    }, 650);
  }

  function rematch() {
    if (!game) return;
    if (game.mode === 'online') {
      if (!room || game.netClosed) { toast('Đối thủ đã rời phòng.'); return; }
      game.rematchMe = true;
      room.send({ type: 'rematch' });
      if (game.rematchThem && room.isHost) beginOnline(game.mySide === 'r' ? 'b' : 'r');
      else toast('Đã gửi lời mời đấu lại. Đang chờ đối thủ…');
      renderGame();
      return;
    }
    const cfg = game.cfg;
    if (cfg.mode === 'ai') {
      // đổi màu cho ván sau, máy bốc lại perk
      const side = E.other(cfg.mySide);
      const ai = E.other(side);
      startGame(Object.assign({}, cfg, {
        mySide: side,
        perks: { [side]: cfg.perks[cfg.mySide], [ai]: CTQ.randomLoadout() },
        names: { [side]: cfg.names[cfg.mySide], [ai]: cfg.names[E.other(cfg.mySide)] },
      }));
    } else startGame(cfg);
  }

  function leaveGame(force) {
    const go = () => { leaveRoom(); game = null; show('menu'); };
    if (force || !game || game.over || game.history.length === 0) return go();
    dialog({
      title: 'Rời trận?', body: game.mode === 'online' ? '<p>Rời trận lúc này sẽ bị tính là thua.</p>' : '<p>Ván đang chơi sẽ không được lưu.</p>',
      buttons: [{ label: 'Ở lại', value: 'stay' }, { label: 'Rời trận', value: 'leave', primary: true }],
    }).then((v) => {
      if (v !== 'leave') return;
      if (game && game.mode === 'online' && room) room.send({ type: 'resign' });
      go();
    });
  }

  $('#btn-leave').addEventListener('click', () => leaveGame(false));
  $('#btn-flip').addEventListener('click', () => { if (!game) return; game.flip = !game.flip; gameBoard.flip = game.flip; renderGame(); });
  $('#btn-undo').addEventListener('click', () => {
    if (!game || game.mode === 'online' || game.thinking || game.history.length === 0) return;
    let n = 1;
    if (game.mode === 'ai') {
      // lùi về lượt của người chơi gần nhất
      n = game.history[game.history.length - 1].mover === game.mySide ? 1 : 2;
      if (n > game.history.length) n = game.history.length;
    }
    let h;
    for (let i = 0; i < n; i++) h = game.history.pop();
    game.state = h.before;
    game.quiet = h.quietBefore;
    game.over = null; game.selected = -1; game.moves = []; game.info = null;
    renderGame();
    maybeAI();
  });
  $('#btn-resign').addEventListener('click', async () => {
    if (!game) return;
    if (game.over) { rematch(); return; }
    const v = await dialog({ title: 'Đầu hàng?', body: '<p>Ván cờ sẽ kết thúc và đối thủ được tính thắng.</p>',
      buttons: [{ label: 'Chơi tiếp', value: 'no' }, { label: 'Đầu hàng', value: 'yes', primary: true }] });
    if (v !== 'yes' || !game || game.over) return;
    const loser = game.mode === 'local' ? game.state.turn : game.mySide;
    if (game.mode === 'online' && room) room.send({ type: 'resign' });
    endGame({ winner: E.other(loser), reason: `${SIDE_NAME[loser]} đầu hàng` });
  });

  function playerCard(side) {
    const st = game.state;
    const active = !game.over && st.turn === side;
    const captured = [];
    for (const h of game.history) if (h.u.captured && h.u.captured.s !== side) captured.push(h.u.captured);
    const chips = CTQ.PIECE_ORDER.map((t) => {
      const perk = CTQ.perkById(st.perks[side][t]);
      const used = t === 'K' && perk.id === 'k_hoanvi' && st.swapUsed[side];
      return `<button type="button" class="chip ${used ? 'is-used' : ''}" data-chip="${side}${t}" title="${esc(perk.name + ': ' + perk.desc)}">
        <span class="mini-glyph side-${side}">${CTQ.PIECES[t].glyph[side]}</span>${esc(perk.name)}</button>`;
    }).join('');
    const you = game.mode !== 'local' && side === game.mySide ? ' (bạn)' : '';
    return `<div class="pc-head ${active ? 'is-active' : ''}">
        <span class="side-dot side-${side}"></span>
        <span class="pc-name">${esc(game.names[side])}${you}</span>
        <span class="pc-side">${SIDE_NAME[side]}</span>
        <span class="pc-caps" aria-label="Quân đã ăn">${captured.map((p) => `<span class="mini-glyph side-${p.s}">${CTQ.PIECES[p.t].glyph[p.s]}</span>`).join('')}</span>
      </div>
      <div class="chips">${chips}</div>`;
  }

  function renderGame() {
    if (!game) return;
    const st = game.state;
    const bottom = game.flip ? 'b' : 'r';
    const top = E.other(bottom);
    $('#card-top').innerHTML = playerCard(top);
    $('#card-bottom').innerHTML = playerCard(bottom);
    for (const c of $$('[data-chip]')) {
      c.addEventListener('click', () => {
        const side = c.dataset.chip[0], t = c.dataset.chip[1];
        game.info = { p: { t, s: side } };
        renderInfo();
      });
    }
    const checkSide = !game.over && E.inCheck(st, st.turn) ? E.findKing(st, st.turn) : -1;
    const lastH = game.history[game.history.length - 1];
    gameBoard.render(st, {
      selected: game.selected,
      moves: game.moves,
      last: lastH ? { from: lastH.u.from, to: lastH.u.to } : null,
      check: checkSide,
    });

    // trạng thái
    let s;
    if (game.over) {
      s = game.over.winner ? `${SIDE_NAME[game.over.winner]} thắng: ${game.over.reason}` : `Hoà: ${game.over.reason}`;
    } else {
      const who = game.mode === 'local' ? game.names[st.turn] : st.turn === game.mySide ? 'Lượt của bạn' : (game.mode === 'ai' ? 'Máy đang nghĩ…' : 'Chờ đối thủ đi…');
      s = `<span class="side-dot side-${st.turn}"></span> ${SIDE_NAME[st.turn]} · ${esc(who)}`;
      if (checkSide >= 0) s += ' <strong class="check-tag">Đang bị chiếu</strong>';
    }
    $('#status').innerHTML = s;
    $('#status').classList.toggle('is-over', !!game.over);

    // diễn biến
    const list = $('#move-list');
    list.innerHTML = game.history.map((h, i) => `<li class="side-${h.mover}"><span class="mv-n">${Math.floor(i / 2) + 1}${h.mover === 'r' ? '.' : '…'}</span> ${esc(h.note)}${h.gaveCheck ? ' <em>chiếu</em>' : ''}</li>`).join('') || '<li class="muted empty">Chưa có nước nào. Đỏ đi trước.</li>';
    list.scrollTop = list.scrollHeight;

    $('#btn-undo').hidden = game.mode === 'online';
    $('#btn-undo').disabled = game.history.length === 0 || game.thinking;
    const rb = $('#btn-resign');
    rb.textContent = game.over ? (game.rematchThem ? 'Đồng ý đấu lại' : 'Đấu lại') : 'Đầu hàng';
    rb.disabled = !!(game.over && game.mode === 'online' && (game.rematchMe || game.netClosed));
    renderInfo();
  }

  function renderInfo() {
    const el = $('#piece-info');
    if (!game || !game.info) { el.innerHTML = '<p class="muted">Chọn một quân hoặc một perk để xem chi tiết. Chấm vàng là nước đi do perk mở ra.</p>'; return; }
    const { p } = game.info;
    const perk = CTQ.perkById(game.state.perks[p.s][p.t]);
    el.innerHTML = `<div class="pi-head"><span class="mini-glyph big side-${p.s}">${CTQ.PIECES[p.t].glyph[p.s]}</span>
      <div><strong>${CTQ.PIECES[p.t].name} ${SIDE_NAME[p.s]}${p.promo ? ' (Tốt phong cấp)' : ''}</strong>
      <p class="muted">${esc(CTQ.PIECES[p.t].base)}</p></div></div>
      <p class="pi-perk"><strong>${esc(perk.name)}</strong> ${esc(perk.desc)}</p>`;
  }

  // ---------------- Thông báo nhanh ----------------
  let toastTimer = 0;
  function toast(msg) {
    let t = $('#toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-on'), 3200);
  }

  // Phím Esc bỏ chọn quân
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && game && game.selected >= 0 && !dlg.open) { game.selected = -1; game.moves = []; renderGame(); }
  });

  readInviteFromURL();
  show('menu');
  Auth.init().then(() => {
    renderAccount();
    // Người mở link mời mà chưa đăng nhập: đăng nhập trước, rồi về sảnh chỉnh đội hình
    if (pendingInvite && !Auth.user) requireLogin(null, `Bạn được mời vào phòng ${pendingInvite}. Đăng nhập để nhận lời mời.`);
  });
})();
