/* Âm thanh: hiệu ứng tổng hợp, nhạc nền tự sinh, giọng đọc, đồng bộ theo khoảng lặng */
(function () {
  const SM = window.SM;
  const A = (SM.Audio = {
    ctx: null, master: null, sfxG: null, musG: null, voiG: null, dest: null,
    voice: { buffer: null, name: '', src: null, peaks: null },
    musicFile: { buffer: null, name: '', src: null },
    musicTimer: null, _musicNodes: [],
  });

  SM.SFX = { tick: 'Tích', pop: 'Bốp', whoosh: 'Vút', hit: 'Đập mạnh', ding: 'Ting', cash: 'Tiền rơi', alert: 'Cảnh báo', sparkle: 'Lấp lánh', boing: 'Boing', sad: 'Buồn (kèn)', type: 'Gõ phím', swish: 'Lướt nhẹ' };

  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return A.ctx; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    const ctx = (A.ctx = new C());
    A.master = ctx.createGain(); A.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    A.master.connect(comp); comp.connect(ctx.destination);
    A.dest = ctx.createMediaStreamDestination(); comp.connect(A.dest);
    A.sfxG = ctx.createGain(); A.musG = ctx.createGain(); A.voiG = ctx.createGain();
    [A.sfxG, A.musG, A.voiG].forEach((g) => g.connect(A.master));
    const n = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = n.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    A.noise = n;
    return ctx;
  };

  const env = (g, t, a, d, peak) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); };
  function osc(type, f0, f1, t, dur, peak, dest, a = 0.005) {
    const c = A.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, a, dur, peak); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + a + 0.05); return o;
  }
  function noise(t, dur, peak, type, f0, f1, dest, q = 1) {
    const c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = A.noise; s.loop = true; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, Math.min(0.03, dur / 3), dur, peak); s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.1);
  }

  A.sfx = function (name, vol = 1, when = 0, target) {
    if (!A.ctx) return;
    const t = A.ctx.currentTime + 0.01 + when, d = target || A.sfxG, v = vol;
    switch (name) {
      case 'tick': osc('square', 1900, 1500, t, 0.04, 0.16 * v, d, 0.001); break;
      case 'pop': osc('sine', 380, 1000, t, 0.09, 0.5 * v, d); break;
      case 'whoosh': noise(t, 0.38, 0.5 * v, 'bandpass', 300, 3200, d, 0.8); break;
      case 'swish': noise(t, 0.22, 0.28 * v, 'highpass', 800, 5000, d, 0.5); break;
      case 'hit': osc('sine', 140, 38, t, 0.32, 0.95 * v, d, 0.003); noise(t, 0.12, 0.5 * v, 'lowpass', 2400, 200, d); break;
      case 'ding': osc('sine', 1318, 1318, t, 0.9, 0.35 * v, d); osc('sine', 1976, 1976, t, 0.7, 0.18 * v, d); break;
      case 'cash': osc('triangle', 2093, 2093, t, 0.35, 0.3 * v, d); osc('triangle', 2637, 2637, t + 0.08, 0.5, 0.3 * v, d); noise(t, 0.1, 0.15 * v, 'highpass', 6000, 9000, d); break;
      case 'alert': osc('square', 880, 880, t, 0.14, 0.2 * v, d, 0.004); osc('square', 880, 880, t + 0.2, 0.14, 0.2 * v, d, 0.004); break;
      case 'sparkle': [0, 1, 2, 3, 4, 5].forEach((i) => osc('sine', 1568 * Math.pow(1.122, i * 2), 1568 * Math.pow(1.122, i * 2), t + i * 0.055, 0.25, 0.16 * v, d)); break;
      case 'boing': { const o = osc('sine', 200, 600, t, 0.5, 0.45 * v, d); o.frequency.setValueCurveAtTime(new Float32Array([200, 520, 260, 480, 300, 420, 340]), t, 0.5); break; }
      case 'sad': osc('triangle', 330, 196, t, 0.9, 0.3 * v, d, 0.05); osc('sawtooth', 331, 197, t, 0.9, 0.08 * v, d, 0.05); break;
      case 'type': [0, 1, 2, 3].forEach((i) => osc('square', 1400 + i * 120, 1200, t + i * 0.06, 0.03, 0.1 * v, d, 0.001)); break;
      default: osc('sine', 600, 600, t, 0.1, 0.2 * v, d);
    }
  };

  // ===== nhạc nền tự sinh =====
  const MUSIC = {
    lofi: { name: 'Lo-fi nhẹ nhàng', bpm: 78, prog: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]], bass: [45, 41, 43, 40] },
    upbeat: { name: 'Vui tươi sôi động', bpm: 112, prog: [[60, 64, 67], [67, 71, 74], [57, 60, 64], [53, 57, 60]], bass: [48, 43, 45, 41] },
    epic: { name: 'Kịch tính hùng tráng', bpm: 92, prog: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], bass: [33, 29, 36, 31] },
    tense: { name: 'Hồi hộp bí ẩn', bpm: 100, prog: [[50, 53, 57], [50, 53, 57], [49, 52, 56], [47, 50, 54]], bass: [38, 38, 37, 35] },
    none: { name: 'Không nhạc' },
    file: { name: 'Nhạc của bạn (đã tải lên)' },
  };
  SM.MUSIC = MUSIC;
  const mf = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function kick(t, v, d) { osc('sine', 150, 42, t, 0.22, 0.7 * v, d, 0.002); }
  function hat(t, v, d) { noise(t, 0.04, 0.12 * v, 'highpass', 7000, 9000, d); }
  function snare(t, v, d) { noise(t, 0.14, 0.22 * v, 'bandpass', 1800, 1200, d); osc('triangle', 220, 160, t, 0.08, 0.2 * v, d); }
  function pad(notes, t, dur, v, d, type = 'triangle', cutoff = 1400) {
    const c = A.ctx, f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff; f.connect(d);
    notes.forEach((m) => [-5, 5].forEach((det) => { const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = mf(m); o.detune.value = det;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.06 * v, t + Math.min(0.4, dur / 3)); g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(f); o.start(t); o.stop(t + dur + 0.05); }));
  }

  function scheduleStep(st, step, t, d) {
    const bar = Math.floor(step / 16), s = step % 16, ch = st.prog[bar % st.prog.length], bs = st.bass[bar % st.bass.length], sd = 60 / st.bpm / 4;
    const style = st.id;
    if (style === 'lofi') {
      if (s === 0) pad(ch.map((m) => m + 0), t, sd * 15, 1, d, 'triangle', 1100);
      if (s === 0 || s === 10) kick(t, 0.8, d);
      if (s === 4 || s === 12) snare(t, 0.55, d);
      if (s % 2 === 0) hat(t + (s % 4 === 2 ? sd * 0.2 : 0), s % 4 === 2 ? 0.7 : 0.4, d);
      if (s === 0 || s === 8) osc('sine', mf(bs), mf(bs), t, sd * 6, 0.35, d, 0.01);
      if ([2, 7, 11, 14].includes(s)) osc('triangle', mf(ch[(s * 3) % ch.length] + 12), mf(ch[(s * 3) % ch.length] + 12), t, sd * 2.5, 0.14, d, 0.005);
    } else if (style === 'upbeat') {
      if (s % 4 === 0) kick(t, 0.7, d);
      if (s === 4 || s === 12) snare(t, 0.5, d);
      if (s % 2 === 1) hat(t, 0.5, d);
      if (s % 2 === 0) osc('square', mf(ch[(s / 2) % ch.length] + 12), mf(ch[(s / 2) % ch.length] + 12), t, sd * 1.6, 0.07, d, 0.003);
      if (s === 0 || s === 6 || s === 10) osc('triangle', mf(bs), mf(bs), t, sd * 3, 0.4, d, 0.005);
      if (s === 0) pad(ch, t, sd * 16, 0.8, d, 'sawtooth', 1800);
    } else if (style === 'epic') {
      if (s === 0) { pad(ch, t, sd * 16, 1.3, d, 'sawtooth', 900); osc('sine', 60, 36, t, 0.6, 0.9, d, 0.005); osc('sawtooth', mf(bs), mf(bs), t, sd * 15, 0.12, d, 0.2); }
      if (s === 8 || s === 14) { osc('sine', 80, 40, t, 0.4, 0.6, d, 0.005); }
      if (s % 4 === 2 && bar % 2) hat(t, 0.5, d);
      if (s === 12) noise(t, 0.25, 0.18, 'bandpass', 200, 2500, d);
    } else if (style === 'tense') {
      if (s === 0) pad([bs + 12, bs + 19], t, sd * 16, 1.1, d, 'sawtooth', 500);
      if (s % 4 === 0) osc('sine', mf(bs), mf(bs), t, sd * 1.8, 0.45, d, 0.003);
      if (s % 2 === 0) hat(t, 0.28, d);
      if (s === 7 || s === 15) osc('triangle', mf(ch[2] + 24), mf(ch[2] + 24), t, sd * 1.2, 0.08, d, 0.003);
    }
  }

  A.stopMusic = function () {
    clearInterval(A.musicTimer); A.musicTimer = null;
    if (A.musicFile.src) { try { A.musicFile.src.stop(); } catch (e) {} A.musicFile.src = null; }
  };
  A.startMusic = function (style, vol, offset = 0) {
    A.stopMusic(); if (!A.ctx) return;
    A.musG.gain.cancelScheduledValues(0); A.musG.gain.value = vol;
    if (style === 'none') return;
    if (style === 'file') {
      if (!A.musicFile.buffer) return;
      const s = A.ctx.createBufferSource(); s.buffer = A.musicFile.buffer; s.loop = true; s.connect(A.musG);
      s.start(0, offset % A.musicFile.buffer.duration); A.musicFile.src = s; return;
    }
    const st = Object.assign({ id: style }, MUSIC[style]); if (!st.bpm) return;
    const sd = 60 / st.bpm / 4; let step = Math.floor(offset / sd), next = A.ctx.currentTime + 0.05;
    const tick = () => { while (next < A.ctx.currentTime + 0.3) { scheduleStep(st, step, next, A.musG); next += sd; step++; } };
    tick(); A.musicTimer = setInterval(tick, 60);
  };
  A.setMusicGain = (v) => { if (A.musG) A.musG.gain.setTargetAtTime(v, A.ctx.currentTime, 0.05); };

  // ===== giọng đọc =====
  A.loadAudio = async function (file) {
    A.init();
    const buf = await A.ctx.decodeAudioData(await file.arrayBuffer());
    return buf;
  };
  A.peaks = function (buf, perSec = 60) {
    const d = buf.getChannelData(0), n = Math.ceil(buf.duration * perSec), step = Math.floor(d.length / n), out = new Float32Array(n);
    for (let i = 0; i < n; i++) { let m = 0; for (let j = 0; j < step; j += 8) { const v = Math.abs(d[i * step + j] || 0); if (v > m) m = v; } out[i] = m; }
    return out;
  };
  A.startVoice = function (offset, vol) {
    A.stopVoice(); const b = A.voice.buffer; if (!A.ctx || !b || offset >= b.duration) return;
    const s = A.ctx.createBufferSource(); s.buffer = b; A.voiG.gain.value = vol; s.connect(A.voiG); s.start(0, Math.max(0, offset)); A.voice.src = s;
  };
  A.stopVoice = function () { if (A.voice.src) { try { A.voice.src.stop(); } catch (e) {} A.voice.src = null; } };

  // tìm các khoảng lặng trong giọng đọc
  A.detectPauses = function (buf) {
    const d = buf.getChannelData(0), win = Math.floor(buf.sampleRate * 0.02), n = Math.floor(d.length / win), rms = new Float32Array(n);
    for (let i = 0; i < n; i++) { let s = 0; for (let j = 0; j < win; j += 2) s += d[i * win + j] ** 2; rms[i] = Math.sqrt(s / (win / 2)); }
    const sorted = Array.from(rms).sort((a, b) => a - b), peak = sorted[Math.floor(n * 0.95)] || 0.1, th = Math.max(0.004, peak * 0.06);
    let first = 0, last = n - 1; while (first < n && rms[first] < th) first++; while (last > 0 && rms[last] < th) last--;
    const gaps = []; let st = -1;
    for (let i = first; i <= last; i++) {
      if (rms[i] < th) { if (st < 0) st = i; } else if (st >= 0) { const len = (i - st) * 0.02; if (len >= 0.14) gaps.push({ t: ((st + i) / 2) * 0.02, len }); st = -1; }
    }
    return { gaps, start: first * 0.02, end: (last + 1) * 0.02 };
  };

  // chia lại thời lượng các cảnh theo giọng đọc
  A.syncScenes = function (p, buf) {
    const n = p.scenes.length; if (!n) return null;
    const { gaps, start, end } = A.detectPauses(buf);
    const w = p.scenes.map((s) => s.text.length + 6), tot = w.reduce((a, b) => a + b, 0);
    let acc = 0; const exp = w.map((x) => (acc += x) / tot);
    const span = end - start, bounds = []; let prev = start;
    for (let i = 0; i < n - 1; i++) {
      const e = start + span * exp[i], win = Math.max(0.6, span / n * 0.45);
      let best = null, bs = 1e9;
      gaps.forEach((g) => { if (g.t <= prev + 0.5 || g.t > end - 0.4) return; const sc = Math.abs(g.t - e) / win - Math.min(g.len, 0.8); if (Math.abs(g.t - e) < win && sc < bs) { bs = sc; best = g; } });
      const b = best ? best.t : Math.max(prev + 0.6, e); bounds.push(b); prev = b;
    }
    const edges = [0, ...bounds, Math.max(buf.duration, end + 0.2)];
    return edges.slice(1).map((e, i) => Math.max(0.6, +(e - edges[i]).toFixed(2)));
  };
})();
