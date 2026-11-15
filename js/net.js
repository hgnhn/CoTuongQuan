/* PeerJS môi giới địa chỉ; mạng chặn P2P cần TURN riêng (xem docs/online.md). */
(function (root) {
  const CTQ = (root.CTQ = root.CTQ || {});
  const PEERJS_URL = 'vendor/peerjs.min.js', PREFIX = 'cotuongquan-';
  const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const SIGNAL_TIMEOUT = 20000, CONNECT_TIMEOUT = 25000;
  function peerOpts() {
    const config = CTQ.CONFIG || {}, peer = config.peer || {}, rtc = peer.config || {};
    const iceServers = Array.isArray(config.iceServers) ? config.iceServers : Array.isArray(rtc.iceServers) ? rtc.iceServers : [
      { urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun.cloudflare.com:3478' },
    ];
    // Không dùng hai TURN mặc định đã ngừng hoạt động trong PeerJS 1.5.4.
    return { ...peer, config: { ...rtc, iceServers } };
  }
  const hasRelay = (options) => options.config.iceServers.some((s) =>
    (Array.isArray(s.urls) ? s.urls : [s.urls]).some((url) => /^turns?:/i.test(url || '')));
  function error(code, message) { return Object.assign(new Error(message), { code }); }
  const cancelled = () => error('cancelled', 'Đã huỷ kết nối phòng.');
  CTQ.inAppBrowser = function () {
    const ua = navigator.userAgent || '';
    if (/Zalo/i.test(ua)) return 'Zalo';
    if (/FBAN|FBAV|FB_IAB|FBIOS|Messenger/i.test(ua)) return 'Facebook/Messenger';
    if (/Instagram/i.test(ua)) return 'Instagram';
    if (/\bLine\//i.test(ua)) return 'LINE';
    if (/musical_ly|TikTok|BytedanceWebview/i.test(ua)) return 'TikTok';
    if (/; wv\)/.test(ua)) return 'ứng dụng';
    return '';
  };
  CTQ.hasWebRTC = () => typeof root.RTCPeerConnection === 'function';
  let loading = null;
  function loadPeerJS() {
    if (!CTQ.hasWebRTC()) {
      const app = CTQ.inAppBrowser();
      return Promise.reject(new Error(app
        ? `Trình duyệt bên trong ${app} không hỗ trợ chơi trực tuyến. Bấm nút ⋯ hoặc ⋮, chọn "Mở bằng trình duyệt" rồi thử lại.`
        : 'Trình duyệt này thiếu WebRTC. Hãy dùng Chrome, Safari, Edge hoặc Firefox bản mới.'));
    }
    if (root.Peer) return Promise.resolve();
    if (!loading) loading = new Promise((resolve, reject) => {
      const script = document.createElement('script'); let settled = false;
      const fail = () => { if (settled) return; settled = true; clearTimeout(timer); loading = null; script.remove(); reject(new Error('Không tải được thư viện kết nối. Kiểm tra mạng rồi thử lại.')); };
      const timer = setTimeout(fail, SIGNAL_TIMEOUT);
      script.src = PEERJS_URL; script.onload = () => { if (settled) return; settled = true; clearTimeout(timer); resolve(); }; script.onerror = fail;
      document.head.appendChild(script);
    });
    return loading;
  }
  function makeCode() {
    let code = '';
    for (let i = 0; i < 5; i++) code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    return code;
  }
  class Room {
    constructor() {
      this.peer = null; this.conn = null; this.handlers = {};
      this.isHost = false; this.code = ''; this.closed = false; this.session = 0; this.admitted = false;
      this.timers = new Set(); this.extras = new Set(); this.phase = 'idle'; this.iceState = 'new';
    }
    on(ev, fn) { this.handlers[ev] = fn; return this; }
    emit(ev, data) { if (this.handlers[ev]) this.handlers[ev](data); }
    later(fn, ms) { const id = setTimeout(() => { this.timers.delete(id); fn(); }, ms); this.timers.add(id); return id; }
    clear(id) { clearTimeout(id); this.timers.delete(id); }
    active(session) { return !this.closed && this.session === session; }
    begin() {
      if (this.peer || this.cancel) throw new Error('Phòng đang hoạt động. Hãy đóng phòng cũ trước.');
      this.closed = false; this.admitted = false; this.iceState = 'new'; this.phase = 'signaling'; return ++this.session;
    }
    diagnostics() { return { phase: this.phase, iceState: this.iceState, relayConfigured: !!this.relayConfigured }; }
    connectionError() {
      return error('ice-failed', this.relayConfigured
        ? 'Hai máy chưa mở được kết nối. Giữ phòng chủ mở và thử lại. Nếu vẫn lỗi, cần kiểm tra máy chủ chuyển tiếp hoặc thử mạng khác.'
        : 'Hai máy chưa mở được kết nối trực tiếp và game chưa cấu hình máy chủ chuyển tiếp TURN. Thử cùng Wi-Fi hoặc đổi mạng; để hỗ trợ hai mạng bị chặn, chủ game cần thêm TURN.');
    }
    async host() {
      const session = this.begin(); this.isHost = true;
      await loadPeerJS(); if (!this.active(session)) throw cancelled();
      const options = peerOpts(); this.relayConfigured = hasRelay(options);
      return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (err) => {
          if (settled) return; settled = true; this.cancel = null; this.clear(timer);
          if (err) { this.close(); reject(err); } else { this.phase = 'waiting'; resolve(this.code); }
        };
        this.cancel = () => finish(cancelled());
        const timer = this.later(() => finish(error('signaling-timeout', 'Không kết nối được máy chủ phòng. Kiểm tra mạng và thử tạo lại phòng.')), SIGNAL_TIMEOUT);
        const tryOpen = (attempt) => {
          this.code = makeCode();
          const peer = this.peer = new root.Peer(PREFIX + this.code, options);
          const active = () => this.active(session) && this.peer === peer;
          peer.on('open', () => { if (active()) finish(); });
          peer.on('connection', (conn) => {
            if (!active()) { conn.close(); return; }
            if (this.conn || this.admitted) { this.rejectIncoming(conn); return; }
            this.attach(conn);
          });
          peer.on('error', (err) => {
            if (!active()) return;
            if (!settled && err.type === 'unavailable-id' && attempt < 4) {
              this.peer = null; peer.destroy(); tryOpen(attempt + 1); return;
            }
            if (!settled) finish(friendlyError(err)); else this.emit('error', friendlyError(err));
          });
          peer.on('disconnected', () => { if (active() && !peer.destroyed) peer.reconnect(); });
        };
        this.onVis = () => { if (this.active(session) && document.visibilityState === 'visible' && this.peer?.disconnected && !this.peer.destroyed) this.peer.reconnect(); };
        document.addEventListener('visibilitychange', this.onVis);
        try { tryOpen(0); } catch (err) { finish(friendlyError(err)); }
      });
    }
    async join(code) {
      code = String(code || '').trim().toUpperCase();
      if (!/^[A-Z0-9]{5}$/.test(code)) throw new Error('Mã phòng phải có 5 chữ hoặc số.');
      const session = this.begin(); this.isHost = false; this.code = code;
      await loadPeerJS(); if (!this.active(session)) throw cancelled();
      const options = peerOpts(); this.relayConfigured = hasRelay(options);
      return new Promise((resolve, reject) => {
        let settled = false, connected = false;
        const finish = (err) => {
          if (settled) { if (err && this.active(session)) this.emit('error', err); return; }
          settled = true; this.cancel = null; this.clear(timer);
          if (err) { this.close(); reject(err); } else resolve();
        };
        this.cancel = () => finish(cancelled());
        const timer = this.later(() => finish(error('signaling-timeout', 'Không kết nối được máy chủ phòng. Kiểm tra mạng rồi thử lại.')), SIGNAL_TIMEOUT);
        try {
          const peer = this.peer = new root.Peer(options);
          peer.on('open', () => {
            if (!this.active(session) || connected) return;
            connected = true; this.clear(timer);
            try { this.attach(peer.connect(PREFIX + this.code, { reliable: true }), () => finish(), (err) => finish(err)); }
            catch (err) { finish(friendlyError(err)); }
          });
          peer.on('error', (err) => { if (this.active(session)) finish(friendlyError(err)); });
        } catch (err) { finish(friendlyError(err)); }
      });
    }
    rejectIncoming(conn) {
      this.extras.add(conn);
      const timeout = this.later(() => close(), CONNECT_TIMEOUT);
      const close = () => { this.clear(timeout); this.extras.delete(conn); conn.close(); };
      const full = () => { conn.send({ type: 'full' }); this.later(close, 300); };
      conn.on('open', full); conn.on('close', () => { this.clear(timeout); this.extras.delete(conn); });
      if (conn.open) full();
    }
    attach(conn, onOpen, onFail) {
      const session = this.session; this.conn = conn; this.phase = 'connecting';
      let opened = false;
      const active = () => this.active(session) && this.conn === conn;
      const pc = conn.peerConnection;
      const release = () => {
        this.clear(timer); pc?.removeEventListener('iceconnectionstatechange', onIce);
        if (this.conn === conn) this.conn = null;
        this.phase = this.isHost ? 'waiting' : 'closed';
      };
      const fail = (err) => {
        if (!active()) return;
        release(); conn.close();
        if (onFail) onFail(err); else if (opened) this.emit('error', err);
        if (opened && this.active(session)) this.emit('close');
      };
      const timer = this.later(() => fail(this.connectionError()), CONNECT_TIMEOUT);
      const onIce = () => {
        if (!active()) return;
        this.iceState = pc.iceConnectionState;
        if (this.iceState === 'failed') fail(this.connectionError());
      };
      pc?.addEventListener('iceconnectionstatechange', onIce);
      const open = () => {
        if (!active() || opened) return;
        opened = true; this.admitted = true; this.clear(timer); this.phase = 'connected';
        if (onOpen) onOpen(); this.emit('open');
      };
      conn.on('open', open);
      conn.on('data', (msg) => {
        if (!active()) return;
        if (msg?.type === 'full') { fail(error('room-full', 'Phòng đã đủ hai người. Hãy tạo phòng khác.')); return; }
        this.emit('message', msg);
      });
      conn.on('close', () => {
        if (!active()) return; release();
        if (opened) this.emit('close'); else if (onFail) onFail(this.connectionError());
      });
      conn.on('error', (err) => fail(err?.type === 'negotiation-failed' ? this.connectionError() : friendlyError(err)));
      if (conn.open) open();
    }
    send(msg) { if (!this.closed && this.conn?.open) this.conn.send(msg); }
    close() {
      if (this.closed) return;
      this.closed = true; this.session++; this.phase = 'closed';
      const cancel = this.cancel; this.cancel = null;
      for (const id of this.timers) clearTimeout(id); this.timers.clear();
      if (this.onVis) { document.removeEventListener('visibilitychange', this.onVis); this.onVis = null; }
      const peer = this.peer, conn = this.conn; this.peer = null; this.conn = null;
      for (const extra of this.extras) extra.close(); this.extras.clear();
      if (conn) conn.close(); if (peer) peer.destroy();
      this.handlers = {}; if (cancel) cancel();
    }
  }
  function friendlyError(err) {
    const type = err?.type || err?.code;
    if (type === 'peer-unavailable') return error(type, 'Không tìm thấy phòng đang mở. Nhờ chủ phòng giữ trang mở và tạo lại mã nếu cần.');
    if (['network', 'server-error', 'socket-error', 'socket-closed'].includes(type)) return error(type, 'Mất kết nối tới máy chủ phòng. Kiểm tra mạng rồi thử lại.');
    if (type === 'browser-incompatible') return error(type, 'Trình duyệt này không hỗ trợ WebRTC.');
    return err instanceof Error ? err : error(type || 'connection-error', String(err?.message || err));
  }
  CTQ.Net = { Room };
})(window);
