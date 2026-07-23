/* ============================
   冉暖科技 — Homepage Animations
   Constellation Network + Paw Particles
   3D Cards + Mouse Glow + Counter
   ============================ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initConstellationParticles();
    initMouseGlow();
    init3DCards();
    initCounter();
    initTitleChars();
  });

  /* --- Constellation Network + Paw Particles (Canvas) --- */
  function initConstellationParticles() {
    var canvas = document.querySelector('.hero-particles');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var nodes = [];
    var paws = [];
    var travelers = [];   // 沿连线流动的脉冲光点
    var isMobile = window.innerWidth < 768;
    var maxNodes = isMobile ? 34 : 88;
    var maxPaws = 12;
    var connectDist = 165;
    var time = 0;

    // 鼠标引力场
    var mouse = { x: -9999, y: -9999 };
    var hero = canvas.parentElement;
    if (hero) {
      hero.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }, { passive: true });
      hero.addEventListener('mouseleave', function () {
        mouse.x = -9999; mouse.y = -9999;
      });
    }

    function resize() {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);

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
      if (travelers.length >= 8) return;
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
      positions.forEach(function (p) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, toeR, 0, Math.PI * 2);
        ctx.fill();
      });

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

    function animate() {
      time += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn
      if (Math.random() < 0.08 && nodes.length < maxNodes) spawnNode();
      if (Math.random() < 0.02) spawnPaw();

      // Update & draw nodes
      nodes.forEach(function (n) {
        // 鼠标引力：靠近的节点被温柔吸引，星座网产生呼吸般的聚拢
        var dxm = mouse.x - n.x, dym = mouse.y - n.y;
        var dm = Math.sqrt(dxm * dxm + dym * dym);
        if (dm < 220 && dm > 0.1) {
          var f = (1 - dm / 220) * 0.014;
          n.vx += (dxm / dm) * f;
          n.vy += (dym / dm) * f;
        }
        // 阻尼 + 最低漂移速度，防止粒子静止
        n.vx *= 0.985;
        n.vy *= 0.985;
        if (Math.abs(n.vx) < 0.04) n.vx += (Math.random() - 0.5) * 0.02;
        if (Math.abs(n.vy) < 0.04) n.vy += (Math.random() - 0.5) * 0.02;

        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

        // 呼吸脉动
        var pulse = 0.7 + Math.sin(time * 1.8 + n.phase) * 0.3;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * (0.8 + pulse * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212,148,58,' + (n.opacity * pulse) + ')';
        ctx.fill();
      });

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
            if (Math.random() < 0.0012 && travelers.length < 8) {
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
      paws.forEach(function (p) {
        p.y -= p.speed;
        p.x += p.drift;
        p.rotation += 0.002;

        if (p.phase === 'in') {
          p.opacity += 0.006;
          if (p.opacity >= p.maxOpacity) p.phase = 'hold';
        } else if (p.y < canvas.height * 0.15) {
          p.phase = 'out';
          p.opacity -= 0.004;
        }

        if (p.opacity > 0) drawPaw(p.x, p.y, p.size, p.opacity, p.rotation);
      });

      paws = paws.filter(function (p) { return p.opacity > 0 && p.y > -50; });

      requestAnimationFrame(animate);
    }

    // Initial nodes（直接铺满 70%，剩余由动画逐渐生成）
    var initialCount = Math.floor(maxNodes * 0.7);
    for (var i = 0; i < initialCount; i++) spawnNode();
    // Initial paws
    for (var j = 0; j < 4; j++) {
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

    animate();
  }

  /* --- Mouse Follow Glow --- */
  function initMouseGlow() {
    var glow = document.querySelector('.hero-mouse-glow');
    if (!glow) return;
    var hero = document.querySelector('.hero');
    if (!hero) return;

    hero.addEventListener('mousemove', function (e) {
      var rect = hero.getBoundingClientRect();
      glow.style.left = (e.clientX - rect.left) + 'px';
      glow.style.top = (e.clientY - rect.top) + 'px';
    });
  }

  /* --- 3D Tilt Cards with holographic angle + particle trail --- */
  function init3DCards() {
    var cards = document.querySelectorAll('.product-card-3d');
    cards.forEach(function (card) {
      // Particle trail on hover
      var particleTimer = null;
      card.addEventListener('mouseenter', function () {
        particleTimer = setInterval(function () {
          spawnCardParticle(card);
        }, 60);
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = '';
        if (particleTimer) { clearInterval(particleTimer); particleTimer = null; }
      });

      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var centerX = rect.width / 2;
        var centerY = rect.height / 2;
        var rotateX = ((y - centerY) / centerY) * -8;
        var rotateY = ((x - centerX) / centerX) * 8;
        card.style.transform = 'perspective(800px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale(1.03)';

        // Update holographic border angle
        var angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
        card.style.setProperty('--card-angle', angle + 'deg');
      });
    });
  }

  /* Spawn a tiny particle near the card edge */
  function spawnCardParticle(card) {
    var rect = card.getBoundingClientRect();
    var el = document.createElement('div');
    el.style.cssText = 'position:fixed;width:4px;height:4px;border-radius:50%;pointer-events:none;z-index:9999;transition:all 0.8s ease-out;';

    // Pick color based on card type
    var color = 'rgba(212,148,58,0.8)';
    if (card.classList.contains('card-2')) color = 'rgba(240,107,94,0.8)';
    if (card.classList.contains('card-3')) color = 'rgba(123,174,127,0.8)';
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

    // Animate outward + fade
    requestAnimationFrame(function () {
      var dx = (Math.random() - 0.5) * 40;
      var dy = (Math.random() - 0.5) * 40;
      el.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(0)';
      el.style.opacity = '0';
    });

    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 900);
  }

  /* --- Number Counter Animation --- */
  function initCounter() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;

    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { obs.observe(el); });
  }

  function animateCounter(el) {
    var target = el.getAttribute('data-count');
    var suffix = el.getAttribute('data-suffix') || '';
    var isFloat = target.indexOf('.') !== -1;
    var end = parseFloat(target);
    var duration = 1500;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(2, -10 * progress);
      var current = end * eased;
      el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }

  /* --- Title Character Split Animation --- */
  function initTitleChars() {
    var titleEl = document.querySelector('.hero-title');
    if (!titleEl) return;

    var lines = titleEl.querySelectorAll('.line-inner');
    lines.forEach(function (line) {
      var text = line.textContent;
      var html = '';
      for (var i = 0; i < text.length; i++) {
        var ch = text[i];
        if (ch === ' ') {
          html += ' ';
        } else {
          var delay = 0.3 + i * 0.04;
          html += '<span class="char" style="animation-delay:' + delay + 's">' + ch + '</span>';
        }
      }
      line.innerHTML = html;
    });
  }

})();
