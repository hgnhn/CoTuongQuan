/* Cờ Tướng Quân — dữ liệu quân cờ và perk.
 * Mỗi loại quân có 3–4 perk; người chơi trang bị đúng 1 perk cho mỗi loại quân.
 * Hiệu ứng của perk được cài trong engine.js (theo id).
 */
(function (root) {
  const CTQ = (root.CTQ = root.CTQ || {});

  // Thứ tự hiển thị trong sảnh
  CTQ.PIECE_ORDER = ['K', 'A', 'E', 'R', 'C', 'H', 'P'];

  CTQ.PIECES = {
    K: { name: 'Tướng', glyph: { r: '帥', b: '將' }, value: 10000,
         base: 'Đi 1 ô ngang/dọc, chỉ trong cung. Hai Tướng không được đối mặt trên cùng một cột trống.' },
    A: { name: 'Sĩ', glyph: { r: '仕', b: '士' }, value: 200,
         base: 'Đi chéo 1 ô, chỉ trong cung.' },
    E: { name: 'Tượng', glyph: { r: '相', b: '象' }, value: 200,
         base: 'Đi chéo 2 ô, không qua sông, bị cản nếu ô giữa có quân (mắt tượng).' },
    R: { name: 'Xe', glyph: { r: '俥', b: '車' }, value: 900,
         base: 'Đi ngang/dọc bao nhiêu ô cũng được, không nhảy qua quân.' },
    C: { name: 'Pháo', glyph: { r: '炮', b: '砲' }, value: 450,
         base: 'Đi như Xe; khi ăn phải nhảy qua đúng 1 quân (ngòi).' },
    H: { name: 'Mã', glyph: { r: '傌', b: '馬' }, value: 400,
         base: 'Đi hình chữ L (1 thẳng + 1 chéo), bị cản chân nếu ô thẳng kề bên có quân.' },
    P: { name: 'Tốt', glyph: { r: '兵', b: '卒' }, value: 100,
         base: 'Tiến 1 ô. Sau khi qua sông được đi ngang, không bao giờ được lùi.' },
  };

  CTQ.PERKS = {
    K: [
      { id: 'k_batquai', name: 'Bát Quái Bộ',
        desc: 'Tướng được đi chéo 1 ô, miễn là vẫn ở trong cung.' },
      { id: 'k_khinhcong', name: 'Khinh Công',
        desc: 'Tướng được lướt thẳng tới 2 ô trong cung, miễn là ô giữa trống.' },
      { id: 'k_ngugia', name: 'Ngự Giá Thân Chinh',
        desc: 'Cung rộng thành 4 × 5 ô. Luật lộ mặt tướng chỉ ràng buộc Tướng địch: Tướng bạn nhìn thẳng sẽ chiếu được Tướng địch.' },
      { id: 'k_hoanvi', name: 'Kim Thiền Thoát Xác',
        desc: 'Hai lần mỗi trận: Tướng đổi chỗ với một quân mình đứng sát bên (cả chéo), miễn ô mới vẫn trong cung.' },
    ],
    A: [
      { id: 'a_canve', name: 'Cận Vệ',
        desc: 'Sĩ được đi thêm 1 ô ngang/dọc trong cung.' },
      { id: 'a_tuantra', name: 'Tuần Tra',
        desc: 'Sĩ được rời cung, đi chéo 1 ô ở bất kỳ đâu trên bàn, kể cả qua sông.' },
      { id: 'a_kimcuong', name: 'Kim Cương',
        desc: 'Sĩ miễn nhiễm với đòn ăn của Pháo, Mã và Tốt.' },
      { id: 'a_tusi', name: 'Tử Sĩ',
        desc: 'Quân nào ăn Sĩ cũng bị tiêu diệt theo. Tướng địch vì vậy không thể ăn Sĩ.' },
    ],
    E: [
      { id: 'e_vuotgiang', name: 'Vượt Giang',
        desc: 'Tượng được qua sông. Khi đứng bên sân địch, Tượng không bị cản mắt.' },
      { id: 'e_voichien', name: 'Voi Chiến',
        desc: 'Tượng không còn bị cản mắt.' },
      { id: 'e_tieubo', name: 'Tiểu Bộ',
        desc: 'Tượng được đi thêm chéo 1 ô tới ô trống bên phần sân nhà.' },
    ],
    R: [
      { id: 'r_thietgiap', name: 'Thiết Giáp',
        desc: 'Xe miễn nhiễm với đòn ăn của Pháo.' },
      { id: 'r_chienxa', name: 'Chiến Xa',
        desc: 'Xe được đi thêm 1 ô chéo. Chéo tiến được ăn quân, chéo lùi chỉ tới ô trống.' },
      { id: 'r_phaoxa', name: 'Pháo Xa',
        desc: 'Theo hàng dọc, Xe được ăn quân kiểu Pháo nếu ngòi là quân mình.' },
    ],
    C: [
      { id: 'c_songngoi', name: 'Song Ngòi',
        desc: 'Pháo được ăn quân khi nhảy qua 1 hoặc 2 ngòi (qua 2 ngòi thì không chiếu được Tướng).' },
      { id: 'c_canchien', name: 'Cận Chiến',
        desc: 'Pháo được ăn thẳng quân địch đứng sát bên (ngang/dọc), không cần ngòi.' },
      { id: 'c_phaobay', name: 'Pháo Bay',
        desc: 'Pháo được nhảy qua 1 ngòi để đáp xuống ô trống phía sau.' },
    ],
    H: [
      { id: 'h_thienly', name: 'Thiên Lý Mã',
        desc: 'Mã không còn bị cản chân.' },
      { id: 'h_chienma', name: 'Chiến Mã',
        desc: 'Mã được đi thêm 1 ô thẳng. Tiến thẳng được ăn quân, các hướng khác chỉ tới ô trống.' },
      { id: 'h_otruy', name: 'Ô Truy',
        desc: 'Mã được nhảy dài theo chiều dọc: 3 ô dọc rồi 1 ô ngang, bị cản nếu 2 ô dọc đầu tiên có quân.' },
    ],
    P: [
      { id: 'p_linhhoat', name: 'Linh Hoạt',
        desc: 'Khi chưa qua sông, Tốt vẫn được đi ngang tới ô trống.' },
      { id: 'p_xungphong', name: 'Xung Phong',
        desc: 'Khi chưa qua sông, Tốt được tiến 2 ô nếu ô giữa trống.' },
      { id: 'p_lienhoan', name: 'Liên Hoàn',
        desc: 'Tốt có Tốt mình đứng sát ngang bên cạnh thì Xe, Mã, Pháo không ăn được.' },
      { id: 'p_thangcap', name: 'Thăng Cấp',
        desc: 'Tốt tiến tới 2 hàng cuối của địch sẽ được phong thành Xe.' },
    ],
  };

  CTQ.perkById = function (id) {
    for (const t of CTQ.PIECE_ORDER) {
      const p = CTQ.PERKS[t].find((x) => x.id === id);
      if (p) return p;
    }
    return null;
  };

  CTQ.defaultLoadout = function () {
    const l = {};
    for (const t of CTQ.PIECE_ORDER) l[t] = CTQ.PERKS[t][0].id;
    return l;
  };

  CTQ.randomLoadout = function (rng) {
    rng = rng || Math.random;
    const l = {};
    for (const t of CTQ.PIECE_ORDER) {
      const list = CTQ.PERKS[t];
      l[t] = list[Math.floor(rng() * list.length)].id;
    }
    return l;
  };

  // Đảm bảo loadout hợp lệ (mỗi loại quân đúng 1 perk thuộc loại đó)
  CTQ.sanitizeLoadout = function (l) {
    const out = CTQ.defaultLoadout();
    if (l && typeof l === 'object') {
      for (const t of CTQ.PIECE_ORDER) {
        if (CTQ.PERKS[t].some((p) => p.id === l[t])) out[t] = l[t];
      }
    }
    return out;
  };
})(typeof window !== 'undefined' ? window : globalThis);
