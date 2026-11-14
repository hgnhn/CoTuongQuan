const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
for (const file of ['data', 'expansion', 'engine', 'mastery']) require('./shared/' + file + '.js');
const C = globalThis.CTQ, { validateReplay } = require('./mastery-core.cjs');
initializeApp();
const db = getFirestore(), options = { region: 'asia-southeast1', timeoutSeconds: 60, maxInstances: 5, cors: true };
function uid(request) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Cần đăng nhập Google để lên bảng chung.');
  return request.auth.uid;
}
function validUid(value) { return typeof value === 'string' && value.length > 0 && value.length <= 128 && !value.includes('/'); }
exports.openMasteryMatch = onCall(options, async (request) => {
  const actor = uid(request), data = request.data || {}, players = data.players;
  if (!players || !['r', 'b'].every((s) => validUid(players[s]?.uid)) || players.r.uid === players.b.uid || !['r', 'b'].some((s) => players[s].uid === actor)) throw new HttpsError('invalid-argument', 'Hai tài khoản khác nhau phải tham gia trận.');
  if (!data.lineups?.r || !data.lineups?.b) throw new HttpsError('invalid-argument', 'Thiếu đội hình.');
  const lineups = { r: C.sanitizeExLoadout(data.lineups.r), b: C.sanitizeExLoadout(data.lineups.b) };
  const record = { players: Object.fromEntries(['r', 'b'].map((s) => [s, { uid: players[s].uid, name: String(players[s].name || 'Kỳ thủ').slice(0, 20) }])),
    lineups, confirmations: {}, awarded: false, createdAt: FieldValue.serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + 2 * 3600000) };
  const ref = await db.collection('masteryMatches').add(record);
  return { id: ref.id };
});
exports.submitMasteryMatch = onCall(options, async (request) => {
  const actor = uid(request), data = request.data || {};
  if (typeof data.matchId !== 'string' || !/^[A-Za-z0-9]{1,100}$/.test(data.matchId)) throw new HttpsError('invalid-argument', 'Mã trận không hợp lệ.');
  const ref = db.collection('masteryMatches').doc(data.matchId), initial = await ref.get();
  if (!initial.exists) throw new HttpsError('not-found', 'Không tìm thấy trận.');
  const match = initial.data(), side = ['r', 'b'].find((s) => match.players[s].uid === actor);
  if (!side) throw new HttpsError('permission-denied', 'Bạn không tham gia trận này.');
  if (match.awarded) return { awarded: true };
  if (match.expiresAt.toMillis() < Date.now()) throw new HttpsError('failed-precondition', 'Trận đã quá thời gian xác nhận.');
  let replay;
  try { replay = validateReplay(C, match.lineups, data.moves, data.outcome); }
  catch (error) { throw new HttpsError('invalid-argument', error.message); }
  return db.runTransaction(async (tx) => {
    const current = (await tx.get(ref)).data();
    if (current.awarded) return { awarded: true };
    const confirmations = { ...current.confirmations, [side]: replay.digest };
    const other = C.Engine.other(side);
    if (confirmations[other] && confirmations[other] !== replay.digest) throw new HttpsError('failed-precondition', 'Hai bên gửi ván cờ khác nhau.');
    if (!confirmations[other]) { tx.update(ref, { confirmations }); return { awarded: false }; }
    const writes = ['r', 'b'].flatMap((s) => replay.awards[s].map((award) => ({
      ref: db.collection('masteryBoards').doc(award.key).collection('players').doc(current.players[s].uid), award, player: current.players[s],
    })));
    const previous = await Promise.all(writes.map((w) => tx.get(w.ref)));
    writes.forEach((w, i) => tx.set(w.ref, { ...C.Mastery.addStats(previous[i].data(), w.award), name: w.player.name, uid: w.player.uid, updatedAt: FieldValue.serverTimestamp() }));
    tx.update(ref, { confirmations, awarded: true, awardedAt: FieldValue.serverTimestamp() });
    return { awarded: true };
  });
});
exports.getMasteryLeaderboard = onCall(options, async (request) => {
  const key = request.data?.key;
  if (!C.Mastery.character(key)) throw new HttpsError('invalid-argument', 'Nhân vật không hợp lệ.');
  const rows = await db.collection('masteryBoards').doc(key).collection('players').orderBy('points', 'desc').limit(50).get();
  return { rows: rows.docs.map((doc) => { const row = doc.data(); return { uid: doc.id, name: row.name, ...C.Mastery.stats(row) }; }) };
});
