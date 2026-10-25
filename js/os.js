// os.js: STARFRAME 95 for the web. Power, BIOS, boot splash, the crew log-on screen, dial-up,
// each account's desktop (wallpaper, icons, colours), windows you can drag, the taskbar and the
// start menu. Which programs exist and who has which is in desktops.js; what the programs do is in
// apps.js, crew-apps.js and games.js.
(function () {
  const C = window.RELIANCE_CONFIG;
  const { COL } = Kit;
  const SF = Starframe;
  const { APPS, ACCOUNTS, visitor } = window.Desktops;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // phones (and short landscape phones) get full-screen windows; must match the @media rule in os.css
  const COMPACT = matchMedia('(max-width: 760px), (max-height: 500px)');
  const isMobile = () => COMPACT.matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const store = {
    get(k, d) { try { const v = localStorage.getItem('isea_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('isea_' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
  };

  // ---------------------------------------------------------------- extra pixel icons (16 x 16, same palette as starframe.js)
  // sym(): draw the left half, mirror it for the right; `swap` recolours the mirrored side
  const sym = (rows, swap = {}) => rows.map(r => r + [...r].reverse().map(c => swap[c] || c).join(''));
  const person = sym(['........', '......kk', '.....kcc', '....kccc', '....kccc', '....kccc', '.....kcc', '......kk',
    '....kkkk', '...kcccc', '..kccccc', '..kccccc', '..kccccc', '..kkkkkk', '........', '........']);
  const plus = person.map(r => [...r]);
  [[9, 13], [10, 13], [11, 11], [11, 12], [11, 13], [11, 14], [11, 15], [12, 13], [13, 13]].forEach(([y, x]) => (plus[y][x] = 'G'));
  Object.assign(SF.ICONS, {
    tape: [
      '................', '................', '.kkkkkkkkkkkkkk.', '.kssssssssssssk.', '.kswwwwwwwwwwsk.', '.kswrrrrrgggwsk.',
      '.kswwwwwwwwwwsk.', '.kssssssssssssk.', '.kssknnnnnnkssk.', '.kskwnnnnnnwksk.', '.kssknnnnnnkssk.', '.kssssssssssssk.',
      '.ksdssssssssdsk.', '.kkkkkkkkkkkkkk.', '................', '................'],
    idcard: [
      '................', '......kkkk......', '.kkkkkkddkkkkkk.', '.kbbbbbbbbbbbbk.', '.kbbbrbbbbbbbbk.', '.kwwwwwwwwwwwwk.',
      '.kwDDDDwwkkkkwk.', '.kwDGGDwwwwwwwk.', '.kwDGGDwwkkkwwk.', '.kwDDDDwwwwwwwk.', '.kwwwwwwwwwwwwk.', '.kwkkwkwkkwkwwk.',
      '.kwwwwwwwwwwwwk.', '.kggggrrrrttttk.', '.kkkkkkkkkkkkkk.', '................'],
    battery: [
      '................', '......kkkk......', '....kkkddkkk....', '....kwwwwwwk....', '....kwkkkkwk....', '....kwkkkkwk....',
      '....kwkkkkwk....', '....kwkookwk....', '....kwkkkkwk....', '....kwkGGkwk....', '....kwkkkkwk....', '....kwkGGkwk....',
      '....kwkkkkwk....', '....kwwwwwwk....', '....kkkkkkkk....', '................'],
    dish: [
      '................', '...........t....', '.........t..t...', '..kk......t..t..', '.kwwk......t....', '.kwccwk.........',
      '.kwcccwkk.......', '..kwcccwwk......', '...kwccccwk.....', '....kwwcccwk....', '.....kkwwwwk....', '.......kdkkk....',
      '......kdddk.....', '.....kdddddk....', '....kkkkkkkkk...', '................'],
    ship: sym([
      '.......k', '......kt', '......kt', '.....kbt', '.....kbt', '....kbbt', '.kk.kbwt', 'kGGkkbwt',
      'kGGkbbbt', 'kGGkbbbb', 'kGkkbbbb', '.kk.kbbk', '....kbkk', '....kggk', '.....oo.', '........']),
    cube: sym([
      '........', '.......k', '.....kkg', '...kkggg', '.kkggggg', '.kkkgggg', '.krrkkgg', '.krrrrkk',
      '.krrrrrk', '.krrrrrk', '.kGGGGGk', '.kGGGGGk', '..kkoook', '....kkok', '......kk', '........'], { r: 'o', G: 'D' }),
    rock: sym([
      '........', '........', '.....kkk', '...kksss', '..ksssgs', '.ksssgss', '.kssgsss', 'kssgssso',
      'ksgsssgo', 'kssgsgss', '.ksgssss', '.kssssss', '..kkssss', '....kkkk', '........', '........']),
    gauge: [
      '................', '................', '.....kkkkkk.....', '...kkwwwwwwkk...', '..kwGwwwwwwrwk..', '.kwwwwwwwwrwwwk.',
      '.kGwwwwwwrwwwrk.', 'kwwwwwwwrwwwwwwk', 'kwwwwwwkkwwwwwwk', 'kwwwwwwkkwwwwwwk', '.kkkkkkkkkkkkkk.', '................',
      '..kddddddddddk..', '..kkkkkkkkkkkk..', '................', '................'],
    music: [
      '................', '.....kkkkkkkkk..', '.....kooooooook.', '.....kkkkkkkkk..', '.....k.......k..', '.....k.......k..',
      '.....k.......k..', '.....k.......k..', '..kkkk....kkkk..', '.kooook..kooook.', '.kooook..kooook.', '..kkkk....kkkk..',
      '................', '................', '................', '................'],
    flag: [
      '................', '......kk........', '......krrrk.....', '......krrrrrk...', '......krrrrrrrk.', '......krrrrrk...',
      '......krrrk.....', '......kk........', '......kk........', '......kk........', '....kkkkkk......', '..kkkkkkkkkk....',
      '..kddddddddk....', '..kkkkkkkkkk....', '................', '................'],
    insignia: sym(['........', '.......g', '......gg', '...ggggg', '....gggg', '.....ggg', '....ggg.', '...gg...',
      '........', '.rr.....', '..rrr...', '...rrrr.', '.....rrr', '.......r', '........', '........']),
    pad: [
      '................', '................', '................', '...kkkkkkkkkk...', '..kmmmmmmmmmmk..', '.kmmkmmmmmmmrmk.',
      '.kmkkkmmmmmrmrk.', '.kmmkmmmmmmmbmk.', '.kmmmmmkkmmmmmk.', '.kmmmmkk.kkmmmk.', '.kmmmk.....kmmk.', '..kkk.......kkk.',
      '................', '................', '................', '................'],
    visitor: person,
    newuser: plus.map(r => r.join('')),
  });
  const iconCache = {};
  function icon(name) {
    if (iconCache[name]) return iconCache[name];
    const rows = SF.ICONS[name] || SF.ICONS.doc, c = document.createElement('canvas');
    c.width = c.height = 16; const g = c.getContext('2d');
    rows.forEach((row, j) => [...row].forEach((ch, i) => { if (SF.PAL[ch]) { g.fillStyle = SF.PAL[ch]; g.fillRect(i, j, 1, 1); } }));
    return (iconCache[name] = c.toDataURL());
  }
  function paintIcons(root = document) { $$('img[data-icon]', root).forEach(img => { if (!img.getAttribute('src')) img.src = icon(img.dataset.icon); }); }
  // an account's picture: Dr. Gray's real (green) photo, everyone else a pixel icon
  function picHTML(acct) {
    return acct.pic === 'photo' && window.GRAY_PHOTO ? `<img class="photo" src="${window.GRAY_PHOTO}" alt="">` : `<img data-icon="${acct.pic}" alt="">`;
  }

  // ---------------------------------------------------------------- sound: the workstation's own noises
  // power / hdd / modem / chime are cut from the TALOS.EXE soundtrack; clicks and blips are made live.
  const Sound = (() => {
    const FILES = { power: 'media/sfx/power.mp3', hdd: 'media/sfx/hdd.mp3', modem: 'media/sfx/modem.mp3', chime: 'media/sfx/chime.mp3' };
    const raw = {}, buf = {};
    let ctx = null, master = null, on = store.get('sound', true);
    for (const [k, url] of Object.entries(FILES)) raw[k] = fetch(url).then(r => r.arrayBuffer()).catch(() => null);
    function unlock() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = on ? 0.8 : 0; master.connect(ctx.destination);
      for (const k in raw) buf[k] = raw[k].then(a => a && new Promise(res => ctx.decodeAudioData(a.slice(0), res, () => res(null))));
    }
    function play(name, vol = 1) {
      if (!ctx || !on || !buf[name]) return { stop() {} };
      let src = null, gain = null, stopped = false;
      buf[name].then(b => {
        if (!b || stopped) return;
        src = ctx.createBufferSource(); src.buffer = b; gain = ctx.createGain(); gain.gain.value = vol;
        src.connect(gain).connect(master); src.start();
      });
      return { stop(fade = 0.25) { stopped = true; if (src) { gain.gain.setTargetAtTime(0, ctx.currentTime, fade / 4); src.stop(ctx.currentTime + fade); } } };
    }
    function tone(freq, dur = 0.07, vol = 0.08, type = 'sine', at = 0) {
      if (!ctx || !on) return;
      const t0 = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(master); o.start(t0); o.stop(t0 + dur + 0.02);
    }
    let noiseBuf = null;
    function noise(dur, freq, q, vol) {
      if (!ctx || !on) return;
      if (!noiseBuf) { noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t0 = ctx.currentTime;
      s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      s.connect(f).connect(g).connect(master); s.start(t0, Math.random() * 0.15); s.stop(t0 + dur);
    }
    return {
      unlock, play, tone,
      ctx: () => ctx, out: () => master,
      key: () => { noise(0.035, 2600 + Math.random() * 1600, 1.2, 0.5); tone(140, 0.03, 0.05, 'triangle'); },
      click: () => noise(0.025, 4200, 0.9, 0.45),
      blip: (f = 1400) => tone(f, 0.05, 0.06),
      beep: () => tone(1046, 0.14, 0.07, 'square'),
      open: () => { tone(660, 0.06, 0.07); tone(990, 0.08, 0.05, 'sine', 0.05); },
      close: () => { tone(880, 0.05, 0.05); tone(587, 0.07, 0.05, 'sine', 0.04); },
      menu: () => noise(0.12, 1800, 0.6, 0.18),
      ding: () => { tone(1318, 0.5, 0.05); tone(988, 0.6, 0.05, 'sine', 0.14); },
      error: () => { tone(220, 0.18, 0.08, 'square'); tone(196, 0.22, 0.07, 'square', 0.12); },
      get on() { return on; },
      set on(v) { on = v; store.set('sound', v); if (master) master.gain.value = v ? 0.8 : 0; document.body.classList.toggle('muted', !v); },
    };
  })();
  document.body.classList.toggle('muted', !Sound.on);
  addEventListener('pointerdown', () => Sound.unlock(), { capture: true });
  addEventListener('keydown', () => Sound.unlock(), { capture: true });

  // ---------------------------------------------------------------- the curved tube
  // On desktop Chrome / Edge the picture really bends like CRT glass: an SVG displacement filter
  // pushes everything outward toward the corners. It's put on the screens you only look at
  // (boot, log-on, wallpaper, scanlines) and not on the windows, so clicks always land where they look.
  // Elsewhere (phones, Safari, Firefox) the rounded glass, shading and glare do the job on their own.
  const screenEl = $('#screen');
  const Warp = (() => {
    const ua = navigator.userAgent;
    const can = /Chrome\/|Edg\//.test(ua) && !/Mobile|Android|CriOS|SamsungBrowser/.test(ua) && matchMedia('(pointer: fine)').matches && !reduced;
    const img = $('#warp-map'), disp = $('#warp-disp');
    let w0 = 0, h0 = 0;
    function build() {
      const w = screenEl.clientWidth, h = screenEl.clientHeight;
      if (!w || (w === w0 && h === h0)) return;
      w0 = w; h0 = h;
      const kx = 0.03, ky = 0.034, N = 96, c = document.createElement('canvas'); c.width = c.height = N;
      const g = c.getContext('2d'), id = g.createImageData(N, N);
      const scale = 2.1 * Math.max(kx * w, ky * h);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const x = (i + 0.5) / N * 2 - 1, y = (j + 0.5) / N * 2 - 1, r2 = x * x + y * y, k = (j * N + i) * 4;
        id.data[k] = Math.round((0.5 + x * r2 * kx * w / 2 / scale) * 255);
        id.data[k + 1] = Math.round((0.5 + y * r2 * ky * h / 2 / scale) * 255);
        id.data[k + 2] = 128; id.data[k + 3] = 255;
      }
      g.putImageData(id, 0, 0);
      img.setAttribute('href', c.toDataURL()); img.setAttribute('width', w); img.setAttribute('height', h);
      disp.setAttribute('scale', scale.toFixed(2));
    }
    function apply() { const on = can && document.body.classList.contains('crt-on'); document.body.classList.toggle('warp', on); if (on) build(); }
    return { apply, build };
  })();

  // ---------------------------------------------------------------- canvas art (logo, emblem) from the promo libraries
  const fontsReady = Promise.all(['900 40px Orb', '40px Audio', '400 20px Pix', '700 20px Pix', '20px Term'].map(f => document.fonts.load(f))).catch(() => {});
  function prep(canvas) { const g = canvas.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, canvas.width, canvas.height); return g; }
  function drawEmblem(canvas) { const g = prep(canvas), s = canvas.width; Emblem.draw(g, s / 2, s / 2, s * 0.94 / 890, {}); }
  // STARFRAME 95 wordmark, centred (or left-aligned from x) and scaled to fit maxW
  function drawWordmark(g, cx, y, size, cols, maxW, left = false) {
    g.font = SF.WIDE(size); const w1 = g.measureText('STARFRAME').width; g.font = SF.WIDE(size * 0.95);
    let total = w1 + size * 0.12 + g.measureText('95').width;
    if (total > maxW) { size *= maxW / total; total = maxW; }
    g.font = SF.WIDE(size); const w = g.measureText('STARFRAME').width;
    const x0 = left ? cx : cx - total / 2;
    SF.wordmark(g, x0, y, size, cols, 0, 'left');
    return x0 + w;
  }
  function drawLoginLogo(canvas, cols) {
    const g = prep(canvas), H = canvas.height;
    SF.starLogo(g, H * 0.5, H * 0.5, H * 0.44, 0, 1);
    drawWordmark(g, H * 1.02, H * 0.72, H * 0.6, cols, canvas.width - H * 1.06, true);
  }

  // ---------------------------------------------------------------- stages
  let stage = 'power';
  function show(id) {
    $$('.stage').forEach(s => s.classList.toggle('on', s.id === id));
    stage = id;
    document.body.dataset.stage = id;
  }
  function tube(dir) {
    if (reduced) return Promise.resolve();
    return new Promise(res => {
      screenEl.classList.remove('tube-on', 'tube-off'); void screenEl.offsetWidth;
      screenEl.classList.add(dir === 'on' ? 'tube-on' : 'tube-off');
      setTimeout(() => { if (dir === 'on') screenEl.classList.remove('tube-on'); res(); }, dir === 'on' ? 560 : 520);
    });
  }

  // a boot step that a tap or key press can cut short
  const boot = { skip: false, wake: null };
  const bwait = ms => new Promise(r => { if (boot.skip) return r(); const t = setTimeout(r, ms); boot.wake = () => { clearTimeout(t); r(); }; });
  function skipBoot() { if (stage !== 'bios' && stage !== 'splash') return; boot.skip = true; if (boot.wake) boot.wake(); }
  ['bios', 'splash'].forEach(id => $('#' + id).addEventListener('pointerdown', skipBoot));
  addEventListener('keydown', e => { if (stage === 'bios' || stage === 'splash') { e.preventDefault(); skipBoot(); } });

  // ---------------------------------------------------------------- 0. power
  fontsReady.then(() => {
    drawEmblem($('#power-emblem')); drawEmblem($('#bios-emblem')); drawEmblem($('#welcome-emblem'));
    $$('.mast-emblem').forEach(drawEmblem);
    drawLoginLogo($('#login-logo'), ['#fff8e8', '#c9d4ff']);
    const sg = prep($('#start-star')); SF.starLogo(sg, 24, 24, 21, 0, 1);
    const dg = prep($('#desk-logo'));
    SF.starLogo(dg, 470, 70, 56, 0, 1);
    drawWordmark(dg, 300, 175, 70, ['#fff8e8', '#c9c0a8'], 560);
    SF.text(dg, 'ISEA WORKSTATION EDITION', 596, 205, SF.PIX(22, 700), '#c9c0a8', 'right');
  });
  $('#power-sound').textContent = Sound.on ? 'SOUND ON' : 'SOUND OFF';
  $('#power-btn').addEventListener('click', () => powerOn());

  async function powerOn() {
    Sound.unlock(); Sound.play('power', 0.9);
    boot.skip = false;
    const quick = store.get('booted', false);
    show(quick ? 'splash' : 'bios'); tube('on');
    if (!quick) await runBios();
    show('splash'); await runSplash(quick ? 1500 : 2700);
    store.set('booted', true);
    showLogin();
  }

  // ---------------------------------------------------------------- 1. BIOS
  const BIOS = [
    ['ISEA MODULAR BIOS v4.10', ''], ['INTERNATIONAL SPACE EXPLORATION AGENCY', ''], ['', ''],
    ['CPU  : QUANTUM CORE QX-9  75 MHz', 'dim'], ['MEMORY TEST : ', 'dim mem'], ['DETECTING HDD-0 ....... ISEA-SYS 540 MB', 'dim'],
    ['DETECTING NETLINK MODEM .... 28800 BPS', 'dim'], ['NEURAL CO-PROCESSOR ........ STANDBY', 'g'], ['', ''],
    ['PRESS <DEL> TO ENTER SETUP', 'faint'], ['', ''], ['BOOTING FROM HDD-0 ...', ''], ['STARTING STARFRAME 95 ...', ''],
  ];
  async function runBios() {
    const pre = $('#bios-text'); pre.textContent = '';
    await bwait(350); Sound.beep();
    for (const [s, cls] of BIOS) {
      if (boot.skip) return;
      const line = document.createElement('span'); line.className = cls; pre.appendChild(line); pre.appendChild(document.createTextNode('\n'));
      if (cls.includes('mem')) {
        const t0 = performance.now();
        while (!boot.skip) {
          const q = Math.min(1, (performance.now() - t0) / 520);
          line.textContent = s + (Math.floor(65536 * q / 64) * 64) + 'K' + (q >= 1 ? ' OK' : '');
          if (q >= 1) break;
          await bwait(30);
        }
      } else {
        for (let i = 1; i <= s.length; i += 3) { if (boot.skip) return; line.textContent = s.slice(0, i); await bwait(12); }
        line.textContent = s;
      }
      if (s.startsWith('DETECTING HDD')) Sound.play('hdd', 0.6);
      await bwait(s ? 110 : 40);
    }
    await bwait(380);
  }

  // ---------------------------------------------------------------- 2. boot splash
  async function runSplash(ms) {
    const line = $('#splash-line'), msg = '> This connection is monitored for your safety.';
    const star = $('#splash-star'), word = $('#splash-word');
    await fontsReady;
    const wg = prep(word); drawWordmark(wg, 450, 122, 118, ['#7dffcf', '#13b46c'], 880);
    word.style.opacity = 0; word.style.transition = 'opacity 0.6s';
    const t0 = performance.now();
    let live = true;
    (function frame() {
      if (!live) return;
      const t = (performance.now() - t0) / 1000;
      const sg = prep(star); SF.starLogo(sg, 200, 200, 190, t, reduced ? 1 : Math.min(1, Math.max(0, (t - 0.1) / 1.1)));
      line.textContent = msg.slice(0, Math.floor(Math.min(1, t / 1.1) * msg.length));
      if (t > 0.7) word.style.opacity = 1;
      requestAnimationFrame(frame);
    })();
    Sound.play('hdd', 0.5);
    await bwait(ms);
    live = false;
  }

  // ---------------------------------------------------------------- 3. log-on: click your user name
  let starsAnim = null;
  function twinkle(canvas, n) {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const S = Array.from({ length: n }, () => [Math.random(), Math.random(), 1 + Math.random() * 2.2, Math.random() * 6]);
    let last = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      if (stage !== 'login' || now - last < 90) return; last = now;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); }
      const g = canvas.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
      const t = now / 1000; g.fillStyle = '#fff8e8';
      for (const [x, y, s, p] of S) { g.globalAlpha = 0.25 + 0.25 * Math.sin(t * 2 + p); g.fillRect(x * w, y * h, s, s); }
    }
    requestAnimationFrame(frame);
    return true;
  }
  // saved accounts made with "New account" (crew accounts are always there)
  const savedAccounts = () => store.get('accounts', []).map(a => visitor(a.name, a.key));
  const sessionOf = acct => (acct.guest ? acct.session : store.get('session_' + acct.key, acct.session));
  function statusOf(acct) {
    if (acct.status) return acct.status();
    const n = sessionOf(acct).length;
    return n ? `Logged on · ${n} program${n > 1 ? 's' : ''} running` : 'Logged on';
  }
  function buildUsers() {
    const ul = $('#users'); ul.innerHTML = '';
    const tile = (acct, status, onClick, extra = '') => {
      const li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.className = 'user-tile ' + extra;
      b.innerHTML = `<span class="pic">${picHTML(acct)}</span><span class="who"><b></b><small></small></span><span class="go" aria-hidden="true">▶</span>`;
      $('b', b).textContent = acct.name; $('small', b).textContent = status;
      b.addEventListener('click', () => { Sound.click(); onClick(); });
      li.appendChild(b); ul.appendChild(li);
    };
    Object.values(ACCOUNTS).forEach(a => tile(a, statusOf(a), () => resume(a)));
    savedAccounts().forEach(a => tile(a, statusOf(a), () => resume(a)));
    tile({ name: 'New account', pic: 'newuser' }, 'Make your own log-on', () => showNewForm(true), 'new');
    tile({ name: 'Visitor', pic: 'visitor' }, 'Look around. No account needed.', () => connect(visitor('Visitor')), 'guest');
    paintIcons(ul);
  }
  function showNewForm(on) {
    $('#users').hidden = on; $('#new-form').hidden = !on;
    $('.login-begin').textContent = on ? 'Type a name for your account' : 'To begin, click your user name';
    if (on) { $('#new-name').value = ''; $('#new-pass').value = ''; setTimeout(() => $('#new-name').focus(), 50); }
  }
  function showLogin() {
    show('login');
    $('#dialup').hidden = true; $('#welcome').hidden = true;
    buildUsers(); showNewForm(false);
    const right = $('.login-right'); right.style.animation = 'none'; void right.offsetWidth; right.style.animation = '';
    if (!starsAnim) starsAnim = twinkle($('#login-stars'), 90);
    Warp.apply();
    Sound.open();
  }
  ['#new-name', '#new-pass'].forEach(s => $(s).addEventListener('keydown', e => { if (e.key.length === 1 || e.key === 'Backspace') Sound.key(); }));
  $('#new-cancel').addEventListener('click', () => { Sound.click(); showNewForm(false); });
  $('#new-form').addEventListener('submit', e => {
    e.preventDefault(); Sound.click();
    const name = $('#new-name').value.trim().replace(/\s+/g, ' ').slice(0, 32), pass = $('#new-pass').value.trim().toLowerCase();
    if (!name) { Sound.error(); toast('Type a user name first.'); $('#new-name').focus(); return; }
    // the crew already have accounts: take them to theirs
    if (/gr[ae]y|catherine/i.test(name)) { if (pass && pass !== 'ilovedarian') toast("That's not Dr. Gray's password. Logging you on anyway."); return resume(ACCOUNTS.gray); }
    if (/reznov/i.test(name)) return resume(ACCOUNTS.reznov);
    if (/winchester/i.test(name)) return resume(ACCOUNTS.winchester);
    if (/^talos$/i.test(name)) { toast('User TALOS is already logged on.'); return; }
    if (pass === 'ilovedarian') toast("That's Dr. Gray's password. We'll pretend we didn't see that.");
    const list = store.get('accounts', []);
    let a = list.find(x => x.name.toLowerCase() === name.toLowerCase());
    if (!a) { a = { name, key: 'u_' + Date.now().toString(36) }; list.unshift(a); store.set('accounts', list.slice(0, 5)); }
    connect(visitor(a.name, a.key));
  });
  $('#turn-off').addEventListener('click', () => shutDown());

  let user = visitor('Visitor');
  let dialRun = 0, modem = null;
  // a crew member (or a saved account) is already logged on: just unlock and carry on
  async function resume(acct) {
    user = acct; dialRun++;
    await welcome(acct.name, 'welcome back');
    enterDesktop();
  }
  // a new log-on dials in to ISEA-NET first
  async function connect(acct) {
    user = acct;
    const run = ++dialRun;
    const dlg = $('#dialup'), msg = $('#dial-msg'), speed = $('#dial-speed');
    dlg.hidden = false; dlg.classList.remove('data'); speed.textContent = 'Speed: negotiating...';
    paintIcons(dlg);
    modem = Sound.play('modem', 0.55);
    const steps = [['Dialing ISEA-NET (station 7)...', 750], ['Handshaking with remote modem...', 1150], ['Verifying user name and password...', 700], ['Logging on to the network...', 500]];
    for (let i = 0; i < steps.length; i++) {
      msg.textContent = steps[i][0];
      if (i === 1) dlg.classList.add('data');
      if (i === 3) speed.textContent = 'Connected at 28,800 bps';
      await new Promise(r => setTimeout(r, steps[i][1]));
      if (run !== dialRun) return;
    }
    modem.stop(0.3);
    dlg.hidden = true;
    await welcome(acct.name, 'welcome');
    if (run !== dialRun) return;
    enterDesktop();
  }
  $('#dial-cancel').addEventListener('click', () => { dialRun++; if (modem) modem.stop(0.1); Sound.click(); $('#dialup').hidden = true; });

  async function welcome(name, word) {
    const w = $('#welcome');
    $('#welcome-name').textContent = name; $('.welcome-word').textContent = word;
    w.hidden = false; w.style.animation = 'none'; void w.offsetWidth; w.style.animation = '';
    Sound.play('chime', 0.8);
    await new Promise(r => setTimeout(r, reduced ? 600 : 1600));
    w.hidden = true;
  }

  // ---------------------------------------------------------------- 4. the desktop, set up for whoever logged on
  const hooks = window.AppHooks = window.AppHooks || {};
  const wins = {};                     // id -> { el, body, art }
  let zTop = 10, focused = null, pendingApp = null, wasMobile = isMobile();

  // WELCOME.TXT's big buttons, one per program of the film's own
  ['brief', 'archive', 'helios', 'dossier', 'comms', 'fund', 'talos'].forEach(id => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'launcher'; b.dataset.open = id;
    b.innerHTML = `<img data-icon="${APPS[id].icon}" alt=""><span><b></b><small></small></span>`;
    $('b', b).textContent = APPS[id].label; $('small', b).textContent = APPS[id].desc;
    $('#launchers').appendChild(b);
  });

  function applyAccount(acct) {
    document.body.dataset.theme = acct.theme;
    document.body.dataset.account = acct.key;
    $$('.user-name').forEach(s => (s.textContent = acct.name));
    // desktop icons
    const icons = $('#icons'); icons.innerHTML = '';
    acct.desk.forEach((id, i) => {
      const b = document.createElement('button');
      b.className = 'dicon pop'; b.type = 'button'; b.dataset.app = id;
      b.style.animationDelay = (0.2 + i * 0.07) + 's';
      b.innerHTML = `<img data-icon="${APPS[id].icon}" alt=""><span></span>`;
      $('span', b).textContent = APPS[id].label;
      b.addEventListener('click', () => { $$('.dicon').forEach(d => d.classList.toggle('sel', d === b)); Sound.click(); openApp(id); });
      icons.appendChild(b);
    });
    // quick launch: the first three things on their desktop
    const ql = $('#quick-launch'); ql.innerHTML = '';
    acct.desk.filter(id => id !== 'bin').slice(0, 3).forEach(id => {
      const b = document.createElement('button'); b.type = 'button'; b.title = APPS[id].label; b.setAttribute('aria-label', APPS[id].label);
      b.innerHTML = `<img data-icon="${APPS[id].icon}" alt="">`; b.addEventListener('click', () => openApp(id)); ql.appendChild(b);
    });
    // the "new tape" / tip balloon
    const bl = acct.balloon;
    $('#balloon-title').textContent = bl.title; $('#balloon-text').textContent = bl.text; $('#balloon-small').textContent = bl.small || '';
    $('#balloon').dataset.open = bl.open;
    $('#welcome-intro').textContent = acct.guest ? 'This workstation holds everything the agency is cleared to tell you.' : 'Your account is ready. Everything the agency is cleared to tell you is here.';
    buildStartMenu();
    paintIcons();
  }

  function enterDesktop(fast = false) {
    applyAccount(user);
    show('desktop');
    Warp.apply();
    if (!fast) acct().desk.forEach((_, i) => setTimeout(() => Sound.blip(1300 + i * 70), 200 + i * 70));
    wall.set(user.theme);
    wall.start();
    const app = pendingApp; pendingApp = null;
    setTimeout(() => {
      if (app) openApp(app.id, app.sub);
      else restoreSession();
      if (!fast && !(isMobile() && Object.values(wins).some(w => !w.el.classList.contains('min')))) setTimeout(() => {
        const b = $('#balloon'); b.hidden = false; Sound.ding();
        setTimeout(() => (b.hidden = true), 9000);
      }, 1500);
    }, fast ? 50 : 650);
  }
  const acct = () => user;
  // carry on where they left off: their programs come back open (on phones, waiting in the taskbar)
  function restoreSession() {
    const ids = sessionOf(user).filter(id => APPS[id]);
    if (isMobile()) { if (user.guest) return; ids.forEach(id => openApp(id, null, { min: true })); return; }
    ids.forEach((id, i) => openApp(id, null, { slot: [i, ids.length] }));
  }
  function saveSession() {
    if (!user || user.guest || stage !== 'desktop') return;
    store.set('session_' + user.key, Object.keys(wins).filter(id => id !== 'welcome' && id !== 'tour'));
  }
  addEventListener('pagehide', saveSession);
  $('#balloon').addEventListener('click', () => { const [id, sub] = ($('#balloon').dataset.open || '').split('/'); $('#balloon').hidden = true; if (APPS[id]) openApp(id, sub); });
  function clock() { const d = new Date(); $('#clock').textContent = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  setInterval(clock, 10000); clock();

  // ---------------------------------------------------------------- windows
  function deskSize() { const d = $('#windows'); return [d.clientWidth, d.clientHeight]; }
  function openApp(id, sub, opt = {}) {
    const def = APPS[id]; if (!def) return;
    if (stage !== 'desktop') { quickLogon({ id, sub }); return; }
    closeStart();
    let w = wins[id];
    if (!w) w = wins[id] = createWin(id, def, opt.slot);
    if (opt.min) { w.el.classList.add('min'); taskbar(); return; }
    w.el.classList.remove('min');
    focusWin(id);
    if (hooks[id] && hooks[id].open) hooks[id].open(w.art, sub);
    setHash(id, sub);
    if (isMobile()) $('#balloon').hidden = true;
  }
  // where a new window goes: centred right of the icons, each one a little further down and right.
  // A restored session (slot = [i, of n]) fans its windows out across the screen instead.
  function place(el, def, slot) {
    const [dw, dh] = deskSize(), n = Object.keys(wins).length % 5;
    const ic = $('#icons').getBoundingClientRect(), x0 = clamp(ic.right - $('#windows').getBoundingClientRect().left + 8, 110, dw * 0.3);
    const ww = Math.min(def.w, dw - 24), wh = Math.min(def.h, dh - 20), room = dw - x0 - ww;
    el.style.width = ww + 'px'; el.style.height = wh + 'px';
    if (slot && slot[1] > 1 && room > 40) {
      const q = slot[0] / (slot[1] - 1);
      el.style.left = (x0 + room * q) + 'px';
      el.style.top = clamp(10 + (dh - wh - 20) * (0.15 + 0.7 * q), 8, Math.max(8, dh - wh - 8)) + 'px';
      return;
    }
    el.style.left = Math.max(8, (room > 40 ? x0 + room / 2 : (dw - ww) / 2) + n * 26 - 40) + 'px';
    el.style.top = Math.max(8, (dh - wh) / 2 - 10 + n * 22 - 30) + 'px';
  }
  function createWin(id, def, slot) {
    const el = document.createElement('div');
    el.className = 'win opening' + (def.cls ? ' ' + def.cls : '');
    el.dataset.app = id; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', def.title);
    el.innerHTML = `<div class="win-title"><img data-icon="${def.icon}" alt=""><span></span><span class="stripes" aria-hidden="true"><i></i><i></i><i></i><i></i></span>` +
      `<span class="wb"><button class="win-btn mn" type="button" aria-label="Minimize">_</button><button class="win-btn mx" type="button" aria-label="Maximize">□</button><button class="win-btn x" type="button" aria-label="Close">×</button></span></div><div class="win-body"></div>`;
    $('.win-title > span', el).textContent = def.title;
    const body = $('.win-body', el), art = $(`#apps .app[data-app="${id}"]`);
    body.appendChild(art);
    place(el, def, slot);
    $('#windows').appendChild(el);
    paintIcons(el); applyLinks(el);
    el.addEventListener('animationend', () => el.classList.remove('opening'), { once: true });
    el.addEventListener('pointerdown', () => { if (focused !== id) focusWin(id); });
    $('.x', el).addEventListener('click', e => { e.stopPropagation(); closeApp(id); });
    $('.mn', el).addEventListener('click', e => { e.stopPropagation(); minimize(id); });
    $('.mx', el).addEventListener('click', e => { e.stopPropagation(); el.classList.toggle('max'); Sound.click(); resized(id); });
    dragify(el, id);
    Sound.open();
    if (hooks[id] && hooks[id].init && !art.dataset.ready) { art.dataset.ready = '1'; hooks[id].init(art); }
    return { el, body, art };
  }
  function dragify(el, id) {
    const bar = $('.win-title', el);
    let sx, sy, ox, oy, dragging = false;
    bar.addEventListener('dblclick', e => { if (e.target.closest('button') || isMobile()) return; el.classList.toggle('max'); resized(id); });
    bar.addEventListener('pointerdown', e => {
      if (e.target.closest('button') || isMobile() || el.classList.contains('max') || e.button !== 0) return;
      dragging = true; sx = e.clientX; sy = e.clientY; ox = el.offsetLeft; oy = el.offsetTop;
      bar.setPointerCapture(e.pointerId); el.classList.add('drag');
    });
    bar.addEventListener('pointermove', e => {
      if (!dragging) return;
      const [dw, dh] = deskSize();
      el.style.left = clamp(ox + e.clientX - sx, 120 - el.offsetWidth, dw - 120) + 'px';
      el.style.top = clamp(oy + e.clientY - sy, 0, dh - 44) + 'px';
    });
    const end = () => { dragging = false; el.classList.remove('drag'); };
    bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end);
  }
  function resized(id) { const w = wins[id]; if (w && hooks[id] && hooks[id].resize) hooks[id].resize(w.art); }
  function focusWin(id) {
    const w = wins[id]; if (!w) return;
    w.el.style.zIndex = ++zTop;
    focused = id;
    Object.entries(wins).forEach(([k, v]) => v.el.classList.toggle('focus', k === id));
    taskbar();
    wall.check();
  }
  function restoreWin(id) {
    const w = wins[id]; if (!w) return;
    w.el.classList.remove('min'); focusWin(id); setHash(id);
    if (hooks[id] && hooks[id].open) hooks[id].open(w.art);
    if (isMobile()) $('#balloon').hidden = true;
  }
  function minimize(id) {
    const w = wins[id]; if (!w) return;
    w.el.classList.add('min'); Sound.close();
    if (hooks[id] && hooks[id].hide) hooks[id].hide(w.art);
    focused = topWin(); if (focused) focusWin(focused); else { taskbar(); wall.check(); setHash(); }
  }
  function closeApp(id) {
    const w = wins[id]; if (!w) return;
    if (hooks[id] && hooks[id].close) hooks[id].close(w.art);
    $('#apps').appendChild(w.art);
    w.el.remove(); delete wins[id];
    Sound.close();
    focused = topWin(); if (focused) focusWin(focused); else { taskbar(); wall.check(); setHash(); }
  }
  function topWin() {
    let best = null, z = -1;
    for (const [k, v] of Object.entries(wins)) if (!v.el.classList.contains('min') && +v.el.style.zIndex > z) { z = +v.el.style.zIndex; best = k; }
    return best;
  }
  function taskbar() {
    const tb = $('#task-buttons'); tb.innerHTML = '';
    Object.keys(wins).forEach(id => {
      const w = wins[id], b = document.createElement('button');
      const active = id === focused && !w.el.classList.contains('min');
      b.type = 'button'; b.className = 'task-btn' + (active ? ' active' : ''); b.title = APPS[id].title; b.setAttribute('aria-label', APPS[id].label);
      b.innerHTML = `<img data-icon="${APPS[id].icon}" alt=""><span></span>`; $('span', b).textContent = APPS[id].label;
      b.addEventListener('click', () => { Sound.click(); if (active) minimize(id); else restoreWin(id); });
      tb.appendChild(b);
    });
    paintIcons(tb);
  }
  function closeAll() { Object.keys(wins).forEach(closeApp); }
  // after a resize or rotating a phone, keep every window on screen
  addEventListener('resize', () => {
    const m = isMobile();
    if (!m) {
      const [dw, dh] = deskSize();
      Object.entries(wins).forEach(([id, w]) => {
        const el = w.el;
        if (wasMobile) { place(el, APPS[id]); return; }
        el.style.width = Math.min(el.offsetWidth, dw - 16) + 'px'; el.style.height = Math.min(el.offsetHeight, dh - 12) + 'px';
        el.style.left = clamp(el.offsetLeft, 120 - el.offsetWidth, dw - 120) + 'px'; el.style.top = clamp(el.offsetTop, 0, dh - 44) + 'px';
      });
    }
    wasMobile = m;
    Object.keys(wins).forEach(resized);
    Warp.apply(); wall.check(); wall.layout();
  });

  // ---------------------------------------------------------------- start menu
  function buildStartMenu() {
    const ul = $('#sm-items'); ul.innerHTML = '';
    const head = document.createElement('li'); head.className = 'sm-user';
    head.innerHTML = `<span class="pic">${picHTML(user)}</span><b></b>`; $('b', head).textContent = user.name; ul.appendChild(head);
    const add = (iconName, label, fn, cls, state) => {
      const li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; if (cls) b.className = cls;
      b.innerHTML = `<img data-icon="${iconName}" alt=""><span></span>` + (state ? '<span class="state"></span>' : '');
      $('span', b).textContent = label;
      if (state) $('.state', b).textContent = state();
      b.addEventListener('click', () => { Sound.click(); fn(); });
      li.appendChild(b); ul.appendChild(li);
    };
    const sep = () => { const li = document.createElement('li'); li.className = 'sep'; ul.appendChild(li); };
    user.desk.filter(id => id !== 'bin').forEach(id => add(APPS[id].icon, APPS[id].label, () => openApp(id), id === 'talos' ? 'talos' : ''));
    sep();
    add('station', 'CRT effect', () => { const on = !document.body.classList.contains('crt-on'); document.body.classList.toggle('crt-on', on); store.set('crt', on); Warp.apply(); buildStartMenu(); }, '', () => (document.body.classList.contains('crt-on') ? 'On' : 'Off'));
    add('modem', 'Sound', () => { Sound.on = !Sound.on; buildStartMenu(); }, '', () => (Sound.on ? 'On' : 'Off'));
    sep();
    add('visitor', 'Switch user...', () => { closeStart(); logOff(); });
    add('bin', 'Shut Down...', () => { closeStart(); shutDown(); });
    paintIcons(ul);
  }
  const startBtn = $('#start-btn'), menu = $('#startmenu');
  function openStart() { buildStartMenu(); menu.hidden = false; startBtn.setAttribute('aria-expanded', 'true'); Sound.menu(); }
  function closeStart() { menu.hidden = true; startBtn.setAttribute('aria-expanded', 'false'); }
  startBtn.addEventListener('click', e => { e.stopPropagation(); Sound.click(); menu.hidden ? openStart() : closeStart(); });
  document.addEventListener('pointerdown', e => { if (!menu.hidden && !e.target.closest('#startmenu, #start-btn')) closeStart(); });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeStart(); });
  $('#tray-sound').addEventListener('click', () => { Sound.on = !Sound.on; if (Sound.on) Sound.blip(); toast(Sound.on ? 'Sound on' : 'Sound off'); });
  document.body.classList.toggle('crt-on', store.get('crt', true));

  // leaving a desktop: remember what was open, close it all, and tidy every program back to new
  function leaveDesktop() {
    saveSession(); closeAll(); wall.stop(); setHash();
    Object.values(hooks).forEach(h => h.reset && h.reset());
    $('#balloon').hidden = true;
  }
  function logOff() { leaveDesktop(); showLogin(); }
  async function shutDown() {
    if (stage === 'desktop') leaveDesktop();
    Sound.close();
    await tube('off');
    screenEl.classList.remove('tube-off');
    show('power');
    Warp.apply();
  }

  // ---------------------------------------------------------------- wallpapers
  //   stars:  visitors (the Helios turning slowly in a starfield)
  //   basic:  Reznov never changed the default
  //   lab:    Gray: the Ichor specimen, live, in 3D
  //   arcade: Winchester: a neon grid racing toward a striped sun
  const wall = (() => {
    const cv = $('#sky'), gcv = $('#wall-gl');
    let theme = 'stars', raf = 0, running = false, last = 0, stars = null, drawn = '', rock = null;
    const dpr = () => Math.min(2, devicePixelRatio || 1);
    function covered() { return Object.values(wins).some(w => !w.el.classList.contains('min') && (isMobile() || w.el.classList.contains('max'))); }
    function starfield(g, w, h, t, top = h) {
      if (!stars) stars = Array.from({ length: Math.round(w * h / 5200) }, () => [Math.random(), Math.random(), 1 + Math.random() * 2.2, Math.random() * 6, Math.random()]);
      for (const [x, y, s, p, c] of stars) {
        if (y * h > top) continue;
        g.globalAlpha = 0.45 + 0.4 * Math.sin(t * 1.8 + p); g.fillStyle = c < 0.85 ? '#fff8e8' : COL.cyan; g.fillRect(x * w, y * h, s, s);
      }
      g.globalAlpha = 1;
    }
    function drawStars(g, w, h, t) {
      g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
      starfield(g, w, h, t);
      const ss = t % 8;
      if (ss > 3 && ss < 3.6) { const q = (ss - 3) / 0.6, x = w * (0.9 - 0.5 * q), y = h * (0.1 + 0.15 * q); g.strokeStyle = '#fff8e8'; g.lineWidth = 2; g.globalAlpha = 1 - q; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 60, y - 19); g.stroke(); g.globalAlpha = 1; }
      const mob = isMobile(), k = mob ? w * 0.86 / 27.5 : Math.min(w * 0.46, h * 1.1) / 27.5;
      SF.heliosWire(g, t, mob ? w / 2 : w * 0.6, mob ? h * 0.66 : h * 0.44, k, 0.55, 0.25, mob ? 1 : 1.3);
    }
    function drawBasic(g, w, h) { g.fillStyle = '#0b7471'; g.fillRect(0, 0, w, h); }
    function drawArcade(g, w, h, t) {
      const hz = Math.round(h * (isMobile() ? 0.56 : 0.6));
      let gr = g.createLinearGradient(0, 0, 0, hz);
      gr.addColorStop(0, '#05021a'); gr.addColorStop(0.55, '#2a0a52'); gr.addColorStop(1, '#a3127a');
      g.fillStyle = gr; g.fillRect(0, 0, w, hz);
      starfield(g, w, h, t, hz * 0.7);
      // the sun, with stripes cut through its lower half
      const sr = Math.min(w, h) * 0.2, sx = isMobile() ? w / 2 : w * 0.62, sy = hz - sr * 0.3;
      const glow = g.createRadialGradient(sx, sy, sr * 0.6, sx, sy, sr * 2.2);
      glow.addColorStop(0, 'rgba(255,116,18,0.35)'); glow.addColorStop(1, 'rgba(255,43,214,0)');
      g.fillStyle = glow; g.fillRect(0, 0, w, hz);
      g.save(); g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.clip();
      gr = g.createLinearGradient(0, sy - sr, 0, sy + sr);
      gr.addColorStop(0, '#ffe66b'); gr.addColorStop(0.5, '#ff7412'); gr.addColorStop(1, '#ff2bd6');
      g.fillStyle = gr; g.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
      g.fillStyle = '#7a0e6a';
      for (let i = 0; i < 7; i++) g.fillRect(sx - sr, sy + sr * (0.08 + i * 0.13) - ((t * 6) % (sr * 0.13)), sr * 2, sr * (0.02 + i * 0.011));
      g.restore();
      // the floor
      g.fillStyle = '#08021c'; g.fillRect(0, hz, w, h - hz);
      g.strokeStyle = COL.cyan; g.globalAlpha = 0.8; g.lineWidth = 2; g.beginPath(); g.moveTo(0, hz); g.lineTo(w, hz); g.stroke();
      const path = new Path2D(), phase = (t * 0.9) % 1;
      for (let k = 1; k < 30; k++) { const z = k - phase; if (z <= 0.2) continue; const y = hz + (h - hz) * 0.9 / z; if (y > h + 4) continue; path.moveTo(0, y); path.lineTo(w, y); }
      for (let i = -24; i <= 24; i++) { path.moveTo(w / 2 + i * w * 0.012, hz); path.lineTo(w / 2 + i * w * 0.12, h); }
      g.strokeStyle = COL.magenta; g.globalAlpha = 0.25; g.lineWidth = 6; g.stroke(path);
      g.globalAlpha = 0.9; g.lineWidth = 1.6; g.stroke(path); g.globalAlpha = 1;
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (document.hidden || now - last < 33) return; last = now;
      const d = dpr(), w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return;
      if (cv.width !== Math.round(w * d) || cv.height !== Math.round(h * d)) { cv.width = Math.round(w * d); cv.height = Math.round(h * d); stars = null; drawn = ''; }
      const g = cv.getContext('2d'), t = now / 1000;
      g.setTransform(d, 0, 0, d, 0, 0);
      if (theme === 'basic') { if (drawn !== w + 'x' + h) { drawBasic(g, w, h); drawn = w + 'x' + h; } return; }
      if (theme === 'arcade') drawArcade(g, w, h, t); else drawStars(g, w, h, t);
    }
    const api = {
      set(th) {
        this.stop(); theme = th; drawn = '';
        if (th === 'lab' && !rock && window.Ichor) rock = Ichor.create(gcv, { fps: 30, scale: 0.75, maxDpr: 1.25, dist: 5.6,
          onFail: () => { rock = null; api.set('stars'); api.start(); } });
        if (th === 'lab' && !rock) theme = 'stars';        // no WebGL: fall back to the starfield
        cv.hidden = theme === 'lab'; gcv.hidden = theme !== 'lab';
        this.layout();
      },
      layout() { if (rock) rock.offset = isMobile() ? [0, -0.7] : [1.35, 0.1]; },
      start() {
        if (running || stage !== 'desktop') return; running = true;
        if (theme === 'lab') rock.start(); else raf = requestAnimationFrame(frame);
      },
      stop() { running = false; cancelAnimationFrame(raf); if (rock) rock.stop(); },
      check() { if (stage !== 'desktop') return; covered() ? this.stop() : this.start(); },
    };
    return api;
  })();

  // ---------------------------------------------------------------- links from config.js
  function linkFor(key) {
    const v = (C[key] || '').trim();
    if (!v) return '';
    return key === 'contactEmail' ? 'mailto:' + v : v;
  }
  function applyLinks(root = document) {
    $$('[data-link]', root).forEach(a => {
      const url = linkFor(a.dataset.link);
      a.classList.toggle('pending-link', !url);
      const st = $('.fund-state', a);
      if (url) { a.href = url; if (!url.startsWith('mailto:')) { a.target = '_blank'; a.rel = 'noopener'; } if (st) st.textContent = 'Donate now ▶'; }
      else { a.href = '#'; a.removeAttribute('target'); if (st) st.textContent = 'Launching soon'; }
    });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a.pending-link, a[href="#"]');
    if (a) { e.preventDefault(); Sound.error(); toast('That link is coming soon. Check back after launch.'); return; }
    const o = e.target.closest('[data-open]');
    if (o) { const [id, sub] = o.dataset.open.split('/'); Sound.click(); openApp(id, sub); }
  });

  // ---------------------------------------------------------------- toast
  let toastT = 0;
  function toast(msg, ms = 2800) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
  }

  // ---------------------------------------------------------------- deep links: #archive, #archive/midnight, #dossier ...
  function setHash(id, sub) {
    const h = id && id !== 'welcome' ? '#' + id + (sub ? '/' + sub : '') : '';
    if (location.hash !== h) history.replaceState(null, '', h || location.pathname + location.search);
  }
  function parseHash() { const [id, sub] = location.hash.slice(1).split('/'); return APPS[id] ? { id, sub } : null; }
  // straight in as a visitor, no boot: for links shared on Instagram and the "skip the intro" row
  function quickLogon(app) {
    pendingApp = app;
    if (stage === 'bios' || stage === 'splash') { boot.skip = true; if (boot.wake) boot.wake(); }
    dialRun++;
    user = visitor('Visitor');
    tube('on');
    enterDesktop(true);
  }
  addEventListener('hashchange', () => { const a = parseHash(); if (a) openApp(a.id, a.sub); });
  Warp.apply();
  const first = parseHash();
  if (first) quickLogon(first);

  window.OS = {
    openApp, closeApp, toast, Sound, icon, paintIcons, applyLinks, setHash, store, isMobile, APPS,
    get user() { return user; }, get account() { return user; }, get focused() { return focused; },
  };
})();
