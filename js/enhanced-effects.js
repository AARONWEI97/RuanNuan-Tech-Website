/* ============================================
   冉暖科技 — Enhanced Visual Effects Engine
   全站视觉增强引擎
   1. 页面淡入        5. 通用3D倾斜
   2. 滚动进度条      6. 视差滚动
   3. 鼠标光晕        7. 标题字符动画
   4. 粒子拖尾        8. 产品Hero粒子背景
   ============================================ */
(function () {
  'use strict';

  var isTouch = window.matchMedia('(pointer: coarse)').matches;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 暖色系粒子配色（与站点基调一致） */
  var PALETTE = ['#D4943A', '#E8B86D', '#F06B5E', '#F4928A', '#7BAE7F'];

  /* rAF 管理器（浏览器在页面隐藏时会自动暂停 rAF，无需手动处理） */
  function addLoop(fn) {
    function tick(t) {
      fn(t);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initPageFade();
    initFluidBg();
    initScrollProgress();
    if (!isTouch && !reduceMotion) {
      initCursorGlow();
      initParticleTrail();
      initTilt();
    }
    initParallax();
    initTitleChars();
    initProductHeroParticles();
    initButtonGlowPos();
  });

  /* ------------------------------------------
     1.5 全站流体背景（页面缺少 .fluid-bg 时自动注入，
         并随滚动缓慢漂移形成流体衔接感）
     ------------------------------------------ */
  function initFluidBg() {
    if (reduceMotion) return;
    if (document.querySelector('.fluid-bg')) return; // 首页已有，尊重原实现

    var bg = document.createElement('div');
    bg.className = 'fx-fluid-bg';
    bg.setAttribute('aria-hidden', 'true');
    bg.innerHTML = '<div class="fx-fluid-blob b1"></div>' +
                   '<div class="fx-fluid-blob b2"></div>' +
                   '<div class="fx-fluid-blob b3"></div>';
    document.body.prepend(bg);

    // 滚动时整体轻漂移（容器位移，不影响 blob 自身动画）
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        bg.style.transform = 'translate3d(0,' + (window.pageYOffset * -0.04).toFixed(1) + 'px,0)';
      });
    }, { passive: true });
  }

  /* ------------------------------------------
     1. 页面淡入
     ------------------------------------------ */
  function initPageFade() {
    if (reduceMotion) return;
    document.body.classList.add('fx-boot');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add('fx-loaded');
      });
    });
  }

  /* ------------------------------------------
     2. 顶部滚动进度条
     ------------------------------------------ */
  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.className = 'fx-scroll-progress';
    document.body.appendChild(bar);

    var target = 0, current = 0;
    function measure() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      target = max > 0 ? (h.scrollTop || window.pageYOffset) / max : 0;
    }
    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addListener('resize', measure);

    addLoop(function () {
      // 平滑追赶，滚动时有流体惯性
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.0005) current = target;
      bar.style.transform = 'scaleX(' + current + ')';
    });
  }

  /* ------------------------------------------
     3. 全局鼠标光晕（lerp 平滑跟随）
     ------------------------------------------ */
  function initCursorGlow() {
    var glow = document.createElement('div');
    glow.className = 'fx-cursor-glow';
    document.body.appendChild(glow);

    var mx = -600, my = -600, x = mx, y = my, shown = false;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; glow.classList.add('fx-on'); x = mx; y = my; }
      // 悬停在深色区域（hero / footer）时切换提亮混合模式
      var dark = e.target.closest && e.target.closest('.hero, .product-hero, .footer, .contact-section, .music-stats-v2, .cta-section');
      glow.classList.toggle('fx-on-dark', !!dark);
    }, { passive: true });

    document.addEventListener('mouseleave', function () {
      glow.classList.remove('fx-on'); shown = false;
    });

    addLoop(function () {
      x += (mx - x) * 0.12;
      y += (my - y) * 0.12;
      glow.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    });
  }

  /* ------------------------------------------
     4. 鼠标粒子拖尾（暖色光点 + 偶发爪印）
     ------------------------------------------ */
  function initParticleTrail() {
    var canvas = document.createElement('canvas');
    canvas.id = 'fx-trail-canvas';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var W, H;
    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var particles = [];
    var MAX = 140;
    var lastX = -1, lastY = -1;
    var pawTick = 0;

    function spawn(x, y, vx, vy) {
      if (particles.length >= MAX) particles.shift();
      var isPaw = (++pawTick % 14 === 0);
      particles.push({
        x: x, y: y,
        vx: vx * 0.35 + (Math.random() - 0.5) * 0.6,
        vy: vy * 0.35 + (Math.random() - 0.5) * 0.6 - 0.35,
        life: 1,
        decay: 0.014 + Math.random() * 0.02,
        size: isPaw ? 10 + Math.random() * 4 : 1.6 + Math.random() * 2.6,
        color: PALETTE[(Math.random() * PALETTE.length) | 0],
        paw: isPaw,
        rot: Math.random() * Math.PI * 2
      });
    }

    document.addEventListener('mousemove', function (e) {
      if (lastX < 0) { lastX = e.clientX; lastY = e.clientY; return; }
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      // 按移动距离插值生成，速度快时粒子更多
      var steps = Math.min(4, Math.max(1, Math.floor(dist / 8)));
      for (var i = 0; i < steps; i++) {
        var t = i / steps;
        spawn(lastX + dx * t, lastY + dy * t, dx * 0.08, dy * 0.08);
      }
      lastX = e.clientX; lastY = e.clientY;
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
      var toeR = p.size * 0.18, toeY = -r * 0.5;
      [[-r * 0.7, toeY], [-r * 0.25, toeY - r * 0.4], [r * 0.25, toeY - r * 0.4], [r * 0.7, toeY]].forEach(function (pos) {
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], toeR, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    addLoop(function () {
      ctx.clearRect(0, 0, W, H);
      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.vy -= 0.012; // 轻微上飘
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
    });
  }

  /* ------------------------------------------
     5. 通用 3D 倾斜 + 动态光泽
        （避开 scifi-animations 已处理的类，防止冲突）
     ------------------------------------------ */
  function initTilt() {
    var SELECTORS = [
      '.showcase-card', '.feature-item', '.faq-item',
      '.changelog-entry', '.roadmap-card', '.contact-item',
      '.progress-item-glass', '.stat-item', '.dl-card',
      '.screenshot-glow', '.about-card', '.value-card',
      '.tech-item', '[data-tilt]'
    ].join(',');

    var els = document.querySelectorAll(SELECTORS);
    els.forEach(function (el) {
      // scifi-animations 处理的类直接跳过
      if (el.closest('.product-card-3d') || el.classList.contains('product-card-3d') ||
          el.classList.contains('feature-card') || el.classList.contains('card-3d')) return;

      el.classList.add('fx-tilt');
      var pos = getComputedStyle(el).position;
      if (pos === 'static') el.style.position = 'relative';

      var shine = document.createElement('div');
      shine.className = 'fx-tilt-shine';
      el.appendChild(shine);

      var maxDeg = parseFloat(el.getAttribute('data-tilt')) || 5;
      var raf = null;

      el.addEventListener('mousemove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var rect = el.getBoundingClientRect();
          var px = (e.clientX - rect.left) / rect.width;
          var py = (e.clientY - rect.top) / rect.height;
          var rx = (py - 0.5) * -2 * maxDeg;
          var ry = (px - 0.5) * 2 * maxDeg;
          el.classList.add('fx-tilt-active');
          el.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-3px)';
          shine.style.setProperty('--shine-x', (px * 100).toFixed(1) + '%');
          shine.style.setProperty('--shine-y', (py * 100).toFixed(1) + '%');
        });
      });

      el.addEventListener('mouseleave', function () {
        el.classList.remove('fx-tilt-active');
        el.style.transform = '';
      });
    });
  }

  /* ------------------------------------------
     6. 视差滚动 — [data-speed] 元素随滚动偏移
     ------------------------------------------ */
  function initParallax() {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-speed]'));
    if (!els.length || reduceMotion) return;

    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -100 || rect.top > vh + 100) return;
        var speed = parseFloat(el.getAttribute('data-speed')) || 0.15;
        var centerOffset = (rect.top + rect.height / 2) - vh / 2;
        el.style.transform = 'translate3d(0,' + (-centerOffset * speed).toFixed(1) + 'px,0)';
      });
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ------------------------------------------
     7. 区块标题字符动画（仅处理纯文本标题）
     ------------------------------------------ */
  function initTitleChars() {
    var titles = document.querySelectorAll('.section-title');
    if (!titles.length) return;

    titles.forEach(function (title) {
      // 含子元素（图标/HTML）的标题跳过，避免破坏结构
      if (title.children.length > 0) return;
      var text = title.textContent.trim();
      if (!text || text.length > 40) return;

      var html = '';
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        html += ch === ' '
          ? '<span class="fx-char" style="--ci:' + i + '">&nbsp;</span>'
          : '<span class="fx-char" style="--ci:' + i + '">' + ch + '</span>';
      }
      title.innerHTML = html;
      title.classList.add('fx-title-chars');
    });

    var animated = document.querySelectorAll('.fx-title-chars');
    if (!animated.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion) {
      animated.forEach(function (t) { t.classList.add('fx-chars-in'); });
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
    animated.forEach(function (t) { obs.observe(t); });
  }

  /* ------------------------------------------
     8. 产品页 Hero 粒子背景（按页面主题色）
     ------------------------------------------ */
  function initProductHeroParticles() {
    var hero = document.querySelector('.product-hero');
    if (!hero || reduceMotion) return;

    // 依据 hero 类型选择主色
    var color = 'rgba(212,148,58,';      // 默认琥珀
    var accent = 'rgba(240,107,94,';
    if (hero.classList.contains('music-hero')) { color = 'rgba(240,107,94,'; accent = 'rgba(212,148,58,'; }
    else if (hero.classList.contains('epos-hero')) { color = 'rgba(123,174,127,'; accent = 'rgba(212,148,58,'; }
    else if (hero.classList.contains('tv-hero')) { color = 'rgba(100,149,237,'; accent = 'rgba(232,184,109,'; }

    hero.style.position = 'relative';
    var canvas = document.createElement('canvas');
    canvas.className = 'fx-hero-canvas';
    hero.insertBefore(canvas, hero.firstChild);
    var ctx = canvas.getContext('2d');

    var W, H;
    function resize() {
      W = canvas.width = hero.offsetWidth;
      H = canvas.height = hero.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    var COUNT = isTouch ? 24 : 46;
    var LINK = 140;
    var nodes = [];
    for (var i = 0; i < COUNT; i++) {
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

    // 鼠标引力交互
    var mouse = { x: -9999, y: -9999 };
    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });
    hero.addEventListener('mouseleave', function () { mouse.x = -9999; mouse.y = -9999; });

    var time = 0;
    addLoop(function () {
      time += 0.016;
      ctx.clearRect(0, 0, W, H);

      nodes.forEach(function (n) {
        // 鼠标轻微引力
        var dxm = mouse.x - n.x, dym = mouse.y - n.y;
        var dm = Math.sqrt(dxm * dxm + dym * dym);
        if (dm < 200 && dm > 0.1) {
          var f = (1 - dm / 200) * 0.012;
          n.vx += (dxm / dm) * f;
          n.vy += (dym / dm) * f;
        }
        n.vx *= 0.985; n.vy *= 0.985;
        // 保持最低漂移速度
        if (Math.abs(n.vx) < 0.05) n.vx += (Math.random() - 0.5) * 0.02;
        if (Math.abs(n.vy) < 0.05) n.vy += (Math.random() - 0.5) * 0.02;

        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;

        // 呼吸脉动
        var pulse = 0.75 + Math.sin(time * 2 + n.ph) * 0.25;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = color + (n.a * pulse) + ')';
        ctx.fill();
      });

      // 星座连线
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].x - nodes[j].x;
          var dy = nodes[i].y - nodes[j].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            var alpha = (1 - d / LINK) * 0.14;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = accent + alpha + ')';
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    });
  }

  /* ------------------------------------------
     9. 按钮光斑位置追踪（配合 CSS ::after）
     ------------------------------------------ */
  function initButtonGlowPos() {
    document.querySelectorAll('.btn').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        btn.style.setProperty('--fx-bx', ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%');
        btn.style.setProperty('--fx-by', ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%');
      }, { passive: true });
    });
  }

})();
