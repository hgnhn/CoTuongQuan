const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const source = fs.readFileSync(require('node:path').join(__dirname, '../js/net.js'), 'utf8');
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
function runtime(config = {}, missingLibrary = false) {
  let now = 0, sequence = 0;
  const timers = new Map(), peers = [], scripts = [], listeners = new Set();
  const clock = {
    set(fn, delay) { const id = ++sequence; timers.set(id, { at: now + delay, fn }); return id; },
    clear(id) { timers.delete(id); },
    tick(ms) {
      const end = now + ms;
      while (true) {
        const next = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!next) break; now = next[1].at; timers.delete(next[0]); next[1].fn();
      }
      now = end;
    },
  };
  class Connection extends EventEmitter {
    constructor() {
      super(); this.open = false; this.sent = []; this.closed = false;
      this.peerConnection = new EventEmitter(); this.peerConnection.iceConnectionState = 'new';
      this.peerConnection.addEventListener = this.peerConnection.on;
      this.peerConnection.removeEventListener = this.peerConnection.removeListener;
    }
    start() { this.open = true; this.emit('open'); }
    send(data) { this.sent.push(data); }
    close() { if (this.closed) return; this.closed = true; this.open = false; this.emit('close'); }
    iceFailed() { this.peerConnection.iceConnectionState = 'failed'; this.peerConnection.emit('iceconnectionstatechange'); }
  }
  class Peer extends EventEmitter {
    constructor(id, options) { super(); this.options = typeof id === 'object' ? id : options; peers.push(this); this.destroyed = false; this.disconnected = false; }
    connect(id) { this.target = id; return this.connection = new Connection(); }
    destroy() { this.destroyed = true; }
    reconnect() { this.reconnects = (this.reconnects || 0) + 1; this.disconnected = false; }
  }
  const ctx = { CTQ: { CONFIG: config }, navigator: { userAgent: 'Chrome' }, RTCPeerConnection() {},
    setTimeout: clock.set, clearTimeout: clock.clear,
    document: { visibilityState: 'visible', createElement: () => ({ remove() { this.removed = true; } }),
      head: { appendChild: (s) => scripts.push(s) }, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) },
  };
  if (!missingLibrary) ctx.Peer = Peer;
  ctx.window = ctx; vm.createContext(ctx); vm.runInContext(source, ctx);
  return { Room: ctx.CTQ.Net.Room, ctx, clock, timers, peers, scripts, listeners, Peer, Connection };
}
async function hosted(config) {
  const r = runtime(config), room = new r.Room(), pending = room.host(); await flush();
  r.peers[0].emit('open'); const code = await pending; return { ...r, room, code };
}
async function joining(config) {
  const r = runtime(config), room = new r.Room(), pending = room.join(' abcd9 '); await flush();
  return { ...r, room, pending, peer: r.peers[0] };
}
let passed = 0;
async function test(name, fn) { await fn(); passed++; console.log('  ok', name); }
(async () => {
  await test('default ICE explicitly excludes discontinued PeerJS TURN', async () => {
    const r = await hosted(); const options = r.peers[0].options;
    assert(options.config.iceServers.some((s) => s.urls.startsWith('stun:')));
    assert(!JSON.stringify(options).includes('turn.peerjs.com')); assert.equal(r.room.diagnostics().relayConfigured, false); r.room.close();
  });
  await test('custom signaling and TURN/TLS preserved, credentials excluded from diagnostics', async () => {
    const iceServers = [{ urls: ['turns:relay.example:443?transport=tcp'], username: 'client', credential: 'not-for-diagnostics' }];
    const config = { peer: { host: 'signal.example', secure: true, config: { iceTransportPolicy: 'relay' } }, iceServers };
    const before = JSON.stringify(config), r = await hosted(config);
    assert.equal(r.peers[0].options.host, 'signal.example'); assert.equal(r.peers[0].options.config.iceTransportPolicy, 'relay');
    assert.equal(r.room.diagnostics().relayConfigured, true); assert(!JSON.stringify(r.room.diagnostics()).includes('not-for-diagnostics'));
    assert.equal(JSON.stringify(config), before); r.room.close();
  });
  await test('legacy peer.config ICE and intentionally empty ICE are respected', async () => {
    let r = await hosted({ peer: { config: { iceServers: [{ urls: 'turn:relay.example', username: 'u', credential: 'p' }] } } });
    assert.equal(r.room.diagnostics().relayConfigured, true); r.room.close();
    r = await hosted({ iceServers: [] }); assert.equal(r.peers[0].options.config.iceServers.length, 0); r.room.close();
  });
  await test('failed pending guest releases host slot; late old open is ignored', async () => {
    const r = await hosted(), first = new r.Connection(), second = new r.Connection(); let closed = 0;
    r.room.on('close', () => closed++); r.peers[0].emit('connection', first); first.emit('error', new Error('failed'));
    assert.equal(r.room.conn, null); assert.equal(first.closed, true); assert.equal(closed, 0);
    r.peers[0].emit('connection', second); first.start(); assert.equal(r.room.conn, second); assert.equal(r.room.admitted, false);
    second.start(); assert.equal(r.room.phase, 'connected'); assert.equal(closed, 0); r.room.close();
  });
  await test('closed pending guest and timed-out guest both leave room joinable', async () => {
    const r = await hosted(); let conn = new r.Connection(); r.peers[0].emit('connection', conn); conn.close(); assert.equal(r.room.conn, null);
    conn = new r.Connection(); r.peers[0].emit('connection', conn); r.clock.tick(25000);
    assert.equal(conn.closed, true); assert.equal(r.room.conn, null); assert.equal(r.room.admitted, false);
    conn = new r.Connection(); r.peers[0].emit('connection', conn); conn.start(); assert.equal(r.room.conn, conn); r.room.close();
  });
  await test('second pending visitor receives full without replacing first', async () => {
    const r = await hosted(), first = new r.Connection(), extra = new r.Connection();
    r.peers[0].emit('connection', first); r.peers[0].emit('connection', extra); extra.start();
    assert.equal(extra.sent[0].type, 'full'); assert.equal(r.room.conn, first); r.clock.tick(300); assert.equal(extra.closed, true); r.room.close();
  });
  await test('established match cannot be taken over by a new visitor after disconnect', async () => {
    const r = await hosted(), conn = new r.Connection(), extra = new r.Connection();
    r.peers[0].emit('connection', conn); conn.start(); conn.close(); r.peers[0].emit('connection', extra); extra.start();
    assert.equal(extra.sent[0].type, 'full'); assert.equal(r.room.conn, null); r.room.close();
  });
  await test('join normalizes code, opens once, and clears timeout after success', async () => {
    const r = await joining(); r.peer.emit('open'); const conn = r.peer.connection; conn.start(); await r.pending;
    assert.equal(r.peer.target, 'cotuongquan-ABCD9'); r.peer.emit('open'); assert.equal(r.peer.connection, conn);
    let failures = 0; r.room.on('error', () => failures++); r.clock.tick(60000);
    assert.equal(failures, 0); assert.equal(r.room.conn, conn); assert.equal(r.timers.size, 0); r.room.close();
  });
  await test('signaling timeout fails with correct error before RTC negotiation', async () => {
    const r = await joining(), check = assert.rejects(r.pending, (e) => e.code === 'signaling-timeout');
    r.clock.tick(20000); await check; assert.equal(r.peer.destroyed, true); assert.equal(r.timers.size, 0);
  });
  await test('RTC timeout identifies missing relay and destroys abandoned guest', async () => {
    const r = await joining(), check = assert.rejects(r.pending, /chưa cấu hình.*TURN/);
    r.peer.emit('open'); r.clock.tick(25000); await check; assert.equal(r.peer.connection.closed, true); assert.equal(r.peer.destroyed, true); assert.equal(r.timers.size, 0);
  });
  await test('missing room rejects immediately and leaves no late timeout', async () => {
    const r = await joining(), check = assert.rejects(r.pending, (e) => e.code === 'peer-unavailable');
    r.peer.emit('open'); r.peer.emit('error', { type: 'peer-unavailable' }); await check; r.clock.tick(60000); assert.equal(r.timers.size, 0);
  });
  await test('ICE failure rejects promptly, with configured-relay wording', async () => {
    const r = await joining({ iceServers: [{ urls: 'turns:relay.example:443', username: 'u', credential: 'p' }] });
    const check = assert.rejects(r.pending, /kiểm tra máy chủ chuyển tiếp/); r.peer.emit('open'); r.peer.connection.iceFailed(); await check;
    assert.equal(r.peer.destroyed, true); assert.equal(r.timers.size, 0);
  });
  await test('full packet after open is reported and closes the connection', async () => {
    const r = await joining(); r.peer.emit('open'); r.peer.connection.start(); await r.pending;
    let code, closes = 0; r.room.on('error', (e) => code = e.code); r.room.on('close', () => closes++);
    r.peer.connection.emit('data', { type: 'full' }); assert.equal(code, 'room-full'); assert.equal(closes, 1); assert.equal(r.room.conn, null); r.room.close();
  });
  await test('cancel during host startup destroys peer and ignores late open', async () => {
    const r = runtime(), room = new r.Room(), p = room.host(), check = assert.rejects(p, (e) => e.code === 'cancelled'); await flush();
    room.close(); await check; r.peers[0].emit('open'); assert.equal(room.peer, null); assert.equal(r.peers[0].destroyed, true); assert.equal(r.listeners.size, 0); assert.equal(r.timers.size, 0);
  });
  await test('cancel during library loading cannot create a peer later', async () => {
    const r = runtime({}, true), room = new r.Room(), p = room.host(), check = assert.rejects(p, (e) => e.code === 'cancelled');
    room.close(); r.ctx.Peer = r.Peer; r.scripts[0].onload(); await check; assert.equal(r.peers.length, 0); assert.equal(r.timers.size, 0);
  });
  await test('host startup timeout, ID collision retry and visibility reconnect', async () => {
    let r = runtime(), room = new r.Room(), p = room.host(), check = assert.rejects(p, (e) => e.code === 'signaling-timeout'); await flush(); r.clock.tick(20000); await check;
    r = runtime(); room = new r.Room(); p = room.host(); await flush(); r.peers[0].emit('error', { type: 'unavailable-id' });
    assert.equal(r.peers[0].destroyed, true); r.peers[1].emit('open'); await p; r.peers[1].disconnected = true; room.onVis(); assert.equal(r.peers[1].reconnects, 1); room.close();
  });
  await test('closing a host also closes rejected visitors and clears timers', async () => {
    const r = await hosted(), first = new r.Connection(), extra = new r.Connection();
    r.peers[0].emit('connection', first); r.peers[0].emit('connection', extra); r.room.close();
    assert.equal(first.closed, true); assert.equal(extra.closed, true); assert.equal(r.timers.size, 0); assert.equal(r.listeners.size, 0);
  });
  await test('bad room code never starts a peer', async () => {
    const r = runtime(), room = new r.Room(); await assert.rejects(room.join('<bad>!'), /Mã phòng/); assert.equal(r.peers.length, 0);
  });
  console.log(`${passed} network checks passed`);
})().catch((e) => { console.error(e); process.exitCode = 1; });
