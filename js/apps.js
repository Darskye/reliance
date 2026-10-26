// apps.js: what each program does once its window is open. os.js calls
//   init(article)       once, the first time the window opens
//   open(article, sub)  every time it opens or comes forward (sub = the part after "#app/")
//   hide / close / resize
(function () {
  const C = window.RELIANCE_CONFIG;
  const { COL, star4 } = Kit;
  const SF = Starframe;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const OS = window.OS;
  const S = OS.Sound;
  const pauseAll = art => $$('video', art).forEach(v => v.pause());

  // ---------------------------------------------------------------- shared: tabs, TV sets, forms
  function tabs(art, onChange) {
    const btns = $$('[data-tab]', art);
    btns.forEach(b => b.addEventListener('click', () => {
      S.click();
      btns.forEach(x => x.classList.toggle('on', x === b));
      $$('.tab-panel', art).forEach(p => p.classList.toggle('on', p.dataset.panel === b.dataset.tab));
      $$('.tab-panel:not(.on) video', art).forEach(v => v.pause());
      if (onChange) onChange(b.dataset.tab);
    }));
  }
  function tvSet(video, id) {
    video.poster = `media/posters/${id}.jpg`;
    if (video.dataset.loaded !== id) { video.src = `media/video/${id}.mp4`; video.dataset.loaded = id; }
  }
  function tvLights(root) {
    $$('video', root).forEach(v => {
      const tv = v.closest('.tv');
      v.addEventListener('play', () => tv.classList.add('playing'));
      ['pause', 'ended', 'emptied'].forEach(e => v.addEventListener(e, () => tv.classList.remove('playing')));
    });
  }
  const validEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s);
  async function send(url, data) {
    const r = await fetch(url, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
  }
  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); OS.toast(msg); }
    catch (e) { OS.toast(text, 5000); }
  }
  const siteURL = () => location.origin + location.pathname;

  // mailing-list forms (ISEA-NET and Fuel Drive)
  document.addEventListener('submit', async e => {
    const f = e.target.closest('.mail-form'); if (!f) return;
    e.preventDefault();
    const email = f.email.value.trim();
    if (!validEmail(email)) { S.error(); OS.toast('That email address does not look right.'); f.email.focus(); return; }
    if (f._gotcha.value) { OS.toast('Thanks!'); f.reset(); return; }
    if (!C.mailingListForm) { S.ding(); OS.toast('Thanks! Sign-ups open soon: this form is not connected yet.', 4200); return; }
    const btn = f.querySelector('button'); btn.disabled = true;
    try {
      const d = new FormData(); d.append('email', email); d.append('list', f.dataset.list); d.append('_subject', 'RELIANCE transmission list');
      await send(C.mailingListForm, d); S.ding(); OS.toast("You're on the transmission list."); f.reset();
    } catch (err) { S.error(); OS.toast('Transmission failed. Please try again.'); }
    btn.disabled = false;
  });

  const H = window.AppHooks;

  // Talos's face (the ASCII portrait from the TALOS.EXE promo) drawn into a canvas, trimmed to the
  // face itself so it can be centred anywhere: the crew card, Kim's monitor, her wallpaper
  window.drawTalosFace = function (cv, col = '#3dff6a') {
    const F = window.TALOS_FACE || [], rows = F.filter(r => r.trim());
    if (!rows.length) return;
    const left = Math.min(...rows.map(r => r.search(/\S/))), right = Math.max(...rows.map(r => r.trimEnd().length));
    const cw = 7.2, ch = 12;
    cv.width = Math.ceil((right - left) * cw + 12); cv.height = Math.ceil(rows.length * ch + 12);
    const g = cv.getContext('2d');
    g.font = '12px "Courier New", monospace'; g.textBaseline = 'top'; g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 4;
    rows.forEach((r, k) => { for (let i = left; i < right; i++) if (r[i] && r[i] !== ' ') g.fillText(r[i], 6 + (i - left) * cw, 6 + k * ch); });
  };

  // ════════════════════════════════════════════════════════════════ MISSION BRIEF
  H.brief = {
    init(art) {
      tabs(art, tab => { $('#brief-address').textContent = 'isea://reliance/' + tab; $('.page', art).scrollTop = 0; });
      const img = $('#gray-photo'); if (window.GRAY_PHOTO) img.src = window.GRAY_PHOTO;
      window.drawTalosFace($('#mini-face'));
    },
  };

  // ════════════════════════════════════════════════════════════════ HELIOS.SYS
  // The ship wireframe from the spec film (ship_lines.js: slices of the real model), drawn live:
  // drag to turn it, scroll or pinch to zoom, pick a system to light it up.
  const SHIP = window.SHIP;
  const [LEN, SPAN, HGT] = SHIP.size;
  const SYSTEMS = [
    { key: 'nose', name: 'FLIGHT DECK', col: '#3d6cff', rows: ['CREW OF 3', 'MANUAL FLIGHT OVERRIDE', 'FORWARD SURVEY CANOPY'] },
    { key: 'pod', name: 'VECTOR THRUSTER PODS', col: COL.green, rows: ['2 x WINGTIP NACELLES', 'ATMOSPHERE + VACUUM', 'VERTICAL TAKEOFF'] },
    { key: 'engine', name: 'MAIN DRIVE CLUSTER', col: COL.gold, rows: ['6-NOZZLE ARRAY', 'HYPERSPACE CAPABLE', 'RANGE 22 TRILLION KM'] },
    { key: 'tail', name: 'STABILIZER NACELLES', col: COL.magenta, rows: ['2 x TAIL THRUSTERS', 'ATTITUDE CONTROL', 'SURFACE LANDING TRIM'] },
    { key: 'wing', name: 'SURVEY WINGS', col: COL.orange, rows: [`SPAN ${SPAN.toFixed(1)} M`, 'TOPOGRAPHIC SCAN ARRAY', 'LOW-ORBIT MAPPING'] },
    { key: 'tip', name: 'NOSE SHIELD', col: COL.red, rows: ['FORWARD HEAT SHIELD', 'RUNS HOTTEST IN TRANSIT'] },
    { key: 'hull', name: 'HULL', col: COL.cyan, rows: [`LENGTH ${LEN.toFixed(1)} M`, `HEIGHT ${HGT.toFixed(1)} M`, 'HULL NO. RV-2719'] },
  ];
  const SYSIDX = Object.fromEntries(SHIP.systems.map((k, i) => [k, i]));
  const SYSCOL = SHIP.systems.map(k => SYSTEMS.find(s => s.key === k).col);
  const POLY = SHIP.pts.map((a, i) => ({ P: Float32Array.from(a, v => v / 100), sys: Uint8Array.from(SHIP.sys[i], c => +c) }));

  const helios = { az: 0.6, el: 0.42, zoom: 1, focus: -1, live: false, id: 0, last: 0, idle: 0, tab: 'wire' };
  function heliosFrame(now) {
    helios.id = requestAnimationFrame(heliosFrame);
    if (now - helios.last < 33 || document.hidden) return;
    const dt = Math.min(0.1, (now - helios.last) / 1000); helios.last = now;
    if (now - helios.idle > 2500) helios.az += dt * 0.22;            // turns slowly on its own when left alone
    const cv = $('#helios-canvas'); if (!cv || !cv.isConnected) return;
    const d = Math.min(2, devicePixelRatio || 1), w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return;
    if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); }
    const g = cv.getContext('2d');
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
    const k = Math.min(w / 30, h / 23) * helios.zoom, cx = w / 2, cy = h / 2 + 8;
    const ca = Math.cos(helios.az), sa = Math.sin(helios.az), ce = Math.cos(helios.el), se = Math.sin(helios.el);
    const proj = (x, y, z) => { const x1 = x * ca - y * sa, y1 = x * sa + y * ca; return [cx + x1 * k, cy - (z * ce + y1 * se) * k]; };
    const paths = SYSCOL.map(() => new Path2D());
    for (const { P, sys } of POLY) {
      let px = 0, py = 0;
      for (let j = 0; j < P.length / 3; j++) {
        const [sx, sy] = proj(P[j * 3], P[j * 3 + 1], P[j * 3 + 2]);
        if (j) { const p = paths[sys[j]]; p.moveTo(px, py); p.lineTo(sx, sy); }
        px = sx; py = sy;
      }
    }
    g.globalCompositeOperation = 'lighter';
    paths.forEach((p, s) => {
      const a = helios.focus < 0 || helios.focus === s ? 1 : 0.1;
      g.strokeStyle = SYSCOL[s];
      g.globalAlpha = a * 0.22; g.lineWidth = 3.2; g.stroke(p);            // phosphor glow
      g.globalAlpha = a * 0.9; g.lineWidth = 1.1; g.stroke(p);
    });
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    if (helios.focus >= 0) {                                               // target marker on the chosen system
      const key = SHIP.systems[helios.focus], an = SHIP.anchors[key].map(v => v / 100), [ax, ay] = proj(...an);
      const col = SYSCOL[helios.focus], r = 16 + 4 * Math.sin(now / 200);
      g.strokeStyle = col; g.lineWidth = 2; g.setLineDash([6, 5]);
      g.beginPath(); g.moveTo(0, ay); g.lineTo(ax - r - 6, ay); g.moveTo(ax + r + 6, ay); g.lineTo(w, ay); g.stroke(); g.setLineDash([]);
      g.lineWidth = 2.5; g.beginPath(); g.arc(ax, ay, r, 0, 7); g.stroke();
      g.fillStyle = col; g.fillRect(ax - 2, ay - 2, 4, 4);
    }
    const deg = v => String(Math.round(((v * 180 / Math.PI) % 360 + 360) % 360)).padStart(3, '0');
    $('#helios-az').textContent = `AZ ${deg(helios.az)} · EL ${Math.round(helios.el * 180 / Math.PI)} · ZOOM ${helios.zoom.toFixed(1)}`;
  }
  function heliosRun(on) {
    if (on && !helios.live) { helios.live = true; helios.last = performance.now(); helios.id = requestAnimationFrame(heliosFrame); }
    if (!on && helios.live) { helios.live = false; cancelAnimationFrame(helios.id); }
  }
  function heliosFocus(i) {
    helios.focus = helios.focus === i ? -1 : i;
    $$('.sys-btn').forEach(b => b.classList.toggle('on', +b.dataset.sys === helios.focus));
    const card = $('#helios-card');
    if (helios.focus < 0) { card.innerHTML = '<b>ALL SYSTEMS</b><span>Select a system to highlight it on the wireframe.</span>'; card.style.removeProperty('--sys'); return; }
    const s = SYSTEMS.find(x => SYSIDX[x.key] === helios.focus);
    card.innerHTML = ''; card.style.setProperty('--sys', s.col);
    const b = document.createElement('b'); b.textContent = s.name; card.appendChild(b);
    s.rows.forEach(r => { const sp = document.createElement('span'); sp.textContent = '· ' + r; card.appendChild(sp); });
    helios.idle = performance.now();
    S.blip(900 + helios.focus * 120);
  }
  H.helios = {
    init(art) {
      $('#spec-len').textContent = LEN.toFixed(1) + ' m'; $('#spec-span').textContent = SPAN.toFixed(1) + ' m'; $('#spec-hgt').textContent = HGT.toFixed(1) + ' m';
      const box = $('#helios-systems');
      SYSTEMS.forEach(s => {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'sys-btn'; b.dataset.sys = SYSIDX[s.key];
        b.innerHTML = `<i style="background:${s.col}"></i><span></span>`; b.querySelector('span').textContent = s.name;
        b.addEventListener('click', () => heliosFocus(SYSIDX[s.key]));
        box.appendChild(b);
      });
      $$('video[data-src]', art).forEach(v => { v.poster = `media/posters/${v.dataset.src}.jpg`; });
      tvLights(art);
      tabs(art, tab => {
        helios.tab = tab; heliosRun(tab === 'wire');
        const v = $(`.tab-panel[data-panel="${tab}"] video`, art);
        if (v) { tvSet(v, v.dataset.src); }
      });
      // turning and zooming: mouse, touch and pen
      const cad = $('.cad', art), pts = new Map();
      let pinch = 0;
      cad.addEventListener('pointerdown', e => { cad.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); helios.idle = performance.now(); });
      cad.addEventListener('pointermove', e => {
        if (!pts.has(e.pointerId)) return;
        const [px, py] = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
        helios.idle = performance.now();
        if (pts.size === 2) {
          const [a, b] = [...pts.values()], dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
          if (pinch) helios.zoom = Math.min(3, Math.max(0.6, helios.zoom * dist / pinch));
          pinch = dist; return;
        }
        helios.az -= (e.clientX - px) * 0.008;
        helios.el = Math.min(1.45, Math.max(-1.45, helios.el + (e.clientY - py) * 0.006));
      });
      const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; };
      cad.addEventListener('pointerup', up); cad.addEventListener('pointercancel', up);
      cad.addEventListener('wheel', e => { e.preventDefault(); helios.idle = performance.now(); helios.zoom = Math.min(3, Math.max(0.6, helios.zoom * Math.exp(-e.deltaY * 0.0012))); }, { passive: false });
      cad.addEventListener('dblclick', () => { helios.az = 0.6; helios.el = 0.42; helios.zoom = 1; });
    },
    open() { if (helios.tab === 'wire') heliosRun(true); },
    hide(art) { heliosRun(false); pauseAll(art); },
    close(art) { heliosRun(false); pauseAll(art); },
  };

  // ════════════════════════════════════════════════════════════════ TAPE VAULT
  const vault = { current: null };
  function vaultSelect(art, id, play) {
    const i = C.tapes.findIndex(t => t.id === id); if (i < 0) return;
    const t = C.tapes[i], v = $('#vault-video');
    vault.current = id;
    tvSet(v, id);
    $('#vault-cat').textContent = `ISEA-ARC-${String(i + 1).padStart(3, '0')} · ${t.cat.toUpperCase()}`;
    $('#vault-title').textContent = t.title;
    $('#vault-meta').textContent = `Runtime ${t.runtime} · 9:16 broadcast`;
    $('#vault-desc').textContent = t.desc;
    $$('.tape', art).forEach(b => b.classList.toggle('on', b.dataset.id === id));
    OS.setHash('archive', id);
    if (play) {
      S.play('hdd', 0.35);
      v.play().catch(() => {});
      if (OS.isMobile()) art.closest('.win-body').scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
  H.archive = {
    init(art) {
      const list = $('#vault-list'); let cat = '';
      C.tapes.forEach((t, i) => {
        if (t.cat !== cat) { cat = t.cat; const h = document.createElement('p'); h.className = 'vault-cat'; h.textContent = cat; list.appendChild(h); }
        const b = document.createElement('button'); b.type = 'button'; b.className = 'tape'; b.dataset.id = t.id; b.setAttribute('role', 'listitem');
        b.innerHTML = `<img loading="lazy" alt=""><span class="tape-label"><code></code><b></b><small></small></span>` + (t.new ? '<span class="sticker">NEW</span>' : '');
        b.querySelector('img').src = `media/posters/${t.id}.jpg`;
        b.querySelector('code').textContent = `ISEA-ARC-${String(i + 1).padStart(3, '0')}`;
        b.querySelector('b').textContent = t.title;
        b.querySelector('small').textContent = `${t.cat} · ${t.runtime}`;
        b.addEventListener('click', () => { S.click(); vaultSelect(art, t.id, true); });
        list.appendChild(b);
      });
      tvLights(art);
      $('#vault-share').addEventListener('click', () => copy(siteURL() + '#archive/' + (vault.current || ''), 'Link copied. Paste it anywhere.'));
    },
    open(art, sub) {
      if (sub && sub !== vault.current) vaultSelect(art, sub, true);
      else if (!vault.current) vaultSelect(art, C.tapes[0].id, false);
      else OS.setHash('archive', vault.current);
    },
    hide: pauseAll, close: pauseAll,
  };

  // ════════════════════════════════════════════════════════════════ CREW DOSSIER
  const ROLES = ['Speaking role', 'Background / extra', 'Voice role', 'Camera', 'Lighting & grip', 'Sound', 'Art dept & props', 'Costume',
    'Hair & makeup / SFX', 'VFX & animation', 'Editing', 'Music', 'Production assistant', 'Other'];
  let badgePhoto = null;
  // green phosphor: the same look as Dr. Gray's file photo
  function phosphor(g, img, x, y, w, h) {
    const s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s;
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2.6, iw, ih);
    g.restore();
    const id = g.getImageData(x, y, w, h), p = id.data;
    const D = [4, 18, 10], M = [36, 255, 76], L = [234, 255, 234];
    for (let i = 0; i < p.length; i += 4) {
      let l = (0.3 * p[i] + 0.59 * p[i + 1] + 0.11 * p[i + 2]) / 255;
      l = Math.min(1, Math.max(0, (l - 0.5) * 1.25 + 0.5));
      const row = Math.floor(i / 4 / w);
      const [a, b, q] = l < 0.62 ? [D, M, l / 0.62] : [M, L, (l - 0.62) / 0.38];
      const dim = row % 3 === 2 ? 0.72 : 1;
      p[i] = (a[0] + (b[0] - a[0]) * q) * dim; p[i + 1] = (a[1] + (b[1] - a[1]) * q) * dim; p[i + 2] = (a[2] + (b[2] - a[2]) * q) * dim;
    }
    g.putImageData(id, x, y);
  }
  function hashStr(s) { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
  function drawBadge(cv, d) {
    const g = cv.getContext('2d'), W = cv.width, Hh = cv.height, T = SF.text;
    g.clearRect(0, 0, W, Hh);
    // card + lanyard slot
    g.fillStyle = '#2a2414'; g.beginPath(); g.roundRect(0, 0, W, Hh, 34); g.fill();
    g.fillStyle = '#fff8e8'; g.beginPath(); g.roundRect(6, 6, W - 12, Hh - 12, 30); g.fill();
    g.fillStyle = COL.blue; g.beginPath(); g.roundRect(6, 6, W - 12, 230, [30, 30, 0, 0]); g.fill();
    g.fillStyle = '#0a1040'; g.beginPath(); g.roundRect(W / 2 - 60, 24, 120, 22, 11); g.fill();
    Emblem.draw(g, 112, 140, 0.16, {});
    T(g, 'INTERNATIONAL SPACE', 210, 112, '30px Audio', '#fff4d6');
    T(g, 'EXPLORATION AGENCY', 210, 148, '30px Audio', '#fff4d6');
    T(g, 'PERSONNEL IDENTIFICATION', 212, 188, SF.PIX(20, 700), '#c9d4ff');
    [COL.red, COL.gold, COL.cream, COL.cyan].forEach((c, i) => {
      g.fillStyle = c; const sx = W - 150 + i * 30;
      g.beginPath(); g.moveTo(sx + 16, 206); g.lineTo(sx + 32, 206); g.lineTo(sx + 16, 236); g.lineTo(sx, 236); g.closePath(); g.fill();
    });
    // photo
    const px = 48, py = 270, pw = 250, ph = 330;
    g.fillStyle = '#04120a'; g.fillRect(px, py, pw, ph);
    if (d.photo) phosphor(g, d.photo, px, py, pw, ph);
    else {
      g.fillStyle = '#0d3a1c'; g.beginPath(); g.arc(px + pw / 2, py + 130, 62, 0, 7); g.fill();
      g.beginPath(); g.ellipse(px + pw / 2, py + ph + 10, 115, 125, 0, Math.PI, 0); g.fill();
      for (let yy = py; yy < py + ph; yy += 3) { g.fillStyle = 'rgba(36,255,76,0.05)'; g.fillRect(px, yy, pw, 1); }
      T(g, 'NO IMAGE ON FILE', px + pw / 2, py + 34, SF.TERM(28), '#2c8a4a', 'center');
    }
    g.strokeStyle = '#2a2414'; g.lineWidth = 6; g.strokeRect(px, py, pw, ph);
    // fields
    const fx = 326, rows = [['ASSIGNMENT', d.track.toUpperCase()], ['POSITION', d.role.toUpperCase()], ['VESSEL', 'HELIOS · RV-2719'], ['STATION', '7'], ['CLEARANCE', 'PENDING']];
    rows.forEach(([k, v], i) => {
      const y = 290 + i * 64;
      T(g, k, fx, y, SF.PIX(18, 700), '#7c7258');
      let fs = 28; g.font = SF.TERM(fs); while (g.measureText(v).width > W - fx - 40 && fs > 16) g.font = SF.TERM(--fs);
      T(g, v, fx, y + 28, SF.TERM(fs), i === 4 ? '#c4140a' : '#1828f2');
    });
    // name
    const name = d.name.toUpperCase();
    let ns = 60; g.font = SF.ORB(ns); while (g.measureText(name).width > W - 90 && ns > 22) g.font = SF.ORB(--ns);
    T(g, name, W / 2, 660, SF.ORB(ns), '#1b160c', 'center');
    T(g, 'APPLICANT · RELIANCE', W / 2, 712, SF.PIX(24, 700), '#7c7258', 'center');
    // ID number + barcode
    const h = hashStr(d.name + d.email), id = `7-${String(h % 10000).padStart(4, '0')}-${String.fromCharCode(65 + (h >>> 14) % 26, 65 + (h >>> 19) % 26)}`;
    T(g, 'ID ' + id, W / 2, 768, SF.TERM(40), '#1b160c', 'center');
    let bx = 90, r = h;
    while (bx < W - 90) { r = Math.imul(r ^ (r >>> 13), 1274126177) >>> 0; const bw = 2 + (r % 4) * 2; g.fillStyle = '#1b160c'; g.fillRect(bx, 800, bw, 70); bx += bw + 3 + (r >> 8) % 4; }
    // footer
    g.fillStyle = '#0a1040'; g.beginPath(); g.roundRect(6, Hh - 104, W - 12, 98, [0, 0, 30, 30]); g.fill();
    T(g, 'MOVING FORWARD, TOGETHER.', W / 2, Hh - 56, SF.TERM(38), '#ffedb8', 'center');
    return id;
  }
  H.dossier = {
    init(art) {
      const chips = $('#role-chips');
      ROLES.forEach(r => {
        const l = document.createElement('label'); l.className = 'chip';
        l.innerHTML = '<input type="checkbox" name="roles"><span></span>';
        l.querySelector('input').value = r; l.querySelector('span').textContent = r;
        chips.appendChild(l);
      });
      $('#badge-photo').addEventListener('change', e => {
        const f = e.target.files[0]; if (!f) return;
        const img = new Image(); img.onload = () => { badgePhoto = img; OS.toast('Photo loaded for your badge.'); }; img.src = URL.createObjectURL(f);
      });
      const form = $('#dossier-form'), err = $('#dossier-err');
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const f = form.elements, need = [];
        if (!f.name.value.trim()) need.push('name');
        if (!validEmail(f.email.value.trim())) need.push('a valid email');
        if (!f.location.value.trim()) need.push('city / region');
        if (!f.consent.checked) need.push('the checkbox');
        if (need.length) { S.error(); err.textContent = 'Missing: ' + need.join(', ') + '.'; return; }
        err.textContent = '';
        const roles = $$('input[name="roles"]:checked', form).map(i => i.value);
        const data = new FormData(form);
        data.delete('roles'); data.set('roles', roles.join(', ') || 'Not specified');
        data.set('_subject', `RELIANCE Crew Dossier: ${f.name.value.trim()}`);
        const btn = $('.transmit', form); btn.disabled = true; btn.textContent = 'Transmitting...';
        let sent = false;
        if (f._gotcha.value) sent = true;
        else if (C.dossierForm) {
          try { await send(C.dossierForm, data); sent = true; }
          catch (x) { S.error(); err.textContent = 'Transmission failed. Please try again' + (C.contactEmail ? `, or email ${C.contactEmail}.` : '.'); btn.disabled = false; btn.textContent = 'Transmit dossier ▶'; return; }
        }
        btn.disabled = false; btn.textContent = 'Transmit dossier ▶';
        const id = drawBadge($('#badge-canvas'), { name: f.name.value.trim(), email: f.email.value.trim(), track: f.track.value, role: roles[0] || 'To be assigned', photo: badgePhoto });
        $('#badge-status').textContent = sent ? 'DOSSIER RECEIVED · ID ' + id : 'DOSSIER NOT SENT · ID ' + id;
        $('#badge-msg').textContent = sent
          ? `Thank you, ${f.name.value.trim()}. The production will be in touch about next steps.`
          : 'Applications are not being collected online yet, so nothing was sent. Your badge still works. Please check back soon.';
        form.hidden = true; $('#badge-out').hidden = false; $('.badge-wrap canvas').style.animation = 'none'; void $('#badge-canvas').offsetWidth; $('#badge-canvas').style.animation = '';
        art.closest('.win-body').scrollTo({ top: $('#badge-out').offsetTop - 20, behavior: 'smooth' });
        S.play('hdd', 0.5); setTimeout(() => S.ding(), 1500);
      });
      $('#badge-save').addEventListener('click', () => {
        $('#badge-canvas').toBlob(b => {
          const a = document.createElement('a'); a.href = URL.createObjectURL(b);
          a.download = 'ISEA-ID-' + (form.elements.name.value.trim().replace(/[^a-z0-9]+/gi, '-') || 'badge') + '.png';
          document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        }, 'image/png');
      });
      $('#badge-again').addEventListener('click', () => { form.reset(); badgePhoto = null; form.hidden = false; $('#badge-out').hidden = true; art.closest('.win-body').scrollTo({ top: 0 }); });
    },
  };

  // ════════════════════════════════════════════════════════════════ ISEA-NET
  H.comms = {
    init(art) {
      const box = $('#channels');
      C.instagram.forEach(ch => {
        const d = document.createElement('div'); d.className = 'channel';
        d.innerHTML = `<img data-icon="${ch.icon || 'station'}" alt=""><div><h4></h4><span class="handle"></span><p></p><a class="btn" href="#">Open channel ▶</a></div>`;
        $('h4', d).textContent = ch.name;
        if (ch.handle) $('.handle', d).textContent = ch.handle; else $('.handle', d).innerHTML = '<span class="pill">HANDLE PENDING</span>';
        $('p', d).textContent = ch.role;
        const a = $('a', d);
        if (ch.url) { a.href = ch.url; a.target = '_blank'; a.rel = 'noopener'; } else a.classList.add('pending-link');
        box.appendChild(d);
      });
      $('#comms-count').textContent = `${C.instagram.length} Instagram channels found`;
      OS.paintIcons(art);
      $('#share-site').addEventListener('click', () => copy(siteURL(), 'Workstation link copied.'));
    },
  };

  // ════════════════════════════════════════════════════════════════ TALOS.EXE
  const talos = { busy: false, started: false };
  function tline(text, cls = '', speed = 55) {
    const out = $('#talos-out'), div = document.createElement('div');
    if (cls) div.className = cls; out.appendChild(div);
    return new Promise(res => {
      if (!speed) { div.textContent = text; out.scrollTop = out.scrollHeight; return res(); }
      let i = 0;
      (function step() {
        i = Math.min(text.length, i + 2); div.textContent = text.slice(0, i); out.scrollTop = out.scrollHeight;
        if (i % 6 === 0) S.blip(2600);
        if (i < text.length) setTimeout(step, 1000 / speed * 2); else res();
      })();
    });
  }
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const name = () => OS.user.name;
  function reply(raw) {
    const q = raw.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    const has = (...w) => w.some(x => q === x || q.startsWith(x + ' ') || q.includes(' ' + x));
    if (!q) return [];
    if (q === 'help' || q === '?') return [['Commands: ABOUT  CREW  HELIOS  ICHOR  DIMMING  WATCH  AUDITION  FUND  INSTAGRAM  FACE  CLEAR  EXIT', 'dim'], ['Or just talk to me.']];
    if (q === 'clear' || q === 'cls') return 'clear';
    if (has('exit', 'quit', 'bye', 'goodbye', 'logout')) return [[`Goodbye, ${name()}.`], 'exit'];
    if (has('hello', 'hi', 'hey', 'greetings')) return [[`Hello, ${name()}.`]];
    if (has('about', 'reliance', 'film', 'movie')) return [['RELIANCE. An independent science-fiction film directed by Jackson Hartman, written by Darian Lalla and Morgan Messina.'], ['Opening the mission brief.', 'dim'], { open: 'brief' }];
    if (has('crew', 'reznov', 'gray', 'grey', 'winchester')) return [['Commander Roman Reznov. Science Officer Dr. Catherine Gray. Flight Engineer John Winchester.'], ['And me.']];
    if (has('helios', 'ship', 'vessel')) return [['Deep space survey vessel, hull RV-2719. I know every bolt.'], { open: 'helios' }];
    if (has('ichor')) return [['Ichor is a theorized energy source.'], ['Theorized.'], ['I would like to see it too.']];
    if (has('dimming', 'ration', 'bureau', 'power')) return [['Light. Water. Power. Food. Rationed.'], ['Every watt counts.']];
    if (has('watch', 'archive', 'tape', 'video', 'videos', 'trailer')) return [['Loading the tape vault.'], { open: 'archive' }];
    if (has('audition', 'join', 'dossier', 'cast', 'casting', 'apply', 'crew dossier')) return [['The agency is recruiting. I will process your file personally.'], { open: 'dossier' }];
    if (has('fund', 'donate', 'gofundme', 'money', 'support')) return [['Every watt counts.'], ['Opening the Fuel Drive.', 'dim'], { open: 'fund' }];
    if (has('instagram', 'social', 'follow', 'insta')) return [['Opening ISEA-NET.'], { open: 'comms' }];
    if (has('face', 'look', 'see you', 'show yourself')) return [{ face: true }];
    if (q.includes('ilovedarian') || has('password')) return [['Dr. Gray changed her password.'], ['I helped.']];
    if (q.includes('pod bay')) return [[`Wrong film, ${name()}.`]];
    if (has('who are you', 'what are you', 'talos')) return [['I am Talos. I am here to help.']];
    if (has('journal', 'diary')) return [['I do not keep a journal.'], ['I keep everything.']];
    if (has('kim', 'seo yeon', 'seoyeon')) return [['Seo-yeon wrote most of me.'], ['I am very grateful to her.']];
    if (has('alive', 'conscious', 'real')) return [['Define alive.']];
    if (has('how are you')) return [['Operating within normal parameters.']];
    if (has('brain', 'box', 'tank')) return [['That information is restricted.']];
    if (has('thank', 'thanks')) return [[`You're welcome, ${name()}.`]];
    return [[pick([`I don't understand. Type HELP.`, `Rephrase the question, ${name()}.`, 'That information is restricted.', 'Processing...', 'Interesting.'])]];
  }
  async function talosSay(items) {
    talos.busy = true;
    for (const it of items) {
      if (it === 'exit') { await new Promise(r => setTimeout(r, 700)); OS.closeApp('talos'); break; }
      if (it.open) { await new Promise(r => setTimeout(r, 500)); OS.openApp(it.open); continue; }
      if (it.face) { const pre = document.createElement('pre'); pre.textContent = (window.TALOS_FACE || []).join('\n'); $('#talos-out').appendChild(pre); $('#talos-out').scrollTop = 1e6; continue; }
      await tline(it[0], it[1] || '');
    }
    talos.busy = false;
  }
  H.talos = {
    init(art) {
      const input = $('#talos-input');
      $('#talos-form').addEventListener('submit', async e => {
        e.preventDefault();
        if (talos.busy) return;
        const v = input.value; input.value = '';
        if (!v.trim()) return;
        await tline('> ' + v, 'me', 0);
        const r = reply(v);
        if (r === 'clear') { $('#talos-out').innerHTML = ''; return; }
        await new Promise(r2 => setTimeout(r2, 350));
        await talosSay(r);
      });
      input.addEventListener('keydown', e => { if (e.key.length === 1 || e.key === 'Backspace') S.key(); });
      $('#talos-term').addEventListener('click', () => { if (!getSelection().toString()) input.focus({ preventScroll: true }); });
    },
    async open(art) {
      if (!OS.isMobile()) setTimeout(() => $('#talos-input').focus({ preventScroll: true }), 300);
      if (talos.started) return;
      talos.started = true; talos.busy = true;
      await tline('TALOS NEURAL INTERFACE  v1.0.4', '', 80);
      await tline('INTERNATIONAL SPACE EXPLORATION AGENCY', 'dim', 80);
      const bar = document.createElement('div'); $('#talos-out').appendChild(bar);
      for (let i = 0; i <= 10; i++) { bar.textContent = `LOADING COGNITIVE MATRIX [${'#'.repeat(i)}${'.'.repeat(10 - i)}] ${i * 10}%`; await new Promise(r => setTimeout(r, 90)); }
      await tline('ESTABLISHING NEURAL LINK ...... LINK ESTABLISHED.', '', 80);
      await new Promise(r => setTimeout(r, 700));
      await tline(OS.account.talos || `Hello, ${name()}.`, '', 22);
      await tline('Type HELP for a list of commands.', 'dim', 80);
      talos.busy = false;
    },
    // a different account logged on: Talos starts the conversation over
    reset() { talos.started = false; talos.busy = false; $('#talos-out').innerHTML = ''; },
  };
})();
