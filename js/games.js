// games.js: Winchester's two games.
//   Debris Field: clear the sector without hitting debris (the Minesweeper that came with STARFRAME).
//   Cube Crunch: steer, eat Cube Meals, get longer, don't hit yourself.
// Both work with a mouse, a keyboard or a touchscreen.
(function () {
  const { COL } = Kit;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const OS = window.OS, S = OS.Sound, H = window.AppHooks;

  // ════════════════════════════════════════════════════════════════ DEBRIS FIELD
  const N = 9, MINES = 10;
  const NUMCOL = ['', '#1828f2', '#0a7a2a', '#ff1a0a', '#0a1460', '#8a1a0a', '#0b7471', '#1b160c', '#7c7258'];
  const mn = { cells: [], over: false, started: false, flags: 0, opened: 0, timer: 0, t: 0, flagMode: false };
  const around = i => {
    const x = i % N, y = Math.floor(i / N), out = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if ((dx || dy) && x + dx >= 0 && x + dx < N && y + dy >= 0 && y + dy < N) out.push((y + dy) * N + x + dx);
    }
    return out;
  };
  function mnNew() {
    clearInterval(mn.timer);
    Object.assign(mn, { cells: Array.from({ length: N * N }, () => ({ mine: false, open: false, flag: false, n: 0 })), over: false, started: false, flags: 0, opened: 0, t: 0 });
    $('#mn-face').textContent = '(^_^)'; $('#mn-time').textContent = '000'; $('#mn-msg').textContent = 'Clear the sector. Numbers count the debris next to a square.';
    $('#mn-msg').className = 'mn-msg';
    mnDraw();
  }
  function mnPlant(safe) {                 // the first square you open is never debris
    const banned = new Set([safe, ...around(safe)]);
    let k = 0;
    while (k < MINES) { const i = Math.floor(Math.random() * N * N); if (!banned.has(i) && !mn.cells[i].mine) { mn.cells[i].mine = true; k++; } }
    mn.cells.forEach((c, i) => (c.n = around(i).filter(j => mn.cells[j].mine).length));
    mn.started = true;
    mn.timer = setInterval(() => { mn.t = Math.min(999, mn.t + 1); $('#mn-time').textContent = String(mn.t).padStart(3, '0'); }, 1000);
  }
  function mnOpen(i) {
    const c = mn.cells[i]; if (c.open || c.flag || mn.over) return;
    if (!mn.started) mnPlant(i);
    if (c.mine) return mnLose(i);
    const stack = [i];
    while (stack.length) {                // open a whole empty patch at once
      const j = stack.pop(), cc = mn.cells[j];
      if (cc.open || cc.flag) continue;
      cc.open = true; mn.opened++;
      if (!cc.n) around(j).forEach(k => { if (!mn.cells[k].open && !mn.cells[k].mine) stack.push(k); });
    }
    S.click();
    if (mn.opened === N * N - MINES) mnWin();
  }
  function mnChord(i) {                    // tapping a number whose debris is all flagged opens the rest
    const c = mn.cells[i]; if (!c.open || !c.n) return;
    const nb = around(i);
    if (nb.filter(j => mn.cells[j].flag).length === c.n) nb.forEach(j => { if (!mn.cells[j].flag && !mn.cells[j].open) mnOpen(j); });
  }
  function mnFlag(i) {
    const c = mn.cells[i]; if (c.open || mn.over) return;
    c.flag = !c.flag; mn.flags += c.flag ? 1 : -1; S.blip(c.flag ? 1500 : 900); mnDraw();
  }
  function mnLose(i) {
    mn.over = true; clearInterval(mn.timer);
    mn.cells.forEach(c => { if (c.mine) c.open = true; }); mn.cells[i].boom = true;
    $('#mn-face').textContent = '(x_x)'; $('#mn-msg').textContent = 'HULL BREACH. Tap the face to try again.'; $('#mn-msg').className = 'mn-msg bad';
    S.error(); mnDraw();
  }
  function mnWin() {
    mn.over = true; clearInterval(mn.timer);
    mn.cells.forEach(c => { if (c.mine) c.flag = true; }); mn.flags = MINES;
    const best = OS.store.get('mines_best', 999);
    if (mn.t < best) OS.store.set('mines_best', mn.t);
    $('#mn-face').textContent = 'B-)'; $('#mn-msg').textContent = `SECTOR CLEAR in ${mn.t} s.` + (mn.t < best ? ' New record!' : ` Record: ${best} s.`); $('#mn-msg').className = 'mn-msg good';
    S.ding(); mnDraw();
  }
  function mnDraw() {
    $('#mn-left').textContent = String(Math.max(0, MINES - mn.flags)).padStart(3, '0');
    $$('#mn-grid button').forEach((b, i) => {
      const c = mn.cells[i];
      b.className = 'mn-cell' + (c.open ? ' open' : '') + (c.boom ? ' boom' : '');
      b.style.color = c.open && !c.mine ? NUMCOL[c.n] : '';
      b.innerHTML = c.open ? (c.mine ? `<img src="${OS.icon('rock')}" alt="debris">` : (c.n || '')) : (c.flag ? `<img src="${OS.icon('flag')}" alt="flag">` : '');
      b.setAttribute('aria-label', c.open ? (c.mine ? 'debris' : c.n ? c.n + ' nearby' : 'clear') : c.flag ? 'flagged' : 'closed');
    });
  }
  H.mines = {
    init() {
      const grid = $('#mn-grid');
      for (let i = 0; i < N * N; i++) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'mn-cell'; b.setAttribute('role', 'gridcell');
        let press = 0, longed = false;
        b.addEventListener('contextmenu', e => { e.preventDefault(); mnFlag(i); });
        b.addEventListener('pointerdown', e => {
          if (e.button !== 0) return;
          longed = false; if (!mn.over) $('#mn-face').textContent = '(o_o)';
          press = setTimeout(() => { longed = true; mnFlag(i); if (navigator.vibrate) navigator.vibrate(15); }, 420);
        });
        const cancel = () => { clearTimeout(press); if (!mn.over) $('#mn-face').textContent = '(^_^)'; };
        b.addEventListener('pointerup', cancel); b.addEventListener('pointerleave', cancel); b.addEventListener('pointercancel', cancel);
        b.addEventListener('click', () => {
          if (longed) return;
          if (mn.flagMode) mnFlag(i);
          else if (mn.cells[i].open) mnChord(i);
          else mnOpen(i);
          mnDraw();
        });
        grid.appendChild(b);
      }
      $('#mn-face').addEventListener('click', () => { S.click(); mnNew(); });
      $('#mn-flag').addEventListener('click', e => {
        mn.flagMode = !mn.flagMode; S.click();
        e.currentTarget.textContent = 'Flag mode: ' + (mn.flagMode ? 'on' : 'off'); e.currentTarget.setAttribute('aria-pressed', mn.flagMode);
        e.currentTarget.classList.toggle('pressed', mn.flagMode);
      });
      mnNew();
    },
    reset() { clearInterval(mn.timer); if (mn.cells.length) mnNew(); },
    close() { clearInterval(mn.timer); mn.started && !mn.over && mnNew(); },
  };

  // ════════════════════════════════════════════════════════════════ CUBE CRUNCH
  const G = 20;                               // 20 x 20 squares
  const sn = { body: [], dir: [1, 0], next: [1, 0], food: [10, 10], alive: false, score: 0, timer: 0, speed: 140 };
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  let cubeImg = null;
  function snPlace() {
    do { sn.food = [Math.floor(Math.random() * G), Math.floor(Math.random() * G)]; } while (sn.body.some(([x, y]) => x === sn.food[0] && y === sn.food[1]));
  }
  function snStart() {
    Object.assign(sn, { body: [[6, 10], [5, 10], [4, 10]], dir: [1, 0], next: [1, 0], alive: true, score: 0, speed: 140 });
    snPlace(); $('#sn-score').textContent = '0'; $('#sn-start').hidden = true;
    S.click(); snLoop();
  }
  function snLoop() {
    clearTimeout(sn.timer);
    if (!sn.alive) return;
    sn.timer = setTimeout(() => { snStep(); snLoop(); }, sn.speed);
  }
  function snTurn(d) {
    const v = DIRS[d]; if (!v || !sn.alive) return;
    if (v[0] === -sn.dir[0] && v[1] === -sn.dir[1]) return;   // no turning straight back
    sn.next = v;
  }
  function snStep() {
    sn.dir = sn.next;
    const [hx, hy] = sn.body[0], nx = (hx + sn.dir[0] + G) % G, ny = (hy + sn.dir[1] + G) % G;   // edges wrap around
    if (sn.body.some(([x, y], i) => i < sn.body.length - 1 && x === nx && y === ny)) return snDie();
    sn.body.unshift([nx, ny]);
    if (nx === sn.food[0] && ny === sn.food[1]) {
      sn.score++; $('#sn-score').textContent = sn.score; S.blip(900 + sn.score * 30);
      sn.speed = Math.max(65, sn.speed - 4); snPlace();
    } else sn.body.pop();
    snDraw();
  }
  function snDie() {
    sn.alive = false; S.error();
    const best = OS.store.get('snake_best', 0);
    if (sn.score > best) { OS.store.set('snake_best', sn.score); $('#sn-best').textContent = sn.score; }
    const st = $('#sn-start'); st.hidden = false;
    st.innerHTML = `GAME OVER<small>${sn.score} Cube Meal${sn.score === 1 ? '' : 's'}.${sn.score > best ? ' New best!' : ''} Be there and be square!<br>Tap to play again.</small>`;
    snDraw();
  }
  function snDraw() {
    const cv = $('#sn-canvas'), g = cv.getContext('2d'), c = cv.width / G;
    g.fillStyle = '#08021c'; g.fillRect(0, 0, cv.width, cv.height);
    g.strokeStyle = 'rgba(255,43,214,0.12)'; g.lineWidth = 1;
    for (let i = 1; i < G; i++) { g.beginPath(); g.moveTo(i * c, 0); g.lineTo(i * c, cv.height); g.moveTo(0, i * c); g.lineTo(cv.width, i * c); g.stroke(); }
    if (!cubeImg) { cubeImg = new Image(); cubeImg.src = OS.icon('cube'); }
    g.imageSmoothingEnabled = false;
    if (cubeImg.complete) g.drawImage(cubeImg, sn.food[0] * c, sn.food[1] * c, c, c);
    sn.body.forEach(([x, y], i) => {
      g.fillStyle = i === 0 ? COL.gold : i % 2 ? COL.orange : '#ff9a3a';
      g.fillRect(x * c + 1, y * c + 1, c - 2, c - 2);
      if (i === 0) { g.fillStyle = '#1b160c'; const ex = sn.dir[0], ey = sn.dir[1]; g.fillRect(x * c + c / 2 + ex * c / 4 - 2 - ey * 4, y * c + c / 2 + ey * c / 4 - 2 - ex * 4, 4, 4); g.fillRect(x * c + c / 2 + ex * c / 4 - 2 + ey * 4, y * c + c / 2 + ey * c / 4 - 2 + ex * 4, 4, 4); }
    });
  }
  const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
  addEventListener('keydown', e => {
    if (OS.focused !== 'snake' || e.target.closest('input, textarea')) return;
    if (KEYS[e.key]) { e.preventDefault(); if (!sn.alive) snStart(); snTurn(KEYS[e.key]); }
    else if (e.key === ' ' && !sn.alive) { e.preventDefault(); snStart(); }
  });
  H.snake = {
    init(art) {
      $('#sn-best').textContent = OS.store.get('snake_best', 0);
      $('#sn-start').addEventListener('click', snStart);
      $$('.sn-pad [data-dir]', art).forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); if (!sn.alive) snStart(); snTurn(b.dataset.dir); }));
      // swipes on the board
      const cv = $('#sn-canvas'); let sx = 0, sy = 0;
      cv.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
      cv.addEventListener('pointerup', e => {
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
        snTurn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      });
      snDraw();
    },
    open() { snDraw(); },
    hide() { if (sn.alive) { clearTimeout(sn.timer); sn.alive = false; const st = $('#sn-start'); st.hidden = false; st.innerHTML = `PAUSED<small>Score ${sn.score}. Tap to start a new game.</small>`; } },
    close() { H.snake.hide(); },
    reset() { clearTimeout(sn.timer); sn.alive = false; sn.body = []; },
  };
})();
