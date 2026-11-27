/* Nhân vật người que: tông màu, tư thế, vẽ */
(function () {
  const SM = window.SM;
  const D2R = Math.PI / 180;
  const dir = (a) => [Math.sin(a * D2R), Math.cos(a * D2R)];
  const osc = (t, f, a, ph = 0) => Math.sin(t * f * 2 * Math.PI + ph) * a;
  const lerp = SM.lerp;

  SM.TONES = {
    paper: { name: 'Giấy', bg: '#f4f1ea', bg2: '#e6e0d2', ink: '#17171a', accent: '#1f9d8f', accent2: '#f2c230', hot: '#e5483b', floor: '#d9d2c0', card: '#ffffff', glass: '#ffffff', head: '#111114', coat: '#8f9298', pants: '#1b1b1f', rim: null },
    warm: { name: 'Ấm', bg: '#fbe6c8', bg2: '#f4cf9d', ink: '#2a1a10', accent: '#e8742a', accent2: '#ffd23f', hot: '#d9372b', floor: '#efc386', card: '#fff8ee', glass: '#ffffff', head: '#14100d', coat: '#a0795a', pants: '#2a1a10', rim: null },
    cool: { name: 'Lạnh', bg: '#dcecfa', bg2: '#bcd8f2', ink: '#101a2a', accent: '#2f7de1', accent2: '#ffd23f', hot: '#e5483b', floor: '#a9c9e8', card: '#ffffff', glass: '#ffffff', head: '#0e1118', coat: '#7d8fa6', pants: '#16202f', rim: null },
    danger: { name: 'Cảnh báo', bg: '#f6d8d3', bg2: '#eab0a8', ink: '#2a0e0c', accent: '#e5483b', accent2: '#ffd23f', hot: '#c1271b', floor: '#dd9b92', card: '#fff4f2', glass: '#ffffff', head: '#140a0a', coat: '#8e6f6d', pants: '#241010', rim: null },
    money: { name: 'Tiền', bg: '#e1f2dc', bg2: '#bfe2b6', ink: '#0f2412', accent: '#2e9e4f', accent2: '#ffd23f', hot: '#e5483b', floor: '#a6d49b', card: '#ffffff', glass: '#ffffff', head: '#0b130c', coat: '#7f9a85', pants: '#13251a', rim: null },
    night: { name: 'Đêm', bg: '#141731', bg2: '#1f2447', ink: '#eceaf7', accent: '#8a7bff', accent2: '#ffd23f', hot: '#ff6b5e', floor: '#0e1126', card: '#262b52', glass: '#ffffff', head: '#07070d', coat: '#6d7194', pants: '#2b2f55', rim: '#c9c6ee' },
  };
  SM.tone = (sc) => SM.TONES[sc.tone] || SM.TONES.paper;

  SM.POSES = {
    idle: 'Đứng nghỉ', talk: 'Vừa nói', point: 'Chỉ tay', present: 'Giới thiệu', think: 'Suy nghĩ', surprised: 'Giật mình',
    celebrate: 'Ăn mừng', sad: 'Buồn', walk: 'Đi bộ', run: 'Chạy', wave: 'Vẫy tay', shrug: 'Nhún vai', smash: 'Đập búa',
  };

  const REST = { lean: 0, aL: [-9, -5], aR: [9, 5], lL: [-5, -3], lR: [5, 3], head: 0, hop: 0, mouth: 'smile', brow: 0, hold: null, look: 0 };
  SM.smashPhase = (t) => (t * 1.6) % 1;

  function poseAt(name, t) {
    const o = Object.assign({}, REST);
    switch (name) {
      case 'idle':
        o.lean = osc(t, 0.35, 1.2); o.aL = [-9 + osc(t, 0.4, 2), -5]; o.aR = [9 - osc(t, 0.4, 2), 5]; o.head = osc(t, 0.3, 2); break;
      case 'talk': {
        const g = osc(t, 1.1, 1);
        o.aR = [85 + 18 * g, 130 + 28 * g]; o.aL = [-14, -30 + osc(t, 0.9, 8, 1)]; o.head = osc(t, 0.8, 3); o.lean = osc(t, 0.5, 1.5); break;
      }
      case 'point':
        o.aR = [98 + osc(t, 1.2, 3), 96 + osc(t, 1.2, 3)]; o.lean = 3; o.hold = 'pointer'; o.look = 1; break;
      case 'present':
        o.aR = [105 + osc(t, 0.8, 8), 80 + osc(t, 0.8, 14)]; o.aL = [-30, -62 + osc(t, 0.8, 6)]; o.look = 1; o.head = 3; break;
      case 'think':
        o.aR = [112, -98 + osc(t, 0.7, 4)]; o.head = 8; o.mouth = 'flat'; o.brow = 1; o.look = 1; o.lean = osc(t, 0.3, 1); break;
      case 'surprised':
        o.aL = [-150 + osc(t, 6, 4), -170 + osc(t, 6, 4)]; o.aR = [150 + osc(t, 6, -4), 170 + osc(t, 6, -4)]; o.hop = osc(t, 5, 2); o.mouth = 'o'; o.lean = -4; o.brow = 2; break;
      case 'celebrate': {
        const j = Math.abs(Math.sin(t * 5));
        o.aL = [-145 - j * 15, -160]; o.aR = [145 + j * 15, 160]; o.hop = -j * 34; o.mouth = 'bigsmile'; o.lL = [-14, -10]; o.lR = [14, 10]; break;
      }
      case 'sad':
        o.lean = 7; o.head = 14; o.aL = [-3, 0]; o.aR = [3, 0]; o.mouth = 'sad'; o.brow = -1; o.hop = 4; break;
      case 'walk': {
        const w = t * 5.2, s = Math.sin(w), c = Math.cos(w);
        o.lL = [s * 28, s * 28 - 18 * Math.max(0, c)]; o.lR = [-s * 28, -s * 28 - 18 * Math.max(0, -c)];
        o.aL = [-8 + s * 24, -8 + s * 30]; o.aR = [8 - s * 24, 8 - s * 30]; o.hop = -Math.abs(Math.sin(w)) * 6; o.lean = 3; break;
      }
      case 'run': {
        const w = t * 8.5, s = Math.sin(w), c = Math.cos(w);
        o.lL = [s * 45, s * 45 - 55 * Math.max(0, c)]; o.lR = [-s * 45, -s * 45 - 55 * Math.max(0, -c)];
        o.aL = [s * 45, s * 45 + 70]; o.aR = [-s * 45, -s * 45 + 70]; o.hop = -Math.abs(Math.sin(w)) * 22; o.lean = 12; o.mouth = 'o'; break;
      }
      case 'wave':
        o.aR = [140, 170 + osc(t, 3.2, 18)]; o.mouth = 'bigsmile'; o.head = osc(t, 0.8, 3); break;
      case 'shrug':
        o.aL = [-55, -130 + osc(t, 1, 4)]; o.aR = [55, 130 - osc(t, 1, 4)]; o.head = 8; o.mouth = 'flat'; o.hop = osc(t, 1, 2); break;
      case 'smash': {
        const p = SM.smashPhase(t);
        let a;
        if (p < 0.6) a = lerp(55, 170, SM.ease.inOut(p / 0.6));
        else { const q = (p - 0.6) / 0.4; a = lerp(170, 55, Math.pow(q, 2.4)); }
        o.aR = [a, a + 8]; o.hold = 'hammer'; o.lean = lerp(-5, 10, p < 0.6 ? p / 0.6 : 1 - (p - 0.6) / 0.4 * 0.6); o.mouth = 'o'; o.brow = -1;
        o.aL = [-20, 20]; o.look = 1; break;
      }
      default: break;
    }
    return o;
  }
  SM.poseAt = poseAt;

  // vẽ nhân vật. Gốc toạ độ = hông. Cao tổng ~ 500 đơn vị.
  SM.drawFigure = function (c, ch, pal, o) {
    const t = o.t || 0, P = poseAt(o.pose, t);
    const frame = Math.floor(t * 8);
    const J = (i) => (SM.hash(i * 7.3 + frame * 1.7) - 0.5) * 2.6;
    const stick = ch.style === 'stick';
    const head = pal.head, coat = stick ? pal.head : ch.coat === '#8f9298' ? pal.coat : ch.coat, pants = stick ? pal.head : (ch.pants === '#1b1b1f' ? pal.pants : ch.pants);
    const lean = P.lean * D2R;
    const hip = [0, P.hop];
    const neck = [hip[0] + 150 * Math.sin(lean), hip[1] - 150 * Math.cos(lean)];
    const shY = (len) => [hip[0] + len * Math.sin(lean), hip[1] - len * Math.cos(lean)];
    const sh = shY(136);
    const lw = stick ? 13 : 17;

    c.save();
    c.translate(o.x, o.y);
    c.scale(o.k * (o.flip ? -1 : 1), o.k);
    c.lineCap = 'round'; c.lineJoin = 'round';

    const rim = (fn, w) => { if (pal.rim) { c.strokeStyle = pal.rim; c.lineWidth = w + 5; fn(); } };
    const limb = (p0, a, w, col, L1, L2, jid) => {
      const e = dir(a[0]), h = dir(a[1]);
      const p1 = [p0[0] + L1 * e[0] + J(jid), p0[1] + L1 * e[1] + J(jid + 1)];
      const p2 = [p1[0] + L2 * h[0] + J(jid + 2), p1[1] + L2 * h[1] + J(jid + 3)];
      const path = () => { c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.lineTo(p2[0], p2[1]); c.stroke(); };
      rim(path, w); c.strokeStyle = col; c.lineWidth = w; path();
      return p2;
    };

    // chân
    const fL = limb([hip[0] - 11, hip[1]], P.lL, lw, pants, 105, 105, 1);
    const fR = limb([hip[0] + 11, hip[1]], P.lR, lw, pants, 105, 105, 5);
    c.fillStyle = head;
    [fL, fR].forEach((f) => { c.beginPath(); c.ellipse(f[0] + 8, f[1] + 3, 20, 10, 0, 0, 7); c.fill(); });

    // tay trái (sau thân)
    const hL = limb([sh[0] - 12, sh[1]], P.aL, stick ? 13 : 17, coat, 85, 80, 9);
    // thân
    const torso = () => { c.beginPath(); c.moveTo(hip[0], hip[1]); c.lineTo(neck[0], neck[1] + 6); c.stroke(); };
    rim(torso, stick ? 13 : 46);
    c.strokeStyle = coat; c.lineWidth = stick ? 13 : 46; torso();
    if (!stick) { // cổ áo / khuy
      c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(hip[0], hip[1] - 20); c.lineTo(sh[0], sh[1] + 28); c.stroke();
    }
    // tay phải
    const hR = limb([sh[0] + 12, sh[1]], P.aR, stick ? 13 : 17, coat, 85, 80, 13);
    c.fillStyle = head;
    [hL, hR].forEach((f) => { c.beginPath(); c.arc(f[0], f[1], 10.5, 0, 7); c.fill(); });

    // đồ cầm
    if (P.hold === 'pointer') {
      const d = dir(P.aR[1]);
      c.strokeStyle = '#7a5230'; c.lineWidth = 6;
      c.beginPath(); c.moveTo(hR[0] - d[0] * 20, hR[1] - d[1] * 20); c.lineTo(hR[0] + d[0] * 150, hR[1] + d[1] * 150); c.stroke();
      c.fillStyle = pal.hot; c.beginPath(); c.arc(hR[0] + d[0] * 154, hR[1] + d[1] * 154, 9, 0, 7); c.fill();
    } else if (P.hold === 'hammer') {
      const a = P.aR[1], d = dir(a);
      c.strokeStyle = '#8a5a2b'; c.lineWidth = 10;
      c.beginPath(); c.moveTo(hR[0] - d[0] * 24, hR[1] - d[1] * 24); c.lineTo(hR[0] + d[0] * 150, hR[1] + d[1] * 150); c.stroke();
      c.save(); c.translate(hR[0] + d[0] * 150, hR[1] + d[1] * 150); c.rotate(-a * D2R);
      c.fillStyle = '#5c6068'; c.strokeStyle = pal.ink; c.lineWidth = 5;
      c.beginPath(); c.roundRect(-44, -8, 88, 44, 7); c.fill(); c.stroke();
      c.fillStyle = '#8d939c'; c.fillRect(-38, -2, 76, 8);
      c.restore();
    }

    // khăn
    if (ch.scarf && !stick) {
      const sw = osc(t, 0.7, 6);
      c.strokeStyle = ch.scarfColor; c.lineWidth = 20;
      c.beginPath(); c.moveTo(neck[0] - 34, neck[1] + 2); c.quadraticCurveTo(neck[0], neck[1] + 20, neck[0] + 34, neck[1] + 2); c.stroke();
      c.lineWidth = 17;
      c.beginPath(); c.moveTo(neck[0] + 22, neck[1] + 12); c.quadraticCurveTo(neck[0] + 26 + sw, neck[1] + 55, neck[0] + 16 + sw * 1.6, neck[1] + 98); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 3;
      c.beginPath(); c.moveTo(neck[0] + 14, neck[1] + 72 + sw * 0.5); c.lineTo(neck[0] + 30 + sw, neck[1] + 70 + sw * 0.5); c.stroke();
    }

    // đầu
    const hc = [neck[0] + 66 * Math.sin(lean + P.head * D2R) + J(20), neck[1] - 66 * Math.cos(lean + P.head * D2R) + J(21)];
    c.save();
    c.translate(hc[0], hc[1]); c.rotate((P.lean + P.head) * D2R);
    if (pal.rim) { c.fillStyle = pal.rim; c.beginPath(); c.arc(0, 0, 64, 0, 7); c.fill(); }
    c.fillStyle = head; c.beginPath(); c.arc(0, 0, 60, 0, 7); c.fill();
    // nón
    if (ch.hat === 'cap') { c.fillStyle = ch.hatColor; c.beginPath(); c.arc(0, -8, 62, Math.PI, 0); c.fill(); c.fillRect(-4, -14, 84, 14); }
    else if (ch.hat === 'beanie') { c.fillStyle = ch.hatColor; c.beginPath(); c.arc(0, -14, 61, Math.PI, 0); c.fill(); c.fillRect(-62, -20, 124, 16); c.beginPath(); c.arc(0, -76, 11, 0, 7); c.fill(); }
    else if (ch.hat === 'tophat') { c.fillStyle = '#222'; c.fillRect(-70, -52, 140, 12); c.fillRect(-42, -118, 84, 70); c.fillStyle = ch.hatColor; c.fillRect(-42, -66, 84, 14); }
    else if (ch.hat === 'crown') { c.fillStyle = '#ffd23f'; c.beginPath(); c.moveTo(-40, -52); c.lineTo(-44, -100); c.lineTo(-20, -76); c.lineTo(0, -108); c.lineTo(20, -76); c.lineTo(44, -100); c.lineTo(40, -52); c.closePath(); c.fill(); }
    // mặt
    const gc = pal.glass, look = P.look * 5, blink = o.blink;
    if (ch.glasses) {
      c.strokeStyle = gc; c.lineWidth = 5;
      c.beginPath(); c.arc(-24, -2, 20, 0, 7); c.moveTo(44, -2); c.arc(24, -2, 20, 0, 7); c.stroke();
      c.beginPath(); c.moveTo(-4, -4); c.lineTo(4, -4); c.stroke();
      c.beginPath(); c.moveTo(-44, -4); c.lineTo(-58, -8); c.moveTo(44, -4); c.lineTo(58, -8); c.stroke();
    }
    c.fillStyle = gc; c.strokeStyle = gc; c.lineWidth = 5;
    if (blink) { c.beginPath(); c.moveTo(-31 + look, -2); c.lineTo(-17 + look, -2); c.moveTo(17 + look, -2); c.lineTo(31 + look, -2); c.stroke(); }
    else { c.beginPath(); c.arc(-24 + look, -2, ch.glasses ? 6 : 8, 0, 7); c.arc(24 + look, -2, ch.glasses ? 6 : 8, 0, 7); c.fill(); }
    // lông mày
    c.lineWidth = 5;
    const br = P.brow;
    if (br) {
      c.beginPath();
      if (br === 1) { c.moveTo(-44, -34); c.lineTo(-8, -38); c.moveTo(8, -44); c.lineTo(44, -40); }
      else if (br === 2) { c.moveTo(-44, -42); c.lineTo(-8, -46); c.moveTo(8, -46); c.lineTo(44, -42); }
      else { c.moveTo(-46, -40); c.lineTo(-8, -28); c.moveTo(8, -28); c.lineTo(46, -40); }
      c.stroke();
    }
    // miệng
    const open = o.talk || 0;
    c.lineWidth = 5;
    if (open > 0.05 && P.mouth !== 'sad') {
      c.beginPath(); c.ellipse(0, 30, 13 + open * 3, 3 + open * 12, 0, 0, 7); c.fill();
    } else if (P.mouth === 'o') { c.beginPath(); c.ellipse(0, 32, 11, 15, 0, 0, 7); c.fill(); }
    else if (P.mouth === 'bigsmile') { c.beginPath(); c.arc(0, 22, 24, 0.1, Math.PI - 0.1); c.closePath(); c.fill(); }
    else if (P.mouth === 'flat') { c.beginPath(); c.moveTo(-14, 32); c.lineTo(14, 30); c.stroke(); }
    else if (P.mouth === 'sad') { c.beginPath(); c.arc(0, 46, 17, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
    else { c.beginPath(); c.arc(0, 20, 20, 0.25, Math.PI - 0.25); c.stroke(); }
    c.restore();
    c.restore();
    return P;
  };
})();
