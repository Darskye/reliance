// kit.js — small drawing helpers shared by the spots: timing curves, typed text,
// Scanimate-style stacked ("extruded") text, motion-blurred streaks and the 1984 palette.
(function () {
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const prog = (t, a, b) => clamp((t - a) / (b - a));          // 0 before a, 1 after b
  const easeOut = x => 1 - Math.pow(1 - x, 3);
  const easeIn = x => x * x * x;
  const expoOut = x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
  const backOut = x => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

  // Flat, saturated 1984 palette (same as the ident). Whites are warm cream.
  const COL = {
    red: '#ff1a0a', blue: '#1828f2', moon: '#a6a2b6', white: '#fff7e0', gold: '#ffc21a',
    orange: '#ff7412', cream: '#ffedb8', cyan: '#18e4ff', green: '#24ff4c', magenta: '#ff2bd6',
  };

  // seeded random numbers, so every render of a frame is identical
  function rng(seed) {
    let s = seed | 0;
    return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // a four-point star with concave sides (the ISEA sparkle shape)
  function star4(g, x, y, w, h, k = 0.14) {
    g.beginPath(); g.moveTo(x, y - h);
    g.quadraticCurveTo(x + w * k, y - h * k, x + w, y);
    g.quadraticCurveTo(x + w * k, y + h * k, x, y + h);
    g.quadraticCurveTo(x - w * k, y + h * k, x - w, y);
    g.quadraticCurveTo(x - w * k, y - h * k, x, y - h);
    g.closePath();
  }

  // largest font size (up to max) at which `text` fits in maxW
  function fit(g, text, font, max, maxW) {
    g.save(); g.font = font(max); const w = g.measureText(text).width; g.restore();
    return w <= maxW ? max : Math.floor(max * maxW / w);
  }

  // Text that types on one character at a time with a block cursor.
  // Character i appears at a + i/len*(b-a). Returns the right edge of the typed text.
  function typed(g, text, x, y, t, a, b, o = {}) {
    if (t < a) return x;
    const q = prog(t, a, b);
    const n = q >= 1 ? text.length : Math.floor(q * text.length) + 1;
    g.save();
    g.font = o.font; g.textBaseline = 'middle'; g.textAlign = 'left';
    const full = g.measureText(text).width;
    const x0 = o.align === 'center' ? x - full / 2 : x;
    const shown = text.slice(0, n);
    g.fillStyle = o.color || COL.cream; g.fillText(shown, x0, y);
    const right = x0 + g.measureText(shown).width;
    const cursor = o.cursor === undefined ? q < 1 : o.cursor;
    if (cursor) { const h = o.cursorH || 56; g.fillStyle = '#ffffff'; g.fillRect(right + 6, y - h / 2, h * 0.55, h); }
    g.restore();
    return right;
  }

  // Scanimate "extruded" text: stacked copies stepping down-right in colour, cream on top.
  // spread 0..1 animates the stack growing out from behind the top layer.
  function extruded(g, text, x, y, o = {}) {
    const layers = o.layers || [COL.red, COL.orange, COL.gold];
    const step = (o.step || 7) * (o.spread === undefined ? 1 : o.spread);
    g.save();
    g.font = o.font; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    for (let i = layers.length; i >= 1; i--) {
      g.fillStyle = layers[i - 1]; g.fillText(text, x + i * step, y + i * step);
    }
    if (o.keyline) { g.strokeStyle = '#000'; g.lineWidth = o.keyline; g.strokeText(text, x, y); }
    g.fillStyle = o.color || COL.cream; g.fillText(text, x, y);
    g.restore();
  }

  // Motion blur: draw `fn(g, tt)` at many moments across one frame's "shutter" on a
  // transparent layer, then put the layer on the canvas. Fast movers become streaks.
  // (each moment is drawn normally on `sample`, then averaged into `layer`)
  let layer = null, lctx = null, sample = null, sctx = null;
  function blurred(g, t, fn, n = 10, shutter = 1 / 30) {
    const w = g.canvas.width, h = g.canvas.height;
    if (!layer || layer.width !== w || layer.height !== h) {
      layer = document.createElement('canvas'); layer.width = w; layer.height = h; lctx = layer.getContext('2d');
      sample = document.createElement('canvas'); sample.width = w; sample.height = h; sctx = sample.getContext('2d');
    }
    lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, w, h);
    lctx.globalCompositeOperation = 'lighter'; lctx.globalAlpha = 1 / n;
    for (let k = 0; k < n; k++) {
      sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, w, h);
      sctx.setTransform(g.getTransform()); sctx.globalAlpha = 1;
      fn(sctx, t - shutter * k / (n - 1));
      lctx.drawImage(sample, 0, 0);
    }
    lctx.globalCompositeOperation = 'source-over'; lctx.globalAlpha = 1;
    const m = g.getTransform(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(layer, 0, 0); g.setTransform(m);
  }

  window.Kit = { clamp, prog, easeOut, easeIn, expoOut, backOut, COL, rng, star4, fit, typed, extruded, blurred };
})();
