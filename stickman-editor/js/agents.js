/* Các trợ lý AI: Đạo diễn, Nhịp cắt, Nhân vật & bối cảnh, Màu phim, Âm thanh, Phụ đề, Zoom & chữ, QA.
   Chạy offline bằng luật; tuỳ chọn dùng Claude API để Đạo diễn đọc kịch bản thông minh hơn. */
(function () {
  const SM = window.SM;
  const { clamp } = SM;
  const AG = (SM.Agents = {});
  AG.NAMES = { director: 'Đạo diễn', rhythm: 'Nhịp cắt', char: 'Nhân vật', color: 'Màu', sound: 'Âm thanh', subs: 'Phụ đề', zoom: 'Zoom & chữ', qa: 'QA' };
  AG.STAGES = [
    ['director', 'Đạo diễn đọc kịch bản'], ['rhythm', 'Nhịp cắt'], ['char', 'Nhân vật & bối cảnh'], ['color', 'Màu phim'],
    ['sound', 'Âm thanh'], ['subs', 'Phụ đề'], ['zoom', 'Zoom & chữ'], ['qa', 'QA kiểm tra'],
  ];

  // ---------- từ điển từ khoá (đã bỏ dấu). "=" đầu: khớp nguyên từ ----------
  const LEX = {
    warning: ['canh bao', 'nguy hiem', 'sai lam', 'loi nghiem', 'warning', 'danger', 'mistake', 'risk', 'rui ro', 'lua dao', 'scam', 'that bai', 'fail', 'coi chung', 'bi khoa', 'bi phat', 'vi pham', 'trap', 'pitfall', 'ban nick'],
    money: ['tien', 'doanh thu', 'loi nhuan', 'kiem duoc', 'thu nhap', 'giau', 'dollar', 'money', 'profit', 'revenue', 'cash', '$', 'trieu', '=ty', 'ngan', 'hoa hong', 'commission', 'earn', 'gia ', 'chi phi', 'ngan sach', 'budget', 'income'],
    chartUp: ['tang', 'bung no', 'viral', 'growth', 'grow', 'increase', 'rise', 'boom', 'len top', 'doanh so', 'scale', 'x2', 'x10', 'cao hon', 'nhieu hon', 'toi uu', 'cai thien', 'hieu qua'],
    chartDown: ['giam', 'sut ', 'ha thap', 'decline', 'drop', 'fall', 'decrease', 'crash', 'sap ', 'lo von', 'thua lo', 'tut'],
    bulb: ['y tuong', 'idea', 'bi quyet', '=meo', 'tip', 'trick', 'nhan ra', 'realize', 'sang tao', 'creative', 'gai y', 'insight', 'hoa ra'],
    question: ['tai sao', 'vi sao', 'lam sao', 'the nao', '=why', 'how ', 'lieu ', 'bao gio', 'co phai'],
    cart: ['don hang', 'ban hang', '=mua', 'gio hang', 'shop', 'seller', 'order', '=sale', 'cua hang', 'tmdt', 'shopee', 'lazada', 'checkout', 'chot don', 'khach hang', 'customer', 'affiliate', 'tiep thi lien ket'],
    box: ['san pham', 'hang hoa', '=kho', 'van chuyen', 'giao hang', 'dong goi', 'product', 'package', 'shipping', 'nhap hang', 'ton kho'],
    phone: ['dien thoai', 'tiktok', 'facebook', 'reels', 'livestream', '=live', 'instagram', 'youtube', '=app', 'ung dung', 'phone', 'mobile', '=page', 'fanpage', 'mang xa hoi', 'zalo', 'thong bao'],
    robot: ['=ai', 'chatgpt', 'claude', 'agent', 'robot', '=bot', 'tu dong', 'automat', 'tri tue nhan tao', 'prompt', 'gemini', 'tro ly', 'machine', 'thuat toan', 'algorithm'],
    stop: ['=dung ', 'dung bao gio', 'khong nen', '=stop', 'never', '=tranh', 'khong bao gio', 'ngung', 'cam ky', 'dung lai', "don't", 'khong duoc'],
    lock: ['bi mat', 'secret', 'bao mat', 'password', 'private', 'an giau', 'mat khau', 'doc quyen', 'exclusive', 'hidden'],
    clock: ['=gio', 'phut', '=ngay', 'nhanh chong', 'thoi gian', 'deadline', '=time', 'minute', '=hour', '=days', 'tuan', 'hang ngay', 'trong 24', 'giay', 'han chot', 'tiet kiem thoi'],
    heart: ['yeu', 'thich', 'love', 'follow', 'theo doi', 'cam on', 'ung ho', 'chia se', '=share', 'dang ky', 'subscribe', 'tym', 'thuong', 'tam huyet', 'dong hanh', 'ket noi'],
    star: ['tuyet voi', '=top', 'chat luong', 'amazing', '5 sao', 'premium', '=vip', 'noi bat', 'dinh cao', 'xuat sac', 'danh gia', 'review'],
    check: ['chinh xac', 'hoan thanh', '=xong', '=done', 'correct', 'giai phap', 'solution', 'ket qua', 'thanh cong', 'success', 'dung roi', 'chuan', 'hieu qua', 'don gian', 'de dang', 'bat dau', 'co the lam'],
    cross: ['khong dung', 'wrong', 'sai roi', 'khong hieu qua', 'vo ich', 'lang phi', 'hieu lam', 'myth'],
    megaphone: ['quang cao', '=ads', 'marketing', 'quang ba', 'announce', 'chay ads', 'thong bao', 'tuyen bo', 'broadcast', 'content', 'truyen thong', 'loan tin'],
    trophy: ['chien thang', 'vo dich', '=win', 'champion', 'so 1', 'thanh tich', 'winner', 'dat duoc', 'giai thuong', 'thanh tuu', 'vuot', 'dan dau', 'best seller', 'bestseller'],
    target: ['muc tieu', 'target', 'tap trung', '=focus', '=nham', '=goal', 'kpi', 'doi tuong', 'chinh xac', 'trung dich', 'dinh vi'],
    fire: ['=hot', 'xu huong', 'trend', 'ban chay', 'bung chay', 'chay hang', 'nong', 'bom tan', 'cuc ky', 'can quet', 'sieu'],
    rocket: ['khoi nghiep', 'launch', 'startup', 'tang toc', 'rocket', 'khoi dong', 'ra mat', 'cat canh', 'but pha', 'dot pha', 'phong'],
    gear: ['quy trinh', 'cai dat', 'he thong', 'cong cu', '=tool', 'workflow', 'setting', 'tinh nang', 'feature', 'tu dong hoa', 'van hanh', 'cau hinh', 'ky thuat', 'co che'],
    doc: ['kich ban', 'ke hoach', '=plan', 'script', 'noi dung', 'bai viet', 'checklist', '=buoc', '=step', 'huong dan', 'guide', 'tai lieu', 'bao cao', 'report', 'danh sach', 'cong thuc', 'mau '],
    magnifier: ['=tim', 'nghien cuu', 'phan tich', 'research', 'analy', 'kiem tra', 'so sanh', 'quan sat', 'search', 'tim hieu', 'soi', 'chi tiet', 'khao sat', 'discover', 'kham pha'],
    shield: ['an toan', 'bao ve', 'shield', 'protect', 'bao hanh', 'uy tin', 'tin cay', 'trust', 'cam ket', 'dam bao', 'chong'],
    play: ['=xem', '=video', '=clip', 'phim', 'watch', '=play', 'quay', 'dung phim', 'edit'],
    tower: ['thap canh', 'tuong thanh', 'van ly', 'tower', 'castle', 'phao dai', 'thanh tri', 'phong thu', 'wall'],
    thumb: ['=like', 'thich bai', 'tuong tac', 'engage', 'luot thich', 'ok ', 'tot ', 'duoc roi'],
  };
  const POSEX = {
    smash: ['dap tan', 'pha vo', '=dap', 'smash', 'break', 'destroy', 'pha huy', 'tan vo', '=bua', 'dap bo', 'ha guc', 'ha bo', 'xoa bo'],
    run: ['chay nhanh', '=chay', '=run', 'sprint', 'voi vang', 'khan truong', 've dich', 'chay dua', 'chay nuoc rut'],
    walk: ['di bo', 'hanh trinh', 'buoc di', '=di', 'journey', 'walk', 'tien len', 'tung buoc', 'tien toi', 'hanh dong'],
    wave: ['xin chao', 'chao cac', 'hello', 'hi cac', 'tam biet', 'hen gap lai', '=bye', 'chao mung', 'welcome', 'goodbye', 'gap lai'],
    surprised: ['bat ngo', 'sock', 'khong the tin', 'giat minh', 'shock', 'surprise', 'kinh ngac', 'thi ra', 'hoa ra', 'bom tan', 'bat ngo', 'khong ngo', 'tuong tuong', 'ngac nhien', 'dieu gi'],
    sad: ['buon', 'that vong', 'khoc', 'tiec', '=sad', 'disappoint', 'te qua', 'thua lo', 'kho khan', 'met moi', 'kiet suc', 'tuyet vong', 'dau dau', 'bat luc', 'khong ai', 'co don'],
    think: ['nghi', 'tu hoi', 'tai sao', 'vi sao', 'lieu ', '=why', 'how come', 'suy nghi', 'tuong tuong', 'imagine', 'thu nghi', 'phan van', 'bao gio', 'neu nhu', 'liệu'],
    celebrate: ['vui', 'hanh phuc', 'chuc mung', 'great', '=wow', 'thang', '=win', 'success', 'cuoi', 'thanh cong', 'tuyet voi', 'yeah', 'hoan ho', 'xuat sac', 'chien thang', 'ky luc'],
    shrug: ['khong biet', '=tuy', 'maybe', 'perhaps', 'biet dau', 'who knows', 'hoac la', 'khong chac', 'tuy thuoc', 'co the'],
  };
  const BGX = {
    night: ['=dem', '=toi', 'khuya', 'night', '=dark', 'ban dem', 've dem'],
    city: ['thanh pho', 'duong pho', '=city', 'cua hang', '=cho', 'street', 'di lam', 'giao thong', 'duong'],
    room: ['=phong', '=nha', 'van phong', '=home', 'office', 'may tinh', 'ban lam viec', 'studio', 'trong nha', 'laptop', 'tai nha', 'nguoi nha'],
    grid: ['du lieu', 'so lieu', '=data', 'ke hoach', 'bao cao', 'phan tich', 'thong ke', '=plan', 'excel', 'bang ', 'quy trinh', 'he thong', 'cong thuc'],
    sunburst: ['bung no', 'chuc mung', 'amazing', 'thanh cong', '=wow', 'ky luc', 'tuyet voi'],
  };
  const compile = (list) => {
    const pre = [], ex = [];
    list.forEach((k) => (k[0] === '=' ? ex.push(k.slice(1).trim()) : pre.push(k.trim())));
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return {
      pre: pre.length ? new RegExp('(?:^|[^a-z0-9])(?:' + pre.map(esc).join('|') + ')', 'g') : null,
      ex: ex.length ? new RegExp('(?:^|[^a-z0-9])(?:' + ex.map(esc).join('|') + ')(?![a-z0-9])', 'g') : null,
    };
  };
  const RX = {}; [['L', LEX], ['P', POSEX], ['B', BGX]].forEach(([n, o]) => { RX[n] = {}; for (const k in o) RX[n][k] = compile(o[k]); });
  const score = (rx, n) => (rx.pre ? (n.match(rx.pre) || []).length : 0) + (rx.ex ? (n.match(rx.ex) || []).length : 0);

  AG.analyze = function (text) {
    const n = ' ' + SM.norm(text) + ' ';
    const out = { props: [], pose: {}, bg: {}, q: /\?\s*$/.test(text.trim()) || /\?/.test(text), ex: /!/.test(text) };
    const ps = [];
    for (const k in RX.L) { const s = score(RX.L[k], n); if (s) ps.push([k, s]); }
    out.props = ps.sort((a, b) => b[1] - a[1]).map((x) => x[0]);
    for (const k in RX.P) out.pose[k] = score(RX.P[k], n);
    for (const k in RX.B) out.bg[k] = score(RX.B[k], n);
    return out;
  };

  // ---------- phân tích kịch bản ----------
  const parseHints = (str) => {
    const h = {};
    str.split(/[\s,;]+(?=[a-z]+:)/i).forEach((kv) => { const m = kv.match(/^\s*([a-z]+)\s*:\s*(.+?)\s*$/i); if (m) h[m[1].toLowerCase()] = m[2]; });
    return h;
  };
  function parseScript(script) {
    const items = []; let chapter = '', pb = false, title = '';
    const lines = script.replace(/\r/g, '').split('\n');
    lines.forEach((raw, li) => {
      let line = raw.trim();
      if (!line) { pb = true; return; }
      const hm = line.match(/^(#{1,3})\s*(.+)$/);
      if (hm) { if (!title && !items.length && hm[1].length === 1 && !chapter) { title = hm[2]; return; } chapter = hm[2]; pb = true; return; }
      if (/^(chương|phần|bước|chapter|part|step)\s*\d+\b[^.!?]{0,60}$/i.test(line)) { chapter = line; pb = true; return; }
      const sents = line.split(/(?<=[.!?…])\s+/).filter(Boolean);
      sents.forEach((s, si) => {
        const hints = {}; s = s.replace(/\{([^}]*)\}/g, (_, g) => { Object.assign(hints, parseHints(g)); return ''; }).trim();
        if (!s) { if (items.length) Object.assign(items[items.length - 1].hints, hints); return; }
        items.push({ text: s.replace(/\s+/g, ' '), chapter, hints, pbreak: pb && si === 0 });
        chapter = ''; pb = false;
      });
    });
    return { items, title };
  }
  const durOf = (text, wps) => {
    const w = text.split(/\s+/).filter(Boolean).length, commas = (text.match(/[,;:]/g) || []).length;
    return +clamp(w / wps + 0.6 + commas * 0.12, 1.6, 14).toFixed(1);
  };

  function applyHints(sc, h) {
    const lock = (k, v) => { sc[k] = v; sc._lock[k] = true; };
    if (h.pose && SM.POSES[h.pose]) lock('pose', h.pose);
    if (h.prop || h.props) lock('props', (h.prop || h.props).split(/[,+|]/).map((s) => s.trim()).filter((s) => SM.PROPS[s]));
    if (h.tone && SM.TONES[h.tone]) lock('tone', h.tone);
    if (h.bg && SM.BGS[h.bg]) lock('bg', h.bg);
    if (h.chip) lock('chip', h.chip);
    if (h.badge) lock('badge', h.badge);
    if (h.tr && SM.TRANSITIONS[h.tr]) lock('transition', h.tr);
    if (h.dur && +h.dur > 0.5) lock('dur', +h.dur);
    if (h.flip) lock('flip', /^(1|true|co|yes)$/i.test(h.flip));
    if (h.sfx && SM.SFX[h.sfx]) { sc._extraSfx = h.sfx; }
  }

  // ---------- LLM đạo diễn (tuỳ chọn) ----------
  async function llmDirector(script, p, key) {
    const sys = `Bạn là Đạo diễn video hoạt hình người que cho người bán hàng online & làm affiliate. Đọc kịch bản và chia thành các cảnh ngắn (mỗi cảnh 1 câu hoặc 1 ý, ≤ 22 từ, giữ nguyên lời gốc, không bịa thêm). Trả về DUY NHẤT một JSON hợp lệ, không giải thích:
{"title":"tiêu đề ngắn","scenes":[{"text":"...","pose":"${Object.keys(SM.POSES).join('|')}","props":["tối đa 2 trong: ${Object.keys(SM.PROPS).join(', ')}"],"bg":"${Object.keys(SM.BGS).join('|')}","tone":"${Object.keys(SM.TONES).join('|')}","chip":"nhãn ngắn hoặc số liệu nổi bật (có thể rỗng)","badge":"cụm 1-3 từ cần nhấn mạnh bằng sticker (có thể rỗng)","emphasis":["các từ khoá nên tô nổi bật"],"transition":"${Object.keys(SM.TRANSITIONS).join('|')}","chapter":"tên chương nếu bắt đầu phần mới, còn lại rỗng"}]}
Quy tắc: cảnh đầu là hook; cảnh cuối là lời kêu gọi; đổi tư thế liên tục, đừng lặp pose 3 lần liền; chọn tone theo cảm xúc (danger=cảnh báo, money=tiền/tăng trưởng, night=bí mật, warm=ý tưởng, cool=công nghệ).`;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: p.llm.model || 'claude-sonnet-5-5', max_tokens: 8000, system: sys, messages: [{ role: 'user', content: script }] }),
    });
    if (!r.ok) throw new Error('API ' + r.status + ' ' + (await r.text()).slice(0, 160));
    const j = await r.json(), txt = (j.content || []).map((b) => b.text || '').join('');
    const m = txt.match(/\{[\s\S]*\}/); if (!m) throw new Error('Không đọc được JSON');
    return JSON.parse(m[0]);
  }

  // ---------- các giai đoạn ----------
  const T = (X, i) => SM.timeline(X.p).starts[i] || 0;
  const short = (s, n = 46) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
  const shortW = (s, n) => { if (s.length <= n) return s; const c = s.slice(0, n).replace(/\s+\S*$/, ''); return (c || s.slice(0, n)) + '…'; };

  async function stageDirector(X) {
    const p = X.p; let items, title, llm = null;
    if (p.llm.on && X.key) {
      try { llm = await llmDirector(p.script, p, X.key); await X.log(0, 'director', 'Claude đã đọc kịch bản và lên kế hoạch cảnh'); }
      catch (e) { await X.log(0, 'director', 'Không gọi được Claude — chuyển sang đạo diễn offline', [String(e.message || e)]); }
    }
    const parsed = parseScript(p.script); title = parsed.title;
    if (llm && Array.isArray(llm.scenes) && llm.scenes.length) {
      title = llm.title || title;
      p.scenes = llm.scenes.filter((s) => s && s.text).map((s) => {
        const sc = SM.defaultScene(String(s.text).trim()); sc._lock = {}; sc._llm = true;
        const L = (k, v, ok) => { if (v != null && v !== '' && (!ok || ok(v))) { sc[k] = v; sc._lock[k] = true; } };
        L('pose', s.pose, (v) => SM.POSES[v]); L('bg', s.bg, (v) => SM.BGS[v]); L('tone', s.tone, (v) => SM.TONES[v]);
        L('transition', s.transition, (v) => SM.TRANSITIONS[v]); L('chip', s.chip); L('badge', s.badge); L('chapter', s.chapter);
        if (Array.isArray(s.props)) L('props', s.props.filter((x) => SM.PROPS[x]).slice(0, 2));
        sc._emphWords = Array.isArray(s.emphasis) ? s.emphasis.map((x) => SM.norm(String(x))) : null;
        sc.dur = durOf(sc.text, p.director.wps); return sc;
      });
    } else {
      p.scenes = parsed.items.map((it) => {
        const sc = SM.defaultScene(it.text); sc._lock = {}; sc._pbreak = it.pbreak; sc.chapter = it.chapter || ''; if (sc.chapter) sc._lock.chapter = true;
        applyHints(sc, it.hints); if (!sc._lock.dur) sc.dur = durOf(sc.text, p.director.wps); return sc;
      });
    }
    if (title && (!p.title || p.title === 'Video người que')) p.title = title;
    if (!p.scenes.length) throw new Error('Kịch bản trống — hãy nhập vài câu rồi thử lại.');
    if ((!p.title || p.title === 'Video người que') && p.scenes[0]) p.title = p.scenes[0].text.split(/\s+/).slice(0, 7).join(' ').replace(/[.!?,]+$/, '');
    SM.touch(p);
    await X.log(0, 'director', `Chia kịch bản thành ${p.scenes.length} cảnh`, [`Tiêu đề: ${p.title}`]);
    for (let i = 0; i < p.scenes.length; i++) {
      const sc = p.scenes[i]; await X.log(T(X, i), 'director', `Cảnh ${i + 1} — ${short(sc.text)}`, [`thời lượng ${sc.dur.toFixed(1)}s`]);
    }
    X.apply();
  }

  async function stageRhythm(X) {
    const p = X.p, max = p.director.maxCut; let splits = 0, merges = 0;
    const out = [];
    const FUNC = new Set('the a an of to in on at for and or but with by from as is are was were và của là các những một cho với để trong từ như thì mà hay hoặc bởi vì nên khi nếu tại về theo sau trước cùng rất đã sẽ đang'.split(' '));
    const splitText = (text) => {
      const w = text.split(/\s+/); if (w.length < 6) return null;
      const mid = w.length / 2; let best = -1, bd = 1e9;
      w.forEach((t, i) => {
        if (i < 2 || i >= w.length - 2) return;
        let d = Math.abs(i + 1 - mid);
        if (/[,;:]$/.test(t)) d -= 4; else if (/[.!?…]$/.test(t)) d -= 6;
        else if (/^(và|nhưng|vì|nên|để|khi|nếu|thì|mà|but|and|so|because|then|which)$/i.test(w[i + 1])) d -= 2.5;
        const last = t.toLowerCase().replace(/[^\p{L}]/gu, ''); if (FUNC.has(last)) d += 6;
        if (/^\p{Lu}/u.test(t) && /^\p{Lu}/u.test(w[i + 1] || '')) d += 5;
        if (d < bd) { bd = d; best = i; }
      });
      return best < 0 ? null : [w.slice(0, best + 1).join(' '), w.slice(best + 1).join(' ')];
    };
    const rec = (sc, depth) => {
      if (sc.dur <= max || depth > 3 || sc._lock.dur) { out.push(sc); return; }
      const parts = splitText(sc.text); if (!parts) { out.push(sc); return; }
      const b = SM.defaultScene(parts[1]); b._lock = {}; b._cont = true; b._pbreak = false; b.dur = durOf(b.text, p.director.wps);
      sc.text = parts[0]; sc.dur = durOf(sc.text, p.director.wps);
      splits++; X._pending.push([SM.timeline(X.p).starts[0], 'rhythm', `Tách cảnh dài: “${short(sc.text, 28)}” | “${short(b.text, 28)}”`]);
      rec(sc, depth + 1); rec(b, depth + 1);
    };
    X._pending = [];
    p.scenes.forEach((sc) => rec(sc, 0));
    // gộp cảnh quá ngắn vào cảnh trước
    const fin = [];
    out.forEach((sc) => {
      const prev = fin[fin.length - 1];
      if (prev && sc.dur < 1.3 && prev.dur + sc.dur < max && !sc.chapter && !prev._lock.dur && !sc._lock.dur && sc.text.split(' ').length < 2) { prev.text += ' ' + sc.text; prev.dur = durOf(prev.text, p.director.wps); merges++; }
      else fin.push(sc);
    });
    p.scenes = fin; SM.touch(p);
    for (const [, a, m] of X._pending) await X.log(0, a, m); X._pending = [];
    // chuyển cảnh theo nhịp
    const cyc = ['slide', 'zoom', 'push', 'wipe'], mode = p.director.transitions; let k = 0;
    p.scenes.forEach((sc, i) => {
      if (sc._lock.transition) return;
      if (i === 0 || mode === 'cut') { sc.transition = 'cut'; return; }
      const prev = p.scenes[i - 1]; let tr;
      if (sc.chapter) tr = 'wipe';
      else if (sc._cont) tr = 'cut';
      else if (sc._pbreak) tr = 'fade';
      else if (prev.dur < 1.3) tr = 'cut';
      else { tr = cyc[k++ % cyc.length]; if (tr === prev.transition) tr = cyc[k++ % cyc.length]; }
      sc.transition = tr;
    });
    const avg = p.scenes.reduce((a, s) => a + s.dur, 0) / p.scenes.length;
    await X.log(0, 'rhythm', `Nhịp cắt trung bình ${avg.toFixed(1)}s/cảnh`, [`tách ${splits} · gộp ${merges} · mục tiêu ≤ ${max}s`]);
    const counts = {}; p.scenes.forEach((s) => (counts[s.transition] = (counts[s.transition] || 0) + 1));
    await X.log(0, 'rhythm', 'Xếp chuyển cảnh', [Object.entries(counts).map(([k2, v]) => `${SM.TRANSITIONS[k2]} ×${v}`).join(' · ')]);
    X.apply();
  }

  async function stageChar(X) {
    const p = X.p, n = p.scenes.length; let prev = '', cyc = 0, bgc = 0, lastBg = 'paper', lastBgIdx = -9;
    const GEN = ['talk', 'present', 'idle', 'point'];
    for (let i = 0; i < n; i++) {
      const sc = p.scenes[i], a = (sc._a = AG.analyze(sc.text)), det = [];
      // đạo cụ
      if (!sc._lock.props) {
        let pr = a.props.slice(0, sc.text.split(/\s+/).length > 4 ? 2 : 1);
        if (i === 0 && a.q && !pr.includes('question')) pr = ['question'];
        if (i === n - 1 && !pr.includes('heart') && /(follow|theo doi|dang ky|subscribe|like|chia se|share|cam on|thank|lien he|inbox)/.test(SM.norm(sc.text))) pr = ['heart', 'thumb'];
        sc.props = pr; if (pr.length) det.push('đạo cụ: ' + pr.map((x) => SM.PROPS[x]).join(', '));
      }
      // tư thế
      if (!sc._lock.pose) {
        const P = a.pose; let pose = null;
        const pick = (k) => P[k] > 0;
        if (pick('smash')) pose = 'smash'; else if (pick('run')) pose = 'run'; else if (pick('walk') && !a.props.length) pose = 'walk';
        else if (i === 0 && pick('wave')) pose = 'wave'; else if (pick('wave')) pose = 'wave';
        else if (pick('surprised') || a.props[0] === 'warning') pose = 'surprised'; else if (pick('sad') || a.props[0] === 'chartDown') pose = 'sad';
        else if (a.q || pick('think')) pose = 'think'; else if (pick('celebrate') || a.props[0] === 'trophy' || (a.ex && (a.props[0] === 'money' || a.props[0] === 'chartUp'))) pose = 'celebrate';
        else if (pick('shrug')) pose = 'shrug';
        else if (i === n - 1) pose = 'wave';
        else if (sc.props.length) pose = cyc++ % 2 ? 'present' : 'point';
        else { pose = GEN[cyc++ % GEN.length]; }
        if (pose === prev && !['smash', 'walk', 'run'].includes(pose)) pose = GEN[(GEN.indexOf(pose) + 1 + (cyc++ % 3)) % GEN.length];
        sc.pose = pose; det.push('tư thế: ' + SM.POSES[pose]);
      }
      prev = sc.pose;
      if (!sc._lock.flip) sc.flip = sc.props.length ? i % 4 === 3 : false;
      // phông nền
      if (!sc._lock.bg) {
        let bg = null, best = 0; for (const k in a.bg) if (a.bg[k] > best) { best = a.bg[k]; bg = k; }
        if (sc.pose === 'walk' || sc.pose === 'run') bg = 'city'; else if (sc.pose === 'celebrate' && !bg) bg = 'sunburst';
        if (!bg) { if (i - lastBgIdx >= 3 || sc.chapter) { bg = ['paper', 'grid', 'dots', 'stripes'][bgc++ % 4]; } else bg = lastBg; }
        if (bg !== lastBg) { lastBgIdx = i; det.push('nền: ' + SM.BGS[bg]); }
        sc.bg = bg; lastBg = bg;
      } else lastBg = sc.bg;
      if (det.length) await X.log(T(X, i), 'char', `Cảnh ${i + 1} — ${det.shift()}`, det);
    }
    X.apply();
    await X.log(0, 'char', `Gán tư thế & đạo cụ cho ${n} cảnh`, [`tên nhân vật: ${p.character.name}`]);
  }

  async function stageColor(X) {
    const p = X.p; let last = 'paper', hold = 0;
    const toneOf = (sc) => {
      const a = sc._a, pr = a.props, pz = a.pose;
      if (a.bg.night > 0 || pr[0] === 'lock') return 'night';
      if (pr[0] === 'warning' || pr[0] === 'stop' || pr[0] === 'cross' || pz.sad > 0 || pr[0] === 'chartDown') return 'danger';
      if (pr[0] === 'money' || pr[0] === 'chartUp' || pr[0] === 'trophy' || pr[0] === 'check') return 'money';
      if (pr[0] === 'bulb' || pr[0] === 'heart' || pr[0] === 'fire' || pr[0] === 'star' || pr[0] === 'rocket') return 'warm';
      if (['robot', 'gear', 'phone', 'magnifier', 'shield', 'doc', 'target', 'play'].includes(pr[0])) return 'cool';
      return null;
    };
    const stat = {};
    for (let i = 0; i < p.scenes.length; i++) {
      const sc = p.scenes[i];
      if (!sc._lock.tone) {
        let t = toneOf(sc); if (!t) { t = hold > 0 ? last : 'paper'; hold--; } else hold = 1;
        if (sc.bg === 'night') t = 'night';
        sc.tone = t; last = t;
      }
      stat[sc.tone] = (stat[sc.tone] || 0) + 1;
      if (sc.tone === 'danger') { sc.grade = { temp: 0.15, contrast: 0.2, sat: 0.1, vignette: 0.2 }; await X.log(T(X, i), 'color', `Chỉnh màu cảnh ${i + 1} — Tạo tông đỏ cảnh báo`, ['tương phản +0.20', 'vignette +0.20']); }
      else if (sc.tone === 'night') { sc.grade = { temp: -0.25, contrast: 0.15, sat: -0.05, vignette: 0.25 }; await X.log(T(X, i), 'color', `Chỉnh màu cảnh ${i + 1} — Làm lạnh tông đêm`, ['nhiệt màu −0.25']); }
      else if (sc.tone === 'money') { sc.grade = { temp: 0.05, contrast: 0.1, sat: 0.2, vignette: 0 }; if (i % 2 === 0) await X.log(T(X, i), 'color', `Chỉnh màu cảnh ${i + 1} — Tông xanh tươi cho số liệu`, ['bão hoà +0.20']); }
    }
    p.grade = Object.assign(p.grade, { temp: 0.1, contrast: 0.28, sat: 0.12, vignette: 0.35, grain: 0.25 });
    await X.log(0, 'color', 'Thiết lập màu phim thống nhất', ['ấm nhẹ · tương phản +0.28 · hạt phim 25%', Object.entries(stat).map(([k, v]) => `${SM.TONES[k].name} ×${v}`).join(' · ')]);
    X.apply();
  }

  async function stageSound(X) {
    const p = X.p; let nHit = 0, nSf = 0;
    const topical = { money: 'cash', warning: 'alert', bulb: 'ding', chartUp: 'sparkle', chartDown: 'sad', stop: 'hit', trophy: 'sparkle', robot: 'type', star: 'sparkle', heart: 'pop', check: 'ding', question: 'boing', fire: 'whoosh', rocket: 'whoosh', lock: 'tick' };
    for (let i = 0; i < p.scenes.length; i++) {
      const sc = p.scenes[i], ev = []; const add = (t, n, v = 1) => { if (t < sc.dur - 0.1 && !ev.some((e) => Math.abs(e.t - t) < 0.14)) ev.push({ t: +t.toFixed(2), n, v }); };
      const words = SM.sceneWords(sc);
      if (sc.transition === 'flash') add(0.02, 'hit', 0.8); else if (sc.transition !== 'cut' && i > 0) add(0, sc.transition === 'wipe' || sc.transition === 'zoom' ? 'whoosh' : 'swish', 0.8);
      if (sc.chapter) add(0.05, 'whoosh', 1);
      const pr = sc.props[0]; if (pr) add(0.22, topical[pr] || 'pop', 0.9);
      if (sc.props[1]) add(0.5, 'pop', 0.6);
      if (sc.chip) add(0.35, 'swish', 0.7);
      if (sc.badge) add(0.62, 'hit', 0.8);
      words.forEach((w) => { if (w.emph && ev.length < 7) add(w.t0, 'tick', 0.7); });
      if (sc.pose === 'smash') for (let k = 1; k <= Math.floor(sc.dur * 1.6) && k <= 6; k++) add(k / 1.6, 'hit', 0.95);
      if (sc.pose === 'surprised') add(0.1, 'boing', 0.6);
      if (sc.pose === 'celebrate' && !pr) add(0.15, 'sparkle', 0.8);
      if (sc._extraSfx) add(0.2, sc._extraSfx, 1);
      sc.sfx = ev.sort((a, b) => a.t - b.t); nSf += ev.length; nHit += ev.filter((e) => e.n === 'hit').length;
      if (ev.length && (i % 3 === 0 || sc.chapter)) await X.log(T(X, i), 'sound', `Hiệu ứng âm — ${ev.slice(0, 3).map((e) => SM.SFX[e.n]).join(', ')}`, [`${ev.length} hiệu ứng trong cảnh ${i + 1}`]);
    }
    // nhạc nền theo không khí
    const cnt = {}; p.scenes.forEach((s) => (cnt[s.tone] = (cnt[s.tone] || 0) + 1));
    const n = p.scenes.length, epic = p.scenes.filter((s) => s.pose === 'smash' || s.props[0] === 'trophy' || s.props[0] === 'rocket').length;
    let style = 'lofi';
    if ((cnt.danger || 0) + (cnt.night || 0) > n * 0.35) style = 'tense'; else if (epic > n * 0.2) style = 'epic'; else if ((cnt.money || 0) + (cnt.warm || 0) > n * 0.4) style = 'upbeat';
    if (p.music.style !== 'file') p.music.style = style;
    p.music.duck = true;
    await X.log(0, 'sound', `Chọn nhạc nền “${SM.MUSIC[p.music.style].name}”`, ['tự hạ nhạc khi có giọng đọc (ducking)', `${nSf} hiệu ứng âm · ${nHit} cú đập`]);
    X.apply();
  }

  async function stageSubs(X) {
    const p = X.p; let em = 0;
    for (let i = 0; i < p.scenes.length; i++) {
      const sc = p.scenes[i], toks = sc.text.split(/\s+/).filter(Boolean), set = new Set(); let inQ = false;
      toks.forEach((w, wi) => {
        const raw = w.replace(/^[“"'(]+|[”"'.,!?;:)…]+$/g, ''), nw = SM.norm(raw);
        if (/^[“"]/.test(w)) inQ = true;
        if (/\d/.test(raw) || (/^\p{Lu}{3,}$/u.test(raw)) || inQ) set.add(wi);
        else if (sc._emphWords && sc._emphWords.some((x) => x && nw && x.split(' ').includes(nw))) set.add(wi);
        else if (!sc._emphWords) for (const k of ['money', 'warning', 'stop', 'cross', 'trophy', 'fire']) if (score(RX.L[k], ' ' + nw + ' ') > 0) { set.add(wi); break; }
        if (/[”"]$/.test(w)) inQ = false;
      });
      sc.emph = Array.from(set).slice(0, 3); em += sc.emph.length;
    }
    p.subs.on = true;
    await X.log(0, 'subs', `Dựng phụ đề từng từ (${p.lang === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'})`, [`kiểu “${{ box: 'Hộp tối + tô từ', pop: 'Chữ nổi viền', classic: 'Cổ điển' }[p.subs.style]}” · ${em} từ khoá được tô màu`]);
    X.apply();
  }

  async function stageZoom(X) {
    const p = X.p; let zi = 0, nZ = 0, nT = 0, nP = 0, maxZ = 1;
    for (let i = 0; i < p.scenes.length; i++) {
      const sc = p.scenes[i], strong = i === 0 || sc.badge || sc.pose === 'surprised' || sc.pose === 'celebrate';
      const side = sc.props.length ? (sc.flip ? 0.38 : 0.62) : 0.5;
      const inZ = zi++ % 2 === 0;
      const z = strong ? 1.16 : 1.09;
      sc.cam = inZ ? { z0: 1, z1: z, fx: side, fy: 0.46 } : { z0: z, z1: 1, fx: side, fy: 0.46 };
      if (sc.pose === 'walk' || sc.pose === 'run') sc.cam = { z0: 1, z1: 1.05, fx: 0.5, fy: 0.5 };
      maxZ = Math.max(maxZ, z); nZ++;
      sc.punches = [];
      SM.sceneWords(sc).forEach((w) => { if (w.emph && sc.punches.length < 2 && w.t0 > 0.3) sc.punches.push(+w.t0.toFixed(2)); });
      if (sc.badge) sc.punches.push(0.6);
      nP += sc.punches.length;
      sc.shake = sc.pose === 'surprised' || sc.transition === 'flash' || sc.badge ? 0.6 : 0;
      // chip số liệu / sticker nhấn mạnh
      if (!sc._lock.chip || !sc._lock.badge) {
        let chipSet = false;
        if (i === 0 && !sc._lock.chip) { sc.chip = shortW(p.title.toUpperCase(), 36); chipSet = true; nT++; }
        const numM = sc.text.match(/(\d[\d.,]*\d|\d)(\s?%|[kK]\b)?(\s+[\p{L}]+(?:\s+[\p{L}]+)?)?/u);
        if (numM) {
          let txt = (numM[1] + (numM[2] || '') + (numM[3] || '')).trim().replace(/[.,;:!?]+$/, '');
          const words = txt.split(/\s+/);
          if (words.length > 2) txt = words.slice(0, 2).join(' ') + (/^\d/.test(words[2]) ? '' : '');
          if (txt.length > 22) txt = words.slice(0, 2).join(' ');
          const lone = /^\d$/.test(txt);
          if (txt.length >= 2 && !lone) {
            if (!chipSet && !sc._lock.chip) { sc.chip = txt; nT++; await X.log(T(X, i), 'zoom', `Thẻ số liệu — “${txt}”`, [`cảnh ${i + 1}`]); }
            else if (!sc._lock.badge && !sc.badge) { sc.badge = txt; nT++; }
          }
        }
        if (!sc._lock.badge && !sc.badge) {
          const q = sc.text.match(/[“"]([^”"]{2,28})[”"]/); const caps = sc.text.match(/(?<![\p{L}])(\p{Lu}{3,}(?:\s+\p{Lu}{2,})*)(?![\p{L}])/u);
          const b = (q && q[1]) || (caps && caps[1] !== sc.text.toUpperCase() ? caps[1] : null);
          if (b) { sc.badge = b; nT++; await X.log(T(X, i), 'zoom', `Dán nhãn “${b}”`, [`sticker nhấn mạnh · cảnh ${i + 1}`]); }
        }
      }
    }
    // chương
    await X.log(0, 'zoom', `Zoom ${Math.round(maxZ * 100)}% · ${nZ} zoom · ${nT} chữ · ${nP} cú nhấn`, ['rung nhẹ ở cảnh cảnh báo / sticker']);
    X.apply();
  }

  const cleanText = (t) => {
    let s = t.replace(/\s+/g, ' ').replace(/\s+([,.;:!?…])/g, '$1').replace(/(?<!\d)([,;:!?])(?=[\p{L}\d])/gu, '$1 ').replace(/(\d)([;:!?])(?=\d)/g, '$1$2 ').trim();
    s = s.replace(/^(["“(]?)(\p{Ll})/u, (m, q, c) => q + c.toUpperCase());
    return s;
  };

  async function stageQA(X) {
    const p = X.p, hasVoice = !!SM.Audio.voice.buffer; let fixes = 0;
    for (let i = 0; i < p.scenes.length; i++) {
      const sc = p.scenes[i], t = T(X, i);
      const c = cleanText(sc.text); if (c !== sc.text) { await X.log(t, 'qa', `Sửa chính tả/khoảng trắng cảnh ${i + 1}`, [`“${short(sc.text, 30)}” → “${short(c, 30)}”`]); sc.text = c; fixes++; }
      const cps = sc.text.length / sc.dur;
      if (!hasVoice && cps > 18 && !sc._lock.dur) { const nd = +(sc.text.length / 15).toFixed(1); await X.log(t, 'qa', `Kéo dài cảnh ${i + 1}: ${sc.dur.toFixed(1)}s → ${nd}s`, ['tốc độ đọc quá nhanh (>18 ký tự/giây)']); sc.dur = nd; fixes++; SM.touch(p); }
      if (sc.dur < 0.8) { sc.dur = 0.8; fixes++; SM.touch(p); }
      if (i >= 2 && sc.pose === p.scenes[i - 1].pose && sc.pose === p.scenes[i - 2].pose && !['smash', 'walk', 'run'].includes(sc.pose)) {
        const alt = { talk: 'present', present: 'point', point: 'talk', idle: 'talk', celebrate: 'wave', think: 'shrug' }[sc.pose] || 'talk';
        await X.log(t, 'qa', `Đổi tư thế cảnh ${i + 1}: ${SM.POSES[sc.pose]} → ${SM.POSES[alt]}`, ['tránh lặp 3 lần liền']); sc.pose = alt; fixes++;
      }
      // lọc SFX chồng
      let lastT = -1; sc.sfx = (sc.sfx || []).filter((e) => { if (e.t - lastT < 0.12) { fixes++; return false; } lastT = e.t; return true; });
    }
    SM.touch(p);
    if (hasVoice) {
      const vd = SM.Audio.voice.buffer.duration, tot = SM.timeline(p).total;
      if (Math.abs(vd - tot) > 0.8) { const durs = SM.Audio.syncScenes(p, SM.Audio.voice.buffer); if (durs) { p.scenes.forEach((s, i) => (s.dur = durs[i])); SM.touch(p); await X.log(0, 'qa', 'Khớp thời lượng cảnh theo giọng đọc', [`giọng ${vd.toFixed(1)}s · cảnh trước đó ${tot.toFixed(1)}s`]); fixes++; } }
    }
    const tl = SM.timeline(p);
    for (let i = 0; i < p.scenes.length; i += Math.max(1, Math.floor(p.scenes.length / 6))) await X.log(tl.starts[i], 'qa', `QA ✓ cảnh ${i + 1} ổn (${p.scenes[i].dur.toFixed(1)}s)`);
    await X.log(tl.total, 'qa', `QA ✓ tổng ${SM.fmt(tl.total)} · ${p.scenes.length} cảnh · ${fixes} sửa`);
    X.apply();
  }

  const STAGE_FN = { director: stageDirector, rhythm: stageRhythm, char: stageChar, color: stageColor, sound: stageSound, subs: stageSubs, zoom: stageZoom, qa: stageQA };
  AG.runStage = async (name, X) => STAGE_FN[name](X);

  // Chạy toàn bộ. hooks: { log(entry), stage(name, state), apply() }
  AG.run = async function (p, opts, hooks) {
    let n = 0; const t0 = performance.now();
    const X = {
      p, key: opts.key, _pending: [],
      apply: () => hooks.apply(),
      log: async (t, agent, msg, details) => { n++; hooks.log({ t, agent, msg, details: details || [], n }); if (n < 140) await SM.sleep(22); },
    };
    for (const [name] of AG.STAGES) {
      hooks.stage(name, 'run');
      await AG.runStage(name, X);
      hooks.stage(name, 'done', n, (performance.now() - t0) / 1000);
      await SM.sleep(120);
    }
    return n;
  };
  AG.cleanText = cleanText;
  AG.durOf = durOf;
})();
