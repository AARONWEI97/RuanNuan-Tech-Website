/** 首页专属动效 */
import { $, $$, finePointer, isDesktop, reducedMotion } from './lib/env';
import { gsap, ScrollTrigger } from './lib/scroll';
import { createHeatfield } from './lib/heatfield';

initHero();
initChapters();
initStoryLine();

function initHero() {
  const hero = $('#hero');
  const canvas = $<HTMLCanvasElement>('.hero-canvas');
  if (!hero || !canvas) return;

  // 温度场：进入视口才跑
  const field = createHeatfield(canvas, hero);
  if (field) {
    new IntersectionObserver(([en]) => (en.isIntersecting ? field.start() : field.stop())).observe(hero);
  }

  // Hero 吸顶：比视口高时（窄屏）让底部先露出来再吸住
  const setTop = () => hero.style.setProperty('--hero-top', `${Math.min(0, window.innerHeight - hero.offsetHeight)}px`);
  setTop();
  new ResizeObserver(setTop).observe(hero);

  // 下一屏覆盖上来时：Hero 缩小、变暗
  const scaler = $('.hero-scaler', hero);
  if (scaler && !reducedMotion) {
    gsap.to(scaler, {
      scale: 0.92, opacity: 0.35, yPercent: -4, ease: 'none',
      scrollTrigger: { trigger: '#products', start: 'top bottom', end: 'top top', scrub: true },
    });
  }

  // 悬浮窗口：鼠标 3D 视差
  const stage = $('[data-hero-stage]', hero);
  if (stage && finePointer && !reducedMotion) {
    const rx = gsap.quickTo(stage, 'rotationX', { duration: 1, ease: 'power3.out' });
    const ry = gsap.quickTo(stage, 'rotationY', { duration: 1, ease: 'power3.out' });
    hero.addEventListener('pointermove', (e) => {
      if (!isDesktop()) return;
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      ry(nx * 14); rx(-ny * 10);
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { rx(0); ry(0); });
  }
}

function initChapters() {
  const root = $('[data-chapters]');
  if (!root) return;
  const chapters = $$('[data-chapter]', root);
  const shots = $$('[data-shot]', root);
  const titles = $$('[data-title]', root);
  const ticks = $$('[data-tick]', root);
  const scan = $('.chapters-scan', root);
  const glow = $('.chapters-glow', root);
  let current = -1;

  const activate = (i: number) => {
    if (i === current) return;
    current = i;
    [chapters, shots, titles, ticks].forEach((list) => list.forEach((el, j) => el.classList.toggle('is-active', j === i)));
    glow?.style.setProperty('--glow', chapters[i].style.getPropertyValue('--accent'));
    if (scan && !reducedMotion) {
      scan.classList.remove('is-run');
      void scan.offsetWidth;
      scan.classList.add('is-run');
    }
  };
  activate(0);

  chapters.forEach((ch, i) => {
    ScrollTrigger.create({
      trigger: ch,
      start: 'top 55%',
      end: 'bottom 55%',
      onToggle: (self) => self.isActive && activate(i),
      onUpdate: (self) => ticks[i]?.querySelector('i')?.style.setProperty('--p', self.progress.toFixed(3)),
      onLeave: () => ticks[i]?.querySelector('i')?.style.setProperty('--p', '1'),
      onLeaveBack: () => ticks[i]?.querySelector('i')?.style.setProperty('--p', '0'),
    });
  });
}

function initStoryLine() {
  const line = $('[data-story-line]');
  if (!line) return;
  if (reducedMotion) { line.style.setProperty('--draw', '1'); return; }
  ScrollTrigger.create({
    trigger: line,
    start: 'top 70%',
    end: 'bottom 60%',
    onUpdate: (self) => line.style.setProperty('--draw', self.progress.toFixed(3)),
    onLeave: () => line.style.setProperty('--draw', '1'),
  });
}
