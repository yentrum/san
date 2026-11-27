/* Giao diện & điều khiển: kịch bản, timeline, phát, xuất video */
(function () {
  const SM = window.SM, { $, $$, h, clamp } = SM, AU = SM.Audio, AG = SM.Agents;
  const S = { p: null, t: 0, playing: false, sel: 0, pps: 70, guides: false, hist: [], hi: -1, rightTab: 'log', leftTab: 'script', running: false, exporting: false, thumbs: new Map(), thumbQ: [] };
  const cv = $('#cv'), cx = cv.getContext('2d');
  const syncers = [];
  const toast = (m, ms = 2600) => { const t = $('#toast'); t.textContent = m; t.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => (t.style.display = 'none'), ms); };

  // ================= dự án =================
  const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
  const merge = (d, o) => { for (const k in o) d[k] = isObj(o[k]) && isObj(d[k]) ? merge(d[k], o[k]) : o[k]; return d; };
  function load() {
    try { const j = localStorage.getItem('sm_proj'); if (j) { const p = merge(SM.defaultProject(), JSON.parse(j)); p.scenes.forEach((s) => (s.cam = Object.assign({ z0: 1, z1: 1.08, fx: 0.5, fy: 0.5 }, s.cam))); return p; } } catch (e) {}
    return SM.defaultProject();
  }
  S.p = load(); SM.touch(S.p);
  const getPath = (path) => path.split('.').reduce((o, k) => o[k], S.p);
  const setPath = (path, v) => { const ks = path.split('.'), last = ks.pop(); ks.reduce((o, k) => o[k], S.p)[last] = v; };
  let saveT;
  function save() {
    clearTimeout(saveT);
    saveT = setTimeout(() => { try { localStorage.setItem('sm_proj', SM.serialize(S.p)); $('#saved').textContent = '✓ Đã lưu ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }); } catch (e) { $('#saved').textContent = '⚠ Không lưu được'; } }, 350);
  }
  function snap(co) {
    const j = SM.serialize(S.p);
    if (co && snap.co === co && Date.now() - snap.at < 900 && S.hi === S.hist.length - 1) { S.hist[S.hi] = j; }
    else { S.hist = S.hist.slice(0, S.hi + 1); S.hist.push(j); if (S.hist.length > 80) S.hist.shift(); S.hi = S.hist.length - 1; }
    snap.co = co; snap.at = Date.now();
  }
  function restore(j) { S.p = merge(SM.defaultProject(), JSON.parse(j)); SM.touch(S.p); S.sel = clamp(S.sel, 0, Math.max(0, S.p.scenes.length - 1)); syncControls(); refresh({ inspector: true, full: true }); save(); }
  const undo = () => { if (S.hi > 0) { S.hi--; restore(S.hist[S.hi]); } };
  const redo = () => { if (S.hi < S.hist.length - 1) { S.hi++; restore(S.hist[S.hi]); } };
  function commit(o = {}) { SM.touch(S.p); snap(o.co); refresh(o); save(); }

  // ================= canvas & vẽ =================
  function sizeCanvas() {
    const A = SM.ASPECTS[S.p.aspect], sc = S.exportScale || 1, w = Math.round((A.w * sc) / 2) * 2, hh = Math.round((A.h * sc) / 2) * 2;
    if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
    const wrap = $('#stageWrap'), aw = wrap.clientWidth - 24, ah = wrap.clientHeight - 24;
    if (aw <= 0 || ah <= 0) return;
    const r = A.w / A.h; let W = aw, H = aw / r; if (H > ah) { H = ah; W = ah * r; }
    cv.style.width = Math.floor(W) + 'px'; cv.style.height = Math.floor(H) + 'px';
  }
  function draw() { SM.render(cx, S.p, S.t, { guides: S.guides && !S.exporting }); updateTimeLbl(); }
  function updateTimeLbl() { $('#timeLbl').textContent = SM.fmt(S.t) + ' / ' + SM.fmt(SM.timeline(S.p).total); }
  window.addEventListener('resize', () => { sizeCanvas(); draw(); });

  // ================= phát =================
  const clock = () => (AU.ctx ? AU.ctx.currentTime : performance.now() / 1000);
  let raf = 0, onTick = null, onEnd = null;
  function total() { return SM.timeline(S.p).total; }
  function play(opts = {}) {
    if (!S.p.scenes.length) return toast('Chưa có cảnh — hãy tạo video từ kịch bản trước');
    AU.init(); if (AU.ctx.state === 'suspended') AU.ctx.resume();
    if (S.t >= total() - 0.05) S.t = 0;
    S.playing = true; S.t0 = S.t; S.c0 = clock(); S.prevT = S.t - 0.001; onTick = opts.onTick; onEnd = opts.onEnd; S.tail = opts.tail || 0;
    const p = S.p, vd = AU.voice.buffer;
    AU.startMusic(p.music.style, p.music.vol * (vd && p.music.duck ? 0.35 : 1), S.t);
    if (vd) AU.startVoice(S.t, p.voice.vol);
    $('#playBtn').textContent = '❚❚';
    cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
  }
  function stop() {
    if (!S.playing) return;
    S.playing = false; cancelAnimationFrame(raf); AU.stopMusic(); AU.stopVoice(); $('#playBtn').textContent = '▶';
    const e = onEnd; onEnd = null; onTick = null; if (e) e();
  }
  function loop() {
    if (!S.playing) return;
    const t = S.t0 + (clock() - S.c0), tot = total();
    // hiệu ứng âm
    if (S.p.sfx.on) {
      const tl = SM.timeline(S.p), a = SM.sceneAt(S.p, Math.max(0, S.prevT)), b = SM.sceneAt(S.p, Math.min(t, tot - 1e-4));
      if (a && b) for (let i = a.i; i <= b.i; i++) (S.p.scenes[i].sfx || []).forEach((e) => { const g = tl.starts[i] + e.t; if (g > S.prevT && g <= t) AU.sfx(e.n, e.v * S.p.sfx.vol); });
    }
    S.prevT = t;
    if (t >= tot + S.tail) { S.t = tot; draw(); stop(); updatePlayhead(); return; }
    S.t = Math.min(t, tot);
    const at = SM.sceneAt(S.p, S.t); if (at && at.i !== S.sel) { S.sel = at.i; markSel(); }
    draw(); updatePlayhead(true); if (onTick) onTick(S.t);
    raf = requestAnimationFrame(loop);
  }
  function seek(t, keep) {
    const was = S.playing; if (was && !keep) { S.playing = false; cancelAnimationFrame(raf); AU.stopMusic(); AU.stopVoice(); }
    S.t = clamp(t, 0, total()); const at = SM.sceneAt(S.p, S.t); if (at && at.i !== S.sel) { S.sel = at.i; markSel(); }
    draw(); updatePlayhead();
    if (was && !keep) { $('#playBtn').textContent = '▶'; play(); }
  }
  function selectScene(i, goto) {
    S.sel = clamp(i, 0, S.p.scenes.length - 1); markSel();
    if (goto) { const st = SM.timeline(S.p).starts[S.sel]; seek(st + Math.min(0.8, S.p.scenes[S.sel].dur * 0.4)); }
    if (S.rightTab === 'inspect') buildInspector();
  }
  $('#playBtn').onclick = () => (S.playing ? stop() : play());
  $('#prevScene').onclick = () => selectScene(S.sel - 1, true);
  $('#nextScene').onclick = () => selectScene(S.sel + 1, true);

  // ================= timeline =================
  const ROWS = [['fx', '✦ Hiệu ứng'], ['txt', 'T Văn bản'], ['vid', '▭ Video'], ['sub', '▤ Phụ đề'], ['voice', '🎙 Giọng đọc'], ['mus', '♫ Nhạc nền']];
  const lab = $('#tlLabels'); ROWS.forEach(([k, n]) => lab.append(h('div', { class: k }, n)));
  const inner = $('#tlInner'), scr = $('#tlScroll');
  let phEl;
  function hashStr(s) { let x = 5381; for (let i = 0; i < s.length; i++) x = ((x << 5) + x + s.charCodeAt(i)) | 0; return (x >>> 0).toString(36); }
  function thumbKey(i) { const s = S.p.scenes[i]; const { id, dur, sfx, ...r } = s; return hashStr(JSON.stringify([r, S.p.character, S.p.aspect, S.p.grade])); }
  function thumbURL(i) {
    const k = thumbKey(i); if (S.thumbs.has(k)) return S.thumbs.get(k);
    if (!S.thumbQ.some((q) => q.k === k)) { S.thumbQ.push({ k, i, id: S.p.scenes[i].id }); if (!thumbURL.busy) { thumbURL.busy = true; setTimeout(pumpThumbs, 5); } }
    return '';
  }
  function pumpThumbs() {
    const q = S.thumbQ.shift(); if (!q) { thumbURL.busy = false; return; }
    const i = S.p.scenes.findIndex((s) => s.id === q.id);
    if (i >= 0 && !S.thumbs.has(q.k)) {
      const A = SM.ASPECTS[S.p.aspect], c = document.createElement('canvas'); c.width = 240; c.height = Math.round((240 * A.h) / A.w);
      const sc = S.p.scenes[i], t0 = SM.timeline(S.p).starts[i] + Math.min(1.1, sc.dur * 0.55);
      try { SM.render(c.getContext('2d'), S.p, t0, { noSubs: true, still: true }); S.thumbs.set(q.k, 'url(' + c.toDataURL('image/jpeg', 0.7) + ')'); } catch (e) {}
      if (S.thumbs.size > 400) S.thumbs.delete(S.thumbs.keys().next().value);
      $$('[data-th="' + q.k + '"]').forEach((e) => (e.style.backgroundImage = S.thumbs.get(q.k)));
    }
    setTimeout(pumpThumbs, 8);
  }

  function buildTimeline() {
    const p = S.p, tl = SM.timeline(p), pps = S.pps, W = Math.max(tl.total * pps + 160, scr.clientWidth - 2);
    const keepScroll = scr.scrollLeft;
    inner.innerHTML = ''; inner.style.width = W + 'px';
    // thước
    const ruler = h('div', { class: 'ruler' }); const step = pps >= 90 ? 1 : pps >= 45 ? 2 : pps >= 22 ? 5 : 10;
    for (let s = 0; s <= W / pps; s += step) ruler.append(h('i', { style: { left: s * pps + 'px' } }, SM.fmt(s).replace(/\.0$/, '')));
    inner.append(ruler);
    const rows = {}; ROWS.forEach(([k]) => { rows[k] = h('div', { class: 'trk ' + k }); inner.append(rows[k]); });
    // video + chữ + phụ đề + fx
    p.scenes.forEach((sc, i) => {
      const x = tl.starts[i] * pps, w = Math.max(6, sc.dur * pps - 1), key = thumbKey(i);
      const th = thumbURL(i);
      const b = h('div', { class: 'blk vid' + (i === S.sel ? ' on' : ''), 'data-i': i, 'data-th': key, title: sc.text, style: { left: x + 'px', width: w + 'px', backgroundImage: th } },
        h('span', { class: 'n' }, `${i + 1} · ${sc.dur.toFixed(1)}s`), h('span', { class: 'h' }));
      b.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (e.target.classList.contains('h')) { startResize(e, i); return; }
        selectScene(i, false); seek(tl.starts[i] + (e.clientX - b.getBoundingClientRect().left) / pps);
      });
      rows.vid.append(b);
      const sb = h('div', { class: 'blk subb' + (i === S.sel ? ' on' : ''), 'data-i': i, title: sc.text, style: { left: x + 'px', width: w + 'px' } }, sc.text);
      sb.onpointerdown = (e) => { e.stopPropagation(); selectScene(i, false); seek(tl.starts[i] + (e.clientX - sb.getBoundingClientRect().left) / pps); };
      rows.sub.append(sb);
      const addT = (cls, txt, t0, wmax) => { if (!txt) return; const tb = h('div', { class: 'blk ' + cls, style: { left: (tl.starts[i] + t0) * pps + 'px', width: Math.max(40, Math.min(sc.dur - t0, wmax) * pps - 2) + 'px' }, title: txt }, txt); tb.onpointerdown = (e) => { e.stopPropagation(); selectScene(i, true); }; rows.txt.append(tb); };
      addT('chapb', sc.chapter, 0, 1.7); addT('chipb', sc.chip, 0.2, 3); addT('badgeb', sc.badge, 0.55, 2.6);
      (sc.sfx || []).forEach((e) => { const m = h('div', { class: 'mk' + (e.n === 'hit' ? ' hit' : ''), title: SM.SFX[e.n] || e.n, style: { left: (tl.starts[i] + e.t) * pps + 'px' } }, { tick: '·', pop: '●', whoosh: '≋', hit: '✸', ding: '♪', cash: '$', alert: '!', sparkle: '✦', boing: '~', sad: '▼', type: '⌨', swish: '≈' }[e.n] || '♪'); m.onpointerdown = (ev) => { ev.stopPropagation(); AU.init(); AU.sfx(e.n, 1); selectScene(i, false); }; rows.fx.append(m); });
    });
    // giọng đọc
    if (AU.voice.buffer) {
      const vd = AU.voice.buffer.duration, ww = Math.max(2, vd * pps), cwv = h('canvas', { class: 'wave', style: { width: ww + 'px', left: 0 } });
      cwv.width = Math.min(ww, 16000); cwv.height = 50; const g = cwv.getContext('2d'), pk = AU.voice.peaks;
      g.fillStyle = '#27c4b0'; for (let x = 0; x < cwv.width; x++) { const v = pk[Math.floor((x / cwv.width) * pk.length)] || 0, hh = Math.max(1, Math.min(1, v * 1.6) * 44); g.fillRect(x, 25 - hh / 2, 1, hh); }
      rows.voice.append(cwv, h('div', { class: 'blk', style: { left: '4px', top: '2px', bottom: 'auto', height: '16px', background: '#0009', color: '#7de3d4' } }, '🎙 ' + AU.voice.name));
    } else rows.voice.append(h('div', { class: 'muted small', style: { padding: '14px 10px' } }, 'Chưa có giọng đọc — tải file ở tab “Âm thanh” để khớp cảnh theo giọng.'));
    rows.mus.append(h('div', { class: 'musbar', style: { width: Math.max(40, tl.total * pps) + 'px' } }, p.music.style === 'none' ? 'Không nhạc nền' : '♫ ' + (SM.MUSIC[p.music.style] || {}).name + ' · ' + Math.round(p.music.vol * 100) + '%'));
    phEl = h('div', { id: 'ph' }); inner.append(phEl); updatePlayhead();
    scr.scrollLeft = keepScroll;
  }
  function markSel() { $$('.blk.vid,.blk.subb', inner).forEach((e) => e.classList.toggle('on', +e.dataset.i === S.sel)); $$('.scard').forEach((e) => e.classList.toggle('on', +e.dataset.i === S.sel)); }
  function updatePlayhead(follow) {
    if (!phEl) return; const x = S.t * S.pps; phEl.style.left = x + 'px';
    if (follow) { const l = scr.scrollLeft, w = scr.clientWidth; if (x > l + w - 60 || x < l) scr.scrollLeft = Math.max(0, x - w * 0.3); }
  }
  function tFromEvent(e) { return (e.clientX - inner.getBoundingClientRect().left) / S.pps; }
  inner.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.blk,.mk')) return;
    const mv = (ev) => seek(tFromEvent(ev), false); mv(e);
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); }; window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  });
  function startResize(e, i) {
    const sc = S.p.scenes[i], x0 = e.clientX, d0 = sc.dur;
    const mv = (ev) => { sc.dur = Math.max(0.6, Math.round((d0 + (ev.clientX - x0) / S.pps) * 10) / 10); SM.touch(S.p); buildTimeline(); updateTimeLbl(); };
    const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); commit({ inspector: true }); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  }

  // thanh công cụ timeline
  function buildTools() {
    const T = $('#tlTools'); T.innerHTML = '';
    const b = (t, title, fn) => h('button', { title, onclick: fn }, t);
    const zoom = h('input', { type: 'range', min: 15, max: 220, value: S.pps, oninput: (e) => { S.pps = +e.target.value; buildTimeline(); } });
    T.append(b('✂ Cắt', 'Cắt cảnh tại đầu phát (S)', splitAtPlayhead), b('⧉ Nhân đôi', 'Nhân đôi cảnh', dupScene), b('＋ Thêm cảnh', 'Thêm cảnh mới sau cảnh đang chọn', addScene),
      b('◀ Dời', 'Dời cảnh sang trái', () => moveScene(-1)), b('Dời ▶', 'Dời cảnh sang phải', () => moveScene(1)), b('🗑 Xoá', 'Xoá cảnh (Del)', delScene),
      h('div', { class: 'spacer' }), h('span', { class: 'muted small' }, 'Thu phóng'), zoom);
  }
  function splitAtPlayhead() {
    const at = SM.sceneAt(S.p, S.t); if (!at) return; const sc = S.p.scenes[at.i];
    if (at.lt < 0.5 || at.lt > sc.dur - 0.5) return toast('Đặt đầu phát vào giữa cảnh (cách mép ≥ 0,5s) rồi cắt');
    const ws = SM.sceneWords(sc); let k = ws.findIndex((w) => w.t0 >= at.lt); if (k <= 0) k = Math.max(1, Math.floor(ws.length / 2)); if (k >= ws.length) k = ws.length - 1;
    const toks = sc.text.split(/\s+/), b = JSON.parse(JSON.stringify(sc)); b.id = SM.uid();
    sc.text = toks.slice(0, k).join(' '); b.text = toks.slice(k).join(' '); b.dur = +(sc.dur - at.lt).toFixed(2); sc.dur = +at.lt.toFixed(2);
    b.chapter = ''; b.chip = ''; b.badge = ''; b.transition = 'cut'; b.emph = []; b.sfx = []; b.punches = [];
    S.p.scenes.splice(at.i + 1, 0, b); S.sel = at.i + 1; commit({ inspector: true }); toast('Đã cắt thành 2 cảnh');
  }
  function dupScene() { const sc = S.p.scenes[S.sel]; if (!sc) return; const b = JSON.parse(JSON.stringify(sc)); b.id = SM.uid(); b.chapter = ''; S.p.scenes.splice(S.sel + 1, 0, b); S.sel++; commit({ inspector: true }); }
  function addScene() { const sc = SM.defaultScene('Nội dung cảnh mới.'); sc.dur = 3; sc.transition = 'slide'; S.p.scenes.splice(S.sel + 1, 0, sc); S.sel = S.p.scenes.indexOf(sc); commit({ inspector: true }); selectScene(S.sel, true); }
  function delScene() { if (!S.p.scenes.length) return; S.p.scenes.splice(S.sel, 1); S.sel = clamp(S.sel, 0, S.p.scenes.length - 1); S.t = Math.min(S.t, total()); commit({ inspector: true }); }
  function moveScene(d) { const i = S.sel, j = i + d; if (j < 0 || j >= S.p.scenes.length) return; const a = S.p.scenes; [a[i], a[j]] = [a[j], a[i]]; S.sel = j; commit({ inspector: true }); }

  // ================= bảng trái =================
  const L = {};
  function F(label, el, sync) { if (sync) syncers.push(sync); return h('div', { class: 'field' }, label ? h('label', {}, label) : null, el); }
  function slider(label, path, min, max, step, fmt = (v) => v) {
    const inp = h('input', { type: 'range', min, max, step }), val = h('span', { class: 'muted small', style: { float: 'right' } });
    inp.oninput = () => { setPath(path, +inp.value); val.textContent = fmt(+inp.value); commit({ co: path, inspector: false }); };
    const f = F('', h('div', {}, h('div', { class: 'row', style: { justifyContent: 'space-between', marginBottom: '2px' } }, h('span', {}, label), val), inp), () => { inp.value = getPath(path); val.textContent = fmt(+getPath(path)); });
    return f;
  }
  function select(label, path, opts, after) {
    const sel = h('select', {}, Object.entries(opts).map(([k, v]) => h('option', { value: k }, v)));
    sel.onchange = () => { setPath(path, sel.value); commit({ inspector: false, full: true }); if (after) after(); };
    return F(label, sel, () => (sel.value = getPath(path)));
  }
  function check(label, path, after) {
    const c = h('input', { type: 'checkbox' }); c.onchange = () => { setPath(path, c.checked); commit({ inspector: false, full: true }); if (after) after(); };
    syncers.push(() => (c.checked = !!getPath(path))); return h('label', { class: 'chk', style: { marginBottom: '8px' } }, c, label);
  }
  function color(label, path) { const c = h('input', { type: 'color' }); c.oninput = () => { setPath(path, c.value); commit({ co: path, full: true, inspector: false }); }; syncers.push(() => (c.value = getPath(path))); return h('div', { class: 'row', style: { marginBottom: '8px' } }, h('span', {}, label), h('span', { class: 'fix' }, c)); }
  function text(label, path) { const i = h('input', { type: 'text' }); i.oninput = () => { setPath(path, i.value); commit({ co: path, full: true, inspector: false }); }; return F(label, i, () => (i.value = getPath(path))); }

  function buildLeft() {
    const body = $('#leftBody'); body.innerHTML = '';
    // --- Kịch bản
    const script = h('textarea', { id: 'script', rows: 12, placeholder: 'Dán kịch bản vào đây. Mỗi câu sẽ thành một cảnh.\n\n# Tiêu đề video\n## Chương 1 · Mở đầu   ← dòng bắt đầu bằng ## là thẻ chương\nBạn có biết 25.000 người đã mất tiền vì lỗi này? {pose:surprised prop:warning}', spellcheck: false });
    script.value = S.p.script || ''; script.oninput = () => { S.p.script = script.value; save(); };
    const samples = h('div', { class: 'chips' }, SM.SAMPLES.map((s) => h('span', { class: 'chip', onclick: () => { script.value = s.text; S.p.script = s.text; S.p.lang = s.lang; S.p.title = 'Video người que'; $('#title').value = S.p.title; syncControls(); save(); toast('Đã nạp kịch bản mẫu — bấm “Tạo video tự động”'); } }, s.name)));
    const key = h('input', { type: 'password', placeholder: 'sk-ant-… (tuỳ chọn)', autocomplete: 'off' }); key.value = localStorage.getItem('sm_key') || ''; key.oninput = () => { try { localStorage.setItem('sm_key', key.value.trim()); } catch (e) {} };
    const wps = slider('Tốc độ đọc (từ/giây)', 'director.wps', 1.6, 4.2, 0.1, (v) => v.toFixed(1)), maxc = slider('Cắt cảnh dài hơn (giây)', 'director.maxCut', 2.5, 12, 0.5, (v) => v + 's');
    const go = h('button', { class: 'primary big', id: 'goBtn', onclick: runAgents }, '✨ Tạo video tự động');
    L.script = h('div', { 'data-p': 'script' },
      F('Kịch bản (mẫu có sẵn)', samples), F('', script),
      h('div', { class: 'row' }, F('Ngôn ngữ', h('select', { id: 'lang', onchange: (e) => { S.p.lang = e.target.value; save(); } }, h('option', { value: 'vi' }, 'Tiếng Việt'), h('option', { value: 'en' }, 'English')), () => ($('#lang').value = S.p.lang)),
        select('Trợ lý chuyển cảnh', 'director.transitions', { auto: 'Tự động đa dạng', cut: 'Chỉ cắt thẳng' })),
      wps, maxc, go,
      details('Cú pháp nâng cao', h('div', { class: 'small', html: `<p><code># Tiêu đề</code> ở dòng đầu = tên video.</p><p><code>## Chương 1 · Mở đầu</code> hoặc dòng “Bước 1…” = thẻ chương (có hiệu ứng quét).</p><p>Gắn lệnh ở cuối câu để ép trợ lý: <code>{pose:smash prop:rocket,star tone:danger bg:city badge:SIÊU HOT chip:Top 1 tr:flash dur:4 sfx:hit flip:1}</code></p><p>pose: ${Object.keys(SM.POSES).join(', ')}<br>prop: ${Object.keys(SM.PROPS).join(', ')}</p>` })),
      details('🤖 Đạo diễn bằng Claude AI (tuỳ chọn)', h('div', {}, check('Dùng Claude để chia cảnh & chọn hiệu ứng thông minh hơn', 'llm.on'), F('Claude API key (lưu trong trình duyệt của bạn)', key), text('Model', 'llm.model'), h('p', { class: 'muted small' }, 'Không bật cũng chạy tốt: các trợ lý offline dùng từ khoá tiếng Việt/Anh. Khi bật, kịch bản được gửi trực tiếp từ trình duyệt đến api.anthropic.com. Nếu lỗi, tự quay về chế độ offline.'))),
    );
    // --- Cảnh
    L.scenes = h('div', { 'data-p': 'scenes', hidden: true }, h('div', { id: 'sgrid', class: 'sgrid' }));
    // --- Âm thanh
    const vf = h('input', { type: 'file', accept: 'audio/*', hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (f) await setVoice(f); e.target.value = ''; } });
    const mfile = h('input', { type: 'file', accept: 'audio/*', hidden: true, onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { AU.musicFile.buffer = await AU.loadAudio(f); AU.musicFile.name = f.name; S.p.music.style = 'file'; syncControls(); commit({ full: true }); toast('Đã nạp nhạc: ' + f.name); } catch (er) { toast('Không đọc được file nhạc'); } e.target.value = ''; } });
    const mstyles = {}; for (const k in SM.MUSIC) mstyles[k] = SM.MUSIC[k].name;
    L.audio = h('div', { 'data-p': 'audio', hidden: true },
      h('div', { class: 'lbl' }, 'Giọng đọc'), h('div', { id: 'voiceInfo', class: 'muted small', style: { marginBottom: '6px' } }, 'Chưa có giọng đọc.'),
      h('div', { class: 'row', style: { marginBottom: '8px' } }, h('button', { onclick: () => vf.click() }, '⬆ Tải giọng đọc'), h('button', { id: 'syncBtn', onclick: syncVoice }, '⇆ Khớp cảnh theo giọng'), h('button', { class: 'fix', title: 'Gỡ giọng đọc', onclick: () => { AU.voice.buffer = null; AU.voice.name = ''; updateVoiceInfo(); buildTimeline(); } }, '✕')), vf,
      slider('Âm lượng giọng', 'voice.vol', 0, 1.5, 0.05, (v) => Math.round(v * 100) + '%'),
      h('p', { class: 'muted small' }, 'Mẹo: tạo giọng bằng ElevenLabs / CapCut / Google TTS rồi tải lên. Hệ thống tự dò khoảng lặng để chia cảnh khớp từng câu.'),
      h('div', { class: 'hr' }), h('div', { class: 'lbl' }, 'Nhạc nền'),
      select('Phong cách (tự sinh, không bản quyền)', 'music.style', mstyles, () => { if (S.playing) { stop(); play(); } }),
      slider('Âm lượng nhạc', 'music.vol', 0, 1, 0.05, (v) => Math.round(v * 100) + '%'),
      h('div', { class: 'row', style: { marginBottom: '8px' } }, h('button', { onclick: () => mfile.click() }, '⬆ Dùng nhạc của bạn'), h('button', { onclick: previewMusic }, '▶ Nghe thử')), mfile,
      check('Tự hạ nhạc khi có giọng đọc (ducking)', 'music.duck'),
      h('div', { class: 'hr' }), h('div', { class: 'lbl' }, 'Hiệu ứng âm'),
      check('Bật hiệu ứng âm (whoosh, ting, đập…)', 'sfx.on'), slider('Âm lượng hiệu ứng', 'sfx.vol', 0, 1.5, 0.05, (v) => Math.round(v * 100) + '%'),
      h('div', { class: 'chips' }, Object.entries(SM.SFX).map(([k, v]) => h('span', { class: 'chip', onclick: () => { AU.init(); AU.sfx(k, 1); } }, '▶ ' + v))),
    );
    // --- Giao diện
    const hats = { none: 'Không', cap: 'Mũ lưỡi trai', beanie: 'Mũ len', tophat: 'Mũ chóp', crown: 'Vương miện' };
    L.look = h('div', { 'data-p': 'look', hidden: true },
      h('div', { class: 'lbl' }, 'Nhân vật'), text('Tên nhân vật', 'character.name'),
      h('div', { class: 'row' }, select('Kiểu', 'character.style', { coat: 'Áo khoác', stick: 'Người que thuần' }), select('Nón', 'character.hat', hats)),
      color('Màu áo (đè lên tông cảnh)', 'character.coat'), color('Màu quần', 'character.pants'), check('Đeo khăn', 'character.scarf'), color('Màu khăn', 'character.scarfColor'), check('Đeo kính', 'character.glasses'), color('Màu nón', 'character.hatColor'), check('Nhép miệng theo lời thoại', 'character.mouthSync'),
      h('div', { class: 'hr' }), h('div', { class: 'lbl' }, 'Phụ đề'),
      select('Kiểu chữ', 'subs.style', { box: 'Hộp tối + tô từ đang đọc', pop: 'Chữ nổi viền (TikTok)', classic: 'Cổ điển có bóng' }), select('Vị trí', 'subs.pos', { bottom: 'Dưới', middle: 'Giữa', top: 'Trên' }),
      slider('Cỡ chữ', 'subs.size', 28, 80, 1, (v) => v + 'px'), color('Màu từ đang đọc', 'subs.color'), color('Màu từ khoá', 'subs.color2'),
      h('div', { class: 'hr' }), h('div', { class: 'lbl' }, 'Màu phim (toàn video)'),
      slider('Nhiệt màu (lạnh ↔ ấm)', 'grade.temp', -1, 1, 0.01, (v) => v.toFixed(2)), slider('Tương phản', 'grade.contrast', 0, 1, 0.01, (v) => v.toFixed(2)), slider('Bão hoà', 'grade.sat', -1, 1, 0.01, (v) => v.toFixed(2)),
      slider('Vignette', 'grade.vignette', 0, 1, 0.01, (v) => v.toFixed(2)), slider('Hạt phim', 'grade.grain', 0, 1, 0.01, (v) => v.toFixed(2)),
    );
    body.append(L.script, L.scenes, L.audio, L.look);
    syncControls();
  }
  const details = (t, el) => h('details', {}, h('summary', {}, t), el);
  function syncControls() { syncers.forEach((f) => { try { f(); } catch (e) {} }); $('#title').value = S.p.title; $('#aspect').value = S.p.aspect; $('#subToggle').checked = S.p.subs.on; if (L.script) { $('#script').value = S.p.script || ''; } updateVoiceInfo(); }
  function setLeftTab(t) { S.leftTab = t; $$('#leftTabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t)); $$('#leftBody>[data-p]').forEach((d) => (d.hidden = d.dataset.p !== t)); if (t === 'scenes') buildSceneGrid(); }
  $$('#leftTabs button').forEach((b) => (b.onclick = () => setLeftTab(b.dataset.tab)));
  function buildSceneGrid() {
    const g = $('#sgrid'); if (!g) return; g.innerHTML = ''; const tl = SM.timeline(S.p);
    S.p.scenes.forEach((sc, i) => g.append(h('div', { class: 'scard' + (i === S.sel ? ' on' : ''), 'data-i': i, onclick: () => selectScene(i, true) }, h('div', { class: 'th', 'data-th': thumbKey(i), style: { backgroundImage: thumbURL(i) } }), h('span', { class: 'tm' }, sc.dur.toFixed(1) + 's'), h('div', { class: 'nm' }, h('span', {}, 'Cảnh ' + (i + 1)), h('span', {}, SM.POSES[sc.pose])))));
    g.append(h('div', { class: 'scard add', onclick: addScene }, '＋ Tạo thêm'));
  }
  function updateVoiceInfo() { const el = $('#voiceInfo'); if (!el) return; const b = AU.voice.buffer; el.textContent = b ? `🎙 ${AU.voice.name} · ${b.duration.toFixed(1)}s` : 'Chưa có giọng đọc.'; }
  async function setVoice(f) {
    try {
      toast('Đang đọc file âm thanh…'); AU.voice.buffer = await AU.loadAudio(f); AU.voice.name = f.name; AU.voice.peaks = AU.peaks(AU.voice.buffer); updateVoiceInfo();
      if (S.p.scenes.length) syncVoice(true); else buildTimeline();
    } catch (e) { toast('Không đọc được file âm thanh này'); }
  }
  function syncVoice(auto) {
    if (!AU.voice.buffer) return toast('Hãy tải giọng đọc trước');
    if (!S.p.scenes.length) return toast('Chưa có cảnh để khớp');
    const d = AU.syncScenes(S.p, AU.voice.buffer); if (!d) return;
    S.p.scenes.forEach((s, i) => { s.dur = d[i]; s.punches = []; }); SM.touch(S.p);
    // dựng lại tia nhấn & sfx theo thời lượng mới
    AG.runStage('zoom', { p: S.p, apply() {}, log: async () => {}, _pending: [] }).then(() => AG.runStage('sound', { p: S.p, apply() {}, log: async () => {}, _pending: [] })).then(() => { commit({ inspector: true, full: true }); toast(`Đã khớp ${S.p.scenes.length} cảnh theo giọng đọc (${AU.voice.buffer.duration.toFixed(1)}s)`); });
  }
  function previewMusic() { if (S.playing) stop(); AU.init(); AU.startMusic(S.p.music.style, S.p.music.vol, 0); setTimeout(() => { if (!S.playing) AU.stopMusic(); }, 6000); toast('Nghe thử 6 giây…'); }

  // ================= bảng phải =================
  function setRightTab(t) { S.rightTab = t; $$('#rightTabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t)); if (t === 'inspect') buildInspector(); else buildLogPane(); }
  $$('#rightTabs button').forEach((b) => (b.onclick = () => setRightTab(b.dataset.tab)));
  S.log = [];
  function buildLogPane() {
    const body = $('#rightBody'); body.innerHTML = '';
    const sb = h('div', { class: 'stagebar', id: 'stagebar' }, AG.STAGES.map(([k, n]) => h('span', { class: 'st' + (S.stageState && S.stageState[k] ? ' ' + S.stageState[k] : ''), 'data-k': k }, n)));
    const lg = h('div', { class: 'log', id: 'logList' });
    body.append(sb, lg);
    if (!S.log.length) lg.append(h('div', { class: 'empty' }, 'Chưa có hoạt động.\nNhập kịch bản ở tab “Kịch bản” rồi bấm ✨ Tạo video tự động.'));
    S.log.slice(-200).reverse().forEach((e) => lg.append(logRow(e)));
  }
  function logRow(e) { return h('div', { class: 'le' }, h('span', { class: 'tm' }, SM.fmt(e.t)), h('span', { class: 'ag ' + e.agent }, AG.NAMES[e.agent]), h('div', {}, h('div', { class: 'ms' }, e.msg), (e.details || []).map((d) => h('div', { class: 'dt' }, '└ ' + d)))); }
  function addLog(e) {
    S.log.push(e); if (S.rightTab !== 'log') return;
    const lg = $('#logList'); if (!lg) return; const emp = lg.querySelector('.empty'); if (emp) emp.remove();
    lg.prepend(logRow(e)); while (lg.children.length > 220) lg.lastChild.remove();
  }
  function buildInspector() {
    const body = $('#rightBody'); body.innerHTML = ''; const sc = S.p.scenes[S.sel];
    if (!sc) { body.append(h('div', { class: 'empty' }, 'Chưa có cảnh nào.')); return; }
    const ed = (fn, key, o = {}) => { fn(sc); commit(Object.assign({ co: key + sc.id, inspector: false }, o)); };
    const sel = (label, val, opts, fn) => F(label, h('select', { onchange: (e) => fn(e.target.value) }, Object.entries(opts).map(([k, v]) => h('option', { value: k, selected: k === val }, v))));
    const sl = (label, val, min, max, step, fn, fmt) => { const v = h('span', { class: 'muted small' }, fmt(val)); return F('', h('div', {}, h('div', { class: 'row', style: { justifyContent: 'space-between' } }, h('span', {}, label), v), h('input', { type: 'range', min, max, step, value: val, oninput: (e) => { v.textContent = fmt(+e.target.value); fn(+e.target.value); } }))); };
    const tl = SM.timeline(S.p);
    const props = h('div', { class: 'chips' }, Object.entries(SM.PROPS).map(([k, v]) => { const c = h('span', { class: 'chip' + (sc.props.includes(k) ? ' on' : ''), onclick: () => { ed((s) => { s.props = s.props.includes(k) ? s.props.filter((x) => x !== k) : [...s.props, k].slice(-4); }, 'props'); c.classList.toggle('on', sc.props.includes(k)); } }, v); return c; }));
    const sfxList = h('div', {}, (sc.sfx || []).map((e, i) => h('div', { class: 'row', style: { marginBottom: '4px' } }, h('span', {}, `${e.t.toFixed(2)}s · ${SM.SFX[e.n] || e.n}`), h('button', { class: 'fix', onclick: () => { AU.init(); AU.sfx(e.n, 1); } }, '▶'), h('button', { class: 'fix', onclick: () => { ed((s) => s.sfx.splice(i, 1), 'sfx', { inspector: true }); buildInspector(); } }, '✕'))));
    const sfxSel = h('select', {}, Object.entries(SM.SFX).map(([k, v]) => h('option', { value: k }, v)));
    body.append(
      h('div', { class: 'row', style: { marginBottom: '8px' } }, h('b', {}, `Cảnh ${S.sel + 1}/${S.p.scenes.length}`), h('span', { class: 'muted fix' }, SM.fmt(tl.starts[S.sel]))),
      F('Lời thoại / phụ đề', h('textarea', { rows: 3, oninput: (e) => ed((s) => (s.text = e.target.value), 'text') }, sc.text)),
      h('div', { class: 'row' }, F('Thời lượng (s)', h('input', { type: 'number', min: 0.6, max: 30, step: 0.1, value: sc.dur, oninput: (e) => { const v = +e.target.value; if (v >= 0.6) ed((s) => (s.dur = v), 'dur'); } })), F('', h('label', { class: 'chk', style: { marginTop: '18px' } }, h('input', { type: 'checkbox', checked: sc.flip, onchange: (e) => ed((s) => (s.flip = e.target.checked), 'flip') }), 'Lật hướng'))),
      h('div', { class: 'row' }, sel('Tư thế', sc.pose, SM.POSES, (v) => ed((s) => (s.pose = v), 'pose')), sel('Nền', sc.bg, SM.BGS, (v) => ed((s) => (s.bg = v), 'bg'))),
      h('div', { class: 'row' }, sel('Tông màu', sc.tone, Object.fromEntries(Object.entries(SM.TONES).map(([k, v]) => [k, v.name])), (v) => ed((s) => (s.tone = v), 'tone')), sel('Chuyển cảnh vào', sc.transition, SM.TRANSITIONS, (v) => ed((s) => (s.transition = v), 'tr'))),
      F('Đạo cụ (tối đa 4)', props),
      F('Thẻ chip (số liệu)', h('input', { type: 'text', value: sc.chip, oninput: (e) => ed((s) => (s.chip = e.target.value), 'chip') })),
      F('Sticker nhấn mạnh', h('input', { type: 'text', value: sc.badge, oninput: (e) => ed((s) => (s.badge = e.target.value), 'badge') })),
      F('Thẻ chương', h('input', { type: 'text', value: sc.chapter, placeholder: 'Chương 2 · Tên chương', oninput: (e) => ed((s) => (s.chapter = e.target.value), 'chap') })),
      sl('Zoom đầu cảnh', sc.cam.z0, 0.8, 1.6, 0.01, (v) => ed((s) => (s.cam.z0 = v), 'z0'), (v) => Math.round(v * 100) + '%'),
      sl('Zoom cuối cảnh', sc.cam.z1, 0.8, 1.6, 0.01, (v) => ed((s) => (s.cam.z1 = v), 'z1'), (v) => Math.round(v * 100) + '%'),
      h('label', { class: 'chk', style: { marginBottom: '8px' } }, h('input', { type: 'checkbox', checked: sc.shake > 0, onchange: (e) => ed((s) => (s.shake = e.target.checked ? 0.8 : 0), 'shake') }), 'Rung màn hình khi vào cảnh'),
      h('div', { class: 'lbl' }, 'Hiệu ứng âm của cảnh'), sfxList,
      h('div', { class: 'row', style: { marginBottom: '10px' } }, sfxSel, h('button', { class: 'fix', onclick: () => { const t = SM.timeline(S.p), lt = clamp(S.t - t.starts[S.sel], 0, sc.dur - 0.1); ed((s) => { s.sfx.push({ t: +lt.toFixed(2), n: sfxSel.value, v: 1 }); s.sfx.sort((a, b) => a.t - b.t); }, 'sfx', { inspector: true }); buildInspector(); } }, '＋ tại đầu phát')),
      h('div', { class: 'row' }, h('button', { onclick: () => redoScene(S.sel) }, '🔄 Đạo diễn làm lại cảnh'), h('button', { class: 'fix', onclick: dupScene }, '⧉'), h('button', { class: 'fix', onclick: delScene }, '🗑')),
    );
  }
  async function redoScene(i) {
    const P = S.p, a = Math.max(0, i - 1), b = Math.min(P.scenes.length - 1, i + 1), sl = P.scenes.slice(a, b + 1).map((s) => { const c = JSON.parse(JSON.stringify(s)); c._lock = {}; return c; });
    const q = Object.assign({}, P, { scenes: sl, _tl: null, _ver: -7 }); SM.touch(q); const mid = i - a;
    const X = { p: q, key: '', apply() {}, log: async () => {}, _pending: [] };
    for (const k of ['char', 'color', 'sound', 'subs', 'zoom']) await AG.runStage(k, X);
    const m = q.scenes[mid], sc = P.scenes[i];
    ['pose', 'props', 'bg', 'tone', 'flip', 'chip', 'badge', 'sfx', 'emph', 'cam', 'punches', 'shake', 'grade'].forEach((k) => (sc[k] = m[k]));
    commit({ inspector: true }); buildInspector(); toast('Đã làm lại cảnh ' + (i + 1));
  }

  // ================= chạy trợ lý =================
  async function runAgents() {
    if (S.running) return;
    const script = $('#script').value.trim(); if (!script) return toast('Hãy nhập hoặc chọn một kịch bản mẫu trước');
    stop(); S.running = true; S.p.script = script; S.p.scenes = []; S.sel = 0; S.t = 0; SM.touch(S.p); S.log = []; S.stageState = {};
    $('#goBtn').disabled = true; $('#goBtn').textContent = '⏳ Các trợ lý đang làm việc…'; setRightTab('log'); refresh({ full: true });
    const pill = $('#pill'), pt = $('#pillText'); pill.classList.add('run'); let done = 0, cnt = 0, sec = 0; const t00 = performance.now();
    const tm = setInterval(() => { sec = (performance.now() - t00) / 1000; pt.textContent = `${Math.max(1, AG.STAGES.length - done)} trợ lý đang làm · ${cnt} chỉnh sửa · ${Math.round(sec)}s`; }, 250);
    try {
      const key = S.p.llm.on ? localStorage.getItem('sm_key') || '' : '';
      const n = await AG.run(S.p, { key }, {
        log: (e) => { cnt = e.n; addLog(e); },
        stage: (name, st) => { S.stageState[name] = st; const el = $(`.st[data-k="${name}"]`); if (el) el.className = 'st ' + st; if (st === 'done') done++; },
        apply: () => { SM.touch(S.p); S.sel = clamp(S.sel, 0, S.p.scenes.length - 1); refresh({ full: true, inspector: false }); },
      });
      pt.textContent = `Xong · ${n} chỉnh sửa · ${Math.round((performance.now() - t00) / 1000)}s — bấm ▶ để xem`;
      $('#title').value = S.p.title; snap(); save(); toast(`✓ Đã dựng ${S.p.scenes.length} cảnh · ${SM.fmt(total())}`); seek(0);
    } catch (e) { console.error(e); pt.textContent = 'Lỗi: ' + (e.message || e); toast('⚠ ' + (e.message || e), 5000); }
    clearInterval(tm); pill.classList.remove('run'); S.running = false; $('#goBtn').disabled = false; $('#goBtn').textContent = '✨ Tạo video tự động';
  }

  // ================= refresh =================
  function refresh(o = {}) {
    SM.touch(S.p); sizeCanvas();
    S.t = clamp(S.t, 0, total()); draw(); buildTimeline();
    if (S.leftTab === 'scenes') buildSceneGrid();
    if (o.inspector && S.rightTab === 'inspect') buildInspector();
    if (S.p.scenes.length) $('#stageHint').style.display = 'none';
    $('#undo').disabled = S.hi <= 0; $('#redo').disabled = S.hi >= S.hist.length - 1;
  }

  // ================= điều khiển trên cùng =================
  const asp = $('#aspect'); Object.entries(SM.ASPECTS).forEach(([k, v]) => asp.append(h('option', { value: k }, v.name)));
  asp.onchange = () => { S.p.aspect = asp.value; S.thumbs.clear(); commit({ full: true }); };
  $('#title').oninput = (e) => { S.p.title = e.target.value; save(); };
  $('#qaMode').onchange = (e) => { S.guides = e.target.checked; draw(); };
  $('#subToggle').onchange = (e) => { S.p.subs.on = e.target.checked; commit({}); };
  $('#undo').onclick = undo; $('#redo').onclick = redo;
  $('#fsBtn').onclick = () => { const s = $('#stage'); (document.fullscreenElement ? document.exitFullscreen() : s.requestFullscreen && s.requestFullscreen()); };
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase(); if (['input', 'textarea', 'select'].includes(tag)) return;
    if (e.code === 'Space') { e.preventDefault(); S.playing ? stop() : play(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if (e.key === 'ArrowLeft') seek(S.t - (e.shiftKey ? 0.1 : 0.5)); else if (e.key === 'ArrowRight') seek(S.t + (e.shiftKey ? 0.1 : 0.5));
    else if (e.key.toLowerCase() === 's' && !e.ctrlKey && !e.metaKey) splitAtPlayhead();
    else if (e.key === 'Delete' || e.key === 'Backspace') delScene();
  });

  // ================= modal =================
  const modal = $('#modal'), mcard = $('#modalCard');
  function openModal(nodes) { mcard.innerHTML = ''; mcard.append(...nodes); modal.hidden = false; }
  function closeModal() { modal.hidden = true; mcard.innerHTML = ''; }
  modal.addEventListener('pointerdown', (e) => { if (e.target === modal && !S.exporting) closeModal(); });
  const dl = (name, blob) => { const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); };
  const slug = () => (SM.norm(S.p.title || 'video').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'video');
  function srt() { const tl = SM.timeline(S.p); return S.p.scenes.map((s, i) => `${i + 1}\n${SM.fmtSrt(tl.starts[i])} --> ${SM.fmtSrt(tl.starts[i] + s.dur - 0.05)}\n${s.text}\n`).join('\n'); }

  $('#btnExport').onclick = () => {
    if (!S.p.scenes.length) return toast('Chưa có video để xuất — hãy tạo video từ kịch bản');
    const mimes = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    const mime = window.MediaRecorder ? mimes.find((m) => MediaRecorder.isTypeSupported(m)) : null;
    const scale = h('select', {}, h('option', { value: 1 }, 'Chuẩn (720p)'), h('option', { value: 1.5 }, 'Nét hơn (1080p, nặng hơn)'), h('option', { value: 0.75 }, 'Nhẹ (540p)'));
    const aud = h('input', { type: 'checkbox', checked: true });
    const bar = h('i'), st = h('div', { class: 'muted small', id: 'expSt' }, mime ? `Định dạng: ${mime.split(';')[0]} · phát hết video theo thời gian thực để thu hình + tiếng.` : '⚠ Trình duyệt này không hỗ trợ xuất video — hãy dùng Chrome/Edge trên máy tính.');
    const go = h('button', { class: 'primary big', disabled: !mime, onclick: () => runExport(mime, +scale.value, aud.checked, bar, st, go) }, '● Bắt đầu xuất video');
    openModal([
      h('h2', {}, 'Xuất video'), h('p', { class: 'muted' }, `${S.p.title} · ${SM.fmt(total())} · ${SM.ASPECTS[S.p.aspect].name}`),
      h('div', { class: 'row' }, F('Chất lượng', scale), h('label', { class: 'chk', style: { marginTop: '18px' } }, aud, 'Kèm giọng đọc + nhạc + hiệu ứng')), go,
      h('div', { class: 'bar' }, bar), st, h('p', { class: 'muted small' }, 'Giữ tab này ở phía trước trong lúc xuất. Không cần cài phần mềm.'),
      h('div', { class: 'hr' }), h('div', { class: 'lbl' }, 'Tải thêm'),
      h('div', { class: 'row' }, h('button', { onclick: () => dl(slug() + '.srt', new Blob([srt()], { type: 'text/plain;charset=utf-8' })) }, '⬇ Phụ đề .srt'),
        h('button', { onclick: () => dl(slug() + '.que.json', new Blob([SM.serialize(S.p)], { type: 'application/json' })) }, '⬇ Dự án .json'),
        h('button', { onclick: () => { draw(); cv.toBlob((b) => dl(slug() + '.png', b)); } }, '⬇ Khung hình PNG'),
        h('button', { onclick: () => { const f = h('input', { type: 'file', accept: '.json', onchange: async (e) => { try { restore(await e.target.files[0].text()); snap(); closeModal(); toast('Đã mở dự án'); } catch (er) { toast('File dự án không hợp lệ'); } } }); f.click(); } }, '⬆ Mở dự án')),
      h('div', { class: 'row', style: { marginTop: '14px' } }, h('button', { onclick: () => { if (!S.exporting) closeModal(); } }, 'Đóng')),
    ]);
  };
  async function runExport(mime, scale, withAudio, bar, st, btn) {
    if (S.exporting) return; S.exporting = true; stop(); AU.init(); btn.disabled = true; S.exportScale = scale; sizeCanvas(); S.t = 0;
    const stream = cv.captureStream(30); if (withAudio) AU.dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Math.round(5e6 * scale), audioBitsPerSecond: 160000 }), chunks = []; let cancelled = false;
    rec.ondataavailable = (e) => e.data && e.data.size && chunks.push(e.data);
    const fin = new Promise((r) => (rec.onstop = r));
    const stopBtn = h('button', { onclick: () => { cancelled = true; stop(); } }, 'Huỷ'); btn.after(stopBtn);
    const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm', tot = total();
    draw(); rec.start(500);
    const prevVol = AU.master && AU.master.gain.value; if (!withAudio && AU.master) { /* vẫn phát để lấy nhịp; không thu */ }
    await new Promise((resolve) => { play({ tail: 0.5, onTick: (t) => { bar.style.width = Math.min(100, (t / tot) * 100) + '%'; st.textContent = `Đang xuất… ${SM.fmt(t)} / ${SM.fmt(tot)}`; }, onEnd: resolve }); });
    await SM.sleep(250); rec.state !== 'inactive' && rec.stop(); await fin;
    S.exportScale = 0; sizeCanvas(); S.exporting = false; stopBtn.remove(); btn.disabled = false; draw();
    if (cancelled) { st.textContent = 'Đã huỷ.'; bar.style.width = '0'; return; }
    const blob = new Blob(chunks, { type: mime.split(';')[0] }); bar.style.width = '100%';
    st.textContent = `✓ Xong! ${(blob.size / 1048576).toFixed(1)} MB · .${ext}`;
    dl(slug() + '.' + ext, blob);
    if (ext === 'webm') st.textContent += ' — file .webm xem được trên máy tính/YouTube; cần .mp4 để đăng Facebook thì đổi bằng CapCut hoặc ffmpeg (ffmpeg -i file.webm file.mp4).';
  }

  // ================= gói đăng bài =================
  const STOP = new Set('và của là có không cho với một những các được này khi đã sẽ để thì mà cũng như trong ra vào lên cái bạn tôi mình nó họ rất hơn nhiều lại còn đang the a an of to and in is it that for on with as are be this you your we they but not have can will'.split(' '));
  function keywords(n = 6) {
    const f = {}; S.p.scenes.forEach((s) => s.text.toLowerCase().replace(/[.,!?;:"“”()…]/g, ' ').split(/\s+/).forEach((w) => { if (w.length >= 4 && !STOP.has(w) && !/\d/.test(w)) f[w] = (f[w] || 0) + 1; }));
    return Object.entries(f).sort((a, b) => b[1] - a[1]).slice(0, n).map((x) => x[0]);
  }
  $('#btnPack').onclick = () => {
    if (!S.p.scenes.length) return toast('Chưa có video — hãy tạo video từ kịch bản trước');
    const page = h('input', { type: 'text', value: localStorage.getItem('sm_page') || 'Yến Trùm' }), out = h('div');
    const build = () => {
      try { localStorage.setItem('sm_page', page.value); } catch (e) {}
      const T = S.p.title, tl = SM.timeline(S.p), vi = S.p.lang === 'vi', kw = keywords(6), tags = [...kw.slice(0, 4).map((k) => '#' + SM.norm(k).replace(/[^a-z0-9]/g, '')), vi ? '#ungdungAI' : '#AI', '#seller', '#affiliate', S.p.aspect === '9:16' ? '#shorts' : '#video'].filter((x, i, a) => x.length > 2 && a.indexOf(x) === i);
      const chapters = []; S.p.scenes.forEach((s, i) => { if (s.chapter) chapters.push([tl.starts[i], s.chapter]); });
      if (chapters.length) { if (chapters[0][0] > 1) chapters.unshift([0, vi ? 'Mở đầu' : 'Intro']); }
      else { const per = Math.max(1, Math.round(S.p.scenes.length / 5)); S.p.scenes.forEach((s, i) => { if (i % per === 0) chapters.push([tl.starts[i], s.text.split(/\s+/).slice(0, 6).join(' ') + '…']); }); }
      const ts = (t) => { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + String(s).padStart(2, '0'); };
      const cta = vi ? `👉 Theo dõi ${page.value} để xem thêm ứng dụng AI cho seller & affiliate.` : `👉 Follow ${page.value} for more AI tips for sellers & affiliates.`;
      const titles = vi ? [T, `${T} — xem hết để hiểu rõ!`, `Đừng bỏ qua: ${T}`] : [T, `${T} (what nobody tells you)`, `Don't miss: ${T}`];
      const thumb = (S.p.scenes.find((s) => s.badge) || {}).badge || (S.p.scenes.find((s) => s.chip) || {}).chip || T.split(/\s+/).slice(0, 4).join(' ');
      const sents = (S.p.script || '').replace(/\{[^}]*\}/g, '').split('\n').filter((l) => l.trim() && !/^#/.test(l.trim())).join(' ').split(/(?<=[.!?…])\s+/).map((x) => x.trim()).filter(Boolean);
      const lead = sents.length ? sents : S.p.scenes.map((s) => s.text);
      const desc = `${lead.slice(0, 2).join(' ')}\n\n${chapters.map((c) => ts(c[0]) + ' ' + c[1]).join('\n')}\n\n${cta}\n\n${tags.join(' ')}`;
      const fb = `${lead[0]}\n\n${lead.slice(1, 4).map((s) => '✅ ' + s).join('\n')}\n\n${cta}\n${tags.join(' ')}`;
      const cp = (label, txt) => h('div', { class: 'field copy' }, h('label', {}, label), h('pre', {}, txt), h('button', { onclick: (e) => { navigator.clipboard && navigator.clipboard.writeText(txt); e.target.textContent = 'Đã chép ✓'; } }, 'Chép'));
      out.innerHTML = ''; out.append(cp('Tiêu đề gợi ý', titles.join('\n')), cp('Chữ trên ảnh bìa', thumb.toUpperCase()), cp('Mô tả YouTube + mốc thời gian', desc), cp('Caption Facebook / Reels', fb), cp('Hashtag', tags.join(' ')));
    };
    page.oninput = build; build();
    openModal([h('h2', {}, 'Gói đăng bài'), h('p', { class: 'muted' }, 'Tiêu đề, mô tả, mốc chương, hashtag và caption — tự sinh từ nội dung video.'), F('Tên page / kênh (dùng trong lời kêu gọi)', page), out, h('div', { class: 'row' }, h('button', { onclick: closeModal }, 'Đóng'))]);
  };

  // ================= khởi động =================
  buildLeft(); buildTools(); setRightTab('log'); setLeftTab('script');
  snap(); sizeCanvas();
  S.p.scenes.length ? (refresh({ full: true }), $('#pillText').textContent = `Đã mở dự án đã lưu · ${S.p.scenes.length} cảnh`) : ($('#stageHint').textContent = '', refresh({ full: true }));
  new ResizeObserver(() => { sizeCanvas(); draw(); }).observe($('#stageWrap'));
  window.__S = S; window.__app = { play, stop, seek, runAgents, selectScene, commit };
})();
