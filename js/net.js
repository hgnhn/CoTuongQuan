/* Cờ Tướng Quân — chơi trực tuyến ngang hàng (WebRTC qua PeerJS).
 * Không cần máy chủ riêng: PeerJS chỉ dùng máy chủ môi giới công khai để hai trình duyệt
 * tìm thấy nhau, sau đó dữ liệu đi thẳng giữa hai người chơi.
 * Mỗi bên tự kiểm tra tính hợp lệ của nước đi nhận được.
 */
(function (root) {
  const CTQ = (root.CTQ = root.CTQ || {});
  const PEERJS_URL = 'vendor/peerjs.min.js'; // PeerJS 1.5.4 (MIT), đóng gói sẵn
  // Tuỳ chọn máy chủ môi giới (mặc định: máy chủ công khai của PeerJS)
  const peerOpts = () => (CTQ.CONFIG && CTQ.CONFIG.peer) || {};
  const PREFIX = 'cotuongquan-';
  const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

  let loading = null;
  function loadPeerJS() {
    if (root.Peer) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PEERJS_URL;
      s.onload = () => resolve();
      s.onerror = () => { loading = null; reject(new Error('Không tải được thư viện kết nối. Kiểm tra mạng rồi thử lại.')); };
      document.head.appendChild(s);
    });
    return loading;
  }

  function makeCode() {
    let c = '';
    for (let i = 0; i < 5; i++) c += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    return c;
  }

  class Room {
    constructor() {
      this.peer = null;
      this.conn = null;
      this.handlers = {};
      this.isHost = false;
      this.code = '';
    }
    on(ev, fn) { this.handlers[ev] = fn; return this; }
    emit(ev, data) { if (this.handlers[ev]) this.handlers[ev](data); }

    async host() {
      await loadPeerJS();
      this.isHost = true;
      return new Promise((resolve, reject) => {
        const tryOpen = (attempt) => {
          this.code = makeCode();
          const peer = new root.Peer(PREFIX + this.code, peerOpts());
          peer.on('open', () => { this.peer = peer; resolve(this.code); });
          peer.on('connection', (conn) => {
            if (this.conn) { conn.on('open', () => { conn.send({ type: 'full' }); setTimeout(() => conn.close(), 300); }); return; }
            this.attach(conn);
          });
          peer.on('error', (err) => {
            if (err.type === 'unavailable-id' && attempt < 4) { peer.destroy(); tryOpen(attempt + 1); return; }
            if (!this.peer) reject(friendlyError(err)); else this.emit('error', friendlyError(err));
          });
          peer.on('disconnected', () => { if (this.peer && !this.peer.destroyed) this.peer.reconnect(); });
        };
        tryOpen(0);
      });
    }

    async join(code) {
      await loadPeerJS();
      this.isHost = false;
      this.code = code.trim().toUpperCase();
      return new Promise((resolve, reject) => {
        const peer = new root.Peer(peerOpts());
        this.peer = peer;
        let done = false;
        const fail = (e) => { if (!done) { done = true; reject(e); } else this.emit('error', e); };
        peer.on('open', () => {
          const conn = peer.connect(PREFIX + this.code, { reliable: true });
          const timer = setTimeout(() => fail(new Error('Không tìm thấy phòng. Kiểm tra lại mã phòng.')), 12000);
          conn.on('open', () => { clearTimeout(timer); done = true; resolve(); });
          this.attach(conn);
        });
        peer.on('error', (err) => fail(friendlyError(err)));
      });
    }

    attach(conn) {
      this.conn = conn;
      conn.on('open', () => this.emit('open'));
      conn.on('data', (msg) => {
        if (msg && msg.type === 'full') { this.emit('error', new Error('Phòng đã đủ người.')); return; }
        this.emit('message', msg);
      });
      conn.on('close', () => this.emit('close'));
      conn.on('error', (e) => this.emit('error', friendlyError(e)));
    }

    send(msg) { if (this.conn && this.conn.open) this.conn.send(msg); }

    close() {
      try { if (this.conn) this.conn.close(); } catch (e) { /* bỏ qua */ }
      try { if (this.peer) this.peer.destroy(); } catch (e) { /* bỏ qua */ }
      this.conn = null; this.peer = null; this.handlers = {};
    }
  }

  function friendlyError(err) {
    const t = err && err.type;
    if (t === 'peer-unavailable') return new Error('Không tìm thấy phòng. Kiểm tra lại mã phòng.');
    if (t === 'network' || t === 'server-error' || t === 'socket-error') return new Error('Mất kết nối tới máy chủ môi giới. Kiểm tra mạng rồi thử lại.');
    if (t === 'browser-incompatible') return new Error('Trình duyệt này không hỗ trợ WebRTC.');
    return err instanceof Error ? err : new Error(String(err));
  }

  CTQ.Net = { Room };
})(window);
