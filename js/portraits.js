/* Cờ Tướng Quân — chân dung Danh Tướng & Quân Sư, vẽ bằng SVG theo lối khảm sơn mài.
 * Nếu nhân vật có trường `art` (đường dẫn ảnh), giao diện dùng ảnh đó thay cho chân dung vẽ.
 */
(function (root) {
  const CTQ = (root.CTQ = root.CTQ || {});

  const REGION = {
    vn: { bg: '#6b1d14', bg2: '#8c2a1c', line: '#d9b25a', name: 'Đại Việt' },
    tq: { bg: '#173a30', bg2: '#235343', line: '#c9b46a', name: 'Trung Hoa' },
    gr: { bg: '#1a2c4e', bg2: '#274070', line: '#d8c690', name: 'Hy Lạp' },
    med: { bg: '#4e2617', bg2: '#6b3820', line: '#d9a95a', name: 'Địa Trung Hải' },
    eu: { bg: '#23283a', bg2: '#323a52', line: '#c9c2a6', name: 'Châu Âu Trung Cổ' },
  };
  const GOLD = '#d9b25a', INK = '#1d1410', SKIN = '#e2b88f', SKIN_SH = '#c8956b';

  // hoa văn nền theo vùng
  function pattern(reg, id) {
    const R = REGION[reg] || REGION.vn;
    const l = R.line;
    if (reg === 'vn') {
      // vòng trống đồng + tia mặt trời
      let rays = '';
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        rays += `<path d="M50 50 L${50 + Math.cos(a - 0.08) * 46} ${50 + Math.sin(a - 0.08) * 46} L${50 + Math.cos(a + 0.08) * 46} ${50 + Math.sin(a + 0.08) * 46} Z" fill="${l}" opacity=".10"/>`;
      }
      return rays + `<circle cx="50" cy="50" r="44" fill="none" stroke="${l}" stroke-width=".6" opacity=".45"/><circle cx="50" cy="50" r="40" fill="none" stroke="${l}" stroke-width=".4" stroke-dasharray="1.5 2" opacity=".45"/>`;
    }
    if (reg === 'tq') {
      // vân mây
      let s = '';
      const cloud = (x, y, k) => `<path d="M${x} ${y} c${2 * k} ${-3 * k} ${6 * k} ${-3 * k} ${7 * k} 0 c${3 * k} ${-2 * k} ${6 * k} 0 ${5 * k} ${3 * k}" fill="none" stroke="${l}" stroke-width=".8" opacity=".35"/>`;
      s += cloud(12, 30, 1.4) + cloud(68, 22, 1.2) + cloud(74, 44, 1) + cloud(8, 52, 1);
      return s + `<circle cx="50" cy="50" r="44" fill="none" stroke="${l}" stroke-width=".6" opacity=".45"/>`;
    }
    if (reg === 'gr') {
      // vân chữ Hồi (meander) chạy vòng
      let s = '';
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * 360;
        s += `<path transform="rotate(${a} 50 50)" d="M48 7 h4 v3 h-2 v-1.5" fill="none" stroke="${l}" stroke-width=".7" opacity=".55"/>`;
      }
      return s + `<circle cx="50" cy="50" r="41" fill="none" stroke="${l}" stroke-width=".5" opacity=".4"/>`;
    }
    if (reg === 'eu') {
      return `<path d="M50 6 V94 M6 50 H94" stroke="${l}" stroke-width="5" opacity=".08"/><circle cx="50" cy="50" r="44" fill="none" stroke="${l}" stroke-width=".6" opacity=".4"/>`;
    }
    // med: sóng
    let s = '';
    for (let i = 0; i < 4; i++) s += `<path d="M6 ${24 + i * 9} q6 -4 12 0 t12 0 t12 0" fill="none" stroke="${l}" stroke-width=".7" opacity=".25"/>`;
    return s + `<circle cx="50" cy="50" r="44" fill="none" stroke="${l}" stroke-width=".6" opacity=".4"/>`;
  }

  function face(p) {
    const skin = p.face || SKIN;
    const fem = p.beard === 'none' && p.hat === 'bun';
    const eye = fem
      ? `<path d="M43 47 q2.5 -1.6 5 0 M52 47 q2.5 -1.6 5 0" stroke="${INK}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`
      : `<path d="M42.5 47.5 h5.5 M52 47.5 h5.5" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>`;
    const brow = fem
      ? `<path d="M42.5 43.6 q3 -1.4 5.8 -.2 M51.7 43.4 q2.8 -1.2 5.8 .2" stroke="${INK}" stroke-width=".8" fill="none"/>`
      : `<path d="M41.5 43.5 l7 -1.6 M58.5 43.5 l-7 -1.6" stroke="${INK}" stroke-width="1.7" stroke-linecap="round"/>`;
    const lip = fem ? `<path d="M47.5 57 q2.5 1.4 5 0" stroke="#9c3a2a" stroke-width="1.2" fill="none" stroke-linecap="round"/>` : `<path d="M47 57.2 h6" stroke="${INK}" stroke-width=".9" stroke-linecap="round" opacity=".7"/>`;
    return `<rect x="45" y="56" width="10" height="13" fill="${SKIN_SH}"/>
      <ellipse cx="50" cy="48" rx="12.5" ry="15.5" fill="${skin}"/>
      <path d="M50 49 v5 l-1.6 .8" stroke="${SKIN_SH}" stroke-width=".9" fill="none"/>
      ${brow}${eye}${lip}`;
  }

  function beard(p) {
    const c = p.beardColor || INK;
    switch (p.beard) {
      case 'long': return `<path d="M39 52 q1 13 11 27 q10 -14 11 -27 q-3 6 -11 6 q-8 0 -11 -6Z" fill="${c}"/><path d="M45 55.5 q5 -2 10 0" stroke="${c}" stroke-width="2.2" fill="none"/>`;
      case 'full': return `<path d="M38 48 q0 16 12 18 q12 -2 12 -18 q-2 7 -12 8 q-10 -1 -12 -8Z" fill="${c}"/><path d="M45 55.6 q5 -2 10 0" stroke="${c}" stroke-width="2" fill="none"/>`;
      case 'goatee': return `<path d="M47 59 q3 9 6 0Z" fill="${c}"/><path d="M44.5 55.6 q5.5 -2.4 11 0" stroke="${c}" stroke-width="1.5" fill="none"/>`;
      case 'short': return `<path d="M40 52 q2 10 10 11 q8 -1 10 -11 q-3 5 -10 5 q-7 0 -10 -5Z" fill="${c}" opacity=".9"/>`;
      case 'stubble': return `<path d="M40 52 q2 10 10 11 q8 -1 10 -11 q-3 5 -10 5 q-7 0 -10 -5Z" fill="${c}" opacity=".35"/>`;
      default: return '';
    }
  }

  function hat(p, R) {
    const g = GOLD;
    switch (p.hat) {
      case 'mu-tuong': // mũ trụ tướng Đại Việt: chóp nhọn, viền vàng, tua đỏ
        return `<path d="M36 44 q0 -18 14 -20 q14 2 14 20 Z" fill="#3a2a1a" stroke="${g}" stroke-width="1"/>
          <path d="M34 44 h32 l-2 4 h-28Z" fill="${g}"/>
          <path d="M50 24 v-6" stroke="${g}" stroke-width="1.6"/><path d="M50 18 q-6 -2 -7 -9 q5 3 7 2 q2 1 7 -2 q-1 7 -7 9Z" fill="#b3261e"/>
          <path d="M36 44 q-3 8 -1 14 M64 44 q3 8 1 14" stroke="#3a2a1a" stroke-width="3" fill="none"/>`;
      case 'corinth': // mũ Corinth có bờm ngựa đỏ
        return `<path d="M30 20 q20 -14 40 0 q-20 -6 -40 0Z" fill="#b3261e"/><path d="M28 21 q22 -18 44 0" stroke="#7a1a1a" stroke-width="2" fill="none"/>
          <path d="M35 50 q-2 -22 15 -24 q17 2 15 24 l-2 12 l-6 2 v-15 q-1 -3 -3 -3 h-8 q-2 0 -3 3 v15 l-6 -2Z" fill="#a8823c" stroke="${g}" stroke-width=".8"/>
          <path d="M49 38 v9 M51 38 v9" stroke="#6f5424" stroke-width="1.6"/>`;
      case 'khan': // khăn vấn
        return `<path d="M36.5 44 q-1 -14 13.5 -15 q14.5 1 13.5 15 q-6 -3 -13.5 -3 q-7.5 0 -13.5 3Z" fill="${p.khan || '#2d2a26'}"/>
          <path d="M37 40 q13 -5 26 0 M37.5 36 q12.5 -5 25 0" stroke="${R.line}" stroke-width=".6" fill="none" opacity=".6"/>`;
      case 'khan-xanh': // khăn xanh của Quan Vũ
        return `<path d="M36 44 q-1 -16 14 -17 q15 1 14 17 q-6 -4 -14 -4 q-8 0 -14 4Z" fill="#2f6b3a" stroke="${g}" stroke-width=".7"/>
          <path d="M62 38 q8 4 9 16 q-4 -5 -8 -7" fill="#2f6b3a"/>`;
      case 'khan-luan': // luân cân của Gia Cát Lượng
        return `<path d="M38 41 q0 -13 12 -14 q12 1 12 14 q-6 -2 -12 -2 q-6 0 -12 2Z" fill="#e8dcc0" stroke="${g}" stroke-width=".6"/>
          <path d="M43 30 v-5 h14 v5" fill="#e8dcc0" stroke="${g}" stroke-width=".6"/><path d="M62 39 q5 6 4 18 M38 39 q-5 6 -4 18" stroke="#e8dcc0" stroke-width="1.6" fill="none"/>`;
      case 'mu-quan': // mũ cánh chuồn của quan văn
        return `<path d="M37 41 q0 -15 13 -15 q13 0 13 15 q-6 -2 -13 -2 q-7 0 -13 2Z" fill="#1d1410"/>
          <path d="M43 27 q7 -5 14 0 v6 h-14Z" fill="#1d1410"/>
          <path d="M37 37 q-10 -3 -15 1 q2 3 15 2 M63 37 q10 -3 15 1 q-2 3 -15 2" fill="#1d1410" stroke="${g}" stroke-width=".5"/>`;
      case 'bun': // búi tóc + trâm của Bà Triệu
        return `<path d="M37 47 q-2 -19 13 -20 q15 1 13 20 q-3 -10 -13 -11 q-10 1 -13 11Z" fill="#1d1410"/>
          <circle cx="50" cy="24" r="6.5" fill="#1d1410"/><path d="M40 22 l22 -4" stroke="${g}" stroke-width="1.4"/><circle cx="62" cy="18" r="1.6" fill="#b3261e"/>
          <path d="M37 47 q-3 10 0 18 M63 47 q3 10 0 18" stroke="#1d1410" stroke-width="2.4" fill="none"/>`;
      case 'bald':
        return `<path d="M37 44 q-1 -10 3 -12 M63 44 q1 -10 -3 -12" stroke="#1d1410" stroke-width="2.4" fill="none"/>
          <ellipse cx="50" cy="38" rx="11" ry="7" fill="${SKIN_SH}" opacity=".25"/>`;
      case 'helm-plume': // mũ Carthage có chùm lông
        return `<path d="M36 46 q-1 -20 14 -21 q15 1 14 21 l-3 -1 q0 -14 -11 -15 q-11 1 -11 15Z" fill="#8a6a3a" stroke="${g}" stroke-width=".8"/>
          <path d="M50 25 q-2 -10 6 -15 q-1 6 4 9 q-6 0 -10 6Z" fill="#e8dcc0"/><path d="M36 41 h28" stroke="${g}" stroke-width="1.4"/>`;
      case 'pheasant': // kim quan + lông trĩ của Lữ Bố
        return `<path d="M38 40 q0 -12 12 -13 q12 1 12 13 q-6 -2 -12 -2 q-6 0 -12 2Z" fill="#1d1410"/>
          <path d="M42 30 h16 l-2 -5 h-12Z" fill="${g}"/><circle cx="50" cy="27" r="1.6" fill="#b3261e"/>
          <path d="M44 26 q-12 -12 -22 -14 M56 26 q12 -12 22 -14" stroke="#c9862b" stroke-width="2" fill="none" stroke-linecap="round"/>
          <path d="M44 26 q-12 -12 -22 -14 M56 26 q12 -12 22 -14" stroke="#1d1410" stroke-width=".6" stroke-dasharray="1.5 1.5" fill="none"/>`;
      case 'great-helm': // mũ trụ hiệp sĩ che kín mặt, có chữ thập
        return `<path d="M35 64 v-30 q0 -10 15 -10 q15 0 15 10 v30 q-15 4 -30 0Z" fill="#9aa1ad" stroke="#5d6470" stroke-width="1"/>
          <path d="M37 45 h26" stroke="#1d1410" stroke-width="2.6"/><path d="M50 30 v30 M42 52 h16" stroke="#b3261e" stroke-width="2"/>
          <path d="M40 57 h2 M44 57 h2 M54 57 h2 M58 57 h2" stroke="#1d1410" stroke-width="1.2"/>`;
      default:
        if (p.hair === 'curly') {
          let s = '';
          for (let i = 0; i < 9; i++) s += `<circle cx="${38 + i * 3}" cy="${33 - Math.sin((i / 8) * Math.PI) * 4}" r="3.6" fill="${p.hairColor || '#3a2a1a'}"/>`;
          return s + `<circle cx="37" cy="40" r="3.4" fill="${p.hairColor || '#3a2a1a'}"/><circle cx="63" cy="40" r="3.4" fill="${p.hairColor || '#3a2a1a'}"/>`;
        }
        return `<path d="M37 43 q-1 -14 13 -15 q14 1 13 15 q-4 -7 -13 -7 q-9 0 -13 7Z" fill="${p.hairColor || '#2a1d14'}"/>`;
    }
  }

  function body(p, R) {
    const robe = p.robe || '#5a3a20';
    const armor = ['mu-tuong', 'corinth', 'helm-plume', 'pheasant', 'great-helm', 'khan-xanh'].includes(p.hat);
    let s = `<path d="M8 100 q4 -26 26 -31 q8 -2 16 -2 q8 0 16 2 q22 5 26 31Z" fill="${robe}"/>`;
    if (armor) {
      // giáp: vảy cá trên vai
      s += `<path d="M14 92 q6 -18 22 -21 M86 92 q-6 -18 -22 -21" stroke="${GOLD}" stroke-width="1.2" fill="none" opacity=".8"/>`;
      for (let i = 0; i < 4; i++) s += `<path d="M${38 + i * 6} 80 q3 3 6 0" stroke="${GOLD}" stroke-width=".8" fill="none" opacity=".7"/><path d="M${41 + i * 6} 86 q3 3 6 0" stroke="${GOLD}" stroke-width=".8" fill="none" opacity=".55"/>`;
      if (p.hat === 'great-helm') s += `<path d="M50 72 v26 M40 84 h20" stroke="#e8e3d6" stroke-width="4"/>`;
    } else {
      // áo giao lĩnh
      s += `<path d="M40 69 l10 16 l10 -16" stroke="${GOLD}" stroke-width="1.4" fill="none"/><path d="M50 85 v15" stroke="${GOLD}" stroke-width=".8" opacity=".6"/>`;
    }
    if (p.fan) {
      s += `<g transform="rotate(-18 76 74)"><path d="M76 92 v-10" stroke="#5a3a20" stroke-width="2"/><path d="M76 83 q-11 -6 -9 -20 q9 -4 18 0 q2 14 -9 20Z" fill="#f2ead6" stroke="${GOLD}" stroke-width=".6"/>
        <path d="M76 83 v-20 M76 83 l-6 -17 M76 83 l6 -17" stroke="#c9b48a" stroke-width=".5"/></g>`;
    }
    return s;
  }

  let uid = 0;
  // Trả về chuỗi SVG. opts.ring: viền vàng ngoài; opts.size: thuộc tính width/height
  CTQ.portraitSVG = function (spec, opts) {
    opts = opts || {};
    const p = spec || {};
    const R = REGION[p.region] || REGION.vn;
    const id = 'pt' + (++uid);
    const size = opts.size ? ` width="${opts.size}" height="${opts.size}"` : '';
    return `<svg viewBox="0 0 100 100"${size} xmlns="http://www.w3.org/2000/svg" class="portrait" aria-hidden="true">
      <defs><clipPath id="${id}"><circle cx="50" cy="50" r="48"/></clipPath>
        <radialGradient id="${id}g" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="${R.bg2}"/><stop offset="1" stop-color="${R.bg}"/></radialGradient></defs>
      <g clip-path="url(#${id})">
        <rect width="100" height="100" fill="url(#${id}g)"/>
        ${pattern(p.region, id)}
        ${body(p, R)}
        ${p.hat === 'great-helm' ? '' : face(p) + beard(p)}
        ${hat(p, R)}
      </g>
      ${opts.ring === false ? '' : `<circle cx="50" cy="50" r="48" fill="none" stroke="${GOLD}" stroke-width="2.4"/><circle cx="50" cy="50" r="45" fill="none" stroke="${GOLD}" stroke-width=".6" opacity=".7"/>`}
    </svg>`;
  };

  // HTML chân dung: ảnh riêng nếu có, không thì chân dung vẽ
  CTQ.portraitHTML = function (person, opts) {
    if (person && person.art) return `<img class="portrait portrait-img" src="${person.art}" alt="" loading="lazy">`;
    return CTQ.portraitSVG(person && person.portrait, opts);
  };
  CTQ.REGION_NAMES = Object.fromEntries(Object.entries(REGION).map(([k, v]) => [k, v.name]));
})(typeof window !== 'undefined' ? window : globalThis);
