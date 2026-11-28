/* Lõi: tiện ích, mô hình dự án, thời gian cảnh */
(function () {
  const SM = (window.SM = window.SM || {});

  SM.$ = (s, r = document) => r.querySelector(s);
  SM.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  SM.h = function (tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, v);
    }
    kids.flat(Infinity).forEach((c) => {
      if (c == null || c === false) return;
      e.append(c.nodeType ? c : document.createTextNode(c));
    });
    return e;
  };
  SM.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  SM.lerp = (a, b, t) => a + (b - a) * t;
  SM.uid = () => Math.random().toString(36).slice(2, 9);
  SM.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  SM.ease = {
    out: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    elastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  };
  SM.norm = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  SM.fmt = (s) => { s = Math.max(0, s); const m = Math.floor(s / 60); return m + ':' + (s - m * 60).toFixed(1).padStart(4, '0'); };
  SM.fmtSrt = (s) => {
    const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60, r = ms % 1000;
    const p = (n, l = 2) => String(n).padStart(l, '0');
    return `${p(h)}:${p(m)}:${p(sec)},${p(r, 3)}`;
  };
  SM.hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // Khung hình logic (cạnh ngắn = 900) và kích thước xuất
  SM.ASPECTS = {
    '16:9': { lw: 1600, lh: 900, w: 1280, h: 720, name: 'Ngang 16:9 (YouTube)' },
    '9:16': { lw: 900, lh: 1600, w: 720, h: 1280, name: 'Dọc 9:16 (Reels/TikTok)' },
    '1:1': { lw: 900, lh: 900, w: 900, h: 900, name: 'Vuông 1:1 (Facebook)' },
    '4:5': { lw: 900, lh: 1125, w: 864, h: 1080, name: 'Dọc 4:5 (Feed)' },
  };

  SM.defaultProject = () => ({
    v: 1,
    title: 'Video người que',
    lang: 'vi',
    aspect: '16:9',
    script: '',
    scenes: [],
    character: { name: 'Que', style: 'coat', head: '#111114', coat: '#8f9298', pants: '#1b1b1f', scarf: true, scarfColor: '#1f8a84', glasses: true, hat: 'none', hatColor: '#e5483b', mouthSync: true },
    grade: { temp: 0.12, contrast: 0.3, sat: 0.15, vignette: 0.35, grain: 0.25 },
    subs: { on: true, style: 'box', size: 46, pos: 'bottom', color: '#ffd23f', color2: '#ff7a59' },
    music: { style: 'lofi', vol: 0.35, duck: true },
    voice: { vol: 1, mode: 'none', provider: 'browser', oaVoice: 'nova', oaModel: 'gpt-4o-mini-tts', elVoice: 'EXAVITQu4vr4xnSDxMaL', browserVoice: '' },
    mark: { text: '', pos: 'tr', opacity: 0.85, logo: '' },
    sfx: { on: true, vol: 0.8 },
    director: { maxCut: 5.5, wps: 2.6, transitions: 'auto' },
    llm: { on: false, model: 'claude-sonnet-5-5' },
  });

  SM.defaultScene = (text = '') => ({
    id: SM.uid(), text, dur: 3, pose: 'talk', bg: 'paper', tone: 'paper', props: [], flip: false,
    chip: '', badge: '', chapter: '', transition: 'cut', emph: [], sfx: [], cam: { z0: 1, z1: 1.08, fx: 0.5, fy: 0.5 },
    punches: [], grade: null, shake: 0,
  });

  // Dòng thời gian
  SM.timeline = function (p) {
    if (p._tl && p._tl.n === p.scenes.length && p._tl.v === p._ver) return p._tl;
    const starts = []; let t = 0;
    for (const s of p.scenes) { starts.push(t); t += s.dur; }
    return (p._tl = { starts, total: t, n: p.scenes.length, v: p._ver });
  };
  SM.touch = (p) => { p._ver = (p._ver || 0) + 1; p._tl = null; };
  SM.sceneAt = function (p, t) {
    const tl = SM.timeline(p);
    if (!p.scenes.length) return null;
    for (let i = p.scenes.length - 1; i >= 0; i--) if (t >= tl.starts[i] - 1e-6) return { i, lt: Math.min(t - tl.starts[i], p.scenes[i].dur + 5), start: tl.starts[i] };
    return { i: 0, lt: 0, start: 0 };
  };

  // Thời điểm từng từ trong cảnh (chia theo độ dài chữ, có nghỉ ở dấu câu)
  const wcache = new Map();
  SM.sceneWords = function (sc) {
    const key = sc.text + '|' + sc.dur + '|' + (sc.emph || []).join(',');
    if (wcache.has(key)) return wcache.get(key);
    const toks = sc.text.split(/\s+/).filter(Boolean);
    const lead = Math.min(0.15, sc.dur * 0.1), tail = Math.min(0.25, sc.dur * 0.12);
    const use = Math.max(0.3, sc.dur - lead - tail);
    const wt = toks.map((w) => w.length + 2 + (/[,;:]$/.test(w) ? 3 : 0) + (/[.!?…]$/.test(w) ? 5 : 0));
    const sum = wt.reduce((a, b) => a + b, 0) || 1;
    let t = lead; const out = [];
    toks.forEach((w, i) => {
      const d = (use * wt[i]) / sum;
      out.push({ w, t0: t, t1: t + d * 0.92, emph: (sc.emph || []).includes(i) });
      t += d;
    });
    if (wcache.size > 500) wcache.clear();
    wcache.set(key, out);
    return out;
  };

  SM.serialize = (p) => JSON.stringify(p, (k, v) => (k[0] === '_' ? undefined : v));
  SM.clone = (p) => JSON.parse(SM.serialize(p));
})();
