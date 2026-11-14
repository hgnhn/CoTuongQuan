/* Cờ Tướng Quân — vẽ bàn cờ (SVG cho đường kẻ, nút bấm cho quân và điểm đến). */
(function (root) {
  const CTQ = (root.CTQ = root.CTQ || {});
  const E = CTQ.Engine;
  const SVGNS = 'http://www.w3.org/2000/svg';

  // Toạ độ giao điểm trong viewBox 0..90 x 0..100
  const X = (c) => 5 + c * 10;
  const Y = (r) => 5 + r * 10;

  function boardSVG() {
    const s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('viewBox', '0 0 90 100');
    s.setAttribute('class', 'board-lines');
    s.setAttribute('aria-hidden', 'true');
    const line = (x1, y1, x2, y2, cls) => {
      const l = document.createElementNS(SVGNS, 'line');
      l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2);
      if (cls) l.setAttribute('class', cls);
      s.appendChild(l);
    };
    const frame = document.createElementNS(SVGNS, 'rect');
    frame.setAttribute('x', 3.6); frame.setAttribute('y', 3.6); frame.setAttribute('width', 82.8); frame.setAttribute('height', 92.8);
    frame.setAttribute('class', 'frame');
    s.appendChild(frame);
    for (let r = 0; r < 10; r++) line(X(0), Y(r), X(8), Y(r));
    for (let c = 0; c < 9; c++) {
      if (c === 0 || c === 8) line(X(c), Y(0), X(c), Y(9));
      else { line(X(c), Y(0), X(c), Y(4)); line(X(c), Y(5), X(c), Y(9)); }
    }
    // chéo cung
    line(X(3), Y(0), X(5), Y(2)); line(X(5), Y(0), X(3), Y(2));
    line(X(3), Y(7), X(5), Y(9)); line(X(5), Y(7), X(3), Y(9));
    // dấu vị trí Pháo / Tốt
    const marks = [[2, 1], [2, 7], [7, 1], [7, 7], [3, 0], [3, 2], [3, 4], [3, 6], [3, 8], [6, 0], [6, 2], [6, 4], [6, 6], [6, 8]];
    for (const [r, c] of marks) {
      const x = X(c), y = Y(r), g = 0.9, l = 2.2;
      for (const sx of [-1, 1]) {
        if ((c === 0 && sx < 0) || (c === 8 && sx > 0)) continue;
        for (const sy of [-1, 1]) {
          const p = document.createElementNS(SVGNS, 'polyline');
          p.setAttribute('points', `${x + sx * (g + l)},${y + sy * g} ${x + sx * g},${y + sy * g} ${x + sx * g},${y + sy * (g + l)}`);
          p.setAttribute('class', 'mark');
          s.appendChild(p);
        }
      }
    }
    // chữ sông
    const txt = (str, x) => {
      const t = document.createElementNS(SVGNS, 'text');
      t.setAttribute('x', x); t.setAttribute('y', 51.6);
      t.setAttribute('class', 'river');
      t.textContent = str;
      s.appendChild(t);
    };
    txt('楚 河', 25); txt('漢 界', 65);
    return s;
  }

  class BoardView {
    constructor(el, opts) {
      this.el = el;
      this.opts = Object.assign({ interactive: true, flip: false, onSquare: null, labels: true }, opts || {});
      this.flip = this.opts.flip;
      el.innerHTML = '';
      el.appendChild(boardSVG());
      this.layer = document.createElement('div');
      this.layer.className = 'board-layer';
      el.appendChild(this.layer);
      this.pieceEls = [];
      this.marks = [];
      this.state = null;
      this.layer.addEventListener('click', (ev) => {
        const btn = ev.target.closest('[data-sq]');
        if (btn && this.opts.onSquare) this.opts.onSquare(+btn.dataset.sq);
      });
    }

    pos(sq) {
      let r = E.rowOf(sq), c = E.colOf(sq);
      if (this.flip) { r = 9 - r; c = 8 - c; }
      return { left: (X(c) / 90) * 100 + '%', top: (Y(r) / 100) * 100 + '%' };
    }

    setFlip(f) { this.flip = f; this.render(this.state, this.decor); }

    // decor: { selected, moves:[{to,kind}], last:{from,to}, check: sq, perkOf: fn(piece)->bool, dim: Set }
    render(state, decor) {
      this.state = state;
      this.decor = decor || {};
      const d = this.decor;
      const B = state.board;
      // Giữ lại phần tử quân theo id để có hiệu ứng trượt
      const prev = new Map();
      for (const el of this.pieceEls) prev.set(el.dataset.key, el);
      const used = new Set();
      const frag = [];
      for (let i = 0; i < 90; i++) {
        const p = B[i];
        if (!p) continue;
        const key = p.uid != null ? 'u' + p.uid : 's' + i;
        let el = prev.get(key);
        if (!el || used.has(key)) {
          el = document.createElement('button');
          el.type = 'button';
          el.className = 'piece';
          el.dataset.key = key;
        }
        // mặt quân: chữ Hán, hoặc chân dung nếu là Danh Tướng
        const face = p.g ? 'g:' + p.g + p.s : 'n:' + p.t + p.s;
        if (el.dataset.face !== face) {
          el.dataset.face = face;
          const glyph = CTQ.PIECES[p.t].glyph[p.s];
          el.innerHTML = p.g
            ? `<span class="pf">${CTQ.portraitHTML(CTQ.generalById(p.g), { ring: false })}</span><span class="glyph-badge">${glyph}</span>`
            : `<span class="glyph">${glyph}</span>`;
        }
        used.add(key);
        el.dataset.sq = i;
        el.className = `piece side-${p.s}` +
          (d.selected === i ? ' is-selected' : '') +
          (d.check === i ? ' is-check' : '') +
          (d.dim && d.dim.has(i) ? ' is-dim' : '') +
          (d.focus === i ? ' is-focus' : '') +
          (d.frozen && d.frozen.has(i) ? ' is-frozen' : '') +
          (d.shield && d.shield.has(i) ? ' is-shield' : '') +
          (p.g ? ' is-general' : '') +
          (p.promo ? ' is-promo' : '');
        const perkId = state.perks && state.perks[p.s] ? state.perks[p.s][p.t] : '';
        const perk = !p.g && perkId ? CTQ.perkById(perkId) : null;
        const sideName = p.s === 'r' ? 'Đỏ' : 'Đen';
        const pname = p.g ? CTQ.generalById(p.g).name + ' (' + CTQ.PIECES[p.t].name + ')' : CTQ.PIECES[p.t].name;
        el.setAttribute('aria-label', `${pname} ${sideName}${p.promo ? ' (phong cấp)' : ''}${perk ? ', perk ' + perk.name : ''}`);
        el.title = `${pname}${perk ? ' · ' + perk.name : ''}`;
        el.tabIndex = this.opts.interactive ? 0 : -1;
        const ps = this.pos(i);
        el.style.left = ps.left; el.style.top = ps.top;
        frag.push(el);
      }
      for (const el of this.pieceEls) if (!used.has(el.dataset.key)) el.remove();
      for (const el of frag) if (!el.parentNode) this.layer.appendChild(el);
      this.pieceEls = frag;

      // điểm đến, nước vừa đi
      for (const m of this.marks) m.remove();
      this.marks = [];
      const addMark = (sq, cls, clickable) => {
        const m = document.createElement(clickable ? 'button' : 'span');
        if (clickable) { m.type = 'button'; m.dataset.sq = sq; m.setAttribute('aria-label', 'Đi tới đây'); }
        m.className = 'mark-sq ' + cls;
        const ps = this.pos(sq);
        m.style.left = ps.left; m.style.top = ps.top;
        this.layer.insertBefore(m, this.layer.firstChild);
        this.marks.push(m);
        return m;
      };
      if (d.last) { addMark(d.last.from, 'last-from'); addMark(d.last.to, 'last-to'); }
      if (d.moves) {
        for (const mv of d.moves) {
          const occupied = !!B[mv.to];
          const m = addMark(mv.to, `target kind-${mv.kind || 'base'}${occupied ? ' is-capture' : ''}`, this.opts.interactive);
          if (occupied) this.layer.appendChild(m); // nằm trên quân để bấm được
        }
      }
    }
  }

  CTQ.BoardView = BoardView;
})(window);
