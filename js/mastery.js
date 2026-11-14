/* Thông thạo là cosmetic: không thay đổi luật, perk hay sức mạnh quân. Dùng chung với máy chủ. */
(function (root) {
  'use strict';
  const C = root.CTQ = root.CTQ || {};
  const M = C.Mastery = {};
  const KEY = 'ctq.mastery.v1';
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const integer = (n) => Number.isSafeInteger(n) && n >= 0 ? Math.min(n, 1000000000) : 0;
  M.LEVELS = [
    { level: 1, min: 0, name: 'Tân Binh' }, { level: 2, min: 300, name: 'Nhập Môn' },
    { level: 3, min: 900, name: 'Thuần Thục' }, { level: 4, min: 1800, name: 'Tinh Anh' },
    { level: 5, min: 3200, name: 'Lão Luyện' }, { level: 6, min: 5200, name: 'Đại Sư' },
    { level: 7, min: 8000, name: 'Tông Sư' }, { level: 8, min: 12000, name: 'Huyền Thoại' },
  ];
  M.SCORING = { win: 120, generalCapture: 20, teamCapture: 10 };
  M.character = (key) => {
    if (typeof key !== 'string') return null;
    const [kind, id, extra] = key.split(':');
    if (extra !== undefined) return null;
    return kind === 'g' ? C.generalById(id) : kind === 's' ? C.strategistById(id) : null;
  };
  M.entries = () => C.GENERALS.map((g) => ({ key: 'g:' + g.id, kind: 'g', hero: g }))
    .concat(C.STRATEGISTS.map((s) => ({ key: 's:' + s.id, kind: 's', hero: s })));
  M.stats = (v) => {
    v = v && typeof v === 'object' ? v : {};
    return { points: integer(v.points), wins: integer(v.wins), captures: integer(v.captures), matches: integer(v.matches) };
  };
  M.tier = (points) => {
    points = integer(points);
    const current = M.LEVELS.filter((t) => points >= t.min).pop(), next = M.LEVELS[current.level];
    return { ...current, points, next: next ? next.min : null,
      remaining: next ? next.min - points : 0,
      progress: next ? (points - current.min) / (next.min - current.min) : 1 };
  };
  M.calculate = ({ mode, ex, side, lineups, history, result }) => {
    if (!ex || !['ai', 'online'].includes(mode) || !['r', 'b'].includes(side) || !result) return null;
    const lo = lineups && lineups[side];
    if (!lo || !C.generalById(lo.general && lo.general.id) || !C.strategistById(lo.strategist)) return null;
    let generalCaptures = 0, teamCaptures = 0;
    for (const h of history || []) {
      const u = h.u;
      if (!u || u.side !== side) continue;
      const victims = [u.captured].concat(u.extra || []).filter((p) => p && p.s !== side && p.t !== 'K').length;
      teamCaptures += victims;
      if (!u.m.skill && u.fromPiece && u.fromPiece.g === lo.general.id) generalCaptures += victims;
    }
    const won = result.winner === side, scale = mode === 'ai' ? 0.5 : 1;
    return [
      { key: 'g:' + lo.general.id, points: Math.floor((generalCaptures * M.SCORING.generalCapture + (won ? M.SCORING.win : 0)) * scale), captures: generalCaptures, wins: +won, matches: 1 },
      { key: 's:' + lo.strategist, points: Math.floor((teamCaptures * M.SCORING.teamCapture + (won ? M.SCORING.win : 0)) * scale), captures: teamCaptures, wins: +won, matches: 1 },
    ];
  };
  M.addStats = (a, b) => {
    a = M.stats(a); b = M.stats(b);
    return Object.fromEntries(Object.keys(a).map((k) => [k, integer(a[k] + b[k])]));
  };
  let database = null;
  function load() {
    if (database) return database;
    database = { profiles: Object.create(null) };
    try {
      const value = JSON.parse(root.localStorage.getItem(KEY) || 'null');
      if (value && value.profiles && typeof value.profiles === 'object') {
        for (const [uid, p] of Object.entries(value.profiles)) {
          if (!p || typeof p !== 'object') continue;
          const heroes = Object.create(null);
          for (const [key, stats] of Object.entries(p.heroes || {})) if (M.character(key)) heroes[key] = M.stats(stats);
          database.profiles[uid] = { name: String(p.name || 'Kỳ thủ').slice(0, 20), heroes,
            showcase: M.character(p.showcase) ? p.showcase : null,
            receipts: Array.isArray(p.receipts) ? p.receipts.filter((id) => typeof id === 'string').slice(-1000) : [] };
        }
      }
    } catch (_) { /* Dữ liệu hỏng hoặc trình duyệt chặn lưu trữ: vẫn dùng được trong phiên. */ }
    return database;
  }
  function save() { try { root.localStorage.setItem(KEY, JSON.stringify(load())); return true; } catch (_) { return false; } }
  M.identity = (user) => user && typeof user.uid === 'string' ? user.uid : 'guest';
  M.profile = (user) => {
    const db = load(), uid = M.identity(user);
    if (!own(db.profiles, uid)) db.profiles[uid] = { name: 'Khách', heroes: Object.create(null), showcase: null, receipts: [] };
    const p = db.profiles[uid];
    if (user && user.name) p.name = String(user.name).slice(0, 20);
    return p;
  };
  M.get = (user, key) => M.stats(M.profile(user).heroes[key]);
  M.award = (match) => {
    const deltas = M.calculate(match);
    if (!deltas || typeof match.id !== 'string') return null;
    const p = M.profile(match.user);
    if (p.receipts.includes(match.id)) return null;
    const awards = deltas.map((delta) => {
      const before = M.get(match.user, delta.key), after = M.addStats(before, delta);
      p.heroes[delta.key] = after;
      return { ...delta, before, after, levelUp: M.tier(after.points).level > M.tier(before.points).level };
    });
    p.receipts = p.receipts.concat(match.id).slice(-1000);
    if (!p.showcase) p.showcase = awards[0].key;
    return { awards, saved: save() };
  };
  M.equip = (user, key) => { if (!M.character(key)) return false; M.profile(user).showcase = key; return save(); };
  M.localBoard = (key) => {
    if (!M.character(key)) return [];
    return Object.entries(load().profiles).filter(([, p]) => p.heroes[key] && p.heroes[key].points > 0)
      .map(([uid, p]) => ({ uid, name: p.name, ...M.stats(p.heroes[key]) }))
      .sort((a, b) => b.points - a.points || b.wins - a.wins || a.uid.localeCompare(b.uid)).slice(0, 50);
  };
  M.snapshot = (user, lo) => {
    const p = M.profile(user), keys = lo ? ['g:' + lo.general.id, 's:' + lo.strategist] : [];
    return { heroes: Object.fromEntries(keys.filter((k) => M.character(k)).map((k) => [k, M.get(user, k)])),
      showcase: p.showcase ? { key: p.showcase, ...M.get(user, p.showcase) } : null };
  };
  M.sanitizeSnapshot = (value) => {
    const heroes = {};
    if (value && value.heroes && typeof value.heroes === 'object') {
      for (const [key, stats] of Object.entries(value.heroes).slice(0, 20)) if (M.character(key)) heroes[key] = M.stats(stats);
    }
    const showcase = value && value.showcase;
    return { heroes, showcase: showcase && M.character(showcase.key) ? { key: showcase.key, ...M.stats(showcase) } : null };
  };
  M.newId = () => root.crypto && root.crypto.randomUUID ? root.crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
})(typeof window !== 'undefined' ? window : globalThis);
