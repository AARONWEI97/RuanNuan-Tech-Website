/**
 * 冉暖科技 - 炫酷科技动画系统
 * Warm Pet Style + Sci-Fi Tech Animations
 */

(function() {
  'use strict';

  // ============================================
  // 初始化所有动画效果
  // ============================================
  document.addEventListener('DOMContentLoaded', function() {
    initParticleSystem();
    init3DCardEffects();
    initMagneticButtons();
    initParallaxScroll();
    initGlowTracking();
    initScrollAnimations();
    initCounterAnimations();
    initTypewriterEffect();
    initSmoothReveal();
  });

  // ============================================
  // 1. 爪印粒子系统
  // ============================================
  function initParticleSystem() {
    const container = document.querySelector('.paw-particles') || createParticleContainer();
    
    function createParticleContainer() {
      const div = document.createElement('div');
      div.className = 'paw-particles';
      document.body.prepend(div);
      return div;
    }

    // 动态创建爪印粒子
    const colors = ['#D4943A', '#F06B5E', '#7BAE7F'];
    const particleCount = window.innerWidth > 768 ? 8 : 4;
    
    for (let i = 0; i < particleCount; i++) {
      createParticle(container, i, colors, particleCount);
    }
  }

  function createParticle(container, index, colors, total) {
    const particle = document.createElement('div');
    particle.className = 'paw-particle';
    
    const color = colors[index % colors.length];
    const left = (index / total) * 100 + Math.random() * 10 - 5;
    const delay = index * 2;
    const duration = 12 + Math.random() * 8;
    const size = 16 + Math.random() * 12;
    
    particle.style.cssText = `
      left: ${left}%;
      width: ${size}px;
      height: ${size}px;
      animation-delay: ${delay}s;
      animation-duration: ${duration}s;
    `;
    
    // 设置爪印颜色
    particle.style.setProperty('--paw-color', color);
    particle.querySelector = () => null;
    
    // 创建SVG爪印
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" style="width:100%;height:100%;">
        <ellipse cx="14" cy="17" rx="7" ry="8.5" fill="${color}" opacity="0.6"/>
        <circle cx="6" cy="8" r="3.2" fill="${color}" opacity="0.6"/>
        <circle cx="10.5" cy="4.5" r="3" fill="${color}" opacity="0.6"/>
        <circle cx="17.5" cy="4.5" r="3" fill="${color}" opacity="0.6"/>
        <circle cx="22" cy="8" r="3.2" fill="${color}" opacity="0.6"/>
      </svg>
    `;
    
    particle.innerHTML = svg;
    container.appendChild(particle);
    
    // 重新触发动画
    setTimeout(() => {
      particle.style.animation = 'none';
      particle.offsetHeight; // 触发重排
      particle.style.animation = `paw-float ${duration}s linear infinite`;
      particle.style.animationDelay = `${delay}s`;
    }, 100);
  }

  // ============================================
  // 2. 3D卡片倾斜效果
  // ============================================
  function init3DCardEffects() {
    const cards = document.querySelectorAll('.card-3d, .product-card-3d, .feature-card');
    
    cards.forEach(card => {
      card.addEventListener('mousemove', handleCardMouseMove);
      card.addEventListener('mouseleave', handleCardMouseLeave);
      
      // 添加3D内层
      if (!card.querySelector('.card-3d-inner')) {
        const inner = document.createElement('div');
        inner.className = 'card-3d-inner';
        inner.innerHTML = card.innerHTML;
        card.innerHTML = '';
        card.appendChild(inner);
      }
    });
    
    function handleCardMouseMove(e) {
      const card = e.currentTarget;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / centerY * -10;
      const rotateY = (x - centerX) / centerX * 10;
      
      const inner = card.querySelector('.card-3d-inner');
      if (inner) {
        inner.style.transform = `
          perspective(1000px)
          rotateX(${rotateX}deg)
          rotateY(${rotateY}deg)
          translateZ(20px)
        `;
      }
      
      // 添加光泽效果
      const shine = card.querySelector('.card-shine') || createShine(card);
      const shineX = (x / rect.width) * 100;
      const shineY = (y / rect.height) * 100;
      shine.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, 
        rgba(255,255,255,0.2) 0%, 
        transparent 60%)`;
    }
    
    function handleCardMouseLeave(e) {
      const card = e.currentTarget;
      const inner = card.querySelector('.card-3d-inner');
      if (inner) {
        inner.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
      }
      
      const shine = card.querySelector('.card-shine');
      if (shine) shine.style.background = 'transparent';
    }
    
    function createShine(card) {
      const shine = document.createElement('div');
      shine.className = 'card-shine';
      shine.style.cssText = `
        position: absolute;
        inset: 0;
        pointer-events: none;
        border-radius: inherit;
        transition: background 0.3s ease;
        z-index: 2;
      `;
      card.appendChild(shine);
      return shine;
    }
  }

  // ============================================
  // 3. 磁吸按钮效果
  // ============================================
  function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn-magnetic, .btn');
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    
    if (isTouchDevice) return;
    
    buttons.forEach(btn => {
      btn.addEventListener('mousemove', handleMagneticMove);
      btn.addEventListener('mouseleave', handleMagneticLeave);
    });
    
    function handleMagneticMove(e) {
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const distance = Math.sqrt(x * x + y * y);
      const maxDistance = 20;
      
      if (distance < 100) {
        const moveX = (x / rect.width) * maxDistance;
        const moveY = (y / rect.height) * maxDistance;
        btn.style.transform = `translate(${moveX}px, ${moveY}px)`;
        
        // 更新光效位置
        const percentX = ((e.clientX - rect.left) / rect.width) * 100;
        const percentY = ((e.clientY - rect.top) / rect.height) * 100;
        btn.style.setProperty('--mouse-x', percentX + '%');
        btn.style.setProperty('--mouse-y', percentY + '%');
      }
    }
    
    function handleMagneticLeave(e) {
      const btn = e.currentTarget;
      btn.style.transform = 'translate(0, 0)';
    }
  }

  // ============================================
  // 4. 视差滚动效果
  // ============================================
  function initParallaxScroll() {
    const parallaxElements = document.querySelectorAll('.parallax-slow, .parallax-medium, .parallax-fast');
    
    let ticking = false;
    
    function updateParallax() {
      const scrollY = window.pageYOffset;
      
      parallaxElements.forEach(el => {
        const speed = el.classList.contains('parallax-fast') ? 0.5 :
                     el.classList.contains('parallax-medium') ? 0.3 : 0.1;
        const yPos = scrollY * speed;
        el.style.transform = `translateY(${yPos}px)`;
      });
      
      ticking = false;
    }
    
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  // ============================================
  // 5. 光标追踪光效
  // ============================================
  function initGlowTracking() {
    const trackElements = document.querySelectorAll('.card-glow-track, .glow-track');
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    
    if (isTouchDevice) return;
    
    trackElements.forEach(el => {
      el.addEventListener('mousemove', handleGlowMove);
      el.addEventListener('mouseleave', handleGlowLeave);
    });
    
    function handleGlowMove(e) {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      el.style.setProperty('--glow-x', x + 'px');
      el.style.setProperty('--glow-y', y + 'px');
      
      const after = el.querySelector('::after');
      if (after) {
        after.style.left = x + 'px';
        after.style.top = y + 'px';
      }
    }
    
    function handleGlowLeave(e) {
      const el = e.currentTarget;
      el.style.removeProperty('--glow-x');
      el.style.removeProperty('--glow-y');
    }
  }

  // ============================================
  // 6. 滚动触发动画增强
  // ============================================
  function initScrollAnimations() {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: [0, 0.1, 0.5, 1]
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          
          // 添加延迟类
          const delay = el.dataset.delay || 0;
          setTimeout(() => {
            el.classList.add('active', 'visible');
            
            // 触发子元素动画
            const children = el.querySelectorAll('.reveal-child');
            children.forEach((child, i) => {
              setTimeout(() => {
                child.classList.add('visible');
              }, i * 100);
            });
          }, delay * 1000);
          
          observer.unobserve(el);
        }
      });
    }, observerOptions);
    
    // 观察所有需要动画的元素
    const animatedElements = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-up'
    );
    animatedElements.forEach(el => observer.observe(el));
  }

  // ============================================
  // 7. 数字计数动画
  // ============================================
  function initCounterAnimations() {
    const counters = document.querySelectorAll('.counter');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.dataset.target) || 0;
          const duration = parseInt(counter.dataset.duration) || 2000;
          animateCounter(counter, target, duration);
          observer.unobserve(counter);
        }
      });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
    
    function animateCounter(element, target, duration) {
      let start = 0;
      const increment = target / (duration / 16);
      const startTime = performance.now();
      
      function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(target * easeOutQuart);
        
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          element.textContent = target.toLocaleString();
        }
      }
      
      requestAnimationFrame(update);
    }
  }

  // ============================================
  // 8. 打字机效果
  // ============================================
  function initTypewriterEffect() {
    const typewriters = document.querySelectorAll('.typewriter');
    
    typewriters.forEach(el => {
      const text = el.textContent;
      el.textContent = '';
      el.style.width = '0';
      
      let i = 0;
      const speed = el.dataset.speed || 50;
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            typeWriter(el, text, speed);
            observer.unobserve(el);
          }
        });
      });
      
      observer.observe(el);
    });
    
    function typeWriter(el, text, speed) {
      let i = 0;
      el.style.width = 'auto';
      
      function type() {
        if (i < text.length) {
          el.textContent += text.charAt(i);
          i++;
          setTimeout(type, speed);
        }
      }
      
      type();
    }
  }

  // ============================================
  // 9. 平滑显示动画
  // ============================================
  function initSmoothReveal() {
    const reveals = document.querySelectorAll('.smooth-reveal');
    
    reveals.forEach((el, index) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
      
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  // ============================================
  // 10. 平滑滚动到锚点
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        
        const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ============================================
  // 11. 添加CSS类工具
  // ============================================
  window.ScifiAnimations = {
    refreshParticles: initParticleSystem,
    refresh3DCards: init3DCardEffects,
    refreshMagnetic: initMagneticButtons,
    triggerReveal: function(selector) {
      document.querySelectorAll(selector).forEach(el => {
        el.classList.add('visible', 'active');
      });
    }
  };

})();
