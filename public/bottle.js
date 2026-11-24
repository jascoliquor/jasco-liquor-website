/* The bottle. Plain WebGL2, no libraries, transparent background.

   The glass is a lathe: a radius for every height. Each pixel bends a ray into the
   bottle, walks to the far wall, tints the light by how much liquid it crossed, and
   looks up a softly lit studio. The liquid is a plane that stays level with the room.

   window.JascoStage(canvas, background) returns null when WebGL2 is missing. */
(function () {
  "use strict";
  var CLEAR = [1, 1, 1], CAP = 0.886, N = 512, WALL = 0.02;
  // Every bottle shares one neck and cap, so shapes blend cleanly into each other.
  var TOP = [[.86, .104], [.866, .12], [.881, .12], [.886, .112], [.889, .126], [.985, .126], [.994, .12], [1, .06]];
  function body(points) { return points.concat(TOP); }
  function hex(h) {
    return [1, 3, 5].map(function (i) { return Math.pow(parseInt(h.slice(i, i + 2), 16) / 255, 2.2); });
  }

  // h: height, fill: liquid level, soak: light lost per unit (r,g,b), hold: light the liquid keeps, glass: tint of the glass (clear if missing)
  var SCENES = [
    { h: 1.78, fill: .66, soak: [.75, 3.1, 9.5], hold: hex("#b85a1c"), cap: hex("#2b211d"),
      p: body([[0, .29], [.012, .335], [.03, .35], [.58, .35], [.65, .33], [.7, .25], [.74, .16], [.77, .116], [.81, .104]]) },
    { h: 1.7, fill: .5, soak: [1, 4.1, 11], hold: hex("#8f3812"), cap: hex("#8d7448"),
      p: body([[0, .31], [.015, .385], [.05, .43], [.15, .455], [.28, .43], [.42, .345], [.55, .225], [.66, .145], [.74, .113], [.8, .104]]) },
    { h: 1.8, fill: .62, soak: [.14, .62, 2.6], hold: hex("#eec67e"), cap: hex("#7a5a40"),
      p: body([[0, .23], [.015, .272], [.04, .288], [.48, .345], [.56, .35], [.63, .318], [.69, .21], [.735, .135], [.78, .108]]) },
    { h: 1.98, fill: .67, soak: [.2, .12, .09], hold: hex("#e9eff2"), cap: hex("#a9b0b3"),
      p: body([[0, .24], [.012, .268], [.03, .276], [.61, .276], [.68, .255], [.74, .18], [.78, .124], [.82, .106]]) },
    { h: 1.64, fill: .585, soak: [.42, .14, .2], hold: hex("#d5e8e4"), cap: hex("#cfc9be"),
      p: body([[0, .33], [.02, .385], [.045, .398], [.51, .398], [.575, .378], [.63, .3], [.66, .2], [.7, .134], [.75, .112]]) },
    { h: 2.06, fill: .62, soak: [3.2, 22, 16], hold: hex("#6a0f26"), cap: hex("#4a1a20"), glass: [.3, .37, .19],
      p: body([[0, .25], [.012, .278], [.03, .286], [.59, .286], [.635, .278], [.675, .24], [.71, .17], [.745, .122], [.79, .104]]) }
  ];

  // Monotone cubic, then a light blur below the neck so highlights run without kinks.
  function sample(pts) {
    var n = pts.length, d = [], m = [], out = new Float32Array(N), i, k = 0, pass;
    for (i = 0; i < n - 1; i++) d[i] = (pts[i + 1][1] - pts[i][1]) / (pts[i + 1][0] - pts[i][0]);
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 * d[i - 1] * d[i] / (d[i - 1] + d[i]);
    for (i = 0; i < N; i++) {
      var y = i / (N - 1);
      while (k < n - 2 && y > pts[k + 1][0]) k++;
      var h = pts[k + 1][0] - pts[k][0], t = (y - pts[k][0]) / h, t2 = t * t, t3 = t2 * t;
      out[i] = (2 * t3 - 3 * t2 + 1) * pts[k][1] + (t3 - 2 * t2 + t) * h * m[k] + (3 * t2 - 2 * t3) * pts[k + 1][1] + (t3 - t2) * h * m[k + 1];
    }
    for (pass = 0; pass < 5; pass++) {
      var src = out.slice();
      for (i = 1; i < N - 1; i++) {
        var yy = i / (N - 1), w = yy < .02 ? 1 : yy < .84 ? 8 : 1, s = 0, c = 0;
        for (var j = -w; j <= w; j++) if (i + j >= 0 && i + j < N) { s += src[i + j]; c++; }
        out[i] = s / c;
      }
    }
    return out;
  }

  var HEAD = `#version 300 es
precision highp float;
uniform vec3 uBg, uHold;
uniform float uBase, uShow;
vec3 tone(vec3 c) { return pow(clamp(c, 0., 1.), vec3(1. / 2.2)); }`;

  // Contact shadow, with a little of the liquid's color in it.
  var SHADOW_VS = `#version 300 es
precision highp float;
in vec2 a; uniform vec2 uHalf; out vec2 q;
void main() { q = a * uHalf; gl_Position = vec4(a, .9999, 1.); }`;
  var SHADOW_FS = HEAD + `
in vec2 q; out vec4 o; uniform float uFoot, uEdge;
float drop(float a, float b, float x) { return 1. - smoothstep(a, b, x); }
float blot(vec2 d, vec2 r) { d /= r; return exp(-dot(d, d)); }
void main() {
  vec2 d = vec2(q.x - .06, q.y - uBase + .015);
  float a = (blot(d, vec2(uFoot * .95, .05)) * .34 + blot(d, vec2(uFoot * 1.6, .11)) * .15) * uShow * drop(.75, 1., abs(d.x) / uEdge);
  // A little noise hides the steps an 8-bit fade would show.
  float n = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715)))) - .5;
  o = vec4(tone(uHold * .16) * a, a) + n / 255. * step(.001, a);
}`;

  var PROF = `
uniform highp sampler2D uProf;
vec2 prof01(float y) {
  float u = clamp(y, 0., 1.) * ${N - 1}.; int i = int(u);
  return mix(texelFetch(uProf, ivec2(i, 0), 0).rg, texelFetch(uProf, ivec2(min(i + 1, ${N - 1}), 0), 0).rg, u - float(i));
}`;

  var GLASS_VS = `#version 300 es
precision highp float;
in vec2 a;
uniform mat3 uRot; uniform vec3 uPos; uniform float uH, uCamZ, uScale; uniform vec2 uLens;
out vec3 lp;` + PROF + `
void main() {
  float r = a.x > 1.5 ? 0. : prof01(a.x).r;
  lp = vec3(r * cos(a.y), (min(a.x, 1.) - .5) * uH, r * sin(a.y));
  vec3 w = uRot * lp * uScale + uPos;
  float z = uCamZ - w.z;
  gl_Position = vec4(w.xy * uLens, (z - 4.) * .1 * z, z);
}`;

  var GLASS_FS = HEAD + `
in vec3 lp; out vec4 o;
uniform mat3 uRot; uniform vec3 uPos, uCamL, uSoak, uCap, uLevelN, uGlass;
uniform float uH, uFill, uScale;` + PROF + `
float rise(float a, float b, float x) { return smoothstep(a, b, x); }
float drop(float a, float b, float x) { return 1. - smoothstep(a, b, x); }
vec2 prof(float y) { return prof01(y / uH + .5); }
float level(vec3 p) { return dot(p - vec3(0., (uFill - .5) * uH, 0.), uLevelN); }
float under(vec3 p) { return drop(-.012, .012, level(p)); }
vec3 outward(vec3 p) {
  return normalize(vec3(p.x, 0., p.z) / max(length(p.xz), 1e-4) - vec3(0., prof(p.y).g / uH, 0.));
}
// A light studio: pale walls, a big soft window on the left, a narrow one on the right,
// and dark panels just out of frame that draw the edges of clear glass.
vec3 studio(vec3 d) {
  float az = atan(d.x, d.z), aa = abs(az);
  vec3 c = uBg * mix(.34, .74, rise(-.9, .8, d.y));
  c *= 1. - .72 * rise(1.55, 1.95, aa) * drop(2.3, 2.75, aa);
  float tall = rise(-.85, -.35, d.y) * drop(.55, .95, d.y);
  c += 2.1 * tall * drop(.16, .5, abs(az + 1.12));
  c += 1.0 * tall * drop(.04, .2, abs(az - 1.3));
  c += .9 * rise(.7, .98, d.y);
  return c;
}
vec3 wallBehind(vec2 q) {
  return uBg * mix(.99, .16, rise(.12, 2., abs(q.x + .12))) * mix(1., .55, drop(-.6, 1.1, q.y - uBase));
}
vec3 behind(vec3 p, vec3 d) {
  vec3 w = uRot * p * uScale + uPos, wd = uRot * d;
  if (wd.z > -.05) return studio(wd) * .55;
  float t = (w.z + 1.2) / -wd.z;
  return mix(wallBehind(w.xy + wd.xy * t), studio(wd) * .55, rise(-.4, -.05, wd.z));
}
vec4 put(vec3 c) { return vec4(tone(c) * uShow, uShow); }

void main() {
  vec3 V = normalize(lp - uCamL), Nn = outward(lp);
  float y = lp.y / uH + .5;

  if (y > ${CAP}) {
    vec3 n = uRot * Nn;
    vec3 c = uCap * (.3 + .8 * rise(-.7, .9, dot(n, normalize(vec3(-.55, .45, .7)))));
    c += studio(reflect(uRot * V, n)) * (.035 + .25 * pow(1. - max(dot(-V, Nn), 0.), 4.));
    c *= mix(.5, 1., rise(${CAP}, ${CAP + 0.01}, y));
    o = put(c); return;
  }

  float ndv = clamp(dot(-V, Nn), 0., 1.);
  float wet = under(lp) * rise(.02, .04, y);
  vec3 d = refract(V, Nn, 1. / mix(1.04, 1.36, wet));

  float soak = 0., st = .036, t = st; vec3 p;
  for (int i = 0; i < 34; i++) {
    p = lp + d * t;
    vec2 pr = prof(p.y); float r = length(p.xz);
    if (r > pr.r - .003 || abs(p.y) > uH * .5) break;
    soak += st * under(p) * drop(pr.r - ${WALL * 2}, pr.r - ${WALL}, r) * rise(-.485, -.465, p.y / uH);
    t += st;
  }
  float lo = t - st, hi = t;
  for (int i = 0; i < 7; i++) {
    float m = (lo + hi) * .5; p = lp + d * m;
    if (length(p.xz) > prof(p.y).r - .003 || abs(p.y) > uH * .5) hi = m; else lo = m;
  }
  // Correct for the part of the last step the walk overshot, so the tint has no bands.
  p = lp + d * lo;
  soak = max(0., soak + (lo - t + st * .5) * under(p) * step(.001, soak));

  vec3 Nb = outward(p);
  if (dot(Nb, d) < 0.) Nb = -Nb;
  float ior = mix(1.04, 1.36, under(p)), cosB = dot(d, Nb);
  vec3 e = refract(d, -Nb, ior), bounce = studio(uRot * reflect(d, -Nb));
  float passes = rise(0., .12, 1. - ior * ior * (1. - cosB * cosB));
  vec3 through = bounce * .5;
  if (dot(e, e) > .01) through = mix(through, behind(p, e), passes);

  vec3 tint = exp(-uSoak * soak);
  vec3 c = through * tint;
  c += uHold * (1. - exp(-soak * 1.2)) * .1;
  c += bounce * tint * .035;
  c *= mix(vec3(1.), vec3(.3, .27, .27), pow(1. - ndv, 2.6));
  // Tinted glass shows fully where the bottle is empty, less where wine fills it.
  c *= mix(uGlass, sqrt(uGlass), wet);
  c *= mix(.8, 1., rise(0., .05, y));
  c *= 1. - .2 * drop(0., .014, abs(level(lp))) * rise(0., .4, ndv);
  c += studio(uRot * reflect(V, Nn)) * (.045 + .42 * pow(1. - ndv, 5.));
  o = put(c);
}`;

  function program(gl, vs, fs) {
    var p = gl.createProgram();
    [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (s) {
      var sh = gl.createShader(s[0]);
      gl.shaderSource(sh, s[1]); gl.compileShader(sh); gl.attachShader(p, sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(sh));
    });
    gl.bindAttribLocation(p, 0, "a");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) {
      var name = gl.getActiveUniform(p, i).name;
      u[name] = gl.getUniformLocation(p, name);
    }
    return { p: p, u: u };
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerp3(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }

  window.JascoStage = function (canvas, background) {
    var gl = canvas.getContext("webgl2", { antialias: true, alpha: true, premultipliedAlpha: true });
    if (!gl) return null;
    var shadow, glass, shadowVao, glassVao, count;
    var profiles = SCENES.map(function (s) { return sample(s.p); });
    var profData = new Float32Array(N * 2), bg = hex(background);

    function mesh(data) {
      var vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      return vao;
    }
    // Everything on the GPU. Runs again if the browser drops the context and gives it back.
    function build() {
      shadow = program(gl, SHADOW_VS, SHADOW_FS); glass = program(gl, GLASS_VS, GLASS_FS);
      if (!shadow || !glass) return false;
      shadowVao = mesh([-1, -1, 3, -1, -1, 3]);
      var ROWS = 240, SEG = 200, v = [], idx = [], i, j;
      // The extra row (marked 2) closes the top.
      for (i = 0; i <= ROWS + 1; i++) for (j = 0; j <= SEG; j++) v.push(i > ROWS ? 2 : i / ROWS, j / SEG * Math.PI * 2);
      for (i = 0; i <= ROWS; i++) for (j = 0; j < SEG; j++) {
        var q = i * (SEG + 1) + j;
        idx.push(q, q + SEG + 1, q + 1, q + 1, q + SEG + 1, q + SEG + 2);
      }
      glassVao = mesh(v); count = idx.length;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);

      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG32F, N, 1, 0, gl.RG, gl.FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0, 0, 0, 0);
      return true;
    }
    if (!build()) return null;

    var CAMZ = 7.5, TAN = 1.55 / CAMZ, SCALE = 1.18, BASE = -1.16, PITCH = .05, lost = false;
    canvas.addEventListener("webglcontextlost", function (e) {
      e.preventDefault(); lost = true;
    });
    canvas.addEventListener("webglcontextrestored", function () {
      lost = !build();
      if (lost) document.documentElement.classList.remove("gl");
    });

    function resize(cssW, cssH, dpr) {
      // Draw above screen resolution and let the browser scale down.
      var k = Math.min(Math.max(2, dpr * 1.5), 3.5, 4096 / Math.max(cssW, cssH, 1));
      var w = Math.round(cssW * k), h = Math.round(cssH * k);
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
    }

    /* s: { f: bottle 0..5, roll, slosh, show 0..1 } */
    function draw(s) {
      var w = canvas.width, h = canvas.height;
      if (lost || !w || !h) return;
      var last = SCENES.length - 1, f = Math.max(0, Math.min(last, s.f));
      var ia = Math.floor(f), ib = Math.min(ia + 1, last), m = f - ia;
      var A = SCENES[ia], B = SCENES[ib], aspect = w / h, k;

      for (k = 0; k < N; k++) profData[k * 2] = lerp(profiles[ia][k], profiles[ib][k], m);
      for (k = 0; k < N; k++) {
        var k0 = Math.max(0, k - 2), k1 = Math.min(N - 1, k + 2);
        profData[k * 2 + 1] = (profData[k1 * 2] - profData[k0 * 2]) / ((k1 - k0) / (N - 1));
      }
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, N, 1, gl.RG, gl.FLOAT, profData);

      var H = lerp(A.h, B.h, m), scale = SCALE * Math.min(1, aspect * 1.5);
      var cr = Math.cos(s.roll), sr = Math.sin(s.roll), cp = Math.cos(PITCH), sp = Math.sin(PITCH);
      // R = Rz(roll) Rx(pitch), row major. The bottle turns about its foot.
      var R = [cr, -sr * cp, sr * sp, sr, cr * cp, -cr * sp, 0, sp, cp];
      var half = H * .5 * scale, pos = [R[1] * half, BASE + R[4] * half, R[7] * half];
      function toLocal(x, y, z) {
        return [R[0] * x + R[3] * y + R[6] * z, R[1] * x + R[4] * y + R[7] * z, R[2] * x + R[5] * y + R[8] * z];
      }
      var ln = Math.hypot(s.slosh, 1), hold = lerp3(A.hold, B.hold, m);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var u = shadow.u;
      gl.useProgram(shadow.p);
      gl.uniform3fv(u.uHold, hold); gl.uniform1f(u.uBase, BASE); gl.uniform1f(u.uShow, s.show);
      gl.uniform1f(u.uFoot, profData[Math.round(.04 * (N - 1)) * 2] * scale);
      gl.uniform1f(u.uEdge, CAMZ * TAN * aspect);
      gl.uniform2f(u.uHalf, CAMZ * TAN * aspect, CAMZ * TAN);
      gl.bindVertexArray(shadowVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      u = glass.u;
      gl.useProgram(glass.p);
      gl.uniform1i(u.uProf, 0);
      gl.uniform3fv(u.uBg, bg); gl.uniform3fv(u.uHold, hold);
      gl.uniform1f(u.uBase, BASE); gl.uniform1f(u.uShow, s.show);
      gl.uniformMatrix3fv(u.uRot, false, [R[0], R[3], R[6], R[1], R[4], R[7], R[2], R[5], R[8]]);
      gl.uniform3fv(u.uPos, pos);
      gl.uniform3fv(u.uCamL, toLocal(-pos[0] / scale, -pos[1] / scale, (CAMZ - pos[2]) / scale));
      gl.uniform3fv(u.uLevelN, toLocal(s.slosh / ln, 1 / ln, 0));
      gl.uniform3fv(u.uGlass, lerp3(A.glass || CLEAR, B.glass || CLEAR, m)); gl.uniform3fv(u.uSoak, lerp3(A.soak, B.soak, m)); gl.uniform3fv(u.uCap, lerp3(A.cap, B.cap, m));
      gl.uniform1f(u.uH, H); gl.uniform1f(u.uFill, lerp(A.fill, B.fill, m));
      gl.uniform1f(u.uScale, scale); gl.uniform1f(u.uCamZ, CAMZ);
      gl.uniform2f(u.uLens, 1 / (TAN * aspect), 1 / TAN);
      gl.bindVertexArray(glassVao);
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
    }
    return { resize: resize, draw: draw };
  };
})();
