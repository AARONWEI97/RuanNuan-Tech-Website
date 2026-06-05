/* ============================
   冉暖科技 — Global JS
   ============================ */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    initScrollReveal();
    initBackToTop();
    initSmoothScroll();
    initMobileMenu();
    initContactForm();
    initModals();
  });

  /* --- Nav scroll effect --- */
  function initNav() {
    var nav = document.querySelector('.nav');
    if (!nav) return;
    var scrollY = window.scrollY;
    nav.classList.toggle('scrolled', scrollY > 50);
    window.addEventListener('scroll', function () {
      nav.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  /* --- Scroll reveal (IntersectionObserver) --- */
  function initScrollReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      els.forEach(function (el) { obs.observe(el); });
    } else {
      els.forEach(function (el) { el.classList.add('visible'); });
    }
  }

  /* --- Back to top --- */
  function initBackToTop() {
    var btn = document.querySelector('.back-to-top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* --- Smooth scroll --- */
  function initSmoothScroll() {
    var nav = document.querySelector('.nav');
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = this.getAttribute('href');
        if (id === '#') return;
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          var offset = nav ? nav.offsetHeight : 0;
          var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top: top, behavior: 'smooth' });
        }
      });
    });
  }

  /* --- Mobile menu --- */
  function initMobileMenu() {
    var menu = document.querySelector('.mobile-menu');
    if (!menu) return;
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { menu.classList.remove('active'); });
    });
  }
  window.toggleMobileMenu = function () {
    var menu = document.querySelector('.mobile-menu');
    var btn = document.querySelector('.mobile-menu-btn');
    if (menu) menu.classList.toggle('active');
    if (btn) btn.classList.toggle('active');
  };

  /* --- Contact form --- */
  function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.querySelector('.success-msg');
      fetch(form.action, { method: 'POST', body: new FormData(form) })
        .then(function (r) {
          if (r.ok) {
            if (msg) msg.style.display = 'block';
            form.reset();
            setTimeout(function () { if (msg) msg.style.display = 'none'; }, 5000);
          } else throw new Error('fail');
        })
        .catch(function () { alert('提交失败，请稍后重试或直接联系微信/QQ'); });
    });
  }

  /* --- Modals --- */
  function initModals() {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeWechatModal(); closeQQModal(); }
    });
  }
  window.openWechatModal = function () {
    var m = document.getElementById('wechatModal');
    if (!m) return;
    m.style.display = 'flex'; m.offsetHeight;
    m.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  window.closeWechatModal = function (e) {
    var m = document.getElementById('wechatModal');
    if (!m) return;
    if (e && e.target !== e.currentTarget && !e.target.closest('.modal-close')) return;
    m.classList.remove('active');
    setTimeout(function () { m.style.display = 'none'; document.body.style.overflow = ''; }, 300);
  };
  window.openQQModal = function () {
    var m = document.getElementById('qqModal');
    if (!m) return;
    m.style.display = 'flex'; m.offsetHeight;
    m.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  window.closeQQModal = function (e) {
    var m = document.getElementById('qqModal');
    if (!m) return;
    if (e && e.target !== e.currentTarget && !e.target.closest('.modal-close')) return;
    m.classList.remove('active');
    setTimeout(function () { m.style.display = 'none'; document.body.style.overflow = ''; }, 300);
  };
  window.copyToClipboard = function (id, btn) {
    var el = document.getElementById(id);
    if (!el) return;
    var text = el.innerText;
    navigator.clipboard.writeText(text).then(function () {
      if (btn) {
        var orig = btn.innerText;
        btn.innerText = '已复制'; btn.style.background = '#7BAE7F';
        setTimeout(function () { btn.innerText = orig; btn.style.background = ''; }, 2000);
      }
    }, function () { prompt('复制失败，请手动复制：', text); });
  };
})();
