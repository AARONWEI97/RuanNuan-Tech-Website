/* ============================
   冉暖科技 — Homepage Animations
   Hero 星座粒子 Canvas + 鼠标光晕 + 3D 卡片倾斜 + 标题字符拆分
   + 科幻动效升级层（2026-10-04）：
     fx-terminal 终端打字 / fx-decode 解码文字 / fx-reticle 科幻准星 / fx-beam 滚动能量束
   仅首页加载；ES5 写法（var + function）+ IIFE + 'use strict'
   约定：
   - `.product-card-3d` 的 transform 由本文件独占写入（其他层不得写入）
   - 数字计数器由 js/main.js 统一处理（data-counter / data-counter-suffix），
     本文件不再包含计数器实现（B5/B6）
   - 标题拆分只包裹纯文本节点，含元素子节点（如 .highlight）不拆分，
     以保留主标题的渐变文字（B4）
   - fx-decode 同理：只处理「无元素子节点」的 [data-fx-decode]，
     且动画结束后必须把文本精确还原为原文（不破坏 SEO 与复制粘贴）
   ============================ */
(function () {
  'use strict';

  /* 重复加载守卫（契约 §3：脚本必须容忍被重复引入） */
  if (window.__RANUAN_HOME_INIT__) return;
  window.__RANUAN_HOME_INIT__ = true;

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function isCoarsePointer() {
    return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  }

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    initConstellationParticles();
    initMouseGlow();
    init3DCards();
    initTitleChars();

    /* 科幻动效升级层（2026-10-04） */
    initTerminalTyping();
    initDecodeText();
    initReticle();
    initScrollBeams();
  });

  /* --- Constellation Network + Paw Particles (Canvas) --- */
  function initConstellationParticles() {
    var canvas = document.querySelector('.hero-particles');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    // 降低动效偏好：首屏 canvas 装饰动画整体不启动
    if (prefersReducedMotion()) return;

    var coarse = isCoarsePointer();
    var nodes = [];
    var paws = [];
    var travelers = [];   // 沿连线流动的脉冲光点
    /* 性能硬性要求（契约 §9.4）：桌面 ≤60、pointer: coarse ≤24 */
    var maxNodes = coarse ? 24 : 60;
    var maxPaws = 8;
    var maxTravelers = 6;
    var connectDist = 165;
    var time = 0;

    var running = false;      // 动画循环是否在跑
    var inViewport = true;    // canvas 是否在视口内
    var pageVisible = !document.hidden;

    // 鼠标引力场
    var mouse = { x: -9999, y: -9999 };
    var hero = canvas.parentElement;

    function resize() {
      var host = canvas.parentElement || hero;
      if (!host) return;
      var w = host.offsetWidth;
      var h = host.offsetHeight;
      if (w > 0 && h > 0) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    resize();

    // resize 用 rAF 节流（契约 §9.5）
    var resizeQueued = false;
    window.addEventListener('resize', function () {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(function () {
        resizeQueued = false;
        resize();
      });
    }, { passive: true });

    if (hero && !coarse) {
      hero.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }, { passive: true });
      hero.addEventListener('mouseleave', function () {
        mouse.x = -9999; mouse.y = -9999;
      }, { passive: true });
    }

    // Spawn constellation nodes
    function spawnNode() {
      if (nodes.length >= maxNodes) return;
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1.2 + Math.random() * 1.5,
        opacity: 0.2 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2   // 呼吸相位
      });
    }

    // 脉冲光点：在两个已连接的节点间流动
    function spawnTraveler(a, b) {
      if (travelers.length >= maxTravelers) return;
      var hue = Math.random() < 0.6 ? '212,148,58' : '240,107,94';
      travelers.push({ a: a, b: b, t: 0, speed: 0.008 + Math.random() * 0.012, hue: hue });
    }

    // Draw a paw shape
    function drawPaw(x, y, size, opacity, rotation) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = opacity;

      // Glow
      ctx.shadowColor = 'rgba(212,148,58,0.4)';
      ctx.shadowBlur = size * 0.8;
      ctx.fillStyle = 'rgba(212,148,58,0.5)';

      var r = size * 0.4;
      ctx.beginPath();
      ctx.ellipse(0, r * 0.3, r, r * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      var toeR = size * 0.18;
      var toeY = -r * 0.5;
      var positions = [
        { x: -r * 0.7, y: toeY },
        { x: -r * 0.25, y: toeY - r * 0.4 },
        { x: r * 0.25, y: toeY - r * 0.4 },
        { x: r * 0.7, y: toeY }
      ];
      for (var i = 0; i < positions.length; i++) {
        ctx.beginPath();
        ctx.arc(positions[i].x, positions[i].y, toeR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.restore();
    }

    function spawnPaw() {
      if (paws.length >= maxPaws) return;
      paws.push({
        x: Math.random() * canvas.width,
        y: canvas.height + 20,
        size: 14 + Math.random() * 18,
        speed: 0.25 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 0.3,
        rotation: (Math.random() - 0.5) * 0.8,
        opacity: 0,
        maxOpacity: 0.12 + Math.random() * 0.15,
        phase: 'in'
      });
    }

    function drawFrame() {
      time += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn
      if (Math.random() < 0.08 && nodes.length < maxNodes) spawnNode();
      if (Math.random() < 0.02) spawnPaw();

      // Update & draw nodes
      for (var n = 0; n < nodes.length; n++) {
        var node = nodes[n];
        // 鼠标引力：靠近的节点被温柔吸引，星座网产生呼吸般的聚拢
        var dxm = mouse.x - node.x, dym = mouse.y - node.y;
        var dm = Math.sqrt(dxm * dxm + dym * dym);
        if (dm < 220 && dm > 0.1) {
          var f = (1 - dm / 220) * 0.014;
          node.vx += (dxm / dm) * f;
          node.vy += (dym / dm) * f;
        }
        // 阻尼 + 最低漂移速度，防止粒子静止
        node.vx *= 0.985;
        node.vy *= 0.985;
        if (Math.abs(node.vx) < 0.04) node.vx += (Math.random() - 0.5) * 0.02;
        if (Math.abs(node.vy) < 0.04) node.vy += (Math.random() - 0.5) * 0.02;

        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // 呼吸脉动
        var pulse = 0.7 + Math.sin(time * 1.8 + node.phase) * 0.3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r * (0.8 + pulse * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212,148,58,' + (node.opacity * pulse) + ')';
        ctx.fill();
      }

      // Draw connections（琥珀主线 + 偶发珊瑚色连线）
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[i].x - nodes[j].x;
          var dy = nodes[i].y - nodes[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectDist) {
            var alpha = (1 - dist / connectDist) * 0.13;
            var coral = ((i * 31 + j * 17) % 7) === 0;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = coral
              ? 'rgba(240,107,94,' + (alpha * 0.9) + ')'
              : 'rgba(212,148,58,' + alpha + ')';
            ctx.lineWidth = 0.6;
            ctx.stroke();

            // 低概率在该连线上生成流动光点
            if (Math.random() < 0.0012) {
              spawnTraveler(nodes[i], nodes[j]);
            }
          }
        }
      }

      // 脉冲光点沿连线流动（发光小球）
      for (var k = travelers.length - 1; k >= 0; k--) {
        var tr = travelers[k];
        tr.t += tr.speed;
        if (tr.t >= 1) { travelers.splice(k, 1); continue; }
        var tx = tr.a.x + (tr.b.x - tr.a.x) * tr.t;
        var ty = tr.a.y + (tr.b.y - tr.a.y) * tr.t;
        var glow = Math.sin(tr.t * Math.PI); // 两端淡入淡出
        ctx.beginPath();
        ctx.arc(tx, ty, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + tr.hue + ',' + (0.55 * glow) + ')';
        ctx.shadowColor = 'rgba(' + tr.hue + ',0.8)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Update & draw paws
      for (var p = 0; p < paws.length; p++) {
        var paw = paws[p];
        paw.y -= paw.speed;
        paw.x += paw.drift;
        paw.rotation += 0.002;

        if (paw.phase === 'in') {
          paw.opacity += 0.006;
          if (paw.opacity >= paw.maxOpacity) paw.phase = 'hold';
        } else if (paw.y < canvas.height * 0.15) {
          paw.phase = 'out';
          paw.opacity -= 0.004;
        }

        if (paw.opacity > 0) drawPaw(paw.x, paw.y, paw.size, paw.opacity, paw.rotation);
      }

      paws = paws.filter(function (paw) { return paw.opacity > 0 && paw.y > -50; });
    }

    function shouldRun() {
      return inViewport && pageVisible && !document.hidden;
    }

    function loop() {
      if (!shouldRun()) { running = false; return; }
      drawFrame();
      requestAnimationFrame(loop);
    }

    function start() {
      if (running || !shouldRun()) return;
      running = true;
      requestAnimationFrame(loop);
    }

    // 元素离屏时暂停（契约 §9.4）
    if (typeof IntersectionObserver === 'function') {
      var canvasObserver = new IntersectionObserver(function (entries) {
        inViewport = !!(entries[0] && entries[0].isIntersecting);
        if (inViewport) start();
      }, { threshold: 0 });
      canvasObserver.observe(canvas);
    }

    // 页面隐藏时暂停（契约 §9.4）
    document.addEventListener('visibilitychange', function () {
      pageVisible = !document.hidden;
      if (pageVisible) start();
    });

    // Initial nodes（直接铺满 70%，剩余由动画逐渐生成）
    var initialCount = Math.floor(maxNodes * 0.7);
    for (var n0 = 0; n0 < initialCount; n0++) spawnNode();
    // Initial paws
    for (var p0 = 0; p0 < 3; p0++) {
      paws.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 14 + Math.random() * 18,
        speed: 0.25 + Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 0.3,
        rotation: (Math.random() - 0.5) * 0.8,
        opacity: 0.08 + Math.random() * 0.1,
        maxOpacity: 0.18,
        phase: 'hold'
      });
    }

    start();
  }

  /* --- Mouse Follow Glow（只用 transform 位移，rAF 节流） --- */
  function initMouseGlow() {
    var glow = document.querySelector('.hero-mouse-glow');
    var hero = document.querySelector('.hero');
    if (!glow || !hero) return;
    if (isCoarsePointer() || prefersReducedMotion()) return;

    var rect = null;
    var pendingX = 0;
    var pendingY = 0;
    var queued = false;

    function flush() {
      queued = false;
      glow.style.transform = 'translate(' + pendingX + 'px,' + pendingY + 'px) translate(-50%, -50%)';
    }

    hero.addEventListener('mousemove', function (e) {
      if (!rect) rect = hero.getBoundingClientRect();
      pendingX = e.clientX - rect.left;
      pendingY = e.clientY - rect.top;
      if (queued) return;
      queued = true;
      requestAnimationFrame(flush);
    }, { passive: true });

    // 滚动/尺寸变化后重新测量
    function invalidate() { rect = null; }
    window.addEventListener('scroll', invalidate, { passive: true });
    window.addEventListener('resize', invalidate, { passive: true });
    hero.addEventListener('mouseleave', invalidate, { passive: true });
  }

  /* --- 3D Tilt Cards（.product-card-3d 的 transform 唯一写入者） --- */
  function init3DCards() {
    var cards = document.querySelectorAll('.product-card-3d');
    if (!cards.length) return;
    if (isCoarsePointer() || prefersReducedMotion()) return;

    for (var i = 0; i < cards.length; i++) {
      bindTiltCard(cards[i]);
    }
  }

  function bindTiltCard(card) {
    var maxDeg = 8;   // 最大倾斜角（度），Hero 卡片由本文件独占
    var lastSpawn = 0;

    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var centerX = rect.width / 2;
      var centerY = rect.height / 2;
      var rotateX = ((y - centerY) / centerY) * -maxDeg;
      var rotateY = ((x - centerX) / centerX) * maxDeg;
      card.style.transform = 'perspective(800px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) scale(1.03)';

      // 粒子拖尾（限频，避免 mousemove 刷 DOM）
      var now = Date.now();
      if (now - lastSpawn > 90) {
        lastSpawn = now;
        spawnCardParticle(card);
      }
    }, { passive: true });

    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
    }, { passive: true });
  }

  /* Spawn a tiny particle near the card edge */
  var liveParticles = 0;
  function spawnCardParticle(card) {
    if (liveParticles >= 12) return;
    var rect = card.getBoundingClientRect();
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;width:4px;height:4px;border-radius:50%;pointer-events:none;z-index:9999;transition:transform 0.8s ease-out, opacity 0.8s ease-out;';

    // Pick color based on card type
    var color = 'rgba(212,148,58,0.8)';
    if (card.classList.contains('card-2')) color = 'rgba(240,107,94,0.8)';
    if (card.classList.contains('card-3')) color = 'rgba(123,174,127,0.8)';
    if (card.classList.contains('card-4')) color = 'rgba(100,149,237,0.8)';
    el.style.background = color;
    el.style.boxShadow = '0 0 6px ' + color;

    // Random position on card edge
    var side = Math.floor(Math.random() * 4);
    var px, py;
    if (side === 0) { px = rect.left + Math.random() * rect.width; py = rect.top; }
    else if (side === 1) { px = rect.right; py = rect.top + Math.random() * rect.height; }
    else if (side === 2) { px = rect.left + Math.random() * rect.width; py = rect.bottom; }
    else { px = rect.left; py = rect.top + Math.random() * rect.height; }

    el.style.left = px + 'px';
    el.style.top = py + 'px';
    el.style.opacity = '1';
    document.body.appendChild(el);
    liveParticles++;

    // Animate outward + fade
    requestAnimationFrame(function () {
      var dx = (Math.random() - 0.5) * 40;
      var dy = (Math.random() - 0.5) * 40;
      el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(0)';
      el.style.opacity = '0';
    });

    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      liveParticles--;
    }, 900);
  }

  /* --- Title Character Split Animation ---
     B4 修复：只拆分「纯文本节点」，不进入元素子节点。
     `.highlight` 的渐变依赖父元素上的 -webkit-background-clip: text，
     一旦把它的文字拆进子 span，渐变会被切断、文字变透明，
     因此含元素子节点的行保持原结构，只保留 .line-inner 的整体入场动画。 */
  function initTitleChars() {
    var titleEl = document.querySelector('.hero-title');
    if (!titleEl) return;
    if (prefersReducedMotion()) return;

    var lines = titleEl.querySelectorAll('.line-inner');
    for (var i = 0; i < lines.length; i++) {
      splitTextNodes(lines[i], 0.3);
    }
  }

  function splitTextNodes(line, baseDelay) {
    var snapshot = [];
    var child = line.firstChild;
    while (child) {
      snapshot.push(child);
      child = child.nextSibling;
    }

    var index = 0;
    for (var i = 0; i < snapshot.length; i++) {
      var node = snapshot[i];
      if (node.nodeType === 3) {
        index = wrapTextNode(line, node, index, baseDelay);
      }
      // 元素节点（如 <span class="highlight">）保持原样，不进入拆分
    }
  }

  function wrapTextNode(parent, textNode, startIndex, baseDelay) {
    var text = textNode.nodeValue || '';
    var frag = document.createDocumentFragment();
    var index = startIndex;

    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        frag.appendChild(document.createTextNode(' '));
        continue;
      }
      var span = document.createElement('span');
      span.className = 'char';
      span.style.animationDelay = (baseDelay + index * 0.04).toFixed(2) + 's';
      span.textContent = ch;
      frag.appendChild(span);
      index++;
    }

    parent.replaceChild(frag, textNode);
    return index;
  }

  /* ============================================================
     科幻动效升级层（2026-10-04）
     fx-terminal / fx-decode / fx-reticle / fx-beam
     共同纪律：
     · 全部由 requestAnimationFrame 驱动，document.hidden 时冻结进度；
       元素离屏即停止循环（IntersectionObserver）
     · 事件监听一律 { passive: true }（滚动再做 rAF 节流）
     · prefers-reduced-motion 与 pointer: coarse 自动降级
     · 每个功能在 DOM 中找不到宿主时静默返回，绝不影响其他初始化
     ============================================================ */

  /* --- fx-terminal：终端逐字打字循环 ---
     文案全部取自 index.html 既有词句（Hero 徽章 / 四张产品卡描述），
     不新增任何事实；文本节点由本函数独占写入。 */
  function initTerminalTyping() {
    var el = document.querySelector('.home-terminal-text');
    if (!el) return;

    var phrases = [
      '用技术创造温暖',
      'AI智能订货，批量分配，尺码占比',
      '双平台音乐播放，独家3D宇宙相册，7音源聚合',
      '专卖店收银，库存管理，CRM会员',
      '桌面端 / 移动端 / 电视端三端视频聚合平台'
    ];

    /* 降低动效偏好：直接给出首句静止文案，不做任何逐字动画 */
    if (prefersReducedMotion()) {
      el.textContent = phrases[0];
      return;
    }

    var TYPE_MS = 62;    /* 逐字打出间隔 */
    var HOLD_MS = 1500;  /* 整句停留 */
    var DEL_MS = 26;     /* 逐字删除间隔 */
    var GAP_MS = 240;    /* 句间空档 */

    var pi = 0;
    var ci = 0;
    var mode = 'type';
    var wait = 0;
    var prev = 0;
    var rafId = 0;
    var running = false;
    var visible = false;
    var started = false;

    function setText(str) {
      if (el.textContent !== str) el.textContent = str;
    }
    function duration() {
      if (mode === 'type') return TYPE_MS;
      if (mode === 'hold') return HOLD_MS;
      if (mode === 'del') return DEL_MS;
      return GAP_MS;
    }
    function advance() {
      var phrase = phrases[pi];
      if (mode === 'type') {
        if (ci < phrase.length) {
          ci++;
          setText(phrase.slice(0, ci));
        }
        if (ci >= phrase.length) mode = 'hold';
        return;
      }
      if (mode === 'hold') { mode = 'del'; return; }
      if (mode === 'del') {
        if (ci > 0) {
          ci--;
          setText(phrase.slice(0, ci));
        }
        if (ci <= 0) mode = 'gap';
        return;
      }
      pi = (pi + 1) % phrases.length;
      ci = 0;
      mode = 'type';
    }
    function frame(ts) {
      if (!running) return;
      rafId = 0;
      if (document.hidden) { prev = 0; rafId = requestAnimationFrame(frame); return; }
      if (!prev) prev = ts;
      var dt = ts - prev;
      prev = ts;
      if (dt > 200) dt = 200;            /* 长时间挂起后不追赶，避免一次跳出一整句 */
      wait += dt;
      var guard = 0;
      while (wait >= duration() && guard < 24) {
        wait -= duration();
        advance();
        guard++;
      }
      rafId = requestAnimationFrame(frame);
    }
    function start() {
      if (running || !visible || document.hidden) return;
      running = true;
      wait = 0;
      prev = 0;
      if (!started) { started = true; setText(''); }   /* 首次进入视口才清空静态文案 */
      rafId = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }

    if (typeof IntersectionObserver === 'function') {
      var observer = new IntersectionObserver(function (entries) {
        visible = !!(entries[0] && entries[0].isIntersecting);
        if (visible) start(); else stop();
      }, { threshold: 0 });
      observer.observe(el);
    } else {
      visible = true;
      start();
    }

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden && visible) start();
    });
  }

  /* --- fx-decode：区块标题「字符乱码 → 逐字解析」 ---
     安全约定：
     · 只处理没有元素子节点的宿主（含 <span class="highlight"> / <br> 的一律跳过）
     · 全程只改写 textContent，动画结束（或被降级打断）时精确还原原文
     · 乱码期同样保留空格换行，不改变文本长度与断行位置 */
  function initDecodeText() {
    var nodes = document.querySelectorAll('[data-fx-decode]');
    if (!nodes.length) return;

    var targets = [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.children.length > 0) continue;      /* 含子元素：跳过，不拆结构 */
      var raw = el.textContent || '';
      if (!raw.length) continue;
      targets.push({ el: el, raw: raw, done: false });
    }
    if (!targets.length) return;

    /* 降低动效偏好：保留准确原文，不做任何改写（也不加下划线的预备类） */
    if (prefersReducedMotion()) return;

    /* 先把 .section-title 置为「下划线待展开」状态（进入视口后再展开） */
    for (var s = 0; s < targets.length; s++) {
      var title = targets[s].el.closest ? targets[s].el.closest('.section-title') : null;
      if (title && !title.classList.contains('home-title-in')) {
        title.classList.add('home-title-armed');
      }
    }

    var GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#$%&*+=<>/|';
    var STEP_MS = 46;     /* 乱码刷新间隔 */
    var PER_CHAR = 52;    /* 每个字符的解析时长 */
    var START_DELAY = 260; /* 等 .reveal 入场动画先启动 */

    function run(item) {
      if (item.done) return;
      item.done = true;

      var title = item.el.closest ? item.el.closest('.section-title') : null;
      if (title) title.classList.add('home-title-in');

      var chars = typeof Array.from === 'function' ? Array.from(item.raw) : item.raw.split('');
      var len = chars.length;
      var total = 320 + len * PER_CHAR;
      var elapsed = 0;
      var prev = 0;
      var lastPaint = -9999;

      function paint(progress) {
        var shown = Math.floor(progress * (len + 1.2));
        var out = '';
        for (var k = 0; k < len; k++) {
          var ch = chars[k];
          if (k < shown || ch === ' ' || ch === '\n' || ch === '\t') out += ch;
          else out += GLYPHS.charAt((Math.random() * GLYPHS.length) | 0);
        }
        item.el.textContent = out;
      }

      function frame(ts) {
        if (!prev) prev = ts;
        var dt = ts - prev;
        prev = ts;
        if (dt > 120) dt = 120;                 /* 切回前台不跳帧 */
        if (!document.hidden) elapsed += dt;    /* 页面隐藏时冻结进度 */
        var progress = elapsed / total;
        if (progress >= 1) {
          item.el.textContent = item.raw;       /* 精确还原，绝不留乱码 */
          return;
        }
        if (ts - lastPaint >= STEP_MS) {
          lastPaint = ts;
          paint(progress);
        }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    function schedule(item, delay) {
      window.setTimeout(function () {
        if (prefersReducedMotion()) {             /* 中途切换偏好：还原原文 */
          item.el.textContent = item.raw;
          return;
        }
        run(item);
      }, delay);
    }

    if (typeof IntersectionObserver !== 'function') {
      for (var f = 0; f < targets.length; f++) schedule(targets[f], START_DELAY + f * 120);
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      for (var n = 0; n < entries.length; n++) {
        var entry = entries[n];
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        for (var t = 0; t < targets.length; t++) {
          if (targets[t].el === entry.target) schedule(targets[t], START_DELAY);
        }
      }
    }, { threshold: 0.45 });
    for (var m = 0; m < targets.length; m++) observer.observe(targets[m].el);
  }

  /* --- fx-reticle：桌面端科幻准星（环 + 十字 + 光点，三级跟随延迟） ---
     只在 Hero 区域内显示；触屏、<992px、prefers-reduced-motion 一律不启用。
     与既有爪印光标共存：本层 pointer-events: none，不改变任何光标样式。 */
  function initReticle() {
    var hero = document.querySelector('.hero');
    var box = document.querySelector('.home-reticle');
    if (!hero || !box || !box.parentNode) return;
    if (isCoarsePointer() || prefersReducedMotion()) return;

    var ring = box.querySelector('.home-reticle-ring');
    var cross = box.querySelector('.home-reticle-cross');
    var dot = box.querySelector('.home-reticle-dot');
    if (!ring || !cross || !dot) return;

    var host = box.parentNode;      /* .hero-inner：准星的坐标参考系 */
    var rect = null;
    var lastX = -9999;
    var lastY = -9999;
    var tx = -200, ty = -200;
    var rx = -200, ry = -200;
    var cx = -200, cy = -200;
    var dx = -200, dy = -200;
    var live = false;
    var running = false;
    var rafId = 0;

    function measure() { rect = host.getBoundingClientRect(); }
    function place(node, x, y) {
      node.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    }
    function frame() {
      rafId = 0;
      if (!live) { running = false; return; }
      if (document.hidden) { rafId = requestAnimationFrame(frame); return; }
      rx += (tx - rx) * 0.14; ry += (ty - ry) * 0.14;   /* 外环：最慢，形成拖尾 */
      cx += (tx - cx) * 0.34; cy += (ty - cy) * 0.34;   /* 十字：中速 */
      dx += (tx - dx) * 0.60; dy += (ty - dy) * 0.60;   /* 光点：最快，几乎贴合 */
      place(ring, rx, ry);
      place(cross, cx, cy);
      place(dot, dx, dy);
      /* 三级都已收敛（以最慢的外环为准）即停帧，鼠标再动时由 start() 唤醒 */
      if (Math.abs(tx - rx) < 0.5 && Math.abs(ty - ry) < 0.5) { running = false; return; }
      rafId = requestAnimationFrame(frame);
    }
    function start() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }
    function hide() {
      if (!live) return;
      live = false;
      box.classList.remove('home-reticle-on');
      stop();
    }
    function show() {
      live = true;
      rx = cx = dx = tx;
      ry = cy = dy = ty;
      box.classList.add('home-reticle-on');
      start();
    }

    hero.addEventListener('mousemove', function (e) {
      if (window.innerWidth < 992) { hide(); return; }
      if (!rect) measure();
      lastX = e.clientX;
      lastY = e.clientY;
      tx = e.clientX - rect.left;
      ty = e.clientY - rect.top;
      if (!live) show(); else start();   /* 收敛后已停帧，移动时重新唤醒 */
    }, { passive: true });

    hero.addEventListener('mouseleave', hide, { passive: true });

    /* 滚动/缩放后 Hero 已移动：重算局部坐标，移出 Hero 则隐藏
       （容差取宽屏留白量级，避免鼠标进入 Hero 两侧留白时准星闪烁） */
    var queued = false;
    function reposition() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        if (!live) return;
        measure();
        tx = lastX - rect.left;
        ty = lastY - rect.top;
        if (tx < -240 || ty < -240 || tx > rect.width + 240 || ty > rect.height + 240) { hide(); return; }
        start();          /* 坐标已变，唤醒帧循环重新贴合 */
      });
    }
    window.addEventListener('scroll', reposition, { passive: true });
    window.addEventListener('resize', reposition, { passive: true });
  }

  /* --- fx-beam：区块分隔处的能量束，随滚动推进 ---
     容器高度 0（不产生布局位移）；进度 = 分隔线穿过视口的比例。
     只写 transform：fill 用 scaleX、head 用 translate3d(百分比)。
     触屏保留（滚动驱动，与指针无关）；降低动效偏好下由 CSS 静态呈现。 */
  function initScrollBeams() {
    var boxes = document.querySelectorAll('[data-beam]');
    if (!boxes.length) return;
    if (prefersReducedMotion()) return;   /* 降级：CSS 给出静态完整光带 */

    var items = [];
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      var fill = box.querySelector('.home-beam-fill');
      var head = box.querySelector('.home-beam-head');
      if (!fill || !head) continue;
      items.push({ box: box, fill: fill, head: head, top: 0, p: -1, near: true, live: false });
    }
    if (!items.length) return;

    function scrollTop() {
      return window.pageYOffset || document.documentElement.scrollTop || 0;
    }

    var ticking = false;
    function update() {
      ticking = false;
      var vh = window.innerHeight || 1;
      var y = scrollTop();
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!it.near) continue;
        var p = (y + vh - it.top) / (vh * 0.9);
        p = p < 0 ? 0 : (p > 1 ? 1 : p);
        if (Math.abs(p - it.p) < 0.002) continue;
        it.p = p;
        it.fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        it.head.style.transform = 'translate3d(' + (p * 100).toFixed(3) + '%,0,0)';
        if (p > 0.005 && p < 0.995) {
          if (!it.live) { it.live = true; it.box.classList.add('home-beam-live'); }
        } else if (it.live) {
          it.live = false;
          it.box.classList.remove('home-beam-live');
        }
      }
    }
    function request() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }
    function measure() {
      for (var i = 0; i < items.length; i++) {
        var r = items[i].box.getBoundingClientRect();
        items[i].top = r.top + scrollTop();
      }
      request();
    }

    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('load', measure, { passive: true });
    window.setTimeout(measure, 1500);     /* 图片加载完成后重新测量 */

    if (typeof IntersectionObserver === 'function') {
      var observer = new IntersectionObserver(function (entries) {
        for (var n = 0; n < entries.length; n++) {
          for (var k = 0; k < items.length; k++) {
            if (items[k].box === entries[n].target) items[k].near = entries[n].isIntersecting;
          }
        }
        request();
      }, { rootMargin: '240px 0px' });
      for (var m = 0; m < items.length; m++) observer.observe(items[m].box);
    }

    measure();
  }

})();
