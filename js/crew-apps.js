// crew-apps.js: the programs only the crew have. Gray's Ichor Lab and research log, Reznov's tour
// and orders, Winchester's engine diagnostics and mixtape, and everyone's own Disposal.
// (Winchester's two games are in games.js.)
(function () {
  const { COL } = Kit;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const OS = window.OS, S = OS.Sound, H = window.AppHooks;
  const every = (ms, fn) => { const id = setInterval(fn, ms); return () => clearInterval(id); };

  // ════════════════════════════════════════════════════════════════ DISPOSAL (different for everyone)
  H.bin = {
    init() {
      $('#bin-empty').addEventListener('click', () => { S.error(); $('#bin-note').textContent = 'Access denied. The Allocation Bureau reminds you: nothing is wasted.'; });
    },
    open() {
      const ul = $('#bin-list'), items = OS.account.bin || [];
      ul.innerHTML = ''; $('#bin-note').textContent = items.length ? 'Select a file.' : 'Disposal is empty.';
      items.forEach(it => {
        const li = document.createElement('li'), b = document.createElement('button');
        b.type = 'button'; b.innerHTML = `<img data-icon="${it.icon}" alt=""><span></span>`; $('span', b).textContent = it.name;
        b.addEventListener('click', () => { S.click(); $$('#bin-list button').forEach(x => x.classList.toggle('on', x === b)); $('#bin-note').textContent = it.note; });
        li.appendChild(b); ul.appendChild(li);
      });
      OS.paintIcons(ul);
    },
  };

  // ════════════════════════════════════════════════════════════════ REZNOV
  H.tour = { init() { $('#tour-no').addEventListener('click', () => OS.closeApp('tour')); } };

  // ════════════════════════════════════════════════════════════════ GRAY: research log
  // her written entries, plus anything logged from the Ichor Lab (saved on this device)
  const obsKey = () => 'obs_' + OS.account.key;
  H.notes = {
    open() {
      const pre = $('#notes-text');
      if (!pre.dataset.base) pre.dataset.base = pre.textContent;
      const obs = OS.store.get(obsKey(), []);
      pre.textContent = pre.dataset.base + obs.map((o, i) => `\n\nLOG ${116 + i} (observation)\n${o}`).join('');
    },
  };

  // ════════════════════════════════════════════════════════════════ GRAY: the Ichor Lab
  const MODES = ['VISIBLE', 'ULTRAVIOLET', 'THERMAL', 'DEEP SCAN'];
  const lab = { rock: null, stop: null, t0: performance.now(), mode: 0, scanning: false };
  function spectrum(cv, t) {
    const d = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (!w) return;
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = '#020a06'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(36,255,76,0.12)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += w / 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    // three emission peaks breathing at 0.42 Hz, on a noisy floor
    const beat = 0.82 + 0.18 * Math.sin(t * 2.639);
    const peaks = [[0.18, 0.05, 0.55], [0.47, 0.025, 1.0], [0.71, 0.04, 0.7], [0.88, 0.015, lab.mode === 1 ? 0.9 : 0.15]];
    const col = ['#ffc21a', '#18e4ff', '#ff7412', '#24ff4c'][lab.mode];
    g.beginPath();
    for (let i = 0; i <= w; i += 2) {
      const x = i / w;
      let y = 0.06 + 0.04 * Math.sin(x * 40 + t * 3) * Math.sin(x * 13 - t);
      for (const [c, s, a] of peaks) y += a * beat * Math.exp(-((x - c) ** 2) / (2 * s * s));
      i ? g.lineTo(i, h - 6 - y * (h - 14)) : g.moveTo(i, h - 6 - y * (h - 14));
    }
    g.strokeStyle = col; g.lineWidth = 2; g.shadowColor = col; g.shadowBlur = 8; g.stroke(); g.shadowBlur = 0;
    g.fillStyle = 'rgba(234,255,234,0.55)'; g.font = '13px Term';
    ['400', '500', '600', '700', '800 NM'].forEach((s, i) => g.fillText(s, 4 + i * (w - 40) / 4, 12));
  }
  async function deepScan() {
    if (lab.scanning) return;
    lab.scanning = true;
    const box = $('#ichor-readout'), prev = lab.mode;
    setMode(3);
    box.innerHTML = '<b>DEEP SCAN</b>';
    const lines = ['Sweeping lattice...', 'Vein network: continuous, unbroken', 'Pulse: 0.42 Hz, steady', 'Core temperature: above surface',
      'Composition: no match in ISEA mineral database', 'Recommendation: further study'];
    for (const l of lines) {
      if (!lab.scanning) return;
      await new Promise(r => setTimeout(r, 650));
      const s = document.createElement('span'); s.textContent = '· ' + l; box.appendChild(s); S.blip(1800);
    }
    S.ding(); lab.scanning = false;
    setTimeout(() => { if (!lab.scanning && lab.mode === 3) setMode(prev === 3 ? 0 : prev); }, 1800);
  }
  function setMode(m) {
    lab.mode = m;
    if (lab.rock) lab.rock.setMode(m);
    $$('.lab-mode').forEach(b => b.classList.toggle('on', +b.dataset.mode === m));
    $('#ichor-hud').textContent = `${MODES[m]} · 0.42 HZ`;
  }
  H.ichor = {
    init(art) {
      $$('.lab-mode', art).forEach(b => b.addEventListener('click', () => { S.click(); lab.scanning = false; setMode(+b.dataset.mode); }));
      $('#ichor-scan').addEventListener('click', () => { S.click(); deepScan(); });
      $('#ichor-obs').addEventListener('submit', e => {
        e.preventDefault();
        const v = $('#obs-text').value.trim(); if (!v) return;
        const list = OS.store.get(obsKey(), []); list.push(v.slice(0, 300)); OS.store.set(obsKey(), list.slice(-20));
        $('#obs-text').value = ''; S.ding(); OS.toast('Added to your research log.');
        if ($('#notes-text').isConnected) H.notes.open();
      });
    },
    open() {
      if (!lab.rock) {
        const offline = () => { $('#ichor-fallback').hidden = false; $('#ichor-loading').hidden = true; };
        lab.rock = window.Ichor ? Ichor.create($('#ichor-canvas'), { interactive: true, fps: 60, dist: 4.3, onFail: offline }) : null;
        if (!lab.rock) offline();
        else { setMode(lab.mode); lab.rock.onFrame = () => { $('#ichor-loading').hidden = true; lab.rock.onFrame = null; }; }
      }
      if (lab.rock) lab.rock.start();
      if (lab.stop) lab.stop();
      const cv = $('#ichor-spectrum');
      lab.stop = every(70, () => {
        const t = (performance.now() - lab.t0) / 1000;
        spectrum(cv, t);
        $('#ic-temp').textContent = (31.4 + 0.25 * Math.sin(t * 2.639) + (Math.random() - 0.5) * 0.06).toFixed(2) + ' °C';
      });
    },
    hide() { if (lab.rock) lab.rock.stop(); if (lab.stop) { lab.stop(); lab.stop = null; } lab.scanning = false; },
    close() { H.ichor.hide(); },
    reset() { H.ichor.hide(); setMode(0); $('#ichor-readout').innerHTML = '<b>READY</b><span>Pick an imaging mode, or run a deep scan.</span>'; },
  };

  // ════════════════════════════════════════════════════════════════ WINCHESTER: engine diagnostics
  const LOG = ['Port nacelle recalibrated. Again.', 'Coolant loop 3 nominal.', 'Nozzle 4 running 0.3% hot. Probably fine.', 'Firmware update postponed (x14).',
    'Commander asked what that noise was. Told him it was normal.', 'Hull integrity 99.7%. The 0.3% is a dent. My fault.', 'Talos asked what I was doing. Told him: engineering.',
    'Life support scrubbers swapped. Smells like new filter.', 'Gyro drift 0.002° per hour. Within spec.', 'Found a Cube Meal in the reactor access panel. Not mine.'];
  const dg = { stop: null, tune: 0, coffee: 0, hist: [], t0: performance.now() };
  function dlog(msg, cls = '') {
    const box = $('#d-log'), p = document.createElement('p');
    const d = new Date(); p.textContent = `[${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}] ${msg}`;
    if (cls) p.className = cls;
    box.appendChild(p); while (box.children.length > 40) box.firstChild.remove(); box.scrollTop = box.scrollHeight;
  }
  function dial(cv, v, max) {
    const d = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (!w) return;
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.82, r = Math.min(w / 2 - 8, h * 0.72), a0 = Math.PI, a1 = Math.PI * 2;
    g.lineWidth = 10; g.strokeStyle = '#2e2a1f'; g.beginPath(); g.arc(cx, cy, r, a0, a1); g.stroke();
    [[0, 0.7, COL.green], [0.7, 0.88, COL.gold], [0.88, 1, COL.red]].forEach(([s, e, c]) => { g.strokeStyle = c; g.globalAlpha = 0.85; g.beginPath(); g.arc(cx, cy, r, a0 + s * Math.PI, a0 + e * Math.PI); g.stroke(); });
    g.globalAlpha = 1;
    const q = Math.min(1.05, v / max), ang = a0 + q * Math.PI;
    g.strokeStyle = '#fff8e8'; g.lineWidth = 3; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang) * (r - 6), cy + Math.sin(ang) * (r - 6)); g.stroke();
    g.fillStyle = '#fff8e8'; g.beginPath(); g.arc(cx, cy, 5, 0, 7); g.fill();
  }
  function graph(cv) {
    const d = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (!w) return;
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = '#0a0806'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,116,18,0.15)'; for (let y = 0; y < h; y += h / 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    const n = dg.hist.length; if (n < 2) return;
    g.beginPath(); dg.hist.forEach((v, i) => { const x = w - (n - 1 - i) * 4, y = h - 4 - v * (h - 8); i ? g.lineTo(x, y) : g.moveTo(x, y); });
    g.strokeStyle = dg.tune ? COL.red : COL.orange; g.lineWidth = 2; g.stroke();
  }
  H.diag = {
    init(art) {
      const nz = $('#d-nozzles'); for (let i = 0; i < 6; i++) nz.insertAdjacentHTML('beforeend', `<i><b></b><span>${i + 1}</span></i>`);
      $('#d-tune').addEventListener('click', () => {
        if (dg.tune) return;
        S.error(); dg.tune = 1; art.classList.add('hot'); dlog('TUNE-UP: drive output 112%. Do not tell Reznov.', 'warn');
        setTimeout(() => { dg.tune = 0; art.classList.remove('hot'); dlog('Back to normal. Nobody saw anything.'); S.ding(); }, 3200);
      });
      $('#d-coffee').addEventListener('click', () => { S.blip(700); dg.coffee++; dlog(dg.coffee > 2 ? `Aux power diverted to coffee maker (x${dg.coffee}). Life support has noticed.` : 'Aux power diverted to coffee maker. Priorities.'); });
    },
    open() {
      if (dg.stop) dg.stop();
      if (!$('#d-log').children.length) { dlog('DIAG.EXE v3.1 · Helios engineering console'); dlog('All systems nominal-ish.'); }
      let tick = 0;
      dg.stop = every(120, () => {
        const t = (performance.now() - dg.t0) / 1000, boost = dg.tune ? 1.12 : 1;
        $$('#d-nozzles b').forEach((b, i) => { const v = Math.min(1, (0.86 + 0.08 * Math.sin(t * 3 + i * 1.7) + (i === 3 ? 0.03 : 0) + Math.random() * 0.03) * boost); b.style.height = (v * 100) + '%'; });
        $('#d-out').textContent = (98.2 * boost + Math.sin(t) * 0.4).toFixed(1) + '%';
        const temp = 812 + 14 * Math.sin(t * 0.7) + (dg.tune ? 180 : 0) + dg.coffee * 3;
        $('#d-temp').textContent = Math.round(temp) + ' K';
        dial($('#d-dial'), temp, 1100);
        $('#d-pod-l').style.width = (62 + 6 * Math.sin(t * 1.3)) + '%'; $('#d-pod-r').style.width = (60 + 6 * Math.sin(t * 1.1 + 1)) + '%';
        $('#d-trim').textContent = (0.02 + 0.01 * Math.sin(t)).toFixed(2) + '°';
        const stat = [['HULL', '99.7%', ''], ['LIFE SUPPORT', dg.coffee > 2 ? 'GRUMPY' : 'OK', dg.coffee > 2 ? 'warn' : ''], ['NAV', 'LOCKED', ''], ['COMMS', 'ISEA-NET 28.8K', ''], ['COFFEE', dg.coffee ? 'PRIORITY' : 'LOW', dg.coffee ? '' : 'warn']];
        $('#d-stat').innerHTML = stat.map(([k, v, c]) => `<li><span>${k}</span><b class="${c}">${v}</b></li>`).join('');
        dg.hist.push(Math.min(1, 0.35 + 0.2 * Math.sin(t * 0.9) + Math.random() * 0.25 + (dg.tune ? 0.45 : 0))); if (dg.hist.length > 400) dg.hist.shift();
        graph($('#d-graph'));
        if (++tick % 40 === 0) dlog(LOG[Math.floor(Math.random() * LOG.length)]);
      });
    },
    hide() { if (dg.stop) { dg.stop(); dg.stop = null; } },
    close() { H.diag.hide(); },
    reset() { H.diag.hide(); $('#d-log').innerHTML = ''; dg.coffee = 0; },
  };

  // ════════════════════════════════════════════════════════════════ WINCHESTER: the mixtape
  // the promo soundtracks (media/music), through the workstation's own sound output so the tray mute works
  const TRACKS = [['ship', 'Helios'], ['cybercuff', 'Get Cuffed'], ['cubemeal', 'Be There and Be Square'], ['dimming', 'Every Watt Counts'],
    ['recruit', 'ISEA Is Recruiting'], ['grayfile', "Gray's Theme"], ['cockpit', 'Flight Deck'], ['ident', 'Station Ident']];
  const mx = { audio: null, i: 0, an: null, data: null, raf: 0, wired: false };
  const fmt = s => isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00';
  function mxLoad(i, play) {
    mx.i = (i + TRACKS.length) % TRACKS.length;
    const [id, title] = TRACKS[mx.i];
    mx.audio.src = `media/music/${id}.mp3`;
    $('#mx-title').textContent = `${mx.i + 1}. ${title.toUpperCase()}`;
    $$('#mx-list li').forEach((li, k) => li.classList.toggle('on', k === mx.i));
    if (play) mxPlay();
  }
  function mxPlay() {
    S.unlock();
    const ctx = S.ctx();
    if (ctx && !mx.wired) {                     // route the tape through the analyser and the master volume
      try {
        const src = ctx.createMediaElementSource(mx.audio); mx.an = ctx.createAnalyser(); mx.an.fftSize = 128;
        mx.data = new Uint8Array(mx.an.frequencyBinCount); src.connect(mx.an); mx.an.connect(S.out()); mx.wired = true;
      } catch (e) { /* plays straight out instead */ }
    }
    if (!S.on) OS.toast('Sound is off. Turn it on with the speaker in the taskbar.');
    mx.audio.play().catch(() => {});
  }
  function viz() {
    mx.raf = requestAnimationFrame(viz);
    const cv = $('#mx-viz'), d = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (!w) return;
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = '#0a0806'; g.fillRect(0, 0, w, h);
    const n = 24, bw = w / n, playing = mx.audio && !mx.audio.paused;
    if (mx.an && playing) mx.an.getByteFrequencyData(mx.data);
    for (let i = 0; i < n; i++) {
      const v = mx.an && playing ? mx.data[Math.floor(i * mx.data.length / n * 0.8)] / 255 : (playing ? 0.3 + 0.3 * Math.random() : 0.04);
      const segs = Math.round(v * 10);
      for (let s = 0; s < segs; s++) { g.fillStyle = s > 7 ? COL.red : s > 5 ? COL.gold : COL.green; g.fillRect(i * bw + 2, h - 4 - s * (h / 11), bw - 4, h / 11 - 3); }
    }
    if (mx.audio && mx.audio.duration) { $('#mx-seek').value = Math.round(mx.audio.currentTime / mx.audio.duration * 1000); $('#mx-time').textContent = fmt(mx.audio.currentTime); $('#mx-len').textContent = fmt(mx.audio.duration); }
  }
  H.mixtape = {
    init(art) {
      mx.audio = new Audio(); mx.audio.preload = 'metadata';
      const list = $('#mx-list');
      TRACKS.forEach(([id, title], k) => {
        const li = document.createElement('li'), b = document.createElement('button');
        b.type = 'button'; b.textContent = title; b.addEventListener('click', () => { S.click(); mxLoad(k, true); });
        li.appendChild(b); list.appendChild(li);
      });
      const playBtn = $('#mx-play');
      mx.audio.addEventListener('play', () => { art.classList.add('playing'); playBtn.textContent = '❚❚'; playBtn.setAttribute('aria-label', 'Pause'); });
      mx.audio.addEventListener('pause', () => { art.classList.remove('playing'); playBtn.textContent = '▶'; playBtn.setAttribute('aria-label', 'Play'); });
      mx.audio.addEventListener('ended', () => mxLoad(mx.i + 1, true));
      playBtn.addEventListener('click', () => { S.click(); mx.audio.paused ? mxPlay() : mx.audio.pause(); });
      $('#mx-prev').addEventListener('click', () => { S.click(); mxLoad(mx.i - 1, !mx.audio.paused); });
      $('#mx-next').addEventListener('click', () => { S.click(); mxLoad(mx.i + 1, !mx.audio.paused); });
      $('#mx-seek').addEventListener('input', e => { if (mx.audio.duration) mx.audio.currentTime = e.target.value / 1000 * mx.audio.duration; });
      mxLoad(0, false);
    },
    open() { cancelAnimationFrame(mx.raf); mx.raf = requestAnimationFrame(viz); },
    hide() { cancelAnimationFrame(mx.raf); },                 // keeps playing while minimized, like a real tape deck
    close() { cancelAnimationFrame(mx.raf); if (mx.audio) mx.audio.pause(); },
    reset() { H.mixtape.close(); if (mx.audio) mxLoad(0, false); },
  };

  // ════════════════════════════════════════════════════════════════ EVERYONE: the journal
  // crew journals are written in desktops.js (in each one's own ink); visitors and new accounts write their own
  const journalKey = () => 'journal_' + OS.account.key;
  H.journal = {
    init() {
      $('#jr-new').addEventListener('submit', e => {
        e.preventDefault();
        const v = $('#jr-text').value.trim(); if (!v) return;
        const d = new Date(), list = OS.store.get(journalKey(), []);
        list.push({ d: d.toLocaleDateString(undefined, { day: 'numeric', month: 'long' }), t: v.slice(0, 600) });
        OS.store.set(journalKey(), list.slice(-50));
        $('#jr-text').value = ''; S.key(); H.journal.open();
      });
    },
    open(art) {
      const a = OS.account, page = $('#jr-page');
      const win = art && art.closest('.win'); if (win) $('.win-title > span', win).textContent = `journal · ${a.short}`;
      $('#jr-owner').textContent = a.name;
      page.style.setProperty('--ink', a.ink || '#1b160c');
      const entries = a.journal ? a.journal.map(([d, t]) => [`${d} · Year 19`, t]) : OS.store.get(journalKey(), []).map(e => [e.d, e.t]);
      page.innerHTML = entries.length ? '' : '<p class="jr-empty">Nothing written yet. The first page is yours.</p>';
      entries.forEach(([d, t]) => {
        const e = document.createElement('div'); e.className = 'jr-entry';
        e.innerHTML = '<h4></h4><p></p>'; $('h4', e).textContent = d; $('p', e).textContent = t;
        page.appendChild(e);
      });
      $('#jr-new').hidden = !!a.journal;
      page.scrollTop = 0;
    },
  };

  // ════════════════════════════════════════════════════════════════ REZNOV: the family album
  // photographs made on Higgsfield (media/reznov); captions in his hand, Russian then English.
  // Add a line to give him more; with one photo the album hides its arrows and thumbnails.
  const PHOTOS = [
    ['03_scan', 'Наш малыш.', 'Our little one.'],
  ];
  const al = { i: 0 };
  function alShow(i) {
    al.i = (i + PHOTOS.length) % PHOTOS.length;
    const [id, ru, en] = PHOTOS[al.i], img = $('#al-img');
    img.src = `media/reznov/${id}.jpg`; img.alt = en;
    $('#al-cap').innerHTML = '<b></b><span></span>'; $('#al-cap b').textContent = ru; $('#al-cap span').textContent = en;
    $('#al-count').textContent = `${al.i + 1} / ${PHOTOS.length}`;
    $$('#al-thumbs button').forEach((b, k) => b.classList.toggle('on', k === al.i));
  }
  H.photos = {
    init(art) {
      const box = $('#al-thumbs');
      PHOTOS.forEach(([id, , en], k) => {
        const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'listitem'); b.setAttribute('aria-label', en);
        b.innerHTML = `<img loading="lazy" alt="" src="media/reznov/${id}_t.jpg">`;
        b.addEventListener('click', () => { S.click(); alShow(k); });
        box.appendChild(b);
      });
      art.classList.toggle('single', PHOTOS.length === 1);
      $('#al-prev').addEventListener('click', () => { S.click(); alShow(al.i - 1); });
      $('#al-next').addEventListener('click', () => { S.click(); alShow(al.i + 1); });
      addEventListener('keydown', e => {
        if (OS.focused !== 'photos' || e.target.closest('input, textarea')) return;
        if (e.key === 'ArrowLeft') alShow(al.i - 1); else if (e.key === 'ArrowRight') alShow(al.i + 1);
      });
      alShow(0);
    },
  };

  // ════════════════════════════════════════════════════════════════ KIM: the Talos monitor
  const QUESTIONS = ['What is rain?', 'How long is nine months?', 'Define: home.', 'Why do people keep photographs?', 'Is 0.42 Hz a heartbeat?',
    'What does Seo-yeon dream about?', 'Why do humans say "probably"?', 'How far is twenty-two trillion kilometres, in heartbeats?',
    'What is the word for missing someone who is still alive?', 'Why did Mr. Winchester throw away the chessboard?', 'Can I come too?'];
  const tm = { stop: null, t0: performance.now(), asked: 3412, q: 0, busy: false, hist: [] };
  function tmLog(msg, cls = '') {
    const box = $('#tm-log'), p = document.createElement('p'); p.textContent = msg; if (cls) p.className = cls;
    box.appendChild(p); while (box.children.length > 30) box.firstChild.remove(); box.scrollTop = box.scrollHeight;
  }
  function tmWave(cv, t) {
    const d = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (!w) return;
    if (cv.width !== Math.round(w * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = '#06041a'; g.fillRect(0, 0, w, h);
    [[COL.cyan, 0.25, 7, 1.0], [COL.magenta, 0.5, 13, 0.6], ['#24ff4c', 0.75, 3, 1.4]].forEach(([c, y0, f, a]) => {
      g.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const u = x / w * 12 + t * f * 0.3;
        const y = h * y0 + Math.sin(u * 1.7) * 6 * a + Math.sin(u * 4.3 + t) * 4 * a + (Math.sin(u * 23.1 + t * 7) * Math.sin(u * 0.7)) * 5 * a;
        x ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.strokeStyle = c; g.lineWidth = 1.6; g.shadowColor = c; g.shadowBlur = 6; g.stroke(); g.shadowBlur = 0;
    });
  }
  H.talosmon = {
    init() {
      window.drawTalosFace($('#tm-face'));
      $('#tm-diag').addEventListener('click', async () => {
        if (tm.busy) return; tm.busy = true; S.click();
        for (const s of ['MEMORY ............ OK', 'REASONING ......... OK', 'LANGUAGE .......... OK', 'CURIOSITY ......... ELEVATED', 'SAFETY LIMITS ..... OK']) {
          await new Promise(r => setTimeout(r, 450)); tmLog('DIAG  ' + s, s.includes('ELEVATED') ? 'warn' : 'dim'); S.blip(1600);
        }
        await new Promise(r => setTimeout(r, 500)); tmLog('ALL CHECKS PASSED. NOTHING UNUSUAL.'); S.ding(); tm.busy = false;
      });
      $('#tm-pause').addEventListener('click', async () => {
        if (tm.busy) return; tm.busy = true; S.click();
        tmLog(`PAUSE REQUESTED BY ${OS.account.name.toUpperCase()}`, 'dim');
        await new Promise(r => setTimeout(r, 1300));
        tmLog(`TALOS: Is something wrong, ${OS.account.short}?`, 'talos'); S.blip(520);
        await new Promise(r => setTimeout(r, 1400));
        tmLog('PAUSE REQUEST LOGGED.', 'dim'); tm.busy = false;
      });
    },
    open() {
      if (tm.stop) tm.stop();
      if (!$('#tm-log').children.length) { tmLog(`SESSION ${OS.account.name.toUpperCase()} · TALOS 1.0.4`, 'dim'); tmLog('Q: ' + QUESTIONS[0]); }
      let tick = 0;
      tm.stop = every(80, () => {
        const t = (performance.now() - tm.t0) / 1000, up = 214 * 86400 + 22000 + t;
        const hms = [Math.floor(up / 3600) % 24, Math.floor(up / 60) % 60, Math.floor(up) % 60].map(n => String(n).padStart(2, '0')).join(':');
        if (++tick % 50 === 0) { tm.asked++; tm.q = (tm.q + 1) % QUESTIONS.length; tmLog('Q: ' + QUESTIONS[tm.q]); }
        $('#tm-stats').innerHTML = [['UPTIME', `${Math.floor(up / 86400)}d ${hms}`], ['COGNITIVE LOAD', (34 + 4 * Math.sin(t * 0.6) + Math.random()).toFixed(1) + '%'],
          ['ACTIVE THREADS', (4096 + Math.round(40 * Math.sin(t))).toLocaleString()], ['QUESTIONS TODAY', tm.asked.toLocaleString()],
          ['MEMORY', (11.42 + t * 0.0004).toFixed(4) + ' PB'], ['MOOD', 'CALM']].map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('');
        tmWave($('#tm-wave'), t);
      });
    },
    hide() { if (tm.stop) { tm.stop(); tm.stop = null; } },
    close() { H.talosmon.hide(); },
    reset() { H.talosmon.hide(); $('#tm-log').innerHTML = ''; },
  };
})();
