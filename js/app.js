/* Cờ Tướng Quân — điều khiển giao diện: sảnh, đội hình, phòng chuẩn bị, trận đấu. */
(function () {
  const CTQ = window.CTQ;
  const E = CTQ.Engine;
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const SIDE_NAME = { r: 'Đỏ', b: 'Đen' };
  const QUIET_LIMIT = 120; // 60 nước mỗi bên không ăn quân thì hoà
  const SETUP_TIME = { normal: 60, ex: 90 }; // giây chuẩn bị
  const COUNTDOWN = 3;
  const PROTO = 2; // phiên bản giao thức trực tuyến

  // ---------------- Lưu trữ ----------------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('ctq.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('ctq.' + k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } },
  };
  // Đội hình: lineups[sảnh][ô] = { perks, general, strategist }
  const lineups = (function () {
    const v2 = store.get('lineups', null);
    const old = store.get('loadouts', {}); // dữ liệu bản cũ: chỉ có perks
    const mk = (l, perks) => CTQ.sanitizeExLoadout(l || { perks });
    return {
      normal: { main: mk(v2 && v2.normal && v2.normal.main, old.main), p2: mk(v2 && v2.normal && v2.normal.p2, old.p2) },
      ex: { main: mk(v2 && v2.ex && v2.ex.main), p2: mk(v2 && v2.ex && v2.ex.p2) },
    };
  })();
  const saveLineups = () => store.set('lineups', lineups);
  let lobby = store.get('lobby', 'normal') === 'ex' ? 'ex' : 'normal';
  let playerName = store.get('name', '') || '';

  // ---------------- Màn hình ----------------
  let current = 'menu';
  function show(id) {
    current = id;
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

  // ---------------- Sảnh ----------------
  function renderMenu() {
    document.body.classList.toggle('lobby-ex', lobby === 'ex');
    for (const b of $$('[data-lobby]')) { b.classList.toggle('is-on', b.dataset.lobby === lobby); b.setAttribute('aria-selected', b.dataset.lobby === lobby); }
    $('#game-title').textContent = lobby === 'ex' ? 'Danh Tướng' : 'Cờ Tướng Quân';
    $('#tagline').textContent = lobby === 'ex'
      ? 'Bản mở rộng của Cờ Tướng Quân: mỗi đội có một Danh Tướng gánh trận và một Quân Sư cầm quân.'
      : 'Cờ tướng, nhưng mỗi loại quân mang một tuyệt kỹ do bạn chọn.';
    const lo = lineups[lobby].main;
    $('#menu-perk-list').innerHTML = CTQ.PIECE_ORDER.map((t) => {
      const perk = CTQ.perkById(lo.perks[t]);
      return `<li><span class="mini-glyph side-r">${CTQ.PIECES[t].glyph.r}</span>
        <span class="ps-name">${CTQ.PIECES[t].name}</span><span class="ps-perk">${esc(perk.name)}</span></li>`;
    }).join('');
    const exEl = $('#menu-ex-summary');
    if (lobby === 'ex') {
      const g = CTQ.generalById(lo.general.id), s = CTQ.strategistById(lo.strategist);
      exEl.innerHTML = `<div class="ex-sum">
        <div class="ex-sum-item"><span class="ex-sum-pt">${CTQ.portraitHTML(g)}</span><span><span class="muted">Danh Tướng · ${CTQ.PIECES[g.type].name}</span><strong>${esc(g.name)}</strong></span></div>
        <div class="ex-sum-item"><span class="ex-sum-pt">${CTQ.portraitHTML(s)}</span><span><span class="muted">Quân Sư</span><strong>${esc(s.name)}</strong></span></div>
      </div>`;
    } else exEl.innerHTML = '';
    renderChangelog();
  }

  function renderChangelog() {
    const seen = store.get('seenVersion', '');
    const [latest, ...older] = CTQ.CHANGELOG;
    const entry = (c) => `<h3>${esc(c.title)} <span class="cl-ver">v${esc(c.v)} · ${esc(c.date)}</span></h3><ul>${c.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
    $('#changelog').innerHTML = `
      <div class="cl-head"><h2>Cập nhật</h2>${seen !== latest.v ? '<span class="cl-new">Mới</span>' : ''}</div>
      ${entry(latest)}
      <details class="cl-older"><summary>Các bản trước</summary>${older.map(entry).join('')}</details>`;
    // đánh dấu đã xem sau khi người chơi rời sảnh lần đầu
    if (seen !== latest.v) setTimeout(() => store.set('seenVersion', latest.v), 4000);
  }

  for (const b of $$('[data-lobby]')) {
    b.addEventListener('click', () => { lobby = b.dataset.lobby; store.set('lobby', lobby); renderMenu(); });
  }

  document.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-action]');
    if (!a) return;
    const act = a.dataset.action;
    if (act === 'menu') show('menu');
    else if (act === 'army') show('army');
    else if (act === 'rules') show('rules');
    else if (act === 'ai') setupAI();
    else if (act === 'local') startSetup({ mode: 'local', ex: lobby === 'ex', names: { r: 'Người chơi 1', b: 'Người chơi 2' }, mySide: null });
    else if (act === 'online') setupOnline();
  });

  // ---------------- Đội hình (ở sảnh) ----------------
  let armySlot = 'main';
  let armyEditor = null;
  for (const b of $$('[data-army-slot]')) {
    b.addEventListener('click', () => {
      armySlot = b.dataset.armySlot;
      for (const x of $$('[data-army-slot]')) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', x === b); }
      renderArmy();
    });
  }
  function renderArmy() {
    $('#army-title').textContent = lobby === 'ex' ? 'Đội hình mở rộng' : 'Đội hình';
    $('#army-lead').textContent = lobby === 'ex'
      ? 'Chọn perk cho từng loại quân, 1 Danh Tướng và 1 Quân Sư. Trước mỗi trận bạn vẫn còn thời gian chỉnh lại ở phòng chuẩn bị.'
      : 'Chọn perk cho từng loại quân. Trước mỗi trận bạn vẫn còn thời gian chỉnh lại ở phòng chuẩn bị.';
    if (!armyEditor) {
      armyEditor = CTQ.createEditor($('#army-editor'), {
        name: 'army', mode: lobby,
        get: () => lineups[lobby][armySlot],
        set: (lo) => { lineups[lobby][armySlot] = CTQ.sanitizeExLoadout(lo); saveLineups(); },
      });
    }
    armyEditor.setMode(lobby);
  }

  // ---------------- Luật ----------------
  function renderRules() {
    $('#rules-list').innerHTML = CTQ.PIECE_ORDER.map((t) => `
      <section class="rule-block">
        <h2><span class="mini-glyph side-r">${CTQ.PIECES[t].glyph.r}</span><span class="mini-glyph side-b">${CTQ.PIECES[t].glyph.b}</span> ${CTQ.PIECES[t].name}</h2>
        <p class="muted">${esc(CTQ.PIECES[t].base)}</p>
        <dl>${CTQ.PERKS[t].map((p) => `<dt>${esc(p.name)}</dt><dd>${esc(p.desc)}</dd>`).join('')}</dl>
      </section>`).join('');
    $('#rules-ex').innerHTML = `
      <section class="rule-block rule-ex">
        <h2>Bản mở rộng</h2>
        <p>Mỗi đội hình có đúng 1 <strong>Danh Tướng</strong> và 1 <strong>Quân Sư</strong>. Danh Tướng thay cho 1 quân cùng loại, dùng bộ perk riêng thay cho perk của loại quân. Quân Sư không đứng trên bàn: nội tại có hiệu lực cả trận; dùng chiêu chủ động thay cho một lượt đi.</p>
        <h3>Danh Tướng</h3>
        <div class="rule-people">${CTQ.GENERALS.map((g) => `
          <div class="rp"><span class="rp-pt">${CTQ.portraitHTML(g)}</span><div><strong>${esc(g.name)}</strong> <span class="muted">${CTQ.PIECES[g.type].name} · ${esc(g.era)}</span>
          <ul>${g.perks.map((id) => { const p = CTQ.perkById(id); return `<li><b>${esc(p.name)}:</b> ${esc(p.desc)}</li>`; }).join('')}</ul></div></div>`).join('')}</div>
        <h3>Quân Sư</h3>
        <div class="rule-people">${CTQ.STRATEGISTS.map((s) => `
          <div class="rp"><span class="rp-pt">${CTQ.portraitHTML(s)}</span><div><strong>${esc(s.name)}</strong> <span class="muted">${esc(s.era)}</span>
          <ul><li><b>Nội tại ${esc(s.passive.name)}:</b> ${esc(s.passive.desc)}</li>
          ${s.actives.map((a) => `<li><b>${esc(CTQ.skillName(a))}</b> (${CTQ.usesText(a).toLowerCase()}): ${esc(CTQ.SKILLS[a.skill].desc)}</li>`).join('')}</ul></div></div>`).join('')}</div>
      </section>`;
  }

  // ---------------- Thiết lập đấu máy ----------------
  async function setupAI() {
    const lastLevel = store.get('aiLevel', 'normal');
    const r = await dialog({
      title: lobby === 'ex' ? 'Đấu với máy (bản mở rộng)' : 'Đấu với máy',
      body: `
        <fieldset class="choice"><legend>Cấp độ</legend>
          ${Object.entries(CTQ.AI.LEVELS).map(([k, v]) => `<label><input type="radio" name="lvl" value="${k}" ${k === lastLevel ? 'checked' : ''}> ${v.name}</label>`).join('')}
        </fieldset>
        <fieldset class="choice"><legend>Bạn cầm quân</legend>
          <label><input type="radio" name="side" value="r" checked> Đỏ (đi trước)</label>
          <label><input type="radio" name="side" value="b"> Đen</label>
          <label><input type="radio" name="side" value="x"> Ngẫu nhiên</label>
        </fieldset>
        <p class="muted">Máy mang đội hình ngẫu nhiên. Bạn có ${SETUP_TIME[lobby]} giây ở phòng chuẩn bị để chỉnh đội hình.</p>`,
      buttons: [{ label: 'Huỷ', value: 'cancel' }, { label: 'Vào phòng chuẩn bị', value: 'go', primary: true }],
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
    const names = { [side]: Auth.user ? Auth.user.name : 'Bạn', [ai]: `Máy (${CTQ.AI.LEVELS[level].name})` };
    startSetup({ mode: 'ai', ex: lobby === 'ex', mySide: side, aiLevel: level, names });
  }

  // ---------------- Phòng chuẩn bị ----------------
  // setup = { cfg, view ('me'|'p2'), lo: {me, p2|opp}, ready: {me, other}, deadline, timer, starting }
  let setup = null;
  let setupEditor = null;

  function startSetup(cfg) {
    stopSetupTimer();
    game = null;
    const mode = cfg.ex ? 'ex' : 'normal';
    const seconds = cfg.timeLimit || SETUP_TIME[mode];
    setup = {
      cfg,
      view: 'me',
      lo: { me: clone(lineups[mode].main), p2: clone(lineups[mode].p2), opp: null },
      ready: { me: false, other: false },
      deadline: Date.now() + seconds * 1000,
      timer: 0,
      starting: false,
    };
    if (cfg.mode === 'ai') {
      setup.lo.opp = cfg.ex ? CTQ.randomExLoadout() : Object.assign(CTQ.defaultExLoadout(), { perks: CTQ.randomLoadout() });
      setup.ready.other = true;
    }
    if (!setupEditor) {
      setupEditor = CTQ.createEditor($('#setup-editor'), {
        name: 'setup', mode,
        get: () => setup.lo[setup.view],
        set: (lo) => {
          setup.lo[setup.view] = CTQ.sanitizeExLoadout(lo);
          // lưu lại để lần sau mở ra vẫn còn
          const m = setup.cfg.ex ? 'ex' : 'normal';
          lineups[m][setup.view === 'p2' ? 'p2' : 'main'] = clone(setup.lo[setup.view]);
          saveLineups();
        },
      });
    }
    setupEditor.setMode(mode);
    show('setup');
    renderSetup();
    setup.timer = setInterval(tickSetup, 250);
    tickSetup();
  }

  function stopSetupTimer() { if (setup && setup.timer) { clearInterval(setup.timer); setup.timer = 0; } }

  const viewReady = () => (setup.view === 'me' ? setup.ready.me : setup.ready.other);

  function renderSetup() {
    if (!setup) return;
    const c = setup.cfg;
    $('#setup-title').textContent = c.ex ? 'Phòng chuẩn bị · Bản mở rộng' : 'Phòng chuẩn bị';
    const meSide = c.mySide;
    const sideTxt = (s) => (s ? `cầm ${SIDE_NAME[s]}${s === 'r' ? ', đi trước' : ''}` : '');
    $('#setup-sub').textContent = c.mode === 'local'
      ? 'Hai người lần lượt chỉnh đội hình rồi bấm Sẵn sàng.'
      : `Bạn ${sideTxt(meSide)}. Đội hình đối thủ được giữ kín tới khi vào trận.`;
    const st = (ok, who) => `<span class="ss-dot ${ok ? 'is-ok' : ''}"></span>${esc(who)}: <strong>${ok ? 'Sẵn sàng' : 'Đang chỉnh đội hình…'}</strong>`;
    let html;
    if (c.mode === 'local') {
      html = `<div class="seg setup-tabs" role="tablist">
          <button type="button" role="tab" class="seg-btn ${setup.view === 'me' ? 'is-on' : ''}" data-view="me">${esc(c.names.r)} (Đỏ)</button>
          <button type="button" role="tab" class="seg-btn ${setup.view === 'p2' ? 'is-on' : ''}" data-view="p2">${esc(c.names.b)} (Đen)</button>
        </div>
        <p>${st(setup.ready.me, c.names.r)}</p><p>${st(setup.ready.other, c.names.b)}</p>`;
    } else {
      const opp = c.names[E.other(meSide)];
      html = `<p>${st(setup.ready.me, 'Bạn')}</p><p>${st(setup.ready.other, opp)}</p>`;
    }
    $('#setup-status').innerHTML = html;
    for (const b of $$('[data-view]')) b.addEventListener('click', () => { setup.view = b.dataset.view; setupEditor.render(); renderSetup(); });
    const r = viewReady();
    $('#setup-ready').textContent = r ? 'Huỷ sẵn sàng' : 'Sẵn sàng';
    $('#setup-ready').classList.toggle('is-ready', r);
    $('#setup-editor').classList.toggle('is-locked', r);
    $('#setup-foot-note').textContent = r
      ? 'Đội hình đã chốt. Chờ ' + (c.mode === 'local' ? 'người còn lại' : 'đối thủ') + ' sẵn sàng.'
      : 'Hết giờ, đội hình hiện tại sẽ được chốt tự động.';
  }

  function tickSetup() {
    if (!setup || setup.starting) return;
    const left = Math.max(0, Math.ceil((setup.deadline - Date.now()) / 1000));
    const el = $('#setup-timer');
    el.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
    el.classList.toggle('is-low', left <= 10);
    if (left === 0) {
      // hết giờ: tự chốt
      if (!setup.ready.me) setReady('me', true);
      if (setup.cfg.mode === 'local' && !setup.ready.other) setReady('p2', true);
      // chủ phòng: đối thủ không phản hồi quá lâu thì dùng đội hình mặc định
      if (setup.cfg.mode === 'online' && room && room.isHost && !setup.ready.other && Date.now() - setup.deadline > 8000) {
        setup.lo.opp = setup.cfg.ex ? CTQ.defaultExLoadout() : CTQ.defaultExLoadout();
        setup.ready.other = true;
        checkAllReady();
      }
    }
  }

  function setReady(who, val) {
    if (!setup || setup.starting) return;
    const c = setup.cfg;
    if (who === 'p2') setup.ready.other = val; else setup.ready.me = val;
    if (c.mode === 'online' && who === 'me' && room) {
      room.send(val ? { type: 'ready', lineup: setup.lo.me } : { type: 'unready' });
    }
    renderSetup();
    checkAllReady();
  }

  $('#setup-ready').addEventListener('click', () => {
    if (!setup) return;
    const who = setup.view === 'p2' ? 'p2' : 'me';
    setReady(who, !viewReady());
    // hai người một máy: chốt xong thì chuyển sang người còn lại
    if (setup.cfg.mode === 'local' && viewReady() && !setup.starting) {
      setup.view = setup.view === 'me' ? 'p2' : 'me';
      setupEditor.render(); renderSetup();
    }
  });

  $('#setup-leave').addEventListener('click', async () => {
    if (!setup) return;
    if (setup.cfg.mode === 'online') {
      const v = await dialog({ title: 'Rời phòng?', body: '<p>Đối thủ sẽ được báo là bạn đã rời phòng.</p>',
        buttons: [{ label: 'Ở lại', value: 'stay' }, { label: 'Rời phòng', value: 'leave', primary: true }] });
      if (v !== 'leave') return;
      if (room) room.send({ type: 'bye' });
    }
    stopSetupTimer();
    setup = null;
    leaveRoom();
    show('menu');
  });

  function checkAllReady() {
    if (!setup || setup.starting || !setup.ready.me || !setup.ready.other) return;
    const c = setup.cfg;
    if (c.mode === 'online') {
      if (!room || !room.isHost) return; // khách chờ lệnh 'go' từ chủ phòng
      const hostSide = c.mySide;
      const lu = { [hostSide]: setup.lo.me, [E.other(hostSide)]: setup.lo.opp };
      room.send({ type: 'go', lineups: lu, names: c.names, hostSide, ex: c.ex });
      beginCountdown({ mode: 'online', ex: c.ex, lineups: lu, names: c.names, mySide: hostSide });
      return;
    }
    let lu;
    if (c.mode === 'ai') lu = { [c.mySide]: setup.lo.me, [E.other(c.mySide)]: setup.lo.opp };
    else lu = { r: setup.lo.me, b: setup.lo.p2 };
    beginCountdown({ mode: c.mode, ex: c.ex, lineups: lu, names: c.names, mySide: c.mySide, aiLevel: c.aiLevel });
  }

  function beginCountdown(gameCfg) {
    setup.starting = true;
    stopSetupTimer();
    $('#setup-editor').classList.add('is-locked');
    const box = $('#countdown');
    box.hidden = false;
    let n = COUNTDOWN;
    const tick = () => {
      if (!setup) { box.hidden = true; return; }
      if (n === 0) { box.hidden = true; setup = null; startGame(gameCfg); return; }
      $('#countdown-num').textContent = n;
      box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
      n--;
      setTimeout(tick, 1000);
    };
    tick();
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

  // Đọc mã phòng từ link mời: ?phong=MÃ hoặc #phong=MÃ (một số app làm rơi phần ?…)
  function readInviteFromURL() {
    const q = new URLSearchParams(location.search);
    const h = new URLSearchParams(location.hash.replace(/^#/, ''));
    const raw = q.get('phong') || h.get('phong') || '';
    const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length === 5) pendingInvite = code;
    if (raw) history.replaceState(null, '', location.pathname);
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
    const app = CTQ.inAppBrowser();
    const warn = app || !CTQ.hasWebRTC()
      ? `<p class="ib-warn">Bạn đang mở link trong trình duyệt của ${esc(app || 'ứng dụng')}, có thể không vào được phòng. Bấm nút ⋯ hoặc ⋮ ở góc màn hình, chọn <strong>Mở bằng trình duyệt</strong> (Chrome/Safari). Hoặc tự mở <strong>${esc(location.host)}</strong> rồi nhập mã <strong>${esc(pendingInvite)}</strong>.</p>`
      : '';
    el.innerHTML = `<p><strong>Bạn được mời vào phòng ${esc(pendingInvite)}.</strong> Vào phòng xong bạn sẽ có thời gian chỉnh đội hình trước khi trận bắt đầu.</p>${warn}
      <div class="ib-actions">
        <button class="primary-btn" id="ib-join">Vào phòng</button>
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
  // Giao thức: khách 'hello' → chủ 'setup' → hai bên 'ready'/'unready' → chủ 'go' → đếm ngược → trận
  // Trong trận: 'move', 'resign', 'rematch' (đủ 2 bên thì chủ gửi 'setup' mới), 'bye'
  let room = null;

  function setupOnline() {
    requireLogin(openOnlineDialog, 'Đăng nhập để chơi trực tuyến và gửi link mời đối thủ.');
  }

  async function openOnlineDialog() {
    const r = await dialog({
      title: lobby === 'ex' ? 'Chơi trực tuyến · Bản mở rộng' : 'Chơi trực tuyến',
      body: `
        <p>Bạn vào trận với tên <strong>${esc(myName())}</strong>. Phòng bạn tạo sẽ dùng luật ${lobby === 'ex' ? '<strong>Bản mở rộng</strong>' : '<strong>Sảnh thường</strong>'}; vào phòng của bạn bè thì theo luật phòng đó.</p>
        <label class="field">Có mã phòng của bạn bè?<input id="on-code" maxlength="5" autocomplete="off" placeholder="Ví dụ: K7QPA" style="text-transform:uppercase"></label>
        <p class="muted">Hoặc tạo phòng mới để nhận link mời. Bên cầm Đỏ được bốc ngẫu nhiên.</p>`,
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
    room.ex = lobby === 'ex';
    let started = false;
    dialog({ title: 'Đang tạo phòng…', body: '<p class="muted">Đang kết nối tới máy chủ môi giới.</p>', buttons: [{ label: 'Huỷ', value: 'cancel' }] })
      .then(() => { if (!started && room === myRoom) leaveRoom(); });
    try {
      const code = await room.host();
      if (room !== myRoom) return;
      const link = inviteLink(code);
      $('#dlg-body').innerHTML = `<h2 class="dlg-title">Phòng đã sẵn sàng</h2>
        <div class="dlg-content"><p>Gửi link mời cho đối thủ. Họ cần đăng nhập rồi mới vào được phòng.</p>
        <p class="invite-link"><input id="invite-link" readonly value="${esc(link)}" aria-label="Link mời"></p>
        <p class="muted">Hoặc đọc mã phòng: <span class="room-code-inline">${code}</span> · Luật: ${room.ex ? 'Bản mở rộng' : 'Sảnh thường'}</p>
        <p class="muted" id="room-wait">Đang chờ đối thủ vào phòng… Giữ màn hình này mở: trên điện thoại, chuyển sang app khác quá lâu có thể làm mất phòng.</p></div>
        <div class="dlg-actions"><button value="cancel" class="ghost-btn">Huỷ phòng</button>${navigator.share ? '<button type="button" class="ghost-btn" id="share-link">Chia sẻ</button>' : ''}<button type="button" class="primary-btn" id="copy-link">Sao chép link</button></div>`;
      $('#invite-link').addEventListener('focus', (e) => e.target.select());
      const inviteText = `${myName()} mời bạn đấu Cờ Tướng Quân: ${link}\nNếu link không vào được, mở ${new URL(link).host} bằng Chrome/Safari rồi nhập mã phòng ${code}.`;
      $('#copy-link').addEventListener('click', () => {
        const done = () => { $('#copy-link').textContent = 'Đã sao chép'; };
        if (navigator.clipboard) navigator.clipboard.writeText(inviteText).then(done, () => { $('#invite-link').select(); });
        else { $('#invite-link').select(); document.execCommand('copy'); done(); }
      });
      const sh = $('#share-link');
      if (sh) sh.addEventListener('click', () => navigator.share({ title: 'Cờ Tướng Quân', text: inviteText }).catch(() => {}));
    } catch (e) {
      closeDialog();
      leaveRoom();
      dialog({ title: 'Không tạo được phòng', body: `<p>${esc(e.message)}</p>`, buttons: [{ label: 'Đóng', value: 'ok', primary: true }] });
      return;
    }
    room.on('message', (msg) => {
      if (msg && msg.type === 'hello' && !started) {
        started = true;
        closeDialog('started');
        if (msg.v !== PROTO) { room.send({ type: 'old' }); }
        room.peerName = String(msg.name || 'Đối thủ').slice(0, 20);
        hostSetup(Math.random() < 0.5 ? 'r' : 'b');
      } else onNetMessage(msg);
    });
    bindRoomEvents();
  }

  // Chủ phòng mở phòng chuẩn bị (ván đầu và mỗi lần đấu lại)
  function hostSetup(hostSide) {
    const guestSide = E.other(hostSide);
    const names = { [hostSide]: myName(), [guestSide]: room.peerName };
    const timeLimit = SETUP_TIME[room.ex ? 'ex' : 'normal'];
    room.send({ type: 'setup', ex: room.ex, hostSide, names, timeLimit });
    startSetup({ mode: 'online', ex: room.ex, mySide: hostSide, names, timeLimit });
  }

  async function joinRoom(code) {
    leaveRoom();
    room = new CTQ.Net.Room();
    const myRoom = room;
    let started = false;
    dialog({ title: 'Đang vào phòng ' + code + '…', body: '<p class="muted">Đang tìm phòng và kết nối với chủ phòng.</p>', buttons: [{ label: 'Huỷ', value: 'cancel' }] })
      .then(() => { if (!started && room === myRoom) leaveRoom(); });
    room.on('message', (msg) => {
      if (msg && msg.type === 'setup') started = true;
      onNetMessage(msg);
    });
    bindRoomEvents();
    try {
      await room.join(code);
      if (room !== myRoom) return;
      room.send({ type: 'hello', name: myName(), uid: Auth.user && Auth.user.uid, v: PROTO });
    } catch (e) {
      if (room !== myRoom) return;
      closeDialog();
      leaveRoom();
      const v = await dialog({ title: 'Không vào được phòng ' + code, body: `<p>${esc(e.message)}</p>`,
        buttons: [{ label: 'Đóng', value: 'ok' }, { label: 'Thử lại', value: 'retry', primary: true }] });
      if (v === 'retry') joinRoom(code);
    }
  }

  function opponentLeft(reason) {
    if (setup && setup.cfg.mode === 'online') {
      stopSetupTimer(); setup = null; leaveRoom(); show('menu');
      dialog({ title: 'Đối thủ đã rời phòng', body: `<p>${esc(reason)}</p>`, buttons: [{ label: 'Đóng', value: 'ok', primary: true }] });
    } else if (game && game.mode === 'online' && !game.over) {
      endGame({ winner: game.mySide, reason: 'Đối thủ đã rời trận' });
    } else if (game && game.mode === 'online') {
      game.netClosed = true;
      renderGame();
    }
  }

  function bindRoomEvents() {
    room.on('close', () => opponentLeft('Kết nối với đối thủ đã đóng.'));
    room.on('error', (e) => { if ((game && game.mode === 'online') || setup) toast(e.message); });
  }

  function onNetMessage(msg) {
    if (!msg || !room) return;
    switch (msg.type) {
      case 'old':
        toast('Đối thủ đang dùng bản game cũ. Nhờ họ tải lại trang.');
        break;
      case 'setup': { // khách nhận lệnh vào phòng chuẩn bị
        closeDialog('started');
        if (game) { game = null; }
        const mySide = E.other(msg.hostSide);
        const names = { r: String((msg.names && msg.names.r) || 'Đỏ').slice(0, 20), b: String((msg.names && msg.names.b) || 'Đen').slice(0, 20) };
        startSetup({ mode: 'online', ex: !!msg.ex, mySide, names, timeLimit: Math.min(180, Math.max(20, +msg.timeLimit || 60)) });
        break;
      }
      case 'ready':
        if (!setup) return;
        setup.lo.opp = CTQ.sanitizeExLoadout(msg.lineup);
        setup.ready.other = true;
        renderSetup(); checkAllReady();
        break;
      case 'unready':
        if (!setup || setup.starting) return;
        setup.ready.other = false;
        renderSetup();
        break;
      case 'go': { // khách: chủ phòng chốt cả hai đội hình
        if (!setup || room.isHost) return;
        const mySide = E.other(msg.hostSide);
        const lu = { r: CTQ.sanitizeExLoadout(msg.lineups && msg.lineups.r), b: CTQ.sanitizeExLoadout(msg.lineups && msg.lineups.b) };
        beginCountdown({ mode: 'online', ex: !!msg.ex, lineups: lu, names: setup.cfg.names, mySide });
        break;
      }
      case 'bye':
        opponentLeft('Đối thủ đã rời phòng.');
        break;
      case 'move': {
        if (!game || game.mode !== 'online' || game.over || game.state.turn === game.mySide) return;
        const legal = E.legalMoves(game.state);
        const m = legal.find((x) => x.from === msg.from && x.to === msg.to && !!x.swap === !!msg.swap && (x.skill || null) === (msg.skill || null));
        if (!m) { toast('Nhận được nước đi không hợp lệ từ đối thủ, đã bỏ qua.'); return; }
        doMove(m, true);
        break;
      }
      case 'resign':
        if (game && game.mode === 'online' && !game.over) endGame({ winner: game.mySide, reason: 'Đối thủ đầu hàng' });
        break;
      case 'rematch':
        if (!game) return;
        game.rematchThem = true;
        if (game.rematchMe && room.isHost) hostSetup(game.mySide === 'r' ? 'b' : 'r');
        else if (!game.rematchMe) { toast('Đối thủ muốn đấu lại. Bấm "Đấu lại" để đồng ý.'); renderGame(); }
        break;
    }
  }

  // ---------------- Trận đấu ----------------
  let game = null;
  let gameBoard = null;
  let uidSeq = 1;

  // cfg: { mode, ex, lineups: {r, b}, names, mySide, aiLevel }
  function startGame(cfg) {
    const lu = cfg.lineups;
    const state = E.createState(lu.r.perks, lu.b.perks, null, cfg.ex ? { r: lu.r, b: lu.b } : null);
    for (const p of state.board) if (p) p.uid = uidSeq++;
    game = {
      mode: cfg.mode,
      ex: !!cfg.ex,
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
      skill: null,
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
    if (game.skill) { onSkillSquare(sq); return; }
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
    if (E.isFrozen(st, sq, p.s)) { game.moves = []; toast('Quân này đang bị Phong Toả.'); return; }
    const legal = E.legalMovesFrom(st, sq);
    // Nước nào chỉ có nhờ perk thì tô màu riêng
    const baseSet = new Set(E.baseMovesFrom(st, sq).map((m) => m.to));
    game.moves = legal.map((m) => ({ m, to: m.to, kind: m.swap || !baseSet.has(m.to) ? 'perk' : 'base' }));
  }

  // ----- Chiêu của Quân Sư -----
  function startSkill(skillId) {
    const st = game.state;
    const side = st.turn;
    if (!controls(side)) return;
    const moves = E.genSkillMoves(st, side, skillId);
    const strat = CTQ.strategistById(st.ex.strat[side]);
    const a = strat.actives.find((x) => x.skill === skillId);
    if (!moves.length) { toast(`${CTQ.skillName(a)}: chưa có mục tiêu hợp lệ.`); return; }
    game.selected = -1; game.moves = [];
    if (moves[0].from === -1) {
      dialog({ title: CTQ.skillName(a), body: `<p>${esc(CTQ.SKILLS[skillId].desc)}</p><p class="muted">Dùng chiêu sẽ thay cho lượt đi này.</p>`,
        buttons: [{ label: 'Thôi', value: 'no' }, { label: 'Dùng chiêu', value: 'yes', primary: true }] })
        .then((v) => { if (v === 'yes' && game && game.state === st) doMove(moves[0]); });
      return;
    }
    game.skill = { id: skillId, name: CTQ.skillName(a), moves, stage: 1, from: -1 };
    renderGame();
  }

  function skillTargets() {
    const sk = game.skill;
    if (sk.stage === 1) {
      const set = new Set();
      for (const m of sk.moves) { set.add(m.from); if (sk.id === 'dieubinh') set.add(m.to); }
      return Array.from(set);
    }
    return sk.moves.filter((m) => m.from === sk.from || (sk.id === 'dieubinh' && m.to === sk.from))
      .map((m) => (m.from === sk.from ? m.to : m.from));
  }

  function onSkillSquare(sq) {
    const sk = game.skill;
    const targets = skillTargets();
    if (!targets.includes(sq)) { game.skill = null; renderGame(); return; }
    if (sk.stage === 1) {
      const cand = sk.moves.filter((m) => m.from === sq || (sk.id === 'dieubinh' && m.to === sq));
      if (cand.length === 1 && cand[0].to === cand[0].from) { game.skill = null; doMove(cand[0]); return; }
      sk.stage = 2; sk.from = sq;
      renderGame();
      return;
    }
    const m = sk.moves.find((x) => (x.from === sk.from && x.to === sq) || (sk.id === 'dieubinh' && x.to === sk.from && x.from === sq));
    game.skill = null;
    if (m) doMove(m); else renderGame();
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
    game.quiet = u.captured || u.extra.length || u.converted ? 0 : game.quiet + 1;
    game.history.push({ before, u, note, key, gaveCheck, mover, quietBefore });
    game.selected = -1; game.moves = []; game.skill = null;
    game.info = null;
    if (game.mode === 'online' && !fromNet && room) room.send({ type: 'move', from: m.from, to: m.to, swap: !!m.swap, skill: m.skill || null, n: game.history.length });

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
    game.selected = -1; game.moves = []; game.skill = null;
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
        buttons: [{ label: 'Xem lại bàn cờ', value: 'stay' }, { label: 'Về sảnh', value: 'menu' }, { label: 'Đấu lại', value: 'again', primary: true }],
      });
      if (v === 'menu') leaveGame(true);
      else if (v === 'again') rematch();
    }, 650);
  }

  // Đấu lại: quay về phòng chuẩn bị, đổi màu quân
  function rematch() {
    if (!game) return;
    if (game.mode === 'online') {
      if (!room || game.netClosed) { toast('Đối thủ đã rời phòng.'); return; }
      game.rematchMe = true;
      room.send({ type: 'rematch' });
      if (game.rematchThem && room.isHost) hostSetup(game.mySide === 'r' ? 'b' : 'r');
      else toast('Đã gửi lời mời đấu lại. Đang chờ đối thủ…');
      renderGame();
      return;
    }
    const cfg = game.cfg;
    if (cfg.mode === 'ai') {
      const side = E.other(cfg.mySide), ai = E.other(side);
      const names = { [side]: cfg.names[cfg.mySide], [ai]: cfg.names[E.other(cfg.mySide)] };
      game = null;
      startSetup({ mode: 'ai', ex: cfg.ex, mySide: side, aiLevel: cfg.aiLevel, names });
    } else {
      game = null;
      startSetup({ mode: 'local', ex: cfg.ex, names: cfg.names, mySide: null });
    }
  }

  function leaveGame(force) {
    const go = () => { leaveRoom(); game = null; show('menu'); };
    if (force || !game || game.over || game.history.length === 0) {
      if (game && game.mode === 'online' && room && !game.over) room.send({ type: 'resign' });
      return go();
    }
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
    game.over = null; game.selected = -1; game.moves = []; game.skill = null; game.info = null;
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
    for (const h of game.history) {
      const u = h.u;
      if (u.captured && u.captured.s !== side) captured.push(u.captured);
      for (const q of u.extra) if (q.s !== side) captured.push(q);
      if (u.converted && u.converted.s !== side) captured.push(u.converted);
    }
    const chips = CTQ.PIECE_ORDER.map((t) => {
      const perk = CTQ.perkById(st.perks[side][t]);
      const used = t === 'K' && perk.id === 'k_hoanvi' && st.swapUsed[side] >= 3;
      return `<button type="button" class="chip ${used ? 'is-used' : ''}" data-chip="${side}${t}" title="${esc(perk.name + ': ' + perk.desc)}">
        <span class="mini-glyph side-${side}">${CTQ.PIECES[t].glyph[side]}</span>${esc(perk.name)}</button>`;
    }).join('');
    let exRow = '';
    if (st.ex) {
      const g = CTQ.generalById(st.ex.gen[side]), s = CTQ.strategistById(st.ex.strat[side]);
      const mine = controls(side) && st.turn === side;
      const skills = s ? s.actives.map((a) => {
        const ss = E.skillStatus(st, side, a);
        const label = ss.ready ? (ss.left !== null ? `còn ${ss.left} lần` : 'sẵn sàng') : ss.left === 0 ? 'đã dùng' : `hồi ${ss.cd} lượt`;
        const on = game.skill && game.skill.id === a.skill && st.turn === side;
        return `<button type="button" class="skill-btn ${ss.ready ? 'is-ready' : ''} ${on ? 'is-on' : ''}" data-skill="${a.skill}" data-side="${side}" ${mine && ss.ready ? '' : 'disabled'}
          title="${esc(CTQ.SKILLS[a.skill].desc)}"><strong>${esc(CTQ.skillName(a))}</strong><span>${label}</span></button>`;
      }).join('') : '';
      exRow = `<div class="pc-ex">
        ${g ? `<button type="button" class="hero-chip" data-hero="g${side}"><span class="hc-pt">${CTQ.portraitHTML(g)}</span><span><span class="muted">Danh Tướng</span>${esc(g.short)}</span></button>` : ''}
        ${s ? `<button type="button" class="hero-chip" data-hero="s${side}"><span class="hc-pt">${CTQ.portraitHTML(s)}</span><span><span class="muted">Quân Sư</span>${esc(s.name)}</span></button>` : ''}
        <div class="skills">${skills}</div>
      </div>`;
    }
    const you = game.mode !== 'local' && side === game.mySide ? ' (bạn)' : '';
    return `<div class="pc-head ${active ? 'is-active' : ''}">
        <span class="side-dot side-${side}"></span>
        <span class="pc-name">${esc(game.names[side])}${you}</span>
        <span class="pc-side">${SIDE_NAME[side]}</span>
        <span class="pc-caps" aria-label="Quân đã ăn">${captured.map((p) => `<span class="mini-glyph side-${p.s}">${CTQ.PIECES[p.t].glyph[p.s]}</span>`).join('')}</span>
      </div>
      ${exRow}
      <div class="chips">${chips}</div>`;
  }

  function renderGame() {
    if (!game) return;
    const st = game.state;
    $('#screen-game').classList.toggle('is-ex', game.ex);
    const bottom = game.flip ? 'b' : 'r';
    const top = E.other(bottom);
    $('#card-top').innerHTML = playerCard(top);
    $('#card-bottom').innerHTML = playerCard(bottom);
    for (const c of $$('[data-chip]')) {
      c.addEventListener('click', () => { game.info = { p: { t: c.dataset.chip[1], s: c.dataset.chip[0] } }; renderInfo(); });
    }
    for (const c of $$('[data-hero]')) {
      c.addEventListener('click', () => { game.info = { hero: c.dataset.hero[0], side: c.dataset.hero[1] }; renderInfo(); });
    }
    for (const b of $$('[data-skill]')) {
      b.addEventListener('click', () => {
        if (game.skill && game.skill.id === b.dataset.skill) { game.skill = null; renderGame(); return; }
        startSkill(b.dataset.skill);
      });
    }
    const checkSide = !game.over && E.inCheck(st, st.turn) ? E.findKing(st, st.turn) : -1;
    const lastH = game.history[game.history.length - 1];
    const frozen = new Set(), shield = new Set();
    if (st.ex) {
      for (const s of ['r', 'b']) {
        const f = st.ex.frz[s];
        if (f && f.n > 0) frozen.add(f.sq);
        if (st.ex.shd[s] >= 0) shield.add(st.ex.shd[s]);
      }
    }
    const moves = game.skill ? skillTargets().map((sq) => ({ to: sq, kind: 'skill' })) : game.moves;
    const lastSq = lastH && lastH.u.from >= 0 ? { from: lastH.u.from, to: lastH.u.to } : null;
    gameBoard.render(st, {
      selected: game.skill && game.skill.stage === 2 ? game.skill.from : game.selected,
      moves, last: lastSq, check: checkSide, frozen, shield,
    });

    // trạng thái
    let s;
    if (game.over) {
      s = game.over.winner ? `${SIDE_NAME[game.over.winner]} thắng: ${game.over.reason}` : `Hoà: ${game.over.reason}`;
    } else if (game.skill) {
      s = `<span class="side-dot side-${st.turn}"></span> ${esc(game.skill.name)}: ${game.skill.stage === 1 ? 'chọn mục tiêu trên bàn' : 'chọn ô đích'} <button type="button" class="link-btn" id="skill-cancel">Huỷ</button>`;
    } else {
      const who = game.mode === 'local' ? game.names[st.turn] : st.turn === game.mySide ? 'Lượt của bạn' : (game.mode === 'ai' ? 'Máy đang nghĩ…' : 'Chờ đối thủ đi…');
      s = `<span class="side-dot side-${st.turn}"></span> ${SIDE_NAME[st.turn]} · ${esc(who)}`;
      if (checkSide >= 0) s += ' <strong class="check-tag">Đang bị chiếu</strong>';
    }
    $('#status').innerHTML = s;
    const sc = $('#skill-cancel');
    if (sc) sc.addEventListener('click', () => { game.skill = null; renderGame(); });
    $('#status').classList.toggle('is-over', !!game.over);

    // diễn biến
    const list = $('#move-list');
    list.innerHTML = game.history.map((h, i) => `<li class="side-${h.mover}${h.u.m.skill ? ' is-skill' : ''}"><span class="mv-n">${Math.floor(i / 2) + 1}${h.mover === 'r' ? '.' : '…'}</span> ${esc(h.note)}${h.gaveCheck ? ' <em>chiếu</em>' : ''}</li>`).join('') || '<li class="muted empty">Chưa có nước nào. Đỏ đi trước.</li>';
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
    if (!game || !game.info) {
      el.innerHTML = `<p class="muted">Chọn một quân hoặc một perk để xem chi tiết. Chấm vàng là nước đi do perk mở ra.${game && game.ex ? ' Bấm chiêu của Quân Sư để dùng thay cho lượt đi.' : ''}</p>`;
      return;
    }
    const st = game.state;
    const info = game.info;
    if (info.hero) {
      const side = info.side;
      if (info.hero === 'g') {
        const g = CTQ.generalById(st.ex.gen[side]);
        el.innerHTML = `<div class="pi-head"><span class="pi-pt">${CTQ.portraitHTML(g)}</span><div><strong>${esc(g.name)}</strong> <span class="muted">${CTQ.PIECES[g.type].name} ${SIDE_NAME[side]} · ${esc(g.era)}</span><p class="muted">${esc(g.bio)}</p></div></div>
          ${g.perks.map((id) => { const p = CTQ.perkById(id); return `<p class="pi-perk"><strong>${esc(p.name)}</strong> ${esc(p.desc)}</p>`; }).join('')}`;
      } else {
        const s = CTQ.strategistById(st.ex.strat[side]);
        el.innerHTML = `<div class="pi-head"><span class="pi-pt">${CTQ.portraitHTML(s)}</span><div><strong>${esc(s.name)}</strong> <span class="muted">Quân Sư ${SIDE_NAME[side]} · ${esc(s.era)}</span><p class="muted">${esc(s.bio)}</p></div></div>
          <p class="pi-perk"><strong>Nội tại ${esc(s.passive.name)}</strong> ${esc(s.passive.desc)}</p>
          ${s.actives.map((a) => `<p class="pi-perk"><strong>${esc(CTQ.skillName(a))}</strong> ${esc(CTQ.SKILLS[a.skill].desc)} <em>${CTQ.usesText(a)}.</em></p>`).join('')}`;
      }
      return;
    }
    const { p } = info;
    if (p.g) { game.info = { hero: 'g', side: p.s }; renderInfo(); return; }
    const set = E.pieceSet(st, p);
    const perks = Array.from(set).map((id) => CTQ.perkById(id)).filter(Boolean);
    el.innerHTML = `<div class="pi-head"><span class="mini-glyph big side-${p.s}">${CTQ.PIECES[p.t].glyph[p.s]}</span>
      <div><strong>${CTQ.PIECES[p.t].name} ${SIDE_NAME[p.s]}${p.promo ? ' (Tốt phong cấp)' : ''}</strong>
      <p class="muted">${esc(CTQ.PIECES[p.t].base)}</p></div></div>
      ${perks.map((perk) => `<p class="pi-perk"><strong>${esc(perk.name)}</strong> ${esc(perk.desc)}</p>`).join('')}`;
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

  // Phím Esc bỏ chọn quân / huỷ chiêu
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !game || dlg.open) return;
    if (game.skill) { game.skill = null; renderGame(); }
    else if (game.selected >= 0) { game.selected = -1; game.moves = []; renderGame(); }
  });

  readInviteFromURL();
  show('menu');
  Auth.init().then(() => {
    renderAccount();
    // Người mở link mời mà chưa đăng nhập: đăng nhập trước, rồi về sảnh
    if (pendingInvite && !Auth.user) requireLogin(null, `Bạn được mời vào phòng ${pendingInvite}. Đăng nhập để nhận lời mời.`);
  });
})();
