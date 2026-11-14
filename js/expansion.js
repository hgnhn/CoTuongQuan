/* Cờ Tướng Quân — Bản mở rộng: Danh Tướng & Quân Sư.
 *
 * Danh Tướng: thay cho đúng 1 quân của một loại; mang 2–3 perk riêng (thay cho perk của loại quân).
 * Quân Sư: không đại diện quân nào; cho nội tại toàn bàn và chiêu chủ động.
 * Dùng chiêu chủ động = mất lượt đi đó. Chiêu có thể dùng 1 lần, hoặc dùng lại sau thời gian hồi.
 * Mỗi đội hình có đúng 1 Danh Tướng và 1 Quân Sư.
 */
(function (root) {
  const CTQ = (root.CTQ = root.CTQ || {});

  // Perk riêng của Danh Tướng (perk thường dùng lại id trong data.js)
  CTQ.GPERKS = {
    g_xuatcung: { name: 'Xuất Cung Thân Chinh', desc: 'Đi 1 ô ngang/dọc/chéo trong cung và được bước ra thêm 1 hàng phía trước cung.' },
    g_cuoivoi: { name: 'Cưỡi Voi Xung Trận', desc: 'Được đi thẳng 1–2 ô theo hàng ngang/dọc (bị chặn bởi quân trên đường), ăn được quân đầu tiên gặp.' },
    g_thuai: { name: 'Thủ Ải Thermopylae', desc: 'Pháo địch không thể chiếu hay ăn quân này.' },
    g_thethan: { name: 'Liều Mình Cứu Chúa', desc: 'Khi Tướng mình đang bị chiếu, đổi chỗ với Tướng nếu đứng sát bên (Tướng vẫn phải ở trong cung).' },
    g_hosi: { name: 'Hổ Si', desc: 'Đi 1 ô theo mọi hướng, được ra khỏi cung nhưng phải ở sân nhà.' },
    g_vuotalps: { name: 'Vượt Alps', desc: 'Lướt chéo tối đa 3 ô (bị chặn bởi quân trên đường), ăn được quân đầu tiên gặp.' },
    g_vosong: { name: 'Vô Song', desc: 'Đi và ăn thêm 1 ô chéo theo mọi hướng.' },
    g_gotchan: { name: 'Gót Chân Achilles', desc: 'Xe không ăn được quân này.' },
    g_thapchu: { name: 'Thập Tự Kỵ', desc: 'Đi và ăn thêm 1 ô chéo theo mọi hướng.' },
    g_lansong: { name: 'Lặn Sông', desc: 'Đứng ở 2 hàng sát sông thì không quân nào ăn được.' },
    g_khoinghia: { name: 'Khởi Nghĩa', desc: 'Đi và ăn 1 ô theo mọi hướng (ngang, dọc, chéo, kể cả lùi) ở bất kỳ đâu trên bàn.' },
    g_tamdiep: { name: 'Lui Về Tam Điệp', desc: 'Tốt đã qua sông được lùi 1 ô.' },
  };

  // region: dùng để chọn màu chân dung. portrait: tham số vẽ chân dung (portraits.js)
  // art (tuỳ chọn): đường dẫn ảnh riêng, ví dụ 'assets/generals/quan-vu.png', thay cho chân dung vẽ.
  CTQ.GENERALS = [
    { id: 'tranhungdao', name: 'Trần Hưng Đạo', short: 'Hưng Đạo', type: 'K', era: 'Đại Việt, thế kỷ 13',
      bio: 'Quốc công tiết chế, ba lần đánh bại quân Nguyên Mông.',
      perks: ['g_xuatcung', 'k_khinhcong', 'k_batquai'],
      portrait: { region: 'vn', hat: 'mu-tuong', beard: 'long', robe: '#8c1c16' } },
    { id: 'leonidas', name: 'Leonidas', short: 'Leonidas', type: 'K', era: 'Sparta, Hy Lạp cổ đại',
      bio: 'Vua Sparta giữ ải Thermopylae trước đại quân Ba Tư.',
      perks: ['g_thuai', 'k_khinhcong'],
      portrait: { region: 'gr', hat: 'corinth', beard: 'full', robe: '#7a1a1a' } },

    { id: 'lelai', name: 'Lê Lai', short: 'Lê Lai', type: 'A', era: 'Đại Việt, thế kỷ 15',
      bio: 'Mặc áo bào thay Lê Lợi, hy sinh để cứu chủ tướng.',
      perks: ['g_thethan', 'a_tusi', 'a_canve'],
      portrait: { region: 'vn', hat: 'khan', beard: 'short', robe: '#5a3a20' } },
    { id: 'hachu', name: 'Hứa Chử', short: 'Hứa Chử', type: 'A', era: 'Tam Quốc',
      bio: 'Hổ Si, cận vệ trung thành của Tào Tháo.',
      perks: ['g_hosi', 'a_kimcuong'],
      portrait: { region: 'tq', hat: 'bald', beard: 'stubble', robe: '#2f4a3a' } },

    { id: 'batrieu', name: 'Bà Triệu', short: 'Bà Triệu', type: 'E', era: 'Giao Châu, thế kỷ 3',
      bio: 'Nữ tướng cưỡi voi đánh quân Đông Ngô.',
      perks: ['e_vuotgiang', 'g_cuoivoi'],
      portrait: { region: 'vn', hat: 'bun', beard: 'none', robe: '#c9a24a' } },
    { id: 'hannibal', name: 'Hannibal', short: 'Hannibal', type: 'E', era: 'Carthage, cổ đại',
      bio: 'Dẫn đoàn voi chiến vượt dãy Alps tiến đánh La Mã.',
      perks: ['e_vuotgiang', 'g_vuotalps'],
      portrait: { region: 'med', hat: 'helm-plume', beard: 'full', robe: '#4a2a5a' } },

    { id: 'lubo', name: 'Lữ Bố', short: 'Lữ Bố', type: 'R', era: 'Tam Quốc',
      bio: 'Đệ nhất mãnh tướng với Phương Thiên Hoạ Kích.',
      perks: ['r_thietgiap', 'r_chienxa'],
      portrait: { region: 'tq', hat: 'pheasant', beard: 'none', robe: '#7a1a1a' } },
    { id: 'achilles', name: 'Achilles', short: 'Achilles', type: 'R', era: 'Hy Lạp, thành Troy',
      bio: 'Chiến binh bất khả xâm phạm, chỉ có gót chân là điểm yếu.',
      perks: ['g_gotchan', 'r_phatran'],
      portrait: { region: 'gr', hat: 'corinth', beard: 'none', robe: '#1f3a6b' } },

    { id: 'honguyentrung', name: 'Hồ Nguyên Trừng', short: 'Nguyên Trừng', type: 'C', era: 'Đại Việt, thế kỷ 15',
      bio: 'Người chế tạo súng Thần Cơ, được nhà Minh tôn làm thần hoả khí.',
      perks: ['c_songngoi', 'c_canchien'],
      portrait: { region: 'vn', hat: 'mu-quan', beard: 'goatee', robe: '#2b3f5c' } },
    { id: 'archimedes', name: 'Archimedes', short: 'Archimedes', type: 'C', era: 'Syracuse, Hy Lạp',
      bio: 'Chế tạo máy bắn đá và gương đốt bảo vệ thành Syracuse.',
      perks: ['c_phaocheo', 'c_hoacong'],
      portrait: { region: 'gr', hat: 'none', beard: 'full', robe: '#e8dcc0', hair: 'curly' } },

    { id: 'quanvu', name: 'Quan Vũ', short: 'Quan Vũ', type: 'H', era: 'Tam Quốc',
      bio: 'Cưỡi Xích Thố, cầm Thanh Long Yển Nguyệt Đao.',
      perks: ['h_thienly', 'h_hanma'],
      portrait: { region: 'tq', hat: 'khan-xanh', beard: 'long', robe: '#2f6b3a', face: '#b8432f' } },
    { id: 'richard', name: 'Richard Tim Sư Tử', short: 'Richard', type: 'H', era: 'Anh, Trung Cổ',
      bio: 'Vua hiệp sĩ dẫn đầu cuộc Thập Tự Chinh thứ ba.',
      perks: ['h_otruy', 'g_thapchu'],
      portrait: { region: 'eu', hat: 'great-helm', beard: 'none', robe: '#b3261e' } },

    { id: 'yetkieu', name: 'Yết Kiêu', short: 'Yết Kiêu', type: 'P', era: 'Đại Việt, thế kỷ 13',
      bio: 'Gia tướng của Trần Hưng Đạo, lặn sông đục thuyền giặc.',
      perks: ['p_linhhoat', 'g_lansong', 'p_xungphong'],
      portrait: { region: 'vn', hat: 'khan', beard: 'none', robe: '#24485c' } },
    { id: 'spartacus', name: 'Spartacus', short: 'Spartacus', type: 'P', era: 'La Mã cổ đại',
      bio: 'Đấu sĩ nô lệ lãnh đạo cuộc khởi nghĩa lớn nhất chống La Mã.',
      perks: ['g_khoinghia', 'p_xungphong'],
      portrait: { region: 'med', hat: 'none', beard: 'stubble', robe: '#6b4a2a', hair: 'short' } },
  ];

  // Chiêu chủ động. target: cách chọn mục tiêu trên bàn
  CTQ.SKILLS = {
    phongtoa: { name: 'Phong Toả', desc: 'Một quân địch (trừ Tướng) không được di chuyển trong 2 lượt của địch.' },
    hothe: { name: 'Hộ Thể', desc: 'Một quân mình (trừ Tướng) không thể bị ăn trong lượt kế tiếp của địch.' },
    hoacong: { name: 'Hoả Công', desc: 'Tiêu diệt 1 Tốt địch bất kỳ trên bàn.' },
    chieubinh: { name: 'Chiêu Binh', desc: 'Đặt 1 Tốt mới vào một ô Tốt ban đầu còn trống của bạn (khi còn ít hơn 5 Tốt).' },
    tamcong: { name: 'Tâm Công', desc: 'Chiêu hàng 1 Tốt địch đang đứng bên sân bạn: Tốt đó thành quân của bạn.' },
    thubinh: { name: 'Thu Binh', desc: 'Rút 1 quân mình (trừ Tướng) về một ô trống trên hàng cuối của bạn.' },
    dieubinh: { name: 'Điều Binh', desc: 'Đổi chỗ 2 quân mình đứng sát nhau (trừ Tướng).' },
    salamis: { name: 'Hải Chiến Salamis', desc: 'Tiêu diệt mọi Tốt địch đang đứng bên sân bạn.' },
  };

  // Quân Sư: passive.grants = perk thêm cho loại quân; passive.flag = luật đặc biệt toàn bàn
  // actives: { skill, uses } (dùng giới hạn số lần) hoặc { skill, cd } (hồi chiêu tính theo lượt của bạn)
  CTQ.STRATEGISTS = [
    { id: 'giacatluong', name: 'Gia Cát Lượng', era: 'Tam Quốc', bio: 'Ngoạ Long tiên sinh, quân sư Thục Hán.',
      passive: { name: 'Bát Trận Đồ', desc: 'Mã địch luôn bị cản chân và không nhảy dài được, kể cả khi có perk.', flag: 'battran' },
      actives: [{ skill: 'phongtoa', uses: 2, name: 'Không Thành Kế' }, { skill: 'hoacong', cd: 4, name: 'Mượn Gió Đông' }],
      portrait: { region: 'tq', hat: 'khan-luan', beard: 'goatee', robe: '#e8dcc0', fan: true } },
    { id: 'tumay', name: 'Tư Mã Ý', era: 'Tam Quốc', bio: 'Đại đô đốc nhà Nguỵ, kiên nhẫn chờ thời.',
      passive: { name: 'Kiên Thủ', desc: 'Quân của bạn đứng trong cung không bị Pháo và Mã ăn.', flag: 'kienthu' },
      actives: [{ skill: 'hothe', cd: 3 }, { skill: 'thubinh', cd: 4 }],
      portrait: { region: 'tq', hat: 'mu-quan', beard: 'long', robe: '#2b2b4a' } },
    { id: 'nguyentrai', name: 'Nguyễn Trãi', era: 'Đại Việt, thế kỷ 15', bio: 'Tác giả Bình Ngô đại cáo, mưu sĩ của Lê Lợi.',
      passive: { name: 'Bình Ngô Sách', desc: 'Mọi Tốt của bạn có thêm perk Liên Hoàn (Tốt đứng sát ngang nhau thì Xe, Mã, Pháo không ăn được).', grants: { P: ['p_lienhoan'] } },
      actives: [{ skill: 'tamcong', uses: 1, name: 'Tâm Công' }, { skill: 'chieubinh', cd: 12 }],
      portrait: { region: 'vn', hat: 'mu-quan', beard: 'long', robe: '#24485c' } },
    { id: 'ngothinham', name: 'Ngô Thì Nhậm', era: 'Tây Sơn, thế kỷ 18', bio: 'Hiến kế lui về Tam Điệp trước khi đại phá quân Thanh.',
      passive: { name: 'Lui Về Tam Điệp', desc: 'Tốt của bạn được tiến 2 ô khi chưa qua sông (Xung Phong) và được lùi 1 ô sau khi qua sông.', grants: { P: ['g_tamdiep', 'p_xungphong'] } },
      actives: [{ skill: 'dieubinh', cd: 3 }, { skill: 'thubinh', cd: 6 }],
      portrait: { region: 'vn', hat: 'khan', beard: 'goatee', robe: '#5a3a20' } },
    { id: 'tontu', name: 'Tôn Tử', era: 'Xuân Thu', bio: 'Tác giả Binh pháp Tôn Tử.',
      passive: { name: 'Binh Quý Thần Tốc', desc: 'Mọi chiêu có hồi chiêu của bạn hồi nhanh hơn 1 lượt.', flag: 'thantoc' },
      actives: [{ skill: 'phongtoa', cd: 10 }, { skill: 'hothe', cd: 5 }],
      portrait: { region: 'tq', hat: 'khan-luan', beard: 'long', robe: '#5a4a2a' } },
    { id: 'themistocles', name: 'Themistocles', era: 'Athens, Hy Lạp cổ đại', bio: 'Xây hạm đội Athens, đánh tan Ba Tư ở Salamis.',
      passive: { name: 'Bức Tường Gỗ', desc: 'Mọi Xe của bạn có thêm perk Thiết Giáp.', grants: { R: ['r_thietgiap'] } },
      actives: [{ skill: 'salamis', uses: 1 }, { skill: 'dieubinh', cd: 4 }],
      portrait: { region: 'gr', hat: 'none', beard: 'full', robe: '#1f3a6b', hair: 'curly' } },
  ];

  CTQ.generalById = (id) => CTQ.GENERALS.find((g) => g.id === id) || null;
  CTQ.strategistById = (id) => CTQ.STRATEGISTS.find((s) => s.id === id) || null;
  CTQ.skillName = (a) => a.name || CTQ.SKILLS[a.skill].name;

  // Ô xuất phát của từng loại quân theo góc nhìn người cầm quân (trái → phải)
  CTQ.slotSquares = function (type, side) {
    const BACK = ['R', 'H', 'E', 'A', 'K', 'A', 'E', 'H', 'R'];
    const back = side === 'r' ? 9 : 0, cannon = side === 'r' ? 7 : 2, pawn = side === 'r' ? 6 : 3;
    let sq = [];
    if (type === 'C') sq = [1, 7].map((c) => cannon * 9 + c);
    else if (type === 'P') sq = [0, 2, 4, 6, 8].map((c) => pawn * 9 + c);
    else BACK.forEach((t, c) => { if (t === type) sq.push(back * 9 + c); });
    sq.sort((a, b) => (a % 9) - (b % 9));
    if (side === 'b') sq.reverse();
    return sq;
  };
  CTQ.defaultSlot = (type) => ({ K: 0, A: 1, E: 1, R: 1, C: 1, H: 1, P: 2 }[type] || 0);

  CTQ.defaultExLoadout = function () {
    return { perks: CTQ.defaultLoadout(), general: { id: 'quanvu', slot: 1 }, strategist: 'giacatluong' };
  };
  CTQ.randomExLoadout = function (rng) {
    rng = rng || Math.random;
    const g = CTQ.GENERALS[Math.floor(rng() * CTQ.GENERALS.length)];
    const st = CTQ.STRATEGISTS[Math.floor(rng() * CTQ.STRATEGISTS.length)];
    const n = CTQ.slotSquares(g.type, 'r').length;
    return { perks: CTQ.randomLoadout(rng), general: { id: g.id, slot: Math.floor(rng() * n) }, strategist: st.id };
  };
  CTQ.sanitizeExLoadout = function (l) {
    const d = CTQ.defaultExLoadout();
    if (!l || typeof l !== 'object') return d;
    const out = { perks: CTQ.sanitizeLoadout(l.perks), general: d.general, strategist: d.strategist };
    const g = l.general && CTQ.generalById(l.general.id);
    if (g) {
      const n = CTQ.slotSquares(g.type, 'r').length;
      const slot = Number.isInteger(l.general.slot) && l.general.slot >= 0 && l.general.slot < n ? l.general.slot : CTQ.defaultSlot(g.type) % n;
      out.general = { id: g.id, slot };
    }
    if (CTQ.strategistById(l.strategist)) out.strategist = l.strategist;
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
