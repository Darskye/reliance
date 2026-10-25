// ichor.js: specimen IC-0417, a 3D rock with glowing veins, drawn with plain WebGL (no libraries).
//   const r = Ichor.create(canvas, { interactive, fps, scale, offset: [x, y], dist })
//   r.start() / r.stop() / r.setMode(0 visible | 1 UV | 2 thermal | 3 scan) / r.destroy()
// The rock's shape is made once here in JavaScript (a ball, pushed in and out by noise, with a few
// flat chipped faces). The veins are drawn per pixel on the graphics card from another noise field,
// so they stay sharp at any zoom. The glow is a real bloom: the veins are drawn again on their own,
// blurred twice, and added back on top.
(function () {
  // ---------------------------------------------------------------- noise for the shape
  function hash3(x, y, z) {
    let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1440670441);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function vnoise(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const c = (i, j, k) => hash3(xi + i, yi + j, zi + k), L = (a, b, t) => a + (b - a) * t;
    return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v),
      L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w);
  }
  function fbm(x, y, z, oct = 4) {
    let a = 0.5, s = 0, f = 1;
    for (let i = 0; i < oct; i++) { s += a * vnoise(x * f + i * 17.3, y * f + i * 5.1, z * f + i * 9.7); f *= 2.03; a *= 0.5; }
    return s / 0.9375;
  }

  // ---------------------------------------------------------------- the rock
  let MESH = null;
  function buildMesh() {
    const t = (1 + Math.sqrt(5)) / 2, norm = v => { const l = Math.hypot(...v); return [v[0] / l, v[1] / l, v[2] / l]; };
    let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
    let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let s = 0; s < 5; s++) {                        // subdivide 5 times: 20,480 triangles
      const cache = new Map(), nf = [];
      const mid = (a, b) => {
        const k = a < b ? a * 65536 + b : b * 65536 + a;
        if (!cache.has(k)) { V.push(norm([V[a][0] + V[b][0], V[a][1] + V[b][1], V[a][2] + V[b][2]])); cache.set(k, V.length - 1); }
        return cache.get(k);
      };
      for (const [a, b, c] of F) { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
      F = nf;
    }
    // chipped faces: anything past one of these planes gets pressed nearly flat onto it
    const cuts = [[0.9, 0.35, 0.2, 0.8], [-0.5, 0.8, -0.3, 0.74], [0.1, -0.95, 0.35, 0.7], [-0.75, -0.35, 0.6, 0.86], [0.3, 0.15, -0.95, 0.8], [-0.2, 0.3, 0.95, 0.9]]
      .map(([x, y, z, c]) => [...norm([x, y, z]), c]);
    const P = V.map(d => {
      let r = 1 + (fbm(d[0] * 1.3, d[1] * 1.3, d[2] * 1.3) - 0.5) * 0.6 + (fbm(d[0] * 3.1 + 5, d[1] * 3.1, d[2] * 3.1) - 0.5) * 0.2
        + (vnoise(d[0] * 9, d[1] * 9, d[2] * 9) - 0.5) * 0.035;
      let p = [d[0] * r * 1.28, d[1] * r * 0.86, d[2] * r];
      for (const [nx, ny, nz, c] of cuts) {
        const dist = p[0] * nx + p[1] * ny + p[2] * nz - c;
        if (dist > 0) { p = [p[0] - nx * dist * 0.92, p[1] - ny * dist * 0.92, p[2] - nz * dist * 0.92]; }
      }
      return p;
    });
    let maxR = 0; for (const p of P) maxR = Math.max(maxR, Math.hypot(...p));
    const pos = new Float32Array(P.length * 3), nor = new Float32Array(P.length * 3), idx = new Uint16Array(F.length * 3);
    P.forEach((p, i) => { pos[i * 3] = p[0] / maxR; pos[i * 3 + 1] = p[1] / maxR; pos[i * 3 + 2] = p[2] / maxR; });
    F.forEach(([a, b, c], i) => {
      idx[i * 3] = a; idx[i * 3 + 1] = b; idx[i * 3 + 2] = c;
      const ax = pos[a * 3], ay = pos[a * 3 + 1], az = pos[a * 3 + 2];
      const ux = pos[b * 3] - ax, uy = pos[b * 3 + 1] - ay, uz = pos[b * 3 + 2] - az;
      const vx = pos[c * 3] - ax, vy = pos[c * 3 + 1] - ay, vz = pos[c * 3 + 2] - az;
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const k of [a, b, c]) { nor[k * 3] += nx; nor[k * 3 + 1] += ny; nor[k * 3 + 2] += nz; }
    });
    // floating dust motes around it
    const N = 240, dust = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      const th = Math.random() * Math.PI * 2, ph = Math.acos(Math.random() * 2 - 1), r = 1.35 + Math.random() * 1.3;
      dust.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.7, r * Math.sin(ph) * Math.sin(th), Math.random()], i * 4);
    }
    return { pos, nor, idx, count: idx.length, dust, dustN: N };
  }

  // ---------------------------------------------------------------- shaders
  const PREC = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
  const NOISE = `
    float hash(vec3 p) { p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float vnoise(vec3 x) {
      vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
                 mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
    }
    float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vnoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; } return s / 0.9375; }`;
  const ROCK_VS = `
    attribute vec3 aPos; attribute vec3 aNor;
    uniform mat4 uProj, uView, uModel; uniform mat3 uNMat;
    varying vec3 vObj, vNor, vViewPos;
    void main() { vObj = aPos; vNor = uNMat * aNor; vec4 vp = uView * uModel * vec4(aPos, 1.0); vViewPos = vp.xyz; gl_Position = uProj * vp; }`;
  const ROCK_FS = `
    uniform float uTime, uMode, uScan;
    varying vec3 vObj, vNor, vViewPos;
    ${NOISE}
    void main() {
      vec3 p = vObj * 1.15;
      vec3 q = p + 0.4 * vec3(fbm(p * 1.1), fbm(p * 1.1 + vec3(5.2, 1.3, 2.8)), fbm(p * 1.1 + vec3(1.7, 9.2, 4.1)));
      float n1 = fbm(q * 1.6), n2 = fbm(q * 3.8 + vec3(3.0));
      float d1 = abs(n1 - 0.5), d2 = abs(n2 - 0.5);
      float line1 = 1.0 - smoothstep(0.004, 0.024, d1);
      float core1 = 1.0 - smoothstep(0.0, 0.008, d1);
      float line2 = 1.0 - smoothstep(0.003, 0.014, d2);
      float halo = 1.0 - smoothstep(0.0, 0.11, d1);
      float flow = 0.6 + 0.4 * sin(uTime * 1.7 - n2 * 30.0 + p.y * 2.5);
      float beat = 0.82 + 0.18 * sin(uTime * 2.639);                       // 0.42 Hz
      vec3 N = normalize(vNor), V = normalize(-vViewPos), L = normalize(vec3(0.55, 0.75, 0.45));
      float diff = max(dot(N, L), 0.0), rim = pow(1.0 - max(dot(N, V), 0.0), 2.5);
      vec3 albedo = mix(vec3(0.07, 0.065, 0.062), vec3(0.2, 0.185, 0.17), fbm(p * 4.5)) * (0.85 + 0.3 * vnoise(p * 14.0));
      float e1 = line1 * flow * beat, e2 = line2 * (0.45 + 0.55 * flow);
      vec3 rock, emis;
      if (uMode < 0.5) {                                                  // visible light: molten gold
        rock = albedo * (0.15 + 1.05 * diff) + vec3(0.25, 0.35, 0.6) * rim * 0.12 + vec3(1.0, 0.5, 0.1) * halo * 0.2 * beat;
        rock += pow(max(dot(N, normalize(L + V)), 0.0), 48.0) * 0.12;
        emis = vec3(1.0, 0.52, 0.07) * e1 * 2.4 + vec3(1.0, 0.95, 0.8) * core1 * flow * 1.4 + vec3(1.0, 0.78, 0.3) * e2 * 0.8;
      } else if (uMode < 1.5) {                                           // ultraviolet: a second network shows up
        float line3 = 1.0 - smoothstep(0.002, 0.01, abs(fbm(q * 8.0 + vec3(7.0)) - 0.5));
        rock = albedo * vec3(0.35, 0.3, 0.6) * (0.08 + 0.4 * diff) + vec3(0.3, 0.2, 0.8) * rim * 0.25;
        emis = vec3(0.1, 0.9, 1.0) * e1 * 2.2 + vec3(0.95, 0.3, 1.0) * e2 * 1.3 + vec3(0.45, 0.6, 1.0) * line3 * 0.7 * flow;
      } else if (uMode < 2.5) {                                           // thermal camera
        float heat = clamp(halo * 0.7 + line1 * 0.6 + 0.25 * fbm(p * 2.0) + 0.1 * flow + 0.12 * diff, 0.0, 1.0);
        vec3 th = mix(vec3(0.02, 0.0, 0.12), vec3(0.55, 0.0, 0.6), clamp(heat / 0.33, 0.0, 1.0));
        th = mix(th, vec3(1.0, 0.35, 0.0), clamp((heat - 0.33) / 0.33, 0.0, 1.0));
        th = mix(th, vec3(1.0, 1.0, 0.7), clamp((heat - 0.66) / 0.34, 0.0, 1.0));
        rock = th * 0.85; emis = th * smoothstep(0.55, 1.0, heat) * 1.1;
      } else {                                                            // scan: a slice sweeps through
        float s = 1.0 - smoothstep(0.0, 0.018, abs(vObj.y - uScan));
        float near = 1.0 - smoothstep(0.0, 0.35, abs(vObj.y - uScan));
        rock = albedo * (0.06 + 0.5 * diff) + vec3(0.1, 1.0, 0.6) * rim * 0.15;
        emis = vec3(0.2, 1.0, 0.6) * s * 2.0 + vec3(1.0, 0.6, 0.1) * e1 * near * 2.6 + vec3(0.2, 1.0, 0.6) * line2 * near * 0.6;
      }
    #ifdef EMIT
      gl_FragColor = vec4(emis, 1.0);
    #else
      gl_FragColor = vec4(rock + emis, 1.0);
    #endif
    }`;
  const DUST_VS = `
    attribute vec4 aDust;
    uniform mat4 uProj, uView; uniform float uTime, uSize;
    varying float vA;
    void main() {
      float a = uTime * (0.05 + 0.08 * fract(aDust.w * 7.3)) + aDust.w * 6.2832, c = cos(a), s = sin(a);
      vec3 p = vec3(aDust.x * c - aDust.z * s, aDust.y + 0.08 * sin(uTime * 0.7 + aDust.w * 20.0), aDust.x * s + aDust.z * c);
      vec4 vp = uView * vec4(p, 1.0);
      gl_Position = uProj * vp;
      gl_PointSize = uSize * (0.5 + fract(aDust.w * 13.1)) / -vp.z;
      vA = (0.3 + 0.7 * fract(aDust.w * 3.7)) * (0.6 + 0.4 * sin(uTime * 2.0 + aDust.w * 40.0));
    }`;
  const DUST_FS = `
    uniform vec3 uCol; varying float vA;
    void main() { vec2 d = gl_PointCoord - 0.5; float a = smoothstep(0.25, 0.0, dot(d, d)); gl_FragColor = vec4(uCol * a * vA, 0.0); }`;
  const QUAD_VS = `attribute vec2 aXY; varying vec2 vUv; void main() { vUv = aXY * 0.5 + 0.5; gl_Position = vec4(aXY, 0.0, 1.0); }`;
  const BLUR_FS = `
    uniform sampler2D uTex; uniform vec2 uDir; varying vec2 vUv;
    void main() {
      vec3 c = texture2D(uTex, vUv).rgb * 0.227027;
      c += (texture2D(uTex, vUv + uDir * 1.3846).rgb + texture2D(uTex, vUv - uDir * 1.3846).rgb) * 0.3162162;
      c += (texture2D(uTex, vUv + uDir * 3.2308).rgb + texture2D(uTex, vUv - uDir * 3.2308).rgb) * 0.0702703;
      gl_FragColor = vec4(c, 1.0);
    }`;
  const COMP_FS = `
    uniform sampler2D uScene, uBloom, uWide; uniform vec2 uRes; uniform float uDpr, uGrid;
    varying vec2 vUv;
    void main() {
      vec4 s = texture2D(uScene, vUv);
      vec3 b = texture2D(uBloom, vUv).rgb * 1.2 + texture2D(uWide, vUv).rgb * 1.1;
      vec2 c = vUv - 0.5; c.x *= uRes.x / uRes.y;
      vec3 bg = mix(vec3(0.02, 0.075, 0.05), vec3(0.003, 0.012, 0.01), smoothstep(0.0, 0.95, length(c)));
      vec2 g = mod(gl_FragCoord.xy, 46.0 * uDpr);
      bg += vec3(0.1, 0.9, 0.5) * (step(g.x, uDpr) + step(g.y, uDpr)) * 0.05 * uGrid;
      vec3 col = bg * (1.0 - s.a) + s.rgb + b;
      gl_FragColor = vec4(1.0 - exp(-col * 1.3), 1.0);
    }`;
  const DUST_COL = [[1.0, 0.7, 0.25], [0.4, 0.9, 1.0], [1.0, 0.45, 0.1], [0.3, 1.0, 0.6]];

  // ---------------------------------------------------------------- small matrix helpers (column-major, like WebGL)
  const M = {
    persp(fy, asp, n, f) { const t = 1 / Math.tan(fy / 2); return [t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]; },
    rot(yaw, pitch) {
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      // Rx(pitch) * Ry(yaw)
      return [cy, sp * sy, -cp * sy, 0, 0, cp, sp, 0, sy, -sp * cy, cp * cy, 0, 0, 0, 0, 1];
    },
    trans(x, y, z) { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]; },
    nmat(m) { return [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]; },
  };

  function create(canvas, opts = {}) {
    const o = Object.assign({ interactive: false, fps: 60, scale: 1, offset: [0, 0], dist: 4.2, grid: 1, maxDpr: 1.5 }, opts);
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, premultipliedAlpha: false, powerPreference: 'high-performance' });
    if (!gl) return null;
    if (!MESH) MESH = buildMesh();

    // shaders compile in the background where the browser allows it (KHR_parallel_shader_compile),
    // so the page doesn't freeze the first time the rock appears; frames are skipped until they're ready
    const parallel = gl.getExtension('KHR_parallel_shader_compile');
    function shader(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    function program(vs, fs, attrs) {
      const p = gl.createProgram();
      gl.attachShader(p, shader(gl.VERTEX_SHADER, vs)); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, PREC + fs));
      attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a));
      gl.linkProgram(p);
      return { p, u: null };
    }
    function finish(prog) {
      if (!gl.getProgramParameter(prog.p, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog.p)); return false; }
      const u = {}, n = gl.getProgramParameter(prog.p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(prog.p, i); u[info.name.replace('[0]', '')] = gl.getUniformLocation(prog.p, info.name); }
      prog.u = u; return true;
    }
    const P = {
      rock: program(ROCK_VS, ROCK_FS, ['aPos', 'aNor']),
      emit: program(ROCK_VS, '#define EMIT\n' + ROCK_FS, ['aPos', 'aNor']),
      dust: program(DUST_VS, DUST_FS, ['aDust']),
      blur: program(QUAD_VS, BLUR_FS, ['aXY']),
      comp: program(QUAD_VS, COMP_FS, ['aXY']),
    };
    let ready = false, failed = false;
    function checkReady() {
      if (ready || failed) return ready;
      if (parallel && !Object.values(P).every(x => gl.getProgramParameter(x.p, parallel.COMPLETION_STATUS_KHR))) return false;
      if (!Object.values(P).every(finish)) { failed = true; if (o.onFail) o.onFail(); return false; }
      return (ready = true);
    }

    const buf = (data, target = gl.ARRAY_BUFFER) => { const b = gl.createBuffer(); gl.bindBuffer(target, b); gl.bufferData(target, data, gl.STATIC_DRAW); return b; };
    const B = { pos: buf(MESH.pos), nor: buf(MESH.nor), idx: buf(MESH.idx, gl.ELEMENT_ARRAY_BUFFER), dust: buf(MESH.dust), quad: buf(new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])) };

    function target(w, h, depth) {
      const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR));
      [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach(k => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
      const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      let rb = null;
      if (depth) { rb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb); }
      return { tex, fb, rb, w, h };
    }
    let T = null, W = 0, H = 0;
    function freeTargets() { if (!T) return; for (const t of Object.values(T)) { gl.deleteTexture(t.tex); gl.deleteFramebuffer(t.fb); if (t.rb) gl.deleteRenderbuffer(t.rb); } T = null; }
    function sizeTargets() {
      const d = Math.min(o.maxDpr, devicePixelRatio || 1) * o.scale;
      const w = Math.max(2, Math.round(canvas.clientWidth * d)), h = Math.max(2, Math.round(canvas.clientHeight * d));
      if (T && w === W && h === H) return d;
      W = w; H = h; canvas.width = w; canvas.height = h; freeTargets();
      const hw = Math.max(1, w >> 1), hh = Math.max(1, h >> 1), qw = Math.max(1, w >> 2), qh = Math.max(1, h >> 2);
      T = { scene: target(w, h, true), emit: target(hw, hh, true), half: target(hw, hh, false), q1: target(qw, qh, false), q2: target(qw, qh, false) };
      return d;
    }

    // view state
    const st = { yaw: 0.6, pitch: 0.25, zoom: 1, mode: 0, scan0: 0, idle: 0, running: false, raf: 0, last: 0, t0: performance.now(), onFrame: null };
    function bindRock(prog, proj, view, model) {
      gl.useProgram(prog.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, B.pos); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, B.nor); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, B.idx);
      gl.uniformMatrix4fv(prog.u.uProj, false, proj); gl.uniformMatrix4fv(prog.u.uView, false, view); gl.uniformMatrix4fv(prog.u.uModel, false, model);
      gl.uniformMatrix3fv(prog.u.uNMat, false, M.nmat(model));
    }
    function drawDust(proj, view, t, size) {
      const p = P.dust; gl.useProgram(p.p);
      gl.disableVertexAttribArray(1);
      gl.bindBuffer(gl.ARRAY_BUFFER, B.dust); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(p.u.uProj, false, proj); gl.uniformMatrix4fv(p.u.uView, false, view);
      gl.uniform1f(p.u.uTime, t); gl.uniform1f(p.u.uSize, size); gl.uniform3fv(p.u.uCol, DUST_COL[st.mode]);
      gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE); gl.depthMask(false);
      gl.drawArrays(gl.POINTS, 0, MESH.dustN);
      gl.disable(gl.BLEND); gl.depthMask(true);
    }
    function quad(prog) {
      gl.useProgram(prog.p); gl.disableVertexAttribArray(1);
      gl.bindBuffer(gl.ARRAY_BUFFER, B.quad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    function blur(src, dst, dx, dy) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fb); gl.viewport(0, 0, dst.w, dst.h);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.useProgram(P.blur.p); gl.uniform1i(P.blur.u.uTex, 0); gl.uniform2f(P.blur.u.uDir, dx / src.w, dy / src.h);
      quad(P.blur);
    }

    function render(now) {
      const d = sizeTargets(), t = (now - st.t0) / 1000;
      const dt = Math.min(0.1, (now - st.last) / 1000 || 0); st.last = now;
      if (now - st.idle > 2500) st.yaw += dt * 0.28;
      const proj = M.persp(0.62, W / H, 0.1, 30);
      const view = M.trans(o.offset[0], o.offset[1], -o.dist / st.zoom);
      const model = M.rot(st.yaw, st.pitch);
      const scanY = st.mode === 3 ? -1.05 + ((t - st.scan0) * 0.85) % 2.1 : 0;
      gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
      // 1. the scene
      gl.bindFramebuffer(gl.FRAMEBUFFER, T.scene.fb); gl.viewport(0, 0, W, H);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      bindRock(P.rock, proj, view, model);
      gl.uniform1f(P.rock.u.uTime, t); gl.uniform1f(P.rock.u.uMode, st.mode); gl.uniform1f(P.rock.u.uScan, scanY);
      gl.drawElements(gl.TRIANGLES, MESH.count, gl.UNSIGNED_SHORT, 0);
      drawDust(proj, view, t, 34 * d);
      // 2. only the glowing parts, at half size
      gl.bindFramebuffer(gl.FRAMEBUFFER, T.emit.fb); gl.viewport(0, 0, T.emit.w, T.emit.h);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      bindRock(P.emit, proj, view, model);
      gl.uniform1f(P.emit.u.uTime, t); gl.uniform1f(P.emit.u.uMode, st.mode); gl.uniform1f(P.emit.u.uScan, scanY);
      gl.drawElements(gl.TRIANGLES, MESH.count, gl.UNSIGNED_SHORT, 0);
      drawDust(proj, view, t, 20 * d);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      // 3. blur it (a tight glow at half size, a wide one at quarter size)
      blur(T.emit, T.half, 1, 0); blur(T.half, T.emit, 0, 1);
      blur(T.emit, T.q1, 2, 0); blur(T.q1, T.q2, 0, 2); blur(T.q2, T.q1, 3.5, 0); blur(T.q1, T.q2, 0, 3.5);
      // 4. put it together over the lab background
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
      [T.scene, T.emit, T.q2].forEach((tt, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, tt.tex); });
      gl.useProgram(P.comp.p);
      gl.uniform1i(P.comp.u.uScene, 0); gl.uniform1i(P.comp.u.uBloom, 1); gl.uniform1i(P.comp.u.uWide, 2);
      gl.uniform2f(P.comp.u.uRes, W, H); gl.uniform1f(P.comp.u.uDpr, d); gl.uniform1f(P.comp.u.uGrid, o.grid);
      quad(P.comp);
      gl.activeTexture(gl.TEXTURE0);
      if (st.onFrame) st.onFrame(t, st);
    }
    function loop(now) {
      st.raf = requestAnimationFrame(loop);
      if (document.hidden || now - (st.lastDraw || 0) < 1000 / o.fps - 2) return;
      if (!canvas.clientWidth || !canvas.clientHeight || !checkReady()) return;
      st.lastDraw = now; render(now);
    }

    // dragging, zooming
    if (o.interactive) {
      const pts = new Map(); let pinch = 0;
      canvas.style.touchAction = 'none';
      canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); st.idle = performance.now(); });
      canvas.addEventListener('pointermove', e => {
        if (!pts.has(e.pointerId)) return;
        const [px, py] = pts.get(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]); st.idle = performance.now();
        if (pts.size === 2) { const [a, b] = [...pts.values()], dd = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) st.zoom = Math.min(2.6, Math.max(0.6, st.zoom * dd / pinch)); pinch = dd; return; }
        st.yaw += (e.clientX - px) * 0.009; st.pitch = Math.min(1.4, Math.max(-1.4, st.pitch + (e.clientY - py) * 0.007));
      });
      const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; };
      canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
      canvas.addEventListener('wheel', e => { e.preventDefault(); st.idle = performance.now(); st.zoom = Math.min(2.6, Math.max(0.6, st.zoom * Math.exp(-e.deltaY * 0.0012))); }, { passive: false });
      canvas.addEventListener('dblclick', () => { st.yaw = 0.6; st.pitch = 0.25; st.zoom = 1; });
    }
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); api.stop(); });

    const api = {
      start() { if (st.running) return; st.running = true; st.last = performance.now(); st.raf = requestAnimationFrame(loop); },
      stop() { st.running = false; cancelAnimationFrame(st.raf); },
      setMode(m) { st.mode = m; if (m === 3) st.scan0 = (performance.now() - st.t0) / 1000; },
      set offset(v) { o.offset = v; },
      set onFrame(fn) { st.onFrame = fn; },
      get state() { return st; },
      destroy() { api.stop(); freeTargets(); const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext(); },
    };
    return api;
  }

  window.Ichor = { create };
})();
