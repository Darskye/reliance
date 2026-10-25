// emblem.js — the ISEA emblem at any size, with each part able to build in (0 = hidden, 1 = done).
//   Emblem.draw(g, cx, cy, scale, { rings, blue, moon, stars, word, arc })
// Same geometry and colours as the logo ident (spots/ident/scene.js), drawn in one go.
(function () {
  const { COL, star4, clamp, backOut, expoOut } = Kit;
  const R = 340, RB = 425, FS = 262;
  const ARC = 'INTERNATIONAL SPACE EXPLORATION AGENCY';

  function draw(g, cx, cy, s, p = {}) {
    const P = Object.assign({ rings: 1, blue: 1, moon: 1, stars: 1, word: 1, arc: 1 }, p);
    g.save(); g.translate(cx, cy); g.scale(s, s);

    // cream ring lines, drawn from the bottom round both sides
    [RB, RB - 10, R + 4].forEach((r, i) => {
      const q = clamp(P.rings * 1.25 - i * 0.12);
      if (q <= 0) return;
      g.strokeStyle = COL.cream; g.lineWidth = i === 2 ? 4 : 5;
      g.beginPath(); g.arc(0, 0, r, Math.PI / 2 - q * Math.PI, Math.PI / 2 + q * Math.PI); g.stroke();
    });

    // blue field, grey moon, stars (all inside the disc)
    if (P.blue > 0) {
      g.save(); g.beginPath(); g.arc(0, 0, R, 0, 7); g.clip();
      g.fillStyle = COL.blue; g.fillRect(-R - (1 - expoOut(P.blue)) * 2.2 * R, -R, 2 * R, 2 * R);
      if (P.moon > 0) {
        const q = expoOut(P.moon);
        g.fillStyle = COL.moon; g.beginPath(); g.arc(0.33 * R + (1 - q) * 560, -0.24 * R - (1 - q) * 330, 0.78 * R, 0, 7); g.fill();
      }
      if (P.stars > 0) {
        const q = backOut(clamp(P.stars)), xs = [-0.22 * R, 0.38 * R];
        g.fillStyle = COL.gold; for (const x of xs) { star4(g, x + 0.18 * R, 0, 0.36 * R * Math.min(1, q * 1.3), 0.8 * R * q); g.fill(); }
        g.fillStyle = COL.white; for (const x of xs) { star4(g, x, 0, 0.36 * R * Math.min(1, q * 1.3), 0.8 * R * q); g.fill(); }
      }
      g.restore();
    }

    // red ISEA letters pop in one after another
    if (P.word > 0) {
      g.font = `900 ${FS}px Orb`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      const sp = 12, ws = [...'ISEA'].map(ch => g.measureText(ch).width);
      let x = -(ws.reduce((a, b) => a + b) + sp * 3) / 2;
      [...'ISEA'].forEach((ch, i) => {
        const q = clamp(P.word * 4 - i), lx = x + ws[i] / 2; x += ws[i] + sp;
        if (q <= 0) return;
        const k = backOut(q);
        g.save(); g.translate(lx, -4); g.scale(k, k);
        g.strokeStyle = '#000'; g.lineWidth = 16; g.strokeText(ch, 0, 0);
        g.fillStyle = COL.red; g.fillText(ch, 0, 0);
        if (q < 1) { g.globalAlpha = 1 - q; g.fillStyle = '#fff4d6'; g.fillText(ch, 0, 0); }
        g.restore();
      });
    }

    // "INTERNATIONAL SPACE EXPLORATION AGENCY" around the lower arc
    if (P.arc > 0) {
      const n = Math.ceil(clamp(P.arc) * ARC.length), rm = (R + 4 + RB - 10) / 2;
      g.font = '33px Audio'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = COL.cream;
      const ws = [...ARC].map(ch => g.measureText(ch).width), span = 2.3;
      const extra = (span * rm - ws.reduce((a, b) => a + b)) / (ARC.length - 1);
      let ang = Math.PI / 2 + span / 2;
      for (let i = 0; i < ARC.length; i++) {
        const da = (ws[i] / 2) / rm; ang -= da;
        if (i < n) {
          g.save(); g.translate(Math.cos(ang) * rm, Math.sin(ang) * rm); g.rotate(ang - Math.PI / 2);
          g.fillText(ARC[i], 0, 0); g.restore();
        }
        ang -= da + extra / rm;
      }
    }
    g.restore();
  }

  window.Emblem = { draw, R, RB };
})();
