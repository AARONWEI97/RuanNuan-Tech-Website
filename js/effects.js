/* ============================================
   冉暖科技 RanNuan Tech — 特效引擎 js/effects.js
   ---------------------------------------------------------------
   本文件由原 js/scifi-animations.js + js/enhanced-effects.js 合并重写，
   修复审计缺陷 B1 / B2 / B3：

   · B1：删除了不存在的 window.addListener(...) —— 该错误曾在
         DOMContentLoaded 中抛 TypeError，导致其后 8 个初始化函数全部不执行。
   · B2：删除了非法的 el.querySelector('::after') —— 该调用在 mousemove 中
         抛 DOMException；本引擎不再使用任何非法选择器。
   · B3：跳过 .product-card-3d（其 3D 倾斜由 js/home.js 独占），
         不再用 innerHTML 包裹 .card-3d-inner，避免双重写 transform。

   能力清单（契约 §5 / §9）：
     滚动进度条 / 鼠标光晕(lerp) / 粒子拖尾 canvas / data-tilt 3D 倾斜 /
     data-speed 视差 / .section-title 字符动画 / 产品页 Hero 粒子 /
     按钮光斑 --fx-bx --fx-by / data-lazy-bg 懒加载 /
     fx-magnetic 磁吸 / fx-ripple 点击涟漪 / fx-fluid-bg 与爪印装饰

   性能纪律：
     · 所有 canvas 与 rAF 循环在 document.hidden 时暂停；
     · 滚动监听一律 { passive: true } + requestAnimationFrame 节流；
     · 元素离屏时暂停对应动画；
     · 不使用永久 will-change。
   纯原生 ES5 语法风格，无任何第三方依赖。
   ============================================ */
(function () {
  'use strict';

  /* 重复加载守卫（契约 §3） */
  if (window.__ranNuanEffectsLoaded) return;
  window.__ranNuanEffectsLoaded = true;

  var isTouch = false;
  var reduceMotion = false;
  try {
    isTouch = window.matchMedia('(pointer: coarse)').matches;
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (err) {
    isTouch = false;
    reduceMotion = false;
  }

  /* 暖色系粒子配色（与站点基调一致） */
  var PALETTE = ['#D4943A', '#E8B86D', '#F06B5E', '#F4928A', '#7BAE7F'];
  /* 粒子拖尾池上限（task-1 指定 ≤140；鼠标驱动，实际并发通常 20–60） */
  var TRAIL_MAX = 140;
  /* 产品页 Hero 星座粒子数（契约 §9.4：桌面 ≤ 60、coarse ≤ 24） */
  var HERO_COUNT = isTouch ? 24 : 46;

  /* ----------------------------------------------------------
     工具函数（无匹配元素时全部安全返回）
     ---------------------------------------------------------- */
  function $(selector, ctx) {
    try { return (ctx || document).querySelector(selector); } catch (err) { return null; }
  }
  function $$(selector, ctx) {
    try {
      return Array.prototype.slice.call((ctx || document).querySelectorAll(selector));
    } catch (err) { return []; }
  }
  function on(el, type, fn, opts) {
    if (el && el.addEventListener) el.addEventListener(type, fn, opts || false);
  }
  function scrollTop() {
    return window.pageYOffset || document.documentElement.scrollTop || 0;
  }
  function rafThrottle(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        fn();
      });
    };
  }
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function ensureRelative(el) {
    try {
      if (window.getComputedStyle(el).position === 'static') el.style.position = 'relative';
    } catch (err) { /* 忽略 */ }
  }
  function insertFirst(parent, child) {
    if (parent.firstChild) parent.insertBefore(child, parent.firstChild);
    else parent.appendChild(child);
  }
  function hasChildClass(parent, cls) {
    for (var i = 0; i < parent.children.length; i++) {
      if (parent.children[i].classList && parent.children[i].classList.contains(cls)) return true;
    }
    return false;
  }

  /* rAF 循环管理器：document.hidden 时暂停执行（恢复可见后自动继续） */
  function addLoop(fn) {
    function tick() {
      if (!document.hidden) {
        try { fn(); } catch (err) { /* 单个循环出错不影响其它特效 */ }
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ----------------------------------------------------------
     1. 顶部滚动进度条（平滑追赶，只写 transform）
     ---------------------------------------------------------- */
  function initScrollProgress() {
    if ($('.fx-scroll-progress')) return;
    var bar = document.createElement('div');
    bar.className = 'fx-scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var target = 0;
    var current = 0;
    function measure() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      target = max > 0 ? Math.min(1, Math.max(0, scrollTop() / max)) : 0;
    }
    measure();
    on(window, 'scroll', rafThrottle(measure), { passive: true });
    on(window, 'resize', rafThrottle(measure));

    addLoop(function () {
      if (current === target) return;              // 静止时不写样式，避免无谓重绘
      current += (target - current) * 0.14;        // 平滑追赶，滚动时有流体惯性
      if (Math.abs(target - current) < 0.0005) current = target;
      bar.style.transform = 'scaleX(' + current.toFixed(4) + ')';
    });
  }

  /* ----------------------------------------------------------
     2. 全局鼠标光晕（lerp 平滑跟随；触屏禁用）
     ---------------------------------------------------------- */
  function initCursorGlow() {
    if (isTouch || reduceMotion) return;
    if ($('.fx-cursor-glow')) return;

    var glow = document.createElement('div');
    glow.className = 'fx-cursor-glow';
    glow.setAttribute('aria-hidden', 'true');
    document.body.appendChild(glow);

    var mx = -600, my = -600, x = mx, y = my, shown = false;

    on(document, 'mousemove', function (e) {
      mx = e.clientX;
      my = e.clientY;
      if (!shown) { shown = true; x = mx; y = my; glow.classList.add('fx-on'); }
      /* 悬停在深色区域（hero / footer）时切换提亮混合模式 */
      var el = e.target;
      var dark = el && el.closest ? el.closest('.hero, .product-hero, .footer, .cta-section') : null;
      glow.classList.toggle('fx-on-dark', !!dark);
    }, { passive: true });

    on(document, 'mouseleave', function () {
      glow.classList.remove('fx-on');
      shown = false;
    });

    addLoop(function () {
      if (!shown) return;
      if (Math.abs(mx - x) < 0.2 && Math.abs(my - y) < 0.2) return;
      x += (mx - x) * 0.12;
      y += (my - y) * 0.12;
      glow.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    });
  }

  /* ----------------------------------------------------------
     3. 鼠标粒子拖尾 Canvas（触屏禁用；池上限 140）
     ---------------------------------------------------------- */
  function initParticleTrail() {
    if (isTouch || reduceMotion) return;
    if (document.getElementById('fx-trail-canvas')) return;

    var canvas = document.createElement('canvas');
    canvas.id = 'fx-trail-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); return; }

    var W = 1, H = 1;
    function resize() {
      W = canvas.width = Math.max(1, window.innerWidth);
      H = canvas.height = Math.max(1, window.innerHeight);
    }
    resize();
    on(window, 'resize', rafThrottle(resize));

    var particles = [];
    var dirty = false;
    var lastX = -1, lastY = -1, pawTick = 0;

    function spawn(px, py, vx, vy) {
      if (particles.length >= TRAIL_MAX) particles.shift();
      var isPaw = (++pawTick % 16 === 0);
      particles.push({
        x: px, y: py,
        vx: vx * 0.35 + (Math.random() - 0.5) * 0.6,
        vy: vy * 0.35 + (Math.random() - 0.5) * 0.6 - 0.35,
        life: 1,
        decay: 0.014 + Math.random() * 0.02,
        size: isPaw ? 10 + Math.random() * 4 : 1.6 + Math.random() * 2.6,
        color: PALETTE[(Math.random() * PALETTE.length) | 0],
        paw: isPaw,
        rot: Math.random() * Math.PI * 2
      });
      dirty = true;
    }

    on(document, 'mousemove', function (e) {
      if (lastX < 0) { lastX = e.clientX; lastY = e.clientY; return; }
      var dx = e.clientX - lastX;
      var dy = e.clientY - lastY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var steps = Math.min(4, Math.max(1, Math.floor(dist / 8)));
      for (var i = 0; i < steps; i++) {
        var t = i / steps;
        spawn(lastX + dx * t, lastY + dy * t, dx * 0.08, dy * 0.08);
      }
      lastX = e.clientX;
      lastY = e.clientY;
    }, { passive: true });

    function drawPaw(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.life * 0.5;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      var r = p.size * 0.4;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.3, r, r * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      var toeR = p.size * 0.18;
      var toeY = -r * 0.5;
      var toes = [[-r * 0.7, toeY], [-r * 0.25, toeY - r * 0.4], [r * 0.25, toeY - r * 0.4], [r * 0.7, toeY]];
      for (var i = 0; i < toes.length; i++) {
        ctx.beginPath();
        ctx.arc(toes[i][0], toes[i][1], toeR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    addLoop(function () {
      if (!dirty && !particles.length) return;     // 鼠标静止且无粒子时不重绘
      ctx.clearRect(0, 0, W, H);
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.vy -= 0.012;                              // 轻微上飘
        p.life -= p.decay;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        if (p.paw) {
          drawPaw(p);
        } else {
          ctx.globalAlpha = p.life * 0.75;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      if (!particles.length) {
        ctx.clearRect(0, 0, W, H);
        dirty = false;
      }
    });
  }

  /* ----------------------------------------------------------
     4. 通用 3D 倾斜（data-tilt / .fx-tilt）
        跳过 .product-card-3d：该类由 js/home.js 独占
     ---------------------------------------------------------- */
  function initTilt() {
    if (isTouch || reduceMotion) return;

    $$('[data-tilt], .fx-tilt').forEach(function (el) {
      if (el.getAttribute('data-fx-tilt') === 'on') return;                  // 幂等
      if (el.classList.contains('product-card-3d') || el.closest('.product-card-3d')) return; // B3
      if (el.hasAttribute('data-speed')) return;                             // 与视差互斥，避免抢写 transform
      if (el.closest('[data-no-tilt]')) return;
      el.setAttribute('data-fx-tilt', 'on');

      var maxDeg = parseFloat(el.getAttribute('data-tilt'));
      if (isNaN(maxDeg)) maxDeg = 5;
      maxDeg = Math.max(0, Math.min(14, maxDeg));

      el.classList.add('fx-tilt');
      ensureRelative(el);

      var shine = null;
      if (!hasChildClass(el, 'fx-tilt-shine')) {
        shine = document.createElement('div');
        shine.className = 'fx-tilt-shine';
        shine.setAttribute('aria-hidden', 'true');
        el.appendChild(shine);
      }

      var raf = null;
      var lastEvent = null;

      on(el, 'mousemove', function (e) {
        lastEvent = e;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var ev = lastEvent;
          if (!ev) return;
          /* 与 .reveal 入场动画共存：入场未完成时不抢写 transform */
          if (el.classList.contains('reveal') && !el.classList.contains('visible')) return;
          var rect = el.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          var px = (ev.clientX - rect.left) / rect.width;
          var py = (ev.clientY - rect.top) / rect.height;
          var rx = (py - 0.5) * -2 * maxDeg;
          var ry = (px - 0.5) * 2 * maxDeg;
          el.classList.add('fx-tilt-active');
          el.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' +
                               ry.toFixed(2) + 'deg) translateY(-3px)';
          if (shine) {
            shine.style.setProperty('--fx-shine-x', (px * 100).toFixed(1) + '%');
            shine.style.setProperty('--fx-shine-y', (py * 100).toFixed(1) + '%');
          }
        });
      }, { passive: true });

      on(el, 'mouseleave', function () {
        lastEvent = null;
        el.classList.remove('fx-tilt-active');
        el.style.transform = '';
      });
    });
  }

  /* ----------------------------------------------------------
     5. 视差滚动 [data-speed]（rAF 节流 + 离屏跳过）
        位移基准在初始化/尺寸变化时测量，避免 transform 反馈漂移
     ---------------------------------------------------------- */
  function initParallax() {
    if (reduceMotion) return;
    var els = $$('[data-speed]').filter(function (el) {
      return !el.hasAttribute('data-tilt') && !el.classList.contains('fx-tilt');
    });
    if (!els.length) return;

    var items = els.map(function (el) {
      var speed = parseFloat(el.getAttribute('data-speed'));
      if (isNaN(speed)) speed = 0.15;
      return { el: el, speed: Math.max(-1, Math.min(1, speed)), baseTop: 0, height: 0 };
    });

    function measure() {
      items.forEach(function (item) {
        var prev = item.el.style.transform;
        item.el.style.transform = 'none';                    // 先移除自身位移再测量
        var rect = item.el.getBoundingClientRect();
        item.baseTop = rect.top + scrollTop();
        item.height = rect.height;
        item.el.style.transform = prev;
      });
    }

    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      var y = scrollTop();
      items.forEach(function (item) {
        var top = item.baseTop - y;
        if (top + item.height < -120 || top > vh + 120) return;   // 离屏跳过
        var centerOffset = (top + item.height / 2) - vh / 2;
        item.el.style.transform = 'translate3d(0,' + (-centerOffset * item.speed).toFixed(1) + 'px,0)';
      });
    }
    function request() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    measure();
    on(window, 'scroll', request, { passive: true });
    on(window, 'resize', rafThrottle(function () { measure(); request(); }));
    on(window, 'load', function () { measure(); request(); });
    window.setTimeout(function () { measure(); update(); }, 1200);   // 图片加载后重新测量
    update();
  }

  /* ----------------------------------------------------------
     6. 区块标题字符动画
        仅在 .section-title 无子元素时处理（含 span 的标题保持原样，防 B4 同类问题）
     ---------------------------------------------------------- */
  function initTitleChars() {
    var titles = $$('.section-title');
    if (!titles.length) return;

    var animated = [];
    titles.forEach(function (title) {
      if (title.getAttribute('data-fx-title') === 'on') return;
      if (title.children.length > 0) return;                 // 含子元素：直接跳过
      var text = (title.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text || text.length > 40) return;                 // 过长标题不做拆分
      title.setAttribute('data-fx-title', 'on');
      if (reduceMotion) return;                              // 降级：保持可读，不拆分

      var html = '';
      for (var i = 0; i < text.length; i++) {
        var ch = text.charAt(i);
        if (ch === ' ') {
          html += ' ';
        } else {
          html += '<span class="fx-char" aria-hidden="true" style="--fx-ci:' + i + '">' + escapeHtml(ch) + '</span>';
        }
      }
      title.innerHTML = html;
      title.setAttribute('aria-label', text);                // 读屏按整句朗读
      title.classList.add('fx-title-chars');
      animated.push(title);
    });
    if (!animated.length) return;

    if (!('IntersectionObserver' in window)) {
      animated.forEach(function (title) { title.classList.add('fx-chars-in'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('fx-chars-in');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    animated.forEach(function (title) { obs.observe(title); });
  }

  /* ----------------------------------------------------------
     7. 全站流体背景层（滚动时整体轻漂移，不影响 blob 自身动画）
     ---------------------------------------------------------- */
  function initFluidBg() {
    if (reduceMotion) return;
    if ($('.fx-fluid-bg')) return;

    var bg = document.createElement('div');
    bg.className = 'fx-fluid-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = '<div class="fx-fluid-blob b1"></div>' +
                   '<div class="fx-fluid-blob b2"></div>' +
                   '<div class="fx-fluid-blob b3"></div>';
    insertFirst(document.body, bg);

    var ticking = false;
    on(window, 'scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        bg.style.transform = 'translate3d(0,' + (scrollTop() * -0.04).toFixed(1) + 'px,0)';
      });
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     8. 爪印粒子飘浮装饰（纯装饰，aria-hidden）
     ---------------------------------------------------------- */
  function initPawParticles() {
    if (reduceMotion) return;
    if ($('.fx-paw-particles')) return;

    var container = document.createElement('div');
    container.className = 'fx-paw-particles';
    container.setAttribute('aria-hidden', 'true');

    var colors = ['#D4943A', '#F06B5E', '#7BAE7F'];
    var count = window.innerWidth > 768 ? 8 : 4;
    for (var i = 0; i < count; i++) {
      var p = document.createElement('div');
      p.className = 'fx-paw-particle';
      p.style.left = ((i / count) * 100 + (Math.random() * 10 - 5)).toFixed(2) + '%';
      var size = (14 + Math.random() * 12).toFixed(0);
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.animationDelay = (-Math.random() * 15).toFixed(2) + 's';
      p.style.animationDuration = (12 + Math.random() * 8).toFixed(1) + 's';
      p.style.setProperty('--fx-paw-color', colors[i % colors.length]);
      container.appendChild(p);
    }
    insertFirst(document.body, container);
  }

  /* ----------------------------------------------------------
     9. Hero 顶部微光（注入 .fx-hero-glow，避开既有伪元素）
     ---------------------------------------------------------- */
  function initHeroGlow() {
    ['.hero', '.product-hero'].forEach(function (selector) {
      var host = $(selector);
      if (!host) return;
      if (hasChildClass(host, 'fx-hero-glow')) return;
      ensureRelative(host);
      var glow = document.createElement('div');
      glow.className = 'fx-hero-glow';
      glow.setAttribute('aria-hidden', 'true');
      insertFirst(host, glow);
    });
  }

  /* ----------------------------------------------------------
     10. 产品页 Hero 粒子背景（按页面主题色；离屏暂停）
     ---------------------------------------------------------- */
  function initHeroParticles() {
    if (reduceMotion) return;
    var hero = $('.product-hero');
    if (!hero) return;
    if (hasChildClass(hero, 'fx-hero-canvas')) return;

    /* 依据 hero 变体选择主色 */
    var color = 'rgba(212,148,58,';        // 默认琥珀
    var accent = 'rgba(240,107,94,';
    if (hero.classList.contains('music-hero')) { color = 'rgba(240,107,94,'; accent = 'rgba(212,148,58,'; }
    else if (hero.classList.contains('epos-hero')) { color = 'rgba(123,174,127,'; accent = 'rgba(212,148,58,'; }
    else if (hero.classList.contains('tv-hero')) { color = 'rgba(100,149,237,'; accent = 'rgba(232,184,109,'; }

    ensureRelative(hero);
    var canvas = document.createElement('canvas');
    canvas.className = 'fx-hero-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    insertFirst(hero, canvas);
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) { if (canvas.parentNode) canvas.parentNode.removeChild(canvas); return; }

    var W = 1, H = 1;
    function resize() {
      W = canvas.width = Math.max(1, hero.offsetWidth);
      H = canvas.height = Math.max(1, hero.offsetHeight);
    }
    resize();
    on(window, 'resize', rafThrottle(resize));

    var LINK = 140;
    var nodes = [];
    for (var i = 0; i < HERO_COUNT; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: 1 + Math.random() * 1.8,
        a: 0.15 + Math.random() * 0.35,
        ph: Math.random() * Math.PI * 2
      });
    }

    /* 鼠标引力交互 */
    var mouse = { x: -9999, y: -9999 };
    on(hero, 'mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });
    on(hero, 'mouseleave', function () { mouse.x = -9999; mouse.y = -9999; });

    /* 元素离屏时暂停 */
    var onScreen = true;
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { onScreen = entry.isIntersecting; });
      }, { threshold: 0 });
      io.observe(hero);
    }

    var time = 0;
    addLoop(function () {
      if (!onScreen || W <= 1 || H <= 1) return;
      time += 0.016;
      ctx.clearRect(0, 0, W, H);

      nodes.forEach(function (n) {
        var dxm = mouse.x - n.x;
        var dym = mouse.y - n.y;
        var dm = Math.sqrt(dxm * dxm + dym * dym);
        if (dm < 200 && dm > 0.1) {
          var f = (1 - dm / 200) * 0.012;
          n.vx += (dxm / dm) * f;
          n.vy += (dym / dm) * f;
        }
        n.vx *= 0.985;
        n.vy *= 0.985;
        if (Math.abs(n.vx) < 0.05) n.vx += (Math.random() - 0.5) * 0.02;
        if (Math.abs(n.vy) < 0.05) n.vy += (Math.random() - 0.5) * 0.02;

        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;

        var pulse = 0.75 + Math.sin(time * 2 + n.ph) * 0.25;   // 呼吸脉动
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = color + (n.a * pulse).toFixed(3) + ')';
        ctx.fill();
      });

      /* 星座连线 */
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x;
          var dy = nodes[a].y - nodes[b].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            var alpha = ((1 - d / LINK) * 0.14).toFixed(3);
            ctx.beginPath();
            ctx.moveTo(nodes[a].x, nodes[a].y);
            ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.strokeStyle = accent + alpha + ')';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    });
  }

  /* ----------------------------------------------------------
     11. 按钮光斑位置追踪（供 CSS --fx-bx / --fx-by 消费）
     ---------------------------------------------------------- */
  function initButtonSpot() {
    if (isTouch) return;
    $$('.btn').forEach(function (btn) {
      if (btn.getAttribute('data-fx-spot') === 'on') return;
      btn.setAttribute('data-fx-spot', 'on');
      var raf = null;
      var bx = 50, by = 50;

      on(btn, 'mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        bx = ((e.clientX - rect.left) / rect.width) * 100;
        by = ((e.clientY - rect.top) / rect.height) * 100;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          btn.style.setProperty('--fx-bx', bx.toFixed(1) + '%');
          btn.style.setProperty('--fx-by', by.toFixed(1) + '%');
        });
      }, { passive: true });
    });
  }

  /* ----------------------------------------------------------
     12. data-lazy-bg 懒加载背景图（进入视口才设置 background-image）
     ---------------------------------------------------------- */
  function initLazyBg() {
    var els = $$('[data-lazy-bg]');
    if (!els.length) return;

    function load(el) {
      var url = el.getAttribute('data-lazy-bg');
      if (!url) return;
      el.style.backgroundImage = 'url("' + String(url).replace(/"/g, '\\"') + '")';
      el.setAttribute('data-fx-bg', 'loaded');
      el.removeAttribute('data-lazy-bg');
    }

    if (!('IntersectionObserver' in window)) {
      els.forEach(load);
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          load(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px 0px' });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ----------------------------------------------------------
     13. 磁吸按钮 .fx-magnetic（触屏禁用；--fx-mx / --fx-my 为 0–100 无单位数值）
     ---------------------------------------------------------- */
  function initMagnetic() {
    if (isTouch || reduceMotion) return;
    $$('.fx-magnetic').forEach(function (el) {
      if (el.getAttribute('data-fx-magnetic') === 'on') return;
      el.setAttribute('data-fx-magnetic', 'on');

      var raf = null;
      var mx = 50, my = 50;

      on(el, 'mousemove', function (e) {
        var rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        mx = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        my = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          el.classList.add('fx-magnetic-active');
          el.style.setProperty('--fx-mx', mx.toFixed(2));
          el.style.setProperty('--fx-my', my.toFixed(2));
        });
      }, { passive: true });

      on(el, 'mouseleave', function () {
        el.classList.remove('fx-magnetic-active');
        el.style.setProperty('--fx-mx', '50');    // 复位 → 回到原位
        el.style.setProperty('--fx-my', '50');
      });
    });
  }

  /* ----------------------------------------------------------
     14. 点击涟漪 .fx-ripple（一次性节点，动画结束立即清理）
     ---------------------------------------------------------- */
  function initRipple() {
    if (reduceMotion) return;
    $$('.fx-ripple').forEach(function (el) {
      if (el.getAttribute('data-fx-ripple') === 'on') return;
      el.setAttribute('data-fx-ripple', 'on');

      on(el, 'click', function (e) {
        var rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        var size = Math.max(rect.width, rect.height) * 1.4;
        var localX = e.clientX - rect.left;
        var localY = e.clientY - rect.top;
        /* 键盘触发（Enter/Space）时无坐标，从中心扩散 */
        if (!e.clientX && !e.clientY) {
          localX = rect.width / 2;
          localY = rect.height / 2;
        }

        var wave = document.createElement('span');
        wave.className = 'fx-ripple-wave';
        wave.setAttribute('aria-hidden', 'true');
        wave.style.width = size.toFixed(0) + 'px';
        wave.style.height = size.toFixed(0) + 'px';
        wave.style.left = localX.toFixed(1) + 'px';
        wave.style.top = localY.toFixed(1) + 'px';
        el.appendChild(wave);

        var removed = false;
        function cleanup() {
          if (removed) return;
          removed = true;
          if (wave.parentNode) wave.parentNode.removeChild(wave);
        }
        on(wave, 'animationend', cleanup);
        window.setTimeout(cleanup, 900);   // 兜底：绝不泄漏 DOM 节点
      });
    });
  }

  /* ----------------------------------------------------------
     13. 错步揭示（熔金科技）：.fx-stagger 容器进入视口时
         为直接子元素写入 --fx-i 并加 .fx-stagger-in。
         .fx-stagger-armed 用于关闭 CSS 无 JS 兜底动画。
     ---------------------------------------------------------- */
  function initStagger() {
    var containers = $$('.fx-stagger');
    if (!containers.length) return;
    containers.forEach(function (box, bi) {
      if (box.getAttribute('data-fx-stagger') === 'on') return;
      box.setAttribute('data-fx-stagger', 'on');
      box.classList.add('fx-stagger-armed');
      var kids = box.children;
      for (var i = 0; i < kids.length; i++) {
        kids[i].style.setProperty('--fx-i', String(i));
      }
    });
    if (reduceMotion || !('IntersectionObserver' in window)) {
      containers.forEach(function (box) { box.classList.add('fx-stagger-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('fx-stagger-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });
    containers.forEach(function (box) { io.observe(box); });
  }

  /* ----------------------------------------------------------
     启动
     ---------------------------------------------------------- */
  function boot() {
    initFluidBg();
    initPawParticles();
    initScrollProgress();
    initCursorGlow();
    initParticleTrail();
    initTilt();
    initParallax();
    initTitleChars();
    initHeroGlow();
    initHeroParticles();
    initButtonSpot();
    initLazyBg();
    initMagnetic();
    initRipple();
    initStagger();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* 供动态插入内容后的手动刷新（各初始化函数均为幂等） */
  window.RanNuanEffects = {
    refreshTilt: initTilt,
    refreshTitleChars: initTitleChars,
    refreshLazyBg: initLazyBg,
    refreshMagnetic: initMagnetic,
    refreshRipple: initRipple,
    refreshButtonSpot: initButtonSpot
  };
})();
