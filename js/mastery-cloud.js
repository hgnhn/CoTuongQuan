/* Kết nối Firebase tuỳ chọn. Không có cấu hình thì thông thạo cục bộ vẫn hoạt động. */
(function (root) {
  const C = root.CTQ, Cloud = C.MasteryCloud = {};
  let loading;
  Cloud.enabled = () => !!(C.CONFIG.firebase && C.CONFIG.masteryCloud && C.CONFIG.masteryCloud.enabled);
  async function service() {
    if (!Cloud.enabled()) throw new Error('Bảng xếp hạng chung chưa được kết nối.');
    if (!C.Auth.ready || !root.firebase || !root.firebase.apps.length) throw new Error('Dịch vụ tài khoản chưa sẵn sàng.');
    if (!loading) loading = new Promise((resolve, reject) => {
      if (root.firebase.functions) return resolve();
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-functions-compat.js';
      script.onload = resolve;
      script.onerror = () => { loading = null; reject(new Error('Không kết nối được bảng xếp hạng. Thử lại sau.')); };
      document.head.appendChild(script);
    });
    await loading;
    return root.firebase.app().functions(C.CONFIG.masteryCloud.region || 'asia-southeast1');
  }
  async function call(name, data) {
    const sdk = await service();
    return (await sdk.httpsCallable(name, { timeout: 20000 })(data)).data;
  }
  Cloud.open = (players, lineups) => call('openMasteryMatch', { players, lineups });
  Cloud.submit = (matchId, moves, outcome) => call('submitMasteryMatch', { matchId, moves, outcome });
  Cloud.board = (key) => call('getMasteryLeaderboard', { key });
})(window);
