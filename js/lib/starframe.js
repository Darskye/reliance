// starframe.js — STARFRAME 95, the ISEA workstation OS look, shared by the spots that use it:
// fonts, colours, Win95-style bevels with soft corners, windows, fields, buttons, 16x16 pixel icons,
// the striped-star logo, the wordmark, the mouse arrow, and the curved-tube CRT settings.
(function () {
  const { clamp, prog, easeOut, expoOut, backOut, COL, star4 } = Kit;
  const PIX = (s, b = 400) => `${b} ${s}px Pix`;          // Pixelify Sans: UI text
  const TERM = s => `${s}px Term`;                        // VT323: BIOS + terminal
  const ORB = s => `900 ${s}px Orb`;
  const WIDE = s => `${s}px Audio`;
  const JP = s => `${s}px "Yu Gothic", "MS Gothic", "Meiryo", sans-serif`;

  // STARFRAME colours: the ISEA palette on warm cream plastic
  const UI = {
    face: '#eadcb6', light: '#fff8e8', shadow: '#9b8a60', dark: '#2a2414', text: '#1b160c',
    title: '#1828f2', title2: '#2f6bff', titleText: '#fff4d6', select: '#1828f2', field: '#fffaf0',
    green: '#24ff4c', termGreen: '#3dff6a', dim: '#7c7258',
  };
  const sstep = (a, b, x) => { const q = clamp((x - a) / (b - a)); return q * q * (3 - 2 * q); };
  const keyTime = (i, a, b, n) => a + (b - a) * (i + 0.3 * Math.sin(i * 2.7 + 1.3)) / n;
  const typedCount = (t, a, b, n) => { let k = 0; while (k < n && t >= keyTime(k, a, b, n)) k++; return k; };

  // ---------------------------------------------------------------- drawing helpers
  function text(g, s, x, y, font, col, align = 'left', base = 'middle') {
    g.font = font; g.fillStyle = col; g.textAlign = align; g.textBaseline = base; g.fillText(s, x, y);
  }
  // a Windows-95 style bevel, with softly rounded corners: light top-left, dark bottom-right
  function bevel(g, x, y, w, h, r = 8, sunken = false, face = UI.face) {
    const [hi, lo] = sunken ? [UI.shadow, UI.light] : [UI.light, UI.shadow];
    g.fillStyle = sunken ? UI.light : UI.dark; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill();
    g.fillStyle = lo; g.beginPath(); g.roundRect(x, y, w - 2, h - 2, r); g.fill();
    g.fillStyle = hi; g.beginPath(); g.roundRect(x, y, w - 5, h - 5, r); g.fill();
    g.fillStyle = face; g.beginPath(); g.roundRect(x + 3, y + 3, w - 8, h - 8, Math.max(2, r - 3)); g.fill();
  }
  function button(g, x, y, w, h, label, pressed = false, isDefault = false) {
    if (isDefault) { g.fillStyle = UI.dark; g.beginPath(); g.roundRect(x - 3, y - 3, w + 6, h + 6, 10); g.fill(); }
    bevel(g, x, y, w, h, 8, pressed);
    text(g, label, x + w / 2 + (pressed ? 2 : 0), y + h / 2 + (pressed ? 2 : 0), PIX(30, 500), UI.text, 'center');
  }
  // a window with a rounded frame, blue title bar, our stripe motif and close box
  function windowFrame(g, x, y, w, h, title, o = {}) {
    const tb = o.tb || 56;
    g.save();
    g.fillStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); g.roundRect(x + 10, y + 12, w, h, 14); g.fill();   // drop shadow
    bevel(g, x, y, w, h, 14, false, o.face || UI.face);
    const grad = g.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, o.titleCol || UI.title); grad.addColorStop(1, o.titleCol2 || UI.title2);
    g.fillStyle = grad; g.beginPath(); g.roundRect(x + 7, y + 7, w - 16, tb, [10, 10, 4, 4]); g.fill();
    if (o.icon) drawIcon(g, o.icon, x + 16, y + 7 + (tb - 40) / 2, 2.5);
    text(g, title, x + (o.icon ? 64 : 22), y + 7 + tb / 2 + 1, PIX(30, 700), o.titleTextCol || UI.titleText);
    // our slanted colour stripes, then minimise / maximise / close
    const bx = x + w - 16 - 3 * 50;
    [COL.red, COL.gold, COL.cream, COL.cyan].forEach((c, i) => {
      g.fillStyle = c; const sx = bx - 120 + i * 26;
      g.beginPath(); g.moveTo(sx + 12, y + 17); g.lineTo(sx + 26, y + 17); g.lineTo(sx + 14, y + tb - 3); g.lineTo(sx, y + tb - 3); g.closePath(); g.fill();
    });
    ['_', '□', '×'].forEach((s, i) => {
      const cx = bx + i * 50;
      bevel(g, cx, y + 14, 42, tb - 14, 6, false, i === 2 ? '#ff5a3a' : UI.face);
      text(g, s, cx + 19, y + 14 + (tb - 14) / 2, PIX(i === 2 ? 34 : 28, 700), UI.text, 'center');
    });
    g.restore();
    return { x: x + 8, y: y + 7 + tb + 6, w: w - 18, h: h - tb - 22 };     // the client area
  }
  function field(g, x, y, w, h, s, caret, t) {
    bevel(g, x, y, w, h, 6, true, UI.field);
    g.save(); g.beginPath(); g.rect(x + 6, y + 4, w - 12, h - 8); g.clip();
    text(g, s, x + 14, y + h / 2 + 1, PIX(32), UI.text);
    if (caret && Math.floor(t * 2.2) % 2 === 0) {
      g.font = PIX(32); const cw = g.measureText(s).width;
      g.fillStyle = UI.text; g.fillRect(x + 16 + cw, y + 9, 3, h - 18);
    }
    g.restore();
  }

  // ---------------------------------------------------------------- pixel icons (16 x 16)
  const PAL = { k: '#120e08', w: '#fff8e8', c: '#eadcb6', d: '#9b8a60', b: '#1828f2', B: '#6a8cff', t: '#18e4ff', r: '#ff1a0a',
    g: '#ffc21a', G: '#24ff4c', D: '#0a5a1c', o: '#ff7412', m: '#b9b4c6', n: '#0a1040', s: '#5a5040' };
  const ICONS = {
    station: [
      '................', '.kkkkkkkkkkkkkk.', '.kccccccccccccdk', '.kckkkkkkkkkkcdk', '.kcknnnnnnnnkcdk', '.kcknBttnnnnkcdk',
      '.kckntnnnnnnkcdk', '.kcknnnnnnnnkcdk', '.kckkkkkkkkkkcdk', '.kccccccccrgccdk', '.kddddddddddddk.', '......kddk......',
      '...kkkkkkkkkk...', '..kccccccccccdk.', '..kdddddddddddk.', '................'],
    folder: [
      '................', '................', '..kkkkk.........', '.kgggggk........', '.kgggggkkkkkkkk.', '.kggggggggggggk.',
      '.kgkkkkkkkkkkkk.', '.kgkgggggggggggk', '.kgkgggggggggggk', '.kkgggggggggggk.', '.kkgggggggggggk.', '.kgggggggggggok.',
      '.kooooooooooook.', '.kkkkkkkkkkkkkk.', '................', '................'],
    globe: [
      '................', '.....kkkkkk.....', '...kkbbtGbbkk...', '..kbbtGGGbbbbk..', '.kbbbtGGbbbtbbk.', '.kbbbbGbbbtGGbk.',
      'kbbbbbbbbbGGGbbk', 'kbtbbbbbbbbGbbbk', 'kbGGtbbbbbbbbbbk', 'kbbGGGbbbbbbtbbk', '.kbbGGbbbbbtGbk.', '.kbbbGbbbbbGbbk.',
      '..kbbbbbbbbbbk..', '...kkbbbbbbkk...', '.....kkkkkk.....', '................'],
    modem: [
      '................', '................', '....kk....kk....', '....kd....kd....', '...kkkkkkkkkk...', '..kccccccccccdk.',
      '.kcwwwwwwwwwwcdk', '.kcGGkrrkggkccdk', '.kcGGkrrkggkccdk', '.kcccccccccccdk.', '.kddddddddddddk.', '..kkkkkkkkkkkk..',
      '.....kk..kk.....', '................', '................', '................'],
    bin: [
      '................', '.....kkkkkk.....', '...kkddddddkk...', '..kkkkkkkkkkkk..', '...kcccccccck...', '...kcdcdcdcdk...',
      '...kcdcdcdcdk...', '...kcdcdcdcdk...', '...kcdcdcdcdk...', '...kcdcdcdcdk...', '...kcdcdcdcdk...', '...kcdcdcdcdk...',
      '....kcccccck....', '....kkkkkkkk....', '................', '................'],
    talos: [
      'kkkkkkkkkkkkkkkk', 'kDDDDDDDDDDDDDDk', 'kDDDDGGGGGGDDDDk', 'kDDDGkkkkkkGDDDk', 'kDDGkkkkkkkkGDDk', 'kDDGkGGkkGGkGDDk',
      'kDDGkGGkkGGkGDDk', 'kDDGkkkkkkkkGDDk', 'kDDGkkkGGkkkGDDk', 'kDDGkkkkkkkkGDDk', 'kDDDGkGGGGkGDDDk', 'kDDDDGkkkkGDDDDk',
      'kDDDDDGGGGDDDDDk', 'kDDDDDDDDDDDDDDk', 'kDGDGDGDGDGDGDGk', 'kkkkkkkkkkkkkkkk'],
    doc: [
      '................', '...kkkkkkkk.....', '...kwwwwwwkk....', '...kwkkkkwwkk...', '...kwwwwwwwwk...', '...kwkkkkkkwk...',
      '...kwwwwwwwwk...', '...kwkkkkkkwk...', '...kwwwwwwwwk...', '...kwkkkkkwwk...', '...kwwwwwwwwk...', '...kwbbbbbwwk...',
      '...kwwwwwwwwk...', '...kkkkkkkkkk...', '................', '................'],
    star: [
      '................', '.......kk.......', '.......kk.......', '......krgk......', '......krgk......', '.....krrggk.....',
      '..kkkkrrggkkkk..', 'kkbbbbbrgttttttk', 'kkbbbbbbtttttttk', '..kkkkbbttkkkk..', '.....kbbttk.....', '......kbtk......',
      '......kbtk......', '.......kk.......', '.......kk.......', '................'],
  };
  const iconCache = {};
  function drawIcon(g, name, x, y, s) {
    if (!iconCache[name]) {
      const c = document.createElement('canvas'); c.width = 16; c.height = 16; const cx = c.getContext('2d');
      ICONS[name].forEach((row, j) => [...row].forEach((ch, i) => { if (PAL[ch]) { cx.fillStyle = PAL[ch]; cx.fillRect(i, j, 1, 1); } }));
      iconCache[name] = c;
    }
    g.save(); g.imageSmoothingEnabled = false; g.drawImage(iconCache[name], x, y, 16 * s, 16 * s); g.restore();
  }

  // ---------------------------------------------------------------- the STARFRAME logo
  // four-point star in four colours, each quarter built from horizontal stripes (like an 80s logo)
  function starLogo(g, cx, cy, size, t, reveal = 1) {
    const cols = [COL.red, COL.cyan, '#2f5bff', COL.gold];
    for (let q = 0; q < 4; q++) {
      const sx = q % 2 ? 1 : -1, sy = q < 2 ? -1 : 1;
      g.save();
      g.beginPath(); star4(g, cx, cy, size * 0.62, size, 0.12); g.clip();
      g.beginPath(); g.rect(sx > 0 ? cx + size * 0.04 : cx - size, sy > 0 ? cy + size * 0.04 : cy - size, size * 0.96, size * 0.96); g.clip();
      g.fillStyle = cols[q];
      const n = 15, step = size / n;
      for (let i = 0; i < n * 2; i++) {
        const yy = cy - size + i * step, d = Math.abs(yy - cy) / size;
        if (prog(reveal, d * 0.6, d * 0.6 + 0.4) <= 0) continue;
        g.fillRect(cx - size, yy, size * 2 * prog(reveal, d * 0.6, d * 0.6 + 0.4), step * 0.62);
      }
      g.restore();
    }
  }
  // wordmark with the bottom half sliced into speed stripes
  function wordmark(g, x, y, size, col, t, align = 'center', maxW = 0) {
    if (maxW) { g.font = WIDE(size); const full = g.measureText('STARFRAME').width + size * 1.32; if (full > maxW) size *= maxW / full; }
    if (align === 'right') { g.font = WIDE(size); x -= size * 1.32; }
    g.save();
    g.font = WIDE(size); g.textAlign = align; g.textBaseline = 'alphabetic';
    const w = g.measureText('STARFRAME').width, x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    const grad = g.createLinearGradient(0, y - size * 0.8, 0, y);
    grad.addColorStop(0, col[0]); grad.addColorStop(1, col[1]);
    g.fillStyle = grad;
    g.beginPath(); g.rect(x0 - 10, y - size, w + 20, size * 0.55);
    for (let k = 0; k < 5; k++) g.rect(x0 - 10, y - size * 0.45 + k * size * 0.1, w + 20, size * 0.06);
    g.clip();
    g.fillText('STARFRAME', x, y);
    g.restore();
    g.font = WIDE(size * 0.95); g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.fillStyle = COL.red; g.fillText('95', x0 + w + size * 0.12, y);
    return { x0, w };
  }


  function arrow(g, ox, oy) {
    g.beginPath();
    [[0, 0], [0, 44], [11, 34], [19, 52], [27, 48], [19, 31], [33, 31]].forEach(([x, y], i) => i ? g.lineTo(x + ox, y + oy) : g.moveTo(x + ox, y + oy));
    g.closePath(); g.fill();
  }

  // the CRT for STARFRAME films: a tall, rounded, bulging tube with a little less glow so the cream UI
  // doesn't blow out. screen = [x0, y0, x1, y1] of the glass in the video frame
  const tubeLook = (screen, extra = {}) => Object.assign({ tube: 1, rect: screen, curve: 0.2, corner: 0.075, vignette: 0.55,
    glare: 0.06, glass: 1.0, glow: 0.34, veil: 0.05, exposure: 0.92, mask: 0.36, conv: 0.9 }, extra);

  // the Helios as a turning, colour-coded wireframe (needs spots/ship/ship_lines.js loaded)
  const SYSCOL = [COL.cyan, '#3d6cff', COL.orange, COL.green, COL.magenta, COL.gold, COL.red];
  let SHIPPTS = null;
  function heliosWire(g, t, cx, cy, k, alpha = 1, spin = 0.25, width = 1.6) {
    if (!window.SHIP) return;
    if (!SHIPPTS) SHIPPTS = window.SHIP.pts.map(a => a.map(v => v / 100));
    const az = t * spin, el = 0.42, ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
    const paths = {};
    SHIPPTS.forEach((P, i) => {
      let px = 0, py = 0;
      for (let j = 0; j < P.length / 3; j++) {
        const x = P[j * 3], y = P[j * 3 + 1], z = P[j * 3 + 2], x1 = x * ca - y * sa, y1 = x * sa + y * ca;
        const sx = cx + x1 * k, sy = cy - (z * ce + y1 * se) * k;
        if (j) { const s = window.SHIP.sys[i][j]; (paths[s] || (paths[s] = new Path2D())).moveTo(px, py); paths[s].lineTo(sx, sy); }
        px = sx; py = sy;
      }
    });
    g.save(); g.lineWidth = width; g.globalAlpha *= alpha;
    for (const s in paths) { g.strokeStyle = SYSCOL[s]; g.stroke(paths[s]); }
    g.restore();
  }

  // the cast credit card: the ISEA emblem in a glass orb, "ACTOR / as / CHARACTER / role", colour bars
  function castCredit(g, t, t0, lines, W, actor, character, role) {
    const { clamp, prog, easeOut, backOut, COL } = Kit;
    const [l0, l1, l2, l3] = lines;
    const oq = backOut(prog(t, t0, t0 + 0.6)), ox = W / 2, oy = 420, r = 150 * oq;
    if (r > 1) {
      const gl = g.createRadialGradient(ox - r * 0.3, oy - r * 0.35, r * 0.1, ox, oy, r);
      gl.addColorStop(0, 'rgba(120,150,255,0.35)'); gl.addColorStop(1, 'rgba(10,16,64,0.9)');
      g.fillStyle = gl; g.beginPath(); g.arc(ox, oy, r, 0, 7); g.fill();
      Emblem.draw(g, ox + Math.sin(t * 0.8) * 6, oy, 0.27 * oq, {});
      g.strokeStyle = '#fff4d6'; g.lineWidth = 4; g.beginPath(); g.arc(ox, oy, r, 0, 7); g.stroke();
      g.globalAlpha = 0.6; g.lineWidth = 6; g.beginPath(); g.arc(ox, oy, r * 0.86, Math.PI * 1.1, Math.PI * 1.45); g.stroke(); g.globalAlpha = 1;
    }
    const fit = (s, font, max, maxW) => { g.font = font(max); const w = g.measureText(s).width; return w > maxW ? Math.floor(max * maxW / w) : max; };
    if (t >= l0) {
      const q = easeOut(prog(t, l0, l0 + 0.5)), fs = fit(actor, ORB, 92, W - 120);
      g.save(); g.globalAlpha = q; text(g, actor, W / 2, 730 + (1 - q) * 30, ORB(fs), COL.cream, 'center'); g.restore();
    }
    if (t >= l1) { g.save(); g.globalAlpha = prog(t, l1, l1 + 0.4); g.font = 'italic 500 44px Pix'; g.textAlign = 'center'; g.fillStyle = '#9fb4ff'; g.fillText('as', W / 2, 825); g.restore(); }
    if (t >= l2) {
      const n = Math.floor(clamp((t - l2) * 22) * character.length), fs = fit(character, WIDE, 70, W - 120);
      text(g, character.slice(0, n), W / 2, 920, WIDE(fs), COL.gold, 'center');
    }
    if (t >= l3) {
      g.save(); g.globalAlpha = prog(t, l3, l3 + 0.5); text(g, role, W / 2, 1010, PIX(32, 700), '#c9d4ff', 'center'); g.restore();
      const ws = [12, 18, 26, 36, 48, 62, 78, 96], cols = [COL.blue, COL.cream, COL.gold, COL.red];
      let x = W / 2 - 240;
      ws.forEach((w, i) => { const q = easeOut(prog(t, l3 + i * 0.05, l3 + i * 0.05 + 0.3)); if (q > 0) { g.fillStyle = cols[i % 4]; g.globalAlpha = q; g.beginPath(); g.moveTo(x + 16, 1080); g.lineTo(x + 16 + w, 1080); g.lineTo(x + w, 1120); g.lineTo(x, 1120); g.closePath(); g.fill(); } x += w + 12; });
      g.globalAlpha = 1;
    }
  }

  window.Starframe = { PIX, TERM, ORB, WIDE, JP, UI, sstep, keyTime, typedCount, text, bevel, button, windowFrame,
    field, ICONS, PAL, drawIcon, starLogo, wordmark, arrow, tubeLook, heliosWire, castCredit };
})();
