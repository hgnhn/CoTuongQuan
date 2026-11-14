(function (root) {
  const C = root.CTQ, M = C.Mastery, View = C.MasteryView = {};
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const number = (n) => Number(n).toLocaleString('vi-VN');
  let options, kind = 'g', selected = 'g:quanvu', boardMode = 'local', requestId = 0;
  View.badge = (points, size = '') => {
    const t = M.tier(points), col = (t.level - 1) % 4, row = Math.floor((t.level - 1) / 4);
    return `<span class="mastery-badge ${size}" role="img" aria-label="Thông thạo ${t.level}: ${t.name}" title="Thông thạo ${t.level} · ${t.name} · ${number(t.points)} điểm" style="--badge-x:${col * 100 / 3}%;--badge-y:${row * 100}%"></span>`;
  };
  View.mini = (user, key) => { const s = M.get(user, key); return `${View.badge(s.points, 'is-mini')}<span class="mastery-mini-label">TT ${M.tier(s.points).level}</span>`; };
  View.receipt = (receipt) => receipt ? `<div class="mastery-receipt"><h3>Thông thạo nhận được</h3>${receipt.awards.map((a) => {
    const hero = M.character(a.key), tier = M.tier(a.after.points);
    return `<div>${View.badge(a.after.points, 'is-small')}<span><strong>${esc(hero.name)}</strong><br><span class="muted">${a.levelUp ? `Lên cấp ${tier.level} · ${tier.name}!` : `Thông thạo ${tier.level}`}</span>${a.perkBonus ? `<br><span class="mastery-perk-bonus">Trong đó +${number(a.perkBonus)} từ perk/chiêu</span>` : ''}</span><strong class="mastery-gain">+${number(a.points)}</strong></div>`;
  }).join('')}${receipt.saved ? '' : '<p role="alert">Không lưu được trên trình duyệt. Điểm chỉ còn trong phiên này.</p>'}</div>` : '';
  View.init = (opts) => {
    options = opts;
    document.querySelector('#mastery-content').addEventListener('click', async (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.masteryKind) { kind = b.dataset.masteryKind; selected = M.entries().find((e) => e.kind === kind).key; View.render(); }
      if (b.dataset.masteryHero) { selected = b.dataset.masteryHero; View.render(); }
      if (b.dataset.masteryBoard) { boardMode = b.dataset.masteryBoard; View.render(); }
      if (b.id === 'mastery-equip') { const saved = M.equip(options.user(), selected); options.toast(saved ? 'Đã trang bị danh hiệu để khoe trong trận.' : 'Đã trang bị trong phiên này; trình duyệt chưa lưu được.'); View.render(); }
      if (b.id === 'mastery-copy') {
        const t = M.tier(M.get(options.user(), selected).points), hero = M.character(selected);
        const text = `${options.user()?.name || 'Kỳ thủ'} · ${hero.name}\nThông thạo ${t.level} — ${t.name} · ${number(t.points)} điểm\nCờ Tướng Quân · ${C.CONFIG.siteUrl}`;
        try { await navigator.clipboard.writeText(text); options.toast('Đã sao chép thẻ thông thạo.'); }
        catch (_) { options.toast('Không sao chép được. Bạn có thể chụp thẻ thông thạo để chia sẻ.'); }
      }
    });
  };
  View.render = () => {
    if (!options) return;
    const user = options.user(), p = M.profile(user), entry = M.character(selected), stats = M.get(user, selected), t = M.tier(stats.points);
    const rows = M.entries().filter((e) => e.kind === kind);
    const total = Object.values(p.heroes).reduce((n, s) => n + s.points, 0);
    document.querySelector('#mastery-content').innerHTML = `
      <header class="mastery-heading"><div><p class="eyebrow">DANH VỌNG LƯU TRUYỀN</p><h1>Ấn ký chiến công</h1><p>Mỗi trận một dấu ấn. Mỗi nhân vật một hành trình.</p></div><div class="mastery-total"><strong>${number(total)}</strong><span>điểm trên thiết bị · ${esc(user?.name || 'Hồ sơ khách')}</span></div></header>
      <p class="mastery-local-note">Thông thạo chỉ đổi huy hiệu và danh hiệu, không tăng sức mạnh. Tiến trình hiện lưu riêng cho hồ sơ trên trình duyệt này.</p>
      <section class="mastery-feature" aria-label="Thẻ thông thạo"><div class="mastery-seal">${View.badge(stats.points, 'is-large')}<span>THÔNG THẠO ${t.level}</span></div><div class="mastery-feature-copy"><p class="eyebrow">${kind === 'g' ? 'DANH TƯỚNG' : 'QUÂN SƯ'} · ${esc(t.name)}</p><h2>${esc(entry.name)}</h2><p class="muted">${esc(entry.era)}</p><div class="mastery-progress-label"><strong>${number(stats.points)} điểm</strong><span>${t.next ? `Còn ${number(t.remaining)} đến cấp ${t.level + 1}` : 'Đã đạt cấp cao nhất · tiếp tục leo điểm'}</span></div><progress max="1" value="${t.progress}" aria-label="Tiến độ lên cấp"></progress><div class="mastery-facts"><span><strong>${stats.matches}</strong> trận</span><span><strong>${stats.wins}</strong> thắng</span><span><strong>${stats.captures}</strong> quân ăn</span><span><strong>${stats.perkCaptures}</strong> nhờ perk/chiêu</span></div><div class="mastery-buttons"><button class="primary-btn" id="mastery-equip">${p.showcase === selected ? 'Đang khoe danh hiệu' : 'Khoe danh hiệu này'}</button><button class="ghost-btn" id="mastery-copy">Sao chép thẻ</button></div></div><div class="mastery-feature-portrait">${C.portraitHTML(entry)}</div></section>
      <section class="mastery-levels" aria-label="8 cấp thông thạo">${M.LEVELS.map((l) => `<div class="${l.level === t.level ? 'is-current' : ''}">${View.badge(l.min)}<strong>${l.level}. ${esc(l.name)}</strong><span>${number(l.min)} điểm</span></div>`).join('')}</section>
      <div class="mastery-columns"><section><div class="mastery-section-title"><h2>Bộ sưu tập của bạn</h2><div class="seg" role="tablist" aria-label="Loại nhân vật"><button class="seg-btn ${kind === 'g' ? 'is-on' : ''}" role="tab" aria-selected="${kind === 'g'}" data-mastery-kind="g">Danh Tướng</button><button class="seg-btn ${kind === 's' ? 'is-on' : ''}" role="tab" aria-selected="${kind === 's'}" data-mastery-kind="s">Quân Sư</button></div></div><div class="mastery-collection">${rows.map(({ key, hero }) => {
        const s = M.get(user, key), level = M.tier(s.points);
        return `<button class="mastery-character ${selected === key ? 'is-on' : ''}" data-mastery-hero="${key}" aria-pressed="${selected === key}">${C.portraitHTML(hero)}<span><strong>${esc(hero.name)}</strong><span class="muted">${esc(level.name)} · ${number(s.points)} điểm</span></span>${View.badge(s.points, 'is-small')}</button>`;
      }).join('')}</div></section><aside class="mastery-ranking"><p class="eyebrow">BẢNG VINH DANH</p><h2>${esc(entry.name)}</h2><div class="seg" role="tablist" aria-label="Phạm vi xếp hạng"><button role="tab" aria-selected="${boardMode === 'local'}" class="seg-btn ${boardMode === 'local' ? 'is-on' : ''}" data-mastery-board="local">Thiết bị này</button><button role="tab" aria-selected="${boardMode === 'global'}" class="seg-btn ${boardMode === 'global' ? 'is-on' : ''}" data-mastery-board="global">Toàn máy chủ</button></div><div id="mastery-board" aria-live="polite"></div></aside></div>
      <details class="mastery-scoring"><summary>Cách nhận điểm thông thạo</summary><p>Thắng trận: +120 điểm cho cả Danh Tướng và Quân Sư. Danh Tướng tự ăn quân: +20 điểm/quân. Quân Sư nhận +10 điểm cho mỗi quân địch đội bạn ăn, kể cả bằng chiêu. Ăn lan được tính từng quân; chiêu hàng không tính là ăn quân. Thêm +10 điểm cho mỗi quân bị hạ nhờ perk/chiêu của nhân vật, kể cả perk Quân Sư ban thêm và Tử Sĩ của Lê Lai. Nước ăn thông thường không có thưởng perk.</p><p>Đấu máy nhận 50% điểm. Chỉ tính bản mở rộng và chốt khi kết thúc trận; đi lại không cộng trùng. Hai người một máy không cộng điểm. Bảng xếp hạng chung chỉ tính trận trực tuyến được cả hai tài khoản xác nhận; điểm luyện máy và điểm cục bộ không được gửi lên bảng chung.</p></details>`;
    const id = ++requestId;
    if (boardMode === 'local') renderBoard(M.localBoard(selected), true);
    else if (!C.MasteryCloud.enabled()) document.querySelector('#mastery-board').innerHTML = '<div class="mastery-empty"><strong>Bảng vinh danh đang chuẩn bị</strong><p>Chưa kết nối máy chủ. Bạn vẫn có thể luyện thông thạo, khoe huy hiệu trong trận và xem xếp hạng trên thiết bị này.</p></div>';
    else {
      document.querySelector('#mastery-board').innerHTML = '<p class="mastery-empty">Đang tải bảng vinh danh…</p>';
      C.MasteryCloud.board(selected).then((r) => { if (id === requestId) renderBoard(r.rows || [], false); }).catch(() => {
        if (id === requestId) document.querySelector('#mastery-board').innerHTML = '<p class="mastery-empty">Chưa tải được bảng vinh danh. Chọn lại mục Toàn máy chủ để thử lại.</p>';
      });
    }
  };
  function renderBoard(rows, local) {
    const el = document.querySelector('#mastery-board'); if (!el) return;
    if (!rows.length) { el.innerHTML = `<div class="mastery-empty"><strong>Chưa có chiến công</strong><p>${local ? 'Hoàn thành một trận bản mở rộng để ghi tên vào bảng vinh danh trên thiết bị.' : 'Hãy là người đầu tiên ghi tên trên bảng vinh danh.'}</p></div>`; return; }
    el.innerHTML = `<table class="mastery-table"><caption>${local ? 'Các hồ sơ đã chơi trên trình duyệt này' : 'Điểm trực tuyến đã xác nhận'}</caption><thead><tr><th scope="col">Hạng</th><th scope="col">Kỳ thủ</th><th scope="col">Điểm</th></tr></thead><tbody>${rows.slice(0, 50).map((row, i) => `<tr><td>${i + 1}</td><td>${View.badge(M.stats(row).points, 'is-small')}<span>${esc(String(row.name || 'Kỳ thủ').slice(0, 20))}</span></td><td>${number(M.stats(row).points)}</td></tr>`).join('')}</tbody></table>`;
  }
})(window);
