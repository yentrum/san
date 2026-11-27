/* Bộ dựng khung hình: cảnh, chuyển cảnh, phụ đề, màu phim */
(function () {
  const SM = window.SM;
  const FONT = '"Be Vietnam Pro","Segoe UI",system-ui,-apple-system,sans-serif';
  const clamp = SM.clamp;
  const TD = 0.38; // thời lượng chuyển cảnh

  let grainCv = null;
  function grain() {
    if (grainCv) return grainCv;
    grainCv = document.createElement('canvas'); grainCv.width = grainCv.height = 160;
    const g = grainCv.getContext('2d'), im = g.createImageData(160, 160);
    for (let i = 0; i < im.data.length; i += 4) { const v = Math.random() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); return grainCv;
  }

  function layout(LW, LH, sc) {
    const land = LW > LH, hasProp = sc.props.length > 0, walk = sc.pose === 'walk' || sc.pose === 'run';
    if (land) {
      const k = (LH / 900) * (hasProp ? 1.1 : 1.22);
      const gy = LH * 0.81;
      const cx = walk ? LW * 0.42 : hasProp ? LW * (sc.flip ? 0.7 : 0.3) : LW * 0.5;
      return { land, k, gy, cx, hy: gy - 220 * k, px: LW * (sc.flip ? 0.3 : 0.69), py: LH * 0.44, ps: (LH / 900) * 1.12 };
    }
    const k = (LW / 900) * (hasProp ? 1.2 : 1.35);
    const gy = LH * (hasProp ? 0.78 : 0.76);
    return { land, k, gy, cx: LW * 0.5, hy: gy - 220 * k, px: LW * 0.5, py: LH * 0.3, ps: (LW / 900) * 1.2 };
  }

  function drawScene(c, p, i, lt, LW, LH, o) {
    const sc = p.scenes[i], pal = SM.tone(sc), L = layout(LW, LH, sc);
    const tAbs = lt + i * 1.37; // lệch pha để mỗi cảnh chuyển động khác nhau
    // camera
    const u = clamp(lt / Math.max(0.1, sc.dur), 0, 1);
    let z = SM.lerp(sc.cam.z0, sc.cam.z1, u);
    let dx = 0, dy = 0;
    (sc.punches || []).forEach((pt) => { const d = lt - pt; if (d >= 0 && d < 0.35) z += 0.07 * Math.pow(1 - d / 0.35, 2); });
    // đập búa: rung + mảnh vỡ
    let hitAge = 99;
    if (sc.pose === 'smash') {
      const ph = lt * 1.6; hitAge = (lt - Math.floor(ph) / 1.6) ; if (Math.floor(ph) < 1) hitAge = 99;
    }
    const shk = (sc.shake || 0) * 10 * Math.max(0, 1 - lt * 3) + (hitAge < 0.4 ? 12 * Math.exp(-hitAge * 9) : 0);
    if (shk > 0.1) { dx = (SM.hash(Math.floor(lt * 40) + 1) - 0.5) * 2 * shk; dy = (SM.hash(Math.floor(lt * 40) + 9) - 0.5) * 2 * shk; }
    const fx = sc.cam.fx * LW, fy = sc.cam.fy * LH;
    c.save();
    c.translate(dx, dy); c.translate(fx, fy); c.scale(z, z); c.translate(-fx, -fy);
    const scroll = sc.pose === 'walk' ? lt * 220 : sc.pose === 'run' ? lt * 520 : lt * 6;
    SM.drawBg(c, LW, LH, sc.bg, pal, tAbs, scroll, L.gy);
    // bóng nhân vật
    c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(L.cx, L.gy + 4, 120 * L.k, 16 * L.k, 0, 0, 7); c.fill();
    // đạo cụ
    const pt = lt - 0.18;
    sc.props.forEach((type, idx) => {
      let x = L.px, y = L.py, s = L.ps;
      if (idx > 0) { const off = [[1, -1], [-1, 1], [1, 1], [-1, -1]][(idx - 1) % 4]; x += off[0] * 230 * L.ps; y += off[1] * 140 * L.ps; s *= 0.5; if (!L.land) { x = LW * (off[0] > 0 ? 0.82 : 0.18); } }
      const tt = pt - idx * 0.22;
      let ox = 0, oy = 0;
      if (sc.pose === 'smash' && idx === 0 && hitAge < 0.3) { ox = (SM.hash(Math.floor(lt * 50)) - 0.5) * 18; oy = (SM.hash(Math.floor(lt * 50) + 3) - 0.5) * 12; }
      SM.drawProp(c, type, pal, x + ox, y + oy + Math.sin(tAbs * 2 + idx) * 7, s, tt);
    });
    // nhân vật
    let talk = 0;
    const words = SM.sceneWords(sc);
    for (const w of words) if (lt >= w.t0 && lt <= w.t1) { talk = p.character.mouthSync ? 0.45 + 0.55 * Math.abs(Math.sin(lt * 13)) : 0; break; }
    if (o && o.still) talk = 0.5;
    const blink = (lt * 1.0 + i * 0.37) % 3.1 < 0.12;
    const enter = SM.ease.out(clamp(lt / 0.35, 0, 1));
    const bounceY = (1 - enter) * 50;
    SM.drawFigure(c, p.character, pal, { x: L.cx, y: L.hy + bounceY, k: L.k, flip: sc.flip, t: tAbs, pose: sc.pose, talk, blink });
    // mảnh vỡ
    if (sc.pose === 'smash' && hitAge < 0.9) {
      const ox = sc.props.length ? L.px : L.cx + (sc.flip ? -1 : 1) * 200 * L.k, oy = sc.props.length ? L.py : L.gy - 30;
      for (let n = 0; n < 16; n++) {
        const a = -Math.PI * (0.1 + 0.8 * SM.hash(n + 1)), v = 260 + 380 * SM.hash(n + 40), tt = hitAge;
        const x = ox + Math.cos(a) * v * tt * (n % 2 ? 1 : -1) * (sc.flip ? -1 : 1), y = oy + Math.sin(a) * v * tt + 900 * tt * tt;
        c.save(); c.translate(x, y); c.rotate(tt * 9 * (n % 3 - 1)); c.globalAlpha = clamp(1 - tt / 0.9, 0, 1);
        c.fillStyle = n % 3 === 0 ? pal.hot : n % 3 === 1 ? '#6b6f78' : pal.ink; const s = 8 + SM.hash(n + 70) * 16;
        c.beginPath(); c.moveTo(-s, -s * 0.4); c.lineTo(s * 0.3, -s); c.lineTo(s, s * 0.5); c.lineTo(-s * 0.4, s); c.closePath(); c.fill(); c.restore();
      }
    }
    c.restore();
    // lớp phủ chữ (không bị zoom)
    drawChip(c, sc, pal, lt, LW, LH);
    drawBadge(c, sc, pal, lt, LW, LH, L);
  }

  function drawChip(c, sc, pal, lt, LW, LH) {
    if (!sc.chip) return;
    const land = LW > LH; let size = land ? 38 : 40;
    const e = SM.ease.out(clamp((lt - 0.2) / 0.4, 0, 1));
    if (e <= 0) return;
    c.save();
    c.font = `800 ${size}px ${FONT}`;
    while (c.measureText(sc.chip).width > LW * 0.84 - 56 && size > 22) { size -= 2; c.font = `800 ${size}px ${FONT}`; } const w = Math.min(LW * 0.84, c.measureText(sc.chip).width + 56), h = size + 32;
    const x = LW * (land ? 0.05 : 0.07) - (1 - e) * (w + 100), y = LH * (land ? 0.08 : 0.07);
    c.shadowColor = 'rgba(0,0,0,.25)'; c.shadowBlur = 16; c.shadowOffsetY = 6;
    c.fillStyle = pal.accent; c.beginPath(); c.roundRect(x, y, w, h, 14); c.fill();
    c.shadowColor = 'transparent'; c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'middle';
    let s = sc.chip; while (c.measureText(s).width > w - 40 && s.length > 4) s = s.slice(0, -2);
    c.fillText(s === sc.chip ? s : s + '…', x + 28, y + h / 2 + 2);
    c.restore();
  }

  function drawBadge(c, sc, pal, lt, LW, LH, L) {
    if (!sc.badge) return;
    const e = SM.ease.back(clamp((lt - 0.55) / 0.4, 0, 1)); if (e <= 0) return;
    const land = LW > LH, maxW = land ? LW * 0.42 : LW * 0.8;
    let size = land ? 84 : 76, lines = [sc.badge.toUpperCase()];
    c.save();
    c.font = `900 ${size}px ${FONT}`;
    const words = lines[0].split(' ');
    if (c.measureText(lines[0]).width > maxW && words.length > 1) { const m = Math.ceil(words.length / 2); lines = [words.slice(0, m).join(' '), words.slice(m).join(' ')]; }
    while (Math.max(...lines.map((l) => c.measureText(l).width)) > maxW && size > 30) { size -= 4; c.font = `900 ${size}px ${FONT}`; }
    const w = Math.max(...lines.map((l) => c.measureText(l).width)) + 56, lh = size * 1.12, h = lines.length * lh + 30;
    const x = L.px, y = L.props0 ? 0 : (sc.props.length ? L.py + 150 * L.ps : LH * 0.3);
    c.translate(x, Math.min(y, LH * 0.62)); c.rotate(-0.05); c.scale(e, e);
    c.shadowColor = 'rgba(0,0,0,.3)'; c.shadowBlur = 18; c.shadowOffsetY = 8;
    c.fillStyle = pal.accent2; c.strokeStyle = '#17171a'; c.lineWidth = 6;
    c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 8); c.fill(); c.shadowColor = 'transparent'; c.stroke();
    c.fillStyle = '#17171a'; c.textAlign = 'center'; c.textBaseline = 'middle';
    lines.forEach((l, i) => c.fillText(l, 0, -h / 2 + 15 + lh * (i + 0.52)));
    c.restore();
  }

  function drawChapter(c, sc, pal, lt, LW, LH) {
    if (!sc.chapter || lt > 1.7) return;
    const inn = SM.ease.out(clamp(lt / 0.3, 0, 1)), out = SM.ease.inOut(clamp((lt - 1.4) / 0.3, 0, 1));
    c.save(); c.translate(0, -LH * (1 - inn) - LH * out);
    c.fillStyle = pal.accent; c.fillRect(0, 0, LW, LH);
    c.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 8; i++) c.fillRect(LW * i / 8, 0, LW / 16, LH);
    const parts = sc.chapter.split(/\s*[·|:–-]\s*/); const a = parts[0], b = parts.slice(1).join(' · ');
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
    c.font = `800 ${LW > LH ? 40 : 40}px ${FONT}`; c.globalAlpha = 0.85; c.fillText(a.toUpperCase(), LW / 2, LH * 0.42); c.globalAlpha = 1;
    let size = LW > LH ? 110 : 84; const txt = b || a; c.font = `900 ${size}px ${FONT}`;
    while (c.measureText(txt).width > LW * 0.86 && size > 30) { size -= 4; c.font = `900 ${size}px ${FONT}`; }
    if (b) c.fillText(b, LW / 2, LH * 0.54);
    c.restore();
  }

  function wrapWords(c, words, maxW) {
    const sp = c.measureText(' ').width, lines = []; let cur = [], cw = 0;
    words.forEach((w, wi) => {
      const ww = c.measureText(w.w).width;
      if (cur.length && cw + sp + ww > maxW) { lines.push({ ws: cur, w: cw }); cur = []; cw = 0; }
      cur.push({ ...w, wi, ww }); cw += (cur.length > 1 ? sp : 0) + ww;
    });
    if (cur.length) lines.push({ ws: cur, w: cw });
    return { lines, sp };
  }

  function drawSubs(c, p, sc, lt, LW, LH) {
    const st = p.subs, words = SM.sceneWords(sc); if (!words.length) return;
    const land = LW > LH, size = st.size * (land ? 1 : 1.12);
    c.save(); c.font = `800 ${size}px ${FONT}`; c.textBaseline = 'middle'; c.textAlign = 'left';
    const { lines, sp } = wrapWords(c, words, LW * (land ? 0.8 : 0.86));
    let cur = 0; words.forEach((w, i) => { if (lt >= w.t0) cur = i; });
    const perPage = land ? 2 : 3, pages = [];
    for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage));
    const page = pages.find((pg) => pg.some((l) => l.ws.some((w) => w.wi === cur))) || pages[0];
    const lh = size * 1.32, H = page.length * lh, W = Math.max(...page.map((l) => l.w));
    const cy = st.pos === 'top' ? LH * 0.1 : st.pos === 'middle' ? LH * 0.5 - H / 2 : LH * (land ? 0.915 : 0.84) - H;
    const age = lt - words[page[0].ws[0].wi].t0, pop = SM.ease.out(clamp(age / 0.15 + 0.4, 0, 1));
    if (st.style === 'box') {
      c.fillStyle = 'rgba(12,12,16,.78)'; c.beginPath(); c.roundRect(LW / 2 - W / 2 - 28, cy - 8, W + 56, H + 16, 22); c.fill();
    }
    page.forEach((l, li) => {
      let x = LW / 2 - l.w / 2; const y = cy + li * lh + lh / 2;
      l.ws.forEach((w) => {
        const isCur = w.wi === cur, spoken = w.wi < cur;
        const col = w.emph ? st.color2 : '#fff';
        if (st.style === 'box') {
          if (isCur) { c.fillStyle = st.color; c.beginPath(); c.roundRect(x - 9, y - size * 0.62, w.ww + 18, size * 1.24, 12); c.fill(); c.fillStyle = '#141418'; }
          else c.fillStyle = w.emph ? st.color2 : spoken ? '#fff' : 'rgba(255,255,255,.72)';
          c.fillText(w.w, x, y);
        } else if (st.style === 'pop') {
          c.save(); c.translate(x + w.ww / 2, y); const sc2 = isCur ? 1.1 * pop + 0.0 : 1; c.scale(sc2, sc2);
          c.lineJoin = 'round'; c.lineWidth = size * 0.26; c.strokeStyle = '#111'; c.strokeText(w.w, -w.ww / 2, 0);
          c.fillStyle = isCur ? st.color : col; c.fillText(w.w, -w.ww / 2, 0); c.restore();
        } else {
          c.shadowColor = 'rgba(0,0,0,.85)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
          c.fillStyle = isCur ? st.color : col; c.fillText(w.w, x, y); c.shadowColor = 'transparent';
        }
        x += w.ww + sp;
      });
    });
    c.restore();
  }

  function transitionDraw(c, p, i, lt, LW, LH, o) {
    const sc = p.scenes[i], tr = sc.transition || 'cut';
    if (i === 0 || tr === 'cut' || lt >= TD) { drawScene(c, p, i, lt, LW, LH, o); return; }
    const u = lt / TD, e = SM.ease.inOut(u), prev = i - 1, plt = p.scenes[prev].dur + lt;
    const A = () => drawScene(c, p, prev, plt, LW, LH, o), B = () => drawScene(c, p, i, lt, LW, LH, o);
    switch (tr) {
      case 'fade': A(); c.save(); c.globalAlpha = e; B(); c.restore(); break;
      case 'slide': A(); c.save(); c.translate((1 - e) * LW, 0); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 40; c.beginPath(); c.rect(0, 0, LW, LH); c.clip(); B(); c.restore(); break;
      case 'push': c.save(); c.translate(-e * LW, 0); A(); c.restore(); c.save(); c.translate((1 - e) * LW, 0); B(); c.restore(); break;
      case 'zoom': c.save(); c.translate(LW / 2, LH / 2); c.scale(1 + e * 0.5, 1 + e * 0.5); c.translate(-LW / 2, -LH / 2); A(); c.restore();
        c.save(); c.globalAlpha = e; c.translate(LW / 2, LH / 2); c.scale(1.35 - e * 0.35, 1.35 - e * 0.35); c.translate(-LW / 2, -LH / 2); B(); c.restore(); break;
      case 'wipe': A(); c.save(); c.beginPath(); c.arc(LW / 2, LH / 2, e * Math.hypot(LW, LH) * 0.55, 0, 7); c.clip(); B(); c.restore(); break;
      case 'flash': if (u < 0.5) A(); else B(); c.fillStyle = `rgba(255,255,255,${1 - Math.abs(2 * u - 1)})`; c.fillRect(0, 0, LW, LH); break;
      default: B();
    }
  }
  SM.TRANSITIONS = { cut: 'Cắt thẳng', fade: 'Mờ dần', slide: 'Trượt', push: 'Đẩy', zoom: 'Zoom xuyên', wipe: 'Mở vòng tròn', flash: 'Loé sáng' };

  function applyGrade(c, W, H, g, t) {
    const dev = (fn) => { c.save(); c.setTransform(1, 0, 0, 1, 0, 0); fn(); c.restore(); };
    dev(() => {
      if (Math.abs(g.temp) > 0.01) { c.globalCompositeOperation = 'soft-light'; c.fillStyle = g.temp > 0 ? `rgba(255,140,40,${Math.min(1, g.temp * 0.9)})` : `rgba(40,120,255,${Math.min(1, -g.temp * 0.9)})`; c.fillRect(0, 0, W, H); }
      if (g.contrast > 0.01) { c.globalCompositeOperation = 'soft-light'; c.globalAlpha = clamp(g.contrast, 0, 1) * 0.7; c.drawImage(c.canvas, 0, 0, W, H); c.globalAlpha = 1; }
      if (Math.abs(g.sat) > 0.01) { c.globalCompositeOperation = 'saturation'; c.globalAlpha = clamp(Math.abs(g.sat), 0, 1) * 0.5; c.fillStyle = g.sat > 0 ? 'hsl(0,100%,50%)' : 'hsl(0,0%,50%)'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
      c.globalCompositeOperation = 'source-over';
      if (g.vignette > 0.01) { const gr = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${g.vignette * 0.75})`); c.fillStyle = gr; c.fillRect(0, 0, W, H); }
      if (g.grain > 0.01) { c.globalCompositeOperation = 'soft-light'; c.globalAlpha = clamp(g.grain, 0, 1) * 0.35; const gc = grain(), ox = (Math.floor(t * 12) * 37) % 160, oy = (Math.floor(t * 12) * 53) % 160;
        for (let x = -ox; x < W; x += 160) for (let y = -oy; y < H; y += 160) c.drawImage(gc, x, y); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    });
  }

  SM.render = function (c, p, t, o) {
    o = o || {};
    const W = c.canvas.width, H = c.canvas.height, A = SM.ASPECTS[p.aspect] || SM.ASPECTS['16:9'];
    const LW = A.lw, LH = A.lh;
    c.save(); c.setTransform(W / LW, 0, 0, H / LH, 0, 0);
    c.fillStyle = '#000'; c.fillRect(0, 0, LW, LH);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowColor = 'transparent';
    const at = SM.sceneAt(p, t);
    if (!at) {
      c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, LW, LH); c.fillStyle = '#9a9588'; c.font = `700 44px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('Chưa có cảnh nào — nhập kịch bản rồi bấm “Tạo video tự động”', LW / 2, LH / 2);
      c.restore(); return;
    }
    // clip khung để hiệu ứng không tràn
    c.save(); c.beginPath(); c.rect(0, 0, LW, LH); c.clip();
    transitionDraw(c, p, at.i, at.lt, LW, LH, o);
    drawChapter(c, p.scenes[at.i], SM.tone(p.scenes[at.i]), at.lt, LW, LH);
    c.restore();
    c.restore();
    // màu phim (toàn cục + riêng từng cảnh)
    const sg = p.scenes[at.i].grade || {}, g = p.grade;
    applyGrade(c, W, H, { temp: g.temp + (sg.temp || 0), contrast: g.contrast + (sg.contrast || 0), sat: g.sat + (sg.sat || 0), vignette: clamp(g.vignette + (sg.vignette || 0), 0, 1), grain: g.grain }, t);
    c.save(); c.setTransform(W / LW, 0, 0, H / LH, 0, 0);
    if (p.subs.on && !o.noSubs) drawSubs(c, p, p.scenes[at.i], at.lt, LW, LH);
    if (o.guides) {
      c.strokeStyle = 'rgba(255,60,90,.9)'; c.setLineDash([14, 10]); c.lineWidth = 3;
      c.strokeRect(LW * 0.05, LH * 0.05, LW * 0.9, LH * 0.9); c.setLineDash([]);
      c.fillStyle = 'rgba(255,60,90,.9)'; c.font = `800 28px ${FONT}`; c.textAlign = 'right'; c.textBaseline = 'top';
      c.fillText(`KIỂM TRA · Cảnh ${at.i + 1}/${p.scenes.length} · ${p.scenes[at.i].pose}`, LW * 0.95, LH * 0.055);
    }
    c.restore();
  };
  SM.TD = TD;
})();
