// Noted & Known site motion. Paper stop motion at 8 frames a second (one frame every 125 ms), no easing.
// Everything is visible without this script: the styles only hide things when <html class="js"> is set.
// Pressable things (links, buttons, the FAQ) stay on one smooth ease-in-out in the CSS.
(function () {
  var FRAME = 125;
  var doc = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var still = reduce || location.hash === '#static';
  if (location.hash === '#static') {
    doc.classList.add('static');
    // Screenshots are taken in one tall window, so give the viewport-height units a fixed phone or desktop size.
    doc.style.setProperty('--svh', (window.innerWidth < 700 ? 8.44 : 9) + 'px');
    Array.prototype.forEach.call(document.querySelectorAll('img[loading=lazy]'), function (i) { i.loading = 'eager'; });
  }

  // ---- Shapes and recut, ported from src/design/cut/shapes.ts ---------------------------------
  var P = {
    circle: 'M50 6 C74 4 95 22 96 48 C97 63 90 78 76 88 L58 95 C34 99 12 86 6 62 C1 40 14 12 50 6 Z',
    leaf: 'M14 78 C8 46 30 10 72 6 C84 5 94 9 95 20 C98 52 72 92 34 94 C24 95 16 90 14 78 Z',
    pebble: 'M10 34 C16 14 40 6 62 9 L86 18 C98 30 97 58 88 74 C76 94 46 98 26 90 C8 82 3 56 10 34 Z',
    square: 'M12 14 L84 7 C92 7 95 12 95 20 L91 82 C90 90 86 93 78 93 L18 96 C10 96 6 92 6 84 L5 24 C5 18 7 15 12 14 Z',
    bean: 'M22 18 C38 2 70 4 86 20 C100 36 98 62 84 78 C72 92 52 88 44 76 C38 67 28 72 20 68 C4 60 6 34 22 18 Z'
  };
  function rng(seed) {
    var a = (seed * 2654435761) >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function recut(path, seed, amt) {
    var r = rng(seed + 17);
    return path.replace(/-?\d+(\.\d+)?/g, function (n) { return (parseFloat(n) + (r() - 0.5) * 2 * amt).toFixed(1); });
  }
  var FACE_SHAPES = ['circle', 'leaf', 'pebble', 'square', 'bean'];
  function faceShapeFor(name) {
    var h = 2166136261;
    for (var i = 0; i < name.length; i++) { h ^= name.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return FACE_SHAPES[h % FACE_SHAPES.length];
  }
  function mixc(a, b, t) {
    var A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16);
    function f(s) { return Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t); }
    return '#' + ((1 << 24) | (f(16) << 16) | (f(8) << 8) | f(0)).toString(16).slice(1).toUpperCase();
  }
  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(name, attrs) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // ---- The SAVE stage, ported from src/design/motion/geometry.ts (saveFrame) ------------------
  var STAGE_W = 356, STAGE_H = 776, SAVE_STILL = 14;
  var BLOB_SCALE = [2.4, 5.5, 10, 22];
  function saveFrame(n, col) {
    var lt = mixc(col, '#FFFFFF', 0.24);
    var dk = mixc(col, '#26282B', 0.16);
    var m = Math.min(n, 3);
    var out = { blob: null, cuts: [], face: n >= 7, tilt: n === 7 ? -5 : -2, faceY: n === 7 ? 128 : 118, faceSeed: n === 7 ? 7 : 0, noted: n >= 9, line: n >= 10 };
    out.blob = {
      d: recut(P.circle, m + 1, 1.6),
      t: 'translate(' + STAGE_W / 2 + ' ' + (STAGE_H - 36) + ') scale(' + BLOB_SCALE[m] + ') translate(-50 -50)'
    };
    if (n >= 4) {
      var bo = n === 4 ? [110, -110] : [0, 0];
      out.cuts.push({ name: 'bean', fill: dk, x: 138 + bo[0], y: -96 + bo[1], w: 380, h: 360, seed: 31 });
    }
    if (n >= 5) {
      var co = n === 5 ? [-120, 120] : [0, 0];
      out.cuts.push({ name: 'circle', fill: lt, x: -170 + co[0], y: 478 + co[1], w: 480, h: 480, seed: 32 });
    }
    var small = [['leaf', '#FFFFFF', 226, 522, 34, 32, 41], ['pebble', lt, 300, 596, 40, 34, 42], ['square', dk, 128, 622, 36, 34, 43]];
    small.forEach(function (p, i) {
      if (n >= 10 + i) out.cuts.push({ name: p[0], fill: p[1], x: p[2], y: p[3], w: p[4], h: p[5], seed: p[6] });
    });
    return out;
  }
  var SAVELINE = {
    observation: function (w) { return 'Something you noticed about ' + w; },
    interest: function (w) { return 'Something ' + w + ' loves'; },
    gift: function (w) { return 'A gift idea for ' + w; },
    moment: function (w) { return 'A moment with ' + w; },
    support: function (w) { return 'A way to support ' + w; }
  };

  function buildStage(host) {
    var col = host.getAttribute('data-col');
    var on = host.getAttribute('data-on');
    var kind = host.getAttribute('data-kind');
    var name = host.getAttribute('data-name');
    var shape = faceShapeFor(name);
    var svg = svgEl('svg', { viewBox: '0 0 ' + STAGE_W + ' ' + STAGE_H, 'aria-hidden': 'true', focusable: 'false' });
    var gBlob = svgEl('g', {}), gCuts = svgEl('g', {}), gFace = svgEl('g', {});
    var gTilt = svgEl('g', {});
    var facePath = svgEl('path', { fill: '#FFFFFF' });
    var faceText = svgEl('text', { 'text-anchor': 'middle', 'font-family': 'Zen Maru Gothic, sans-serif', 'font-weight': '700', 'font-size': '42', fill: '#26282B', x: '50', y: '64' });
    faceText.textContent = name.charAt(0).toUpperCase();
    gTilt.appendChild(facePath); gTilt.appendChild(faceText); gFace.appendChild(gTilt);
    var noted = svgEl('text', { x: '28', y: '438', 'font-family': 'Zen Maru Gothic, sans-serif', 'font-weight': '900', 'font-size': '84', fill: on });
    noted.textContent = 'Noted.';
    var line = svgEl('text', { 'font-family': 'Zen Kaku Gothic New, sans-serif', 'font-size': '23', 'font-weight': '500', fill: on });
    var words = SAVELINE[kind](name).split(' ');
    var l1 = '', l2 = '';
    words.forEach(function (w) { if ((l1 + ' ' + w).trim().length <= 20 && !l2) l1 = (l1 + ' ' + w).trim(); else l2 = (l2 + ' ' + w).trim(); });
    [l1, l2].forEach(function (t, i) {
      if (!t) return;
      var ts = svgEl('tspan', { x: '28', y: String(484 + i * 30) });
      ts.textContent = t;
      line.appendChild(ts);
    });
    [gBlob, gCuts, gFace, noted, line].forEach(function (e) { svg.appendChild(e); });
    host.appendChild(svg);

    function render(n) {
      var f = saveFrame(n, col);
      gBlob.textContent = '';
      var g = svgEl('g', { transform: f.blob.t });
      g.appendChild(svgEl('path', { d: f.blob.d, fill: col }));
      gBlob.appendChild(g);
      gCuts.textContent = '';
      f.cuts.forEach(function (c) {
        var cg = svgEl('g', { transform: 'translate(' + c.x + ' ' + c.y + ') scale(' + c.w / 100 + ' ' + c.h / 100 + ')' });
        cg.appendChild(svgEl('path', { d: recut(P[c.name], c.seed, c.w > 200 ? 0.25 : 1.4), fill: c.fill }));
        gCuts.appendChild(cg);
      });
      gFace.setAttribute('visibility', f.face ? 'visible' : 'hidden');
      gFace.setAttribute('transform', 'translate(90 ' + f.faceY + ') scale(2.4)');
      gTilt.setAttribute('transform', 'rotate(' + f.tilt + ' 50 50)');
      facePath.setAttribute('d', recut(P[shape], f.faceSeed + 3, 1.2));
      noted.setAttribute('visibility', f.noted ? 'visible' : 'hidden');
      line.setAttribute('visibility', f.line ? 'visible' : 'hidden');
    }
    return { render: render, played: false, host: host };
  }

  var stages = Array.prototype.map.call(document.querySelectorAll('.stage'), function (host) {
    var s = buildStage(host);
    s.render(SAVE_STILL);
    return s;
  });
  function playStage(s) {
    if (s.played || still) return;
    s.played = true;
    var n = 0;
    s.render(0);
    var id = setInterval(function () {
      n += 1;
      s.render(n);
      if (n >= SAVE_STILL) clearInterval(id);
    }, FRAME);
  }

  // ---- Shapes that recut between three frames when they arrive --------------------------------
  Array.prototype.forEach.call(document.querySelectorAll('svg[data-shape]'), function (svg) {
    var name = svg.getAttribute('data-shape');
    var seed = parseInt(svg.getAttribute('data-seed') || '1', 10);
    svg.textContent = '';
    for (var i = 0; i < 3; i++) {
      var p = svgEl('path', { d: recut(P[name], seed + i * 7, 1.8), class: 'v v' + (i + 1) });
      svg.appendChild(p);
    }
  });

  // ---- Words arrive in chunks -----------------------------------------------------------------
  Array.prototype.forEach.call(document.querySelectorAll('[data-chunks]'), function (el) {
    var n = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var frag = document.createDocumentFragment();
          c.nodeValue.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            var s = document.createElement('span');
            s.className = 'w';
            s.style.setProperty('--n', String(Math.min(n, 8)));
            s.textContent = w;
            n += 1;
            frag.appendChild(s);
          });
          node.replaceChild(frag, c);
        } else if (c.nodeType === 1) walk(c);
      });
    })(el);
  });

  // ---- The one small idle loop: the logo's dots are recut at 8 fps while the hero is on screen ----
  var boil = document.querySelector('.boil');
  var boilTimer = null, tick = 0;
  function boilOn() {
    if (boilTimer || still || !boil) return;
    var dots = boil.querySelectorAll('path');
    boilTimer = setInterval(function () {
      tick = (tick + 1) % 4;
      Array.prototype.forEach.call(dots, function (p, i) { p.setAttribute('d', recut(P.circle, i + 21 + tick, 1.2)); });
    }, FRAME);
  }
  function boilOff() { clearInterval(boilTimer); boilTimer = null; }

  // ---- Enter detection: a scroll check plus a timer, so it works wherever scroll events don't ----
  var items = Array.prototype.slice.call(document.querySelectorAll('.sec, .tile'));
  var hero = document.querySelector('.hero');
  function check() {
    var h = window.innerHeight || doc.clientHeight;
    items = items.filter(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < h * 0.7 && r.bottom > 0) {
        el.classList.add('is-in');
        stages.forEach(function (s) { if (el.contains(s.host)) playStage(s); });
        return false;
      }
      return true;
    });
    if (hero && boil) {
      var hr = hero.getBoundingClientRect();
      if (hr.bottom > 0 && hr.top < h) boilOn(); else boilOff();
    }
  }
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  setInterval(check, 300);
  if (still) items.forEach(function (el) { el.classList.add('is-in'); });
  check();
})();
