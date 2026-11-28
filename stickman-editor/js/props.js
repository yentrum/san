/* Đạo cụ (icon vẽ bằng canvas) và phông nền */
(function () {
  const SM = window.SM;
  const TAU = Math.PI * 2;
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
  const fs = (c, fill, p, lw = 8) => { if (fill) { c.fillStyle = fill; c.fill(); } c.strokeStyle = p.ink; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const txt = (c, s, x, y, size, col, w = 900) => { c.font = `${w} ${size}px "Be Vietnam Pro","Segoe UI",system-ui,sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(s, x, y); };

  SM.PROPS = {
    warning: 'Cảnh báo', money: 'Tiền', chartUp: 'Biểu đồ tăng', chartDown: 'Biểu đồ giảm', bulb: 'Bóng đèn', question: 'Dấu hỏi', cart: 'Giỏ hàng', box: 'Hộp hàng',
    phone: 'Điện thoại', robot: 'Robot AI', stop: 'Dừng', lock: 'Khoá', clock: 'Đồng hồ', heart: 'Trái tim', star: 'Ngôi sao', check: 'Dấu tích', cross: 'Dấu sai',
    megaphone: 'Loa', trophy: 'Cúp', target: 'Mục tiêu', fire: 'Lửa', rocket: 'Tên lửa', gear: 'Bánh răng', doc: 'Tài liệu', magnifier: 'Kính lúp', shield: 'Khiên',
    play: 'Video', tower: 'Tháp canh', thumb: 'Like',
  };

  const D = {
    warning(c, p, t) {
      const s = 1 + Math.sin(t * 6) * 0.03;
      c.scale(s, s);
      c.beginPath(); c.moveTo(0, -130); c.lineTo(140, 110); c.lineTo(-140, 110); c.closePath(); c.lineJoin = 'round';
      fs(c, p.accent2, p, 12);
      rr(c, -12, -50, 24, 90, 12); c.fillStyle = p.ink; c.fill();
      c.beginPath(); c.arc(0, 72, 14, 0, TAU); c.fill();
    },
    money(c, p, t) {
      c.rotate(-0.08);
      rr(c, -150, -80, 300, 160, 18); fs(c, '#7cc67f', p);
      rr(c, -128, -58, 256, 116, 10); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 3; c.stroke();
      c.beginPath(); c.arc(0, 0, 44, 0, TAU); fs(c, '#a6dba4', p, 5);
      txt(c, '$', 0, 4, 66, p.ink);
      for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(120 + i * 6, 100 - i * 22, 52, 18, 0, 0, TAU); fs(c, '#ffd23f', p, 6); }
    },
    chartUp(c, p, t) {
      rr(c, -150, -120, 300, 240, 20); fs(c, p.card, p);
      const g = SM.clamp(t * 1.6, 0, 1);
      [0.25, 0.45, 0.65, 1].forEach((h, i) => { rr(c, -110 + i * 62, 90 - 170 * h * g, 44, 170 * h * g, 6); fs(c, '#2e9e4f', p, 5); });
      c.beginPath(); c.moveTo(-120, 40 * (1 - g) + 30); c.lineTo(-40, 10); c.lineTo(20, -10); c.lineTo(110, -86 * g);
      c.strokeStyle = p.hot; c.lineWidth = 9; c.stroke();
      c.beginPath(); c.moveTo(110, -86 * g - 22); c.lineTo(118, -86 * g + 6); c.lineTo(88, -86 * g - 4); c.closePath(); c.fillStyle = p.hot; c.fill();
    },
    chartDown(c, p, t) {
      rr(c, -150, -120, 300, 240, 20); fs(c, p.card, p);
      const g = SM.clamp(t * 1.6, 0, 1);
      [1, 0.7, 0.45, 0.22].forEach((h, i) => { rr(c, -110 + i * 62, 90 - 170 * h * g, 44, 170 * h * g, 6); fs(c, p.hot, p, 5); });
      c.beginPath(); c.moveTo(-120, -80); c.lineTo(-30, -30); c.lineTo(30, -10); c.lineTo(112, 52 * g);
      c.strokeStyle = p.ink; c.lineWidth = 9; c.stroke();
      c.beginPath(); c.moveTo(118, 66 * g); c.lineTo(86, 56 * g); c.lineTo(108, 36 * g); c.closePath(); c.fillStyle = p.ink; c.fill();
    },
    bulb(c, p, t) {
      c.save(); c.strokeStyle = p.accent2; c.lineWidth = 9; c.lineCap = 'round';
      for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + t * 0.4, r1 = 130 + Math.sin(t * 5 + i) * 6; c.beginPath(); c.moveTo(Math.cos(a) * r1, -30 + Math.sin(a) * r1); c.lineTo(Math.cos(a) * (r1 + 30), -30 + Math.sin(a) * (r1 + 30)); c.stroke(); }
      c.restore();
      c.beginPath(); c.arc(0, -30, 88, 0, TAU); fs(c, p.accent2, p, 9);
      rr(c, -36, 52, 72, 54, 10); fs(c, '#c9c9cf', p, 8);
      c.beginPath(); c.moveTo(-20, 110); c.lineTo(20, 110); c.lineTo(10, 132); c.lineTo(-10, 132); c.closePath(); fs(c, '#8c8c94', p, 7);
      c.beginPath(); c.moveTo(-24, 52); c.lineTo(-24, 10); c.lineTo(0, -14); c.lineTo(24, 10); c.lineTo(24, 52); c.strokeStyle = p.ink; c.lineWidth = 6; c.stroke();
    },
    question(c, p, t) {
      const b = Math.sin(t * 3) * 6;
      c.translate(0, b);
      c.beginPath(); c.arc(0, 0, 120, 0, TAU); fs(c, p.accent, p, 10);
      txt(c, '?', 0, 8, 190, '#fff');
    },
    cart(c, p) {
      c.beginPath(); c.moveTo(-150, -100); c.lineTo(-100, -100); c.lineTo(-60, 60); c.lineTo(110, 60); c.lineTo(140, -50); c.lineTo(-90, -50);
      c.lineJoin = 'round'; c.strokeStyle = p.ink; c.lineWidth = 14; c.stroke();
      c.beginPath(); c.moveTo(-85, -44); c.lineTo(-62, 54); c.lineTo(108, 54); c.lineTo(134, -44); c.closePath(); c.fillStyle = p.accent; c.fill();
      rr(c, -20, -110, 70, 56, 6); fs(c, '#d9a35f', p, 6);
      [-40, 90].forEach((x) => { c.beginPath(); c.arc(x, 112, 24, 0, TAU); fs(c, p.ink, p, 6); c.fillStyle = '#fff'; c.beginPath(); c.arc(x, 112, 8, 0, TAU); c.fill(); });
    },
    box(c, p) {
      rr(c, -110, -40, 220, 150, 8); fs(c, '#d9a35f', p);
      c.beginPath(); c.moveTo(-110, -40); c.lineTo(-70, -100); c.lineTo(150, -100); c.lineTo(110, -40); c.closePath(); fs(c, '#e8b878', p);
      c.fillStyle = '#f4e3c5'; c.fillRect(-22, -40, 44, 150); c.fillRect(-18 + 60, -100, 40, 60);
      c.strokeStyle = p.ink; c.lineWidth = 5; c.strokeRect(-22, -40, 44, 150);
    },
    phone(c, p, t) {
      rr(c, -75, -140, 150, 280, 26); fs(c, '#23252b', p, 9);
      rr(c, -60, -118, 120, 232, 10); c.fillStyle = '#eef3f6'; c.fill();
      c.beginPath(); c.moveTo(-22, -40); c.lineTo(34, -4); c.lineTo(-22, 32); c.closePath(); c.fillStyle = p.hot; c.fill();
      rr(c, -48, 70, 96, 14, 7); c.fillStyle = '#c4ccd2'; c.fill();
      const f = (t * 0.6) % 1;
      c.globalAlpha = 1 - f; c.fillStyle = p.hot; c.beginPath(); c.arc(70 + f * 20, -110 - f * 80, 18, 0, TAU); c.fill(); c.globalAlpha = 1;
    },
    robot(c, p, t) {
      c.strokeStyle = p.ink; c.lineWidth = 8; c.beginPath(); c.moveTo(0, -128); c.lineTo(0, -90); c.stroke();
      c.beginPath(); c.arc(0, -138, 12 + Math.sin(t * 6) * 2, 0, TAU); fs(c, p.hot, p, 6);
      rr(c, -100, -92, 200, 150, 28); fs(c, '#cfd6dc', p, 9);
      [-42, 42].forEach((x) => { c.beginPath(); c.arc(x, -30, 24, 0, TAU); fs(c, '#fff', p, 6); c.fillStyle = p.accent; c.beginPath(); c.arc(x + Math.sin(t * 2) * 5, -30, 11, 0, TAU); c.fill(); });
      rr(c, -52, 14, 104, 28, 8); c.fillStyle = p.ink; c.fill(); c.fillStyle = '#fff';
      for (let i = 0; i < 5; i++) c.fillRect(-42 + i * 20, 20, 10, 16);
      rr(c, -74, 66, 148, 62, 16); fs(c, p.accent, p, 8);
      [-116, 116].forEach((x) => { rr(c, x - 10, -40, 20, 60, 8); fs(c, '#9aa4ac', p, 6); });
    },
    stop(c, p, t) {
      const s = 1 + Math.sin(t * 7) * 0.025; c.scale(s, s);
      c.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + TAU / 16; c.lineTo(Math.cos(a) * 130, Math.sin(a) * 130); } c.closePath(); fs(c, p.hot, p, 12);
      txt(c, 'STOP', 0, 4, 66, '#fff');
    },
    lock(c, p) {
      c.beginPath(); c.arc(0, -40, 64, Math.PI, 0); c.lineTo(64, 0); c.moveTo(-64, 0); c.lineTo(-64, -40); c.strokeStyle = p.ink; c.lineWidth = 30; c.stroke();
      c.strokeStyle = '#c9ccd2'; c.lineWidth = 16; c.beginPath(); c.arc(0, -40, 64, Math.PI, 0); c.lineTo(64, 0); c.moveTo(-64, 0); c.lineTo(-64, -40); c.stroke();
      rr(c, -100, -6, 200, 150, 22); fs(c, p.accent2, p, 10);
      c.beginPath(); c.arc(0, 56, 18, 0, TAU); c.fillStyle = p.ink; c.fill(); c.fillRect(-7, 56, 14, 44);
    },
    clock(c, p, t) {
      c.beginPath(); c.arc(0, 0, 122, 0, TAU); fs(c, p.card, p, 11);
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 100, Math.sin(a) * 100); c.lineTo(Math.cos(a) * 112, Math.sin(a) * 112); c.strokeStyle = p.ink; c.lineWidth = 6; c.stroke(); }
      c.lineCap = 'round'; c.lineWidth = 10; c.strokeStyle = p.ink;
      const m = t * 2.2, h = m / 12;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(h) * 58, -Math.cos(h) * 58); c.stroke();
      c.lineWidth = 7; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.sin(m) * 90, -Math.cos(m) * 90); c.stroke();
      c.beginPath(); c.arc(0, 0, 9, 0, TAU); c.fillStyle = p.hot; c.fill();
    },
    heart(c, p, t) {
      const s = 1 + Math.abs(Math.sin(t * 4)) * 0.07; c.scale(s, s);
      c.beginPath(); c.moveTo(0, 100); c.bezierCurveTo(-170, -10, -110, -130, 0, -50); c.bezierCurveTo(110, -130, 170, -10, 0, 100); c.closePath(); fs(c, '#ff4d6d', p, 11);
      c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-62, -48, 16, 28, -0.6, 0, TAU); c.fill();
    },
    star(c, p, t) {
      c.rotate(Math.sin(t * 2) * 0.12);
      c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 56 : 135, a = (i / 10) * TAU - Math.PI / 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); fs(c, p.accent2, p, 10);
    },
    check(c, p) {
      c.beginPath(); c.arc(0, 0, 120, 0, TAU); fs(c, '#2e9e4f', p, 10);
      c.beginPath(); c.moveTo(-56, 4); c.lineTo(-14, 48); c.lineTo(62, -44); c.strokeStyle = '#fff'; c.lineWidth = 24; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
    },
    cross(c, p) {
      c.beginPath(); c.arc(0, 0, 120, 0, TAU); fs(c, p.hot, p, 10);
      c.beginPath(); c.moveTo(-48, -48); c.lineTo(48, 48); c.moveTo(48, -48); c.lineTo(-48, 48); c.strokeStyle = '#fff'; c.lineWidth = 24; c.lineCap = 'round'; c.stroke();
    },
    megaphone(c, p, t) {
      c.beginPath(); c.moveTo(-100, -40); c.lineTo(60, -110); c.lineTo(60, 110); c.lineTo(-100, 40); c.closePath(); fs(c, p.accent, p, 10);
      rr(c, -140, -44, 56, 88, 12); fs(c, '#d8dde2', p, 8);
      rr(c, -112, 40, 30, 70, 8); fs(c, p.ink, p, 4);
      c.strokeStyle = p.ink; c.lineWidth = 9; c.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const k = (t * 1.4 + i * 0.33) % 1; c.globalAlpha = 1 - k; c.beginPath(); c.arc(70, 0, 40 + k * 70, -0.6, 0.6); c.stroke(); }
      c.globalAlpha = 1;
    },
    trophy(c, p) {
      c.beginPath(); c.moveTo(-80, -110); c.lineTo(80, -110); c.quadraticCurveTo(76, 30, 0, 50); c.quadraticCurveTo(-76, 30, -80, -110); fs(c, p.accent2, p, 10);
      c.beginPath(); c.arc(-86, -62, 34, Math.PI * 0.5, Math.PI * 1.5); c.moveTo(86, -96); c.arc(86, -62, 34, -Math.PI * 0.5, Math.PI * 0.5); c.strokeStyle = p.ink; c.lineWidth = 10; c.stroke();
      c.fillStyle = p.ink; c.fillRect(-10, 48, 20, 40); rr(c, -62, 86, 124, 36, 8); fs(c, p.ink, p, 4);
      txt(c, '1', 0, -36, 64, p.ink);
    },
    target(c, p, t) {
      [120, 84, 48, 18].forEach((r, i) => { c.beginPath(); c.arc(0, 0, r, 0, TAU); fs(c, i % 2 ? '#fff' : p.hot, p, 7); });
      const k = SM.ease.out(SM.clamp(t * 2, 0, 1));
      c.save(); c.translate(70 * (1 - k) + 0, -70 * (1 - k) - 0); c.translate(0, 0);
      c.strokeStyle = p.ink; c.lineWidth = 9; c.beginPath(); c.moveTo(0, 0); c.lineTo(100 * (1 - k) + 0, -100 * (1 - k)); c.moveTo(100 * (1 - k), -100 * (1 - k)); c.lineTo(130 * (1 - k) + 40, -130 * (1 - k) - 40 * (1 - k)); c.stroke();
      c.restore();
    },
    fire(c, p, t) {
      const w = Math.sin(t * 8) * 6;
      c.beginPath(); c.moveTo(0, -140); c.bezierCurveTo(70 + w, -60, 120, 0, 90, 70); c.bezierCurveTo(70, 120, -70, 120, -90, 70); c.bezierCurveTo(-120, 0, -60 - w, -50, 0, -140); fs(c, '#ff8a1f', p, 10);
      c.beginPath(); c.moveTo(0, -40); c.bezierCurveTo(40, 10, 60, 40, 40, 80); c.bezierCurveTo(20, 110, -40, 110, -46, 70); c.bezierCurveTo(-52, 30, -10, 10, 0, -40); c.fillStyle = '#ffd23f'; c.fill();
    },
    rocket(c, p, t) {
      c.rotate(Math.PI / 4 * 0.6 + Math.sin(t * 3) * 0.03);
      c.beginPath(); c.moveTo(0, 130); c.quadraticCurveTo(26 + Math.sin(t * 14) * 6, 200, 0, 230); c.quadraticCurveTo(-26, 200, 0, 130); c.fillStyle = '#ff8a1f'; c.fill();
      c.beginPath(); c.moveTo(0, -150); c.bezierCurveTo(70, -80, 70, 60, 50, 130); c.lineTo(-50, 130); c.bezierCurveTo(-70, 60, -70, -80, 0, -150); fs(c, '#f2f4f7', p, 9);
      c.beginPath(); c.arc(0, -30, 30, 0, TAU); fs(c, p.accent, p, 7);
      c.beginPath(); c.moveTo(50, 60); c.lineTo(100, 130); c.lineTo(50, 120); c.closePath(); fs(c, p.hot, p, 7);
      c.beginPath(); c.moveTo(-50, 60); c.lineTo(-100, 130); c.lineTo(-50, 120); c.closePath(); fs(c, p.hot, p, 7);
    },
    gear(c, p, t) {
      c.rotate(t * 0.5);
      c.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, r = i % 2 ? 100 : 130; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.lineTo(Math.cos(a + TAU / 32) * r, Math.sin(a + TAU / 32) * r); } c.closePath(); fs(c, '#aab3bc', p, 9);
      c.beginPath(); c.arc(0, 0, 44, 0, TAU); fs(c, p.card, p, 8);
    },
    doc(c, p) {
      rr(c, -100, -140, 200, 270, 14); fs(c, p.card, p, 9);
      for (let i = 0; i < 4; i++) { const y = -90 + i * 52; c.beginPath(); c.moveTo(-60, y + 6); c.lineTo(-48, y + 18); c.lineTo(-30, y - 6); c.strokeStyle = '#2e9e4f'; c.lineWidth = 8; c.stroke(); rr(c, -14, y - 6, 86, 14, 6); c.fillStyle = '#c9ced4'; c.fill(); }
    },
    magnifier(c, p, t) {
      c.translate(Math.sin(t * 2) * 10, Math.cos(t * 2) * 6);
      c.strokeStyle = p.ink; c.lineWidth = 26; c.lineCap = 'round'; c.beginPath(); c.moveTo(48, 48); c.lineTo(120, 120); c.stroke();
      c.beginPath(); c.arc(-20, -20, 88, 0, TAU); fs(c, 'rgba(180,225,250,.7)', p, 14);
      c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 8; c.beginPath(); c.arc(-20, -20, 62, Math.PI * 1.1, Math.PI * 1.5); c.stroke();
    },
    shield(c, p) {
      c.beginPath(); c.moveTo(0, -140); c.lineTo(110, -100); c.quadraticCurveTo(116, 60, 0, 140); c.quadraticCurveTo(-116, 60, -110, -100); c.closePath(); fs(c, p.accent, p, 11);
      c.beginPath(); c.moveTo(-44, 0); c.lineTo(-10, 38); c.lineTo(50, -34); c.strokeStyle = '#fff'; c.lineWidth = 22; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
    },
    play(c, p, t) {
      const s = 1 + Math.sin(t * 3) * 0.02; c.scale(s, s);
      rr(c, -150, -95, 300, 190, 46); fs(c, p.hot, p, 10);
      c.beginPath(); c.moveTo(-34, -54); c.lineTo(62, 0); c.lineTo(-34, 54); c.closePath(); c.fillStyle = '#fff'; c.fill();
    },
    tower(c, p, t) {
      c.beginPath(); c.moveTo(-80, 130); c.lineTo(-64, -40); c.lineTo(64, -40); c.lineTo(80, 130); c.closePath(); fs(c, '#b9ac95', p, 9);
      for (let r = 0; r < 4; r++) { c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-76 + r * 3, 10 + r * 30); c.lineTo(76 - r * 3, 10 + r * 30); c.stroke(); }
      rr(c, -80, -80, 160, 44, 4); fs(c, '#c8bba3', p, 9);
      [-70, -30, 10, 50].forEach((x) => { c.fillStyle = '#c8bba3'; c.fillRect(x, -112, 24, 34); c.strokeStyle = p.ink; c.lineWidth = 7; c.strokeRect(x, -112, 24, 34); });
      c.beginPath(); c.arc(0, 50, 26, Math.PI, 0); c.lineTo(26, 130); c.lineTo(-26, 130); c.closePath(); c.fillStyle = p.ink; c.fill();
      c.strokeStyle = p.ink; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -112); c.lineTo(0, -170); c.stroke();
      c.beginPath(); c.moveTo(0, -170); c.lineTo(46 + Math.sin(t * 4) * 6, -156); c.lineTo(0, -142); c.closePath(); c.fillStyle = p.hot; c.fill();
    },
    thumb(c, p, t) {
      c.rotate(-0.1 + Math.sin(t * 4) * 0.05);
      rr(c, -120, -10, 62, 130, 10); fs(c, p.accent, p, 9);
      c.beginPath(); c.moveTo(-50, 6); c.lineTo(-20, -60); c.quadraticCurveTo(-4, -130, 30, -110); c.quadraticCurveTo(52, -90, 36, -40); c.lineTo(110, -40); c.quadraticCurveTo(140, -34, 128, 0); c.lineTo(122, 90); c.quadraticCurveTo(116, 124, 80, 124); c.lineTo(-50, 124); c.closePath(); fs(c, '#ffd9b0', p, 9);
    },
  };

  // vẽ đạo cụ tại (x,y) với tỉ lệ s. t = thời gian từ lúc xuất hiện (giây)
  SM.drawProp = function (c, type, p, x, y, s, t) {
    const fn = D[type] || D.star;
    c.save(); c.translate(x, y);
    const a = SM.ease.back(SM.clamp(t / 0.45, 0, 1));
    if (t < 0) { c.restore(); return; }
    c.scale(s * a, s * a);
    // bóng đổ nhẹ
    c.shadowColor = 'rgba(0,0,0,.18)'; c.shadowBlur = 24; c.shadowOffsetY = 10;
    c.lineJoin = 'round'; c.lineCap = 'round';
    fn(c, p, t);
    c.restore();
  };

  // ===== phông nền =====
  SM.BGS = { paper: 'Giấy trơn', grid: 'Lưới', dots: 'Chấm bi', sunburst: 'Tia nắng', stripes: 'Sọc chéo', city: 'Thành phố', room: 'Căn phòng', night: 'Đêm sao', gradient: 'Chuyển màu' };
  SM.drawBg = function (c, W, H, type, p, t, scroll, groundY) {
    const g0 = c.createRadialGradient(W / 2, H * 0.45, 100, W / 2, H * 0.45, Math.max(W, H) * 0.8);
    g0.addColorStop(0, p.bg); g0.addColorStop(1, p.bg2);
    c.fillStyle = g0; c.fillRect(-W, -H, W * 3, H * 3);
    c.save();
    switch (type) {
      case 'grid': {
        c.strokeStyle = 'rgba(0,0,0,.07)'; c.lineWidth = 2; const o = (scroll % 60);
        for (let x = -o; x < W; x += 60) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
        for (let y = 0; y < H; y += 60) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
        c.strokeStyle = 'rgba(0,0,0,.12)'; for (let x = -(scroll % 300); x < W; x += 300) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
        break;
      }
      case 'dots': {
        c.fillStyle = 'rgba(0,0,0,.09)'; const o = scroll % 50;
        for (let y = 20; y < H; y += 50) for (let x = 20 - o; x < W + 50; x += 50) { c.beginPath(); c.arc(x, y, 3.5, 0, TAU); c.fill(); }
        break;
      }
      case 'sunburst': {
        c.translate(W / 2, H * 0.45); c.rotate(t * 0.05); c.fillStyle = 'rgba(255,255,255,.28)';
        const R = Math.hypot(W, H);
        for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, a, a + TAU / 36); c.closePath(); c.fill(); }
        break;
      }
      case 'stripes': {
        c.fillStyle = 'rgba(0,0,0,.045)'; const o = (t * 20 + scroll) % 120;
        for (let x = -H - 120 + o; x < W + H; x += 120) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 60, 0); c.lineTo(x + 60 - H, H); c.lineTo(x - H, H); c.closePath(); c.fill(); }
        break;
      }
      case 'city': {
        const layer = (par, base, col, minH, maxH, w) => {
          c.fillStyle = col; const off = (scroll * par) % (w * 20);
          for (let i = -2; i < Math.ceil(W / w) + 22; i++) {
            const hh = minH + SM.hash(i + (par * 100 | 0) % 17) * (maxH - minH), x = i * w - off;
            if (x > W + w || x < -w * 2) continue;
            c.fillRect(x, base - hh, w - 6, hh);
            if (par > 0.4) { c.fillStyle = 'rgba(255,255,255,.35)'; for (let wy = base - hh + 18; wy < base - 20; wy += 34) for (let wx = x + 12; wx < x + w - 24; wx += 30) c.fillRect(wx, wy, 12, 16); c.fillStyle = col; }
          }
        };
        layer(0.3, groundY, 'rgba(0,0,0,.07)', 160, 420, 110);
        layer(0.6, groundY, 'rgba(0,0,0,.12)', 100, 300, 140);
        break;
      }
      case 'room': {
        c.fillStyle = 'rgba(0,0,0,.05)'; c.fillRect(0, groundY - 40, W, 40);
        const wx = W * 0.62, wy = H * 0.14, ww = Math.min(380, W * 0.3), wh = 300;
        c.fillStyle = 'rgba(190,225,250,.75)'; c.fillRect(wx, wy, ww, wh);
        c.strokeStyle = p.ink; c.lineWidth = 9; c.strokeRect(wx, wy, ww, wh);
        c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh / 2); c.lineTo(wx + ww, wy + wh / 2); c.stroke();
        c.fillStyle = 'rgba(0,0,0,.1)'; c.fillRect(W * 0.08, H * 0.2, 150, 110);
        c.strokeStyle = p.ink; c.lineWidth = 7; c.strokeRect(W * 0.08, H * 0.2, 150, 110);
        break;
      }
      case 'night': {
        for (let i = 0; i < 60; i++) { const x = SM.hash(i) * W, y = SM.hash(i + 99) * H * 0.7, r = 1.5 + SM.hash(i + 7) * 2.5, a = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.5 + SM.hash(i + 3)) + i)); c.fillStyle = `rgba(255,255,255,${a})`; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
        c.fillStyle = '#f6edc8'; c.beginPath(); c.arc(W * 0.82, H * 0.2, 60, 0, TAU); c.fill();
        c.fillStyle = p.bg; c.beginPath(); c.arc(W * 0.82 + 24, H * 0.2 - 10, 54, 0, TAU); c.fill();
        break;
      }
      case 'gradient': {
        const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, p.accent + '55'); g.addColorStop(1, p.accent2 + '55');
        c.fillStyle = g; c.fillRect(0, 0, W, H); break;
      }
      default: break;
    }
    c.restore();
    // sàn
    c.fillStyle = p.floor; c.globalAlpha = 0.55; c.fillRect(-W, groundY, W * 3, H * 2); c.globalAlpha = 1;
    c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(-W, groundY, W * 3, 4);
  };
})();
