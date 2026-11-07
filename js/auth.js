/* Cờ Tướng Quân — đăng nhập.
 * Hai chế độ:
 *  - 'firebase': đăng nhập Google qua Firebase Authentication (khi CTQ.CONFIG.firebase có cấu hình).
 *  - 'local'   : hồ sơ kỳ thủ lưu trên trình duyệt (mặc định, không cần máy chủ).
 * Giao diện chỉ dùng: Auth.mode, Auth.user, Auth.init(), Auth.signInGoogle(),
 * Auth.signInLocal(name), Auth.signOut(), Auth.onChange(fn).
 */
(function (root) {
  const CTQ = (root.CTQ = root.CTQ || {});
  const FB_VER = '10.14.1';
  const LS_KEY = 'ctq.account';

  const listeners = [];
  const Auth = (CTQ.Auth = {
    mode: CTQ.CONFIG && CTQ.CONFIG.firebase ? 'firebase' : 'local',
    user: null, // { uid, name, provider }
    ready: false,
    onChange(fn) { listeners.push(fn); },
  });
  const emit = () => { for (const fn of listeners) fn(Auth.user); };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Không tải được dịch vụ đăng nhập. Kiểm tra mạng rồi thử lại.'));
      document.head.appendChild(s);
    });
  }

  let fbAuth = null;

  Auth.init = async function () {
    if (Auth.mode === 'local') {
      try { Auth.user = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) { Auth.user = null; }
      Auth.ready = true;
      emit();
      return;
    }
    try {
      await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app-compat.js`);
      await loadScript(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-auth-compat.js`);
      root.firebase.initializeApp(CTQ.CONFIG.firebase);
      fbAuth = root.firebase.auth();
      await new Promise((resolve) => {
        let first = true;
        fbAuth.onAuthStateChanged((u) => {
          Auth.user = u ? { uid: u.uid, name: u.displayName || (u.email || 'Kỳ thủ').split('@')[0], provider: 'google', photo: u.photoURL || '' } : null;
          Auth.ready = true;
          emit();
          if (first) { first = false; resolve(); }
        });
      });
    } catch (e) {
      Auth.ready = true;
      Auth.error = e.message;
      emit();
    }
  };

  Auth.signInGoogle = async function () {
    if (!fbAuth) throw new Error(Auth.error || 'Đăng nhập Google chưa được cấu hình.');
    const provider = new root.firebase.auth.GoogleAuthProvider();
    try {
      await fbAuth.signInWithPopup(provider);
    } catch (e) {
      if (e && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')) return false;
      if (e && e.code === 'auth/popup-blocked') { await fbAuth.signInWithRedirect(provider); return false; }
      throw new Error('Đăng nhập không thành công: ' + (e.message || e.code));
    }
    return true;
  };

  Auth.signInLocal = function (name) {
    name = String(name || '').trim().slice(0, 20);
    if (name.length < 2) throw new Error('Tên kỳ thủ cần ít nhất 2 ký tự.');
    const prev = Auth.user;
    const uid = prev && prev.provider === 'local' ? prev.uid : 'local-' + Math.random().toString(36).slice(2, 10);
    Auth.user = { uid, name, provider: 'local' };
    try { localStorage.setItem(LS_KEY, JSON.stringify(Auth.user)); } catch (e) { /* bỏ qua */ }
    emit();
    return true;
  };

  Auth.signOut = async function () {
    if (Auth.mode === 'firebase' && fbAuth) { await fbAuth.signOut(); return; }
    Auth.user = null;
    try { localStorage.removeItem(LS_KEY); } catch (e) { /* bỏ qua */ }
    emit();
  };
})(window);
