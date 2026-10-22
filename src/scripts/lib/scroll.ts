/**
 * 平滑滚动（Lenis）+ GSAP ScrollTrigger 同步。模块单例，site.ts / home.ts 共享。
 * 减少动态效果时不启用 Lenis，退回原生滚动。
 */
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { reducedMotion } from './env';

gsap.registerPlugin(ScrollTrigger);

export const lenis: Lenis | null = reducedMotion
  ? null
  : new Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: false });

if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

export function scrollToTarget(target: Element | number, offset = 0) {
  if (lenis) {
    lenis.scrollTo(target as HTMLElement | number, { offset, duration: 1.2 });
  } else {
    const top = typeof target === 'number' ? target : target.getBoundingClientRect().top + window.scrollY + offset;
    window.scrollTo({ top, behavior: reducedMotion ? 'auto' : 'smooth' });
  }
}

/** 弹层打开时锁定背景滚动 */
export function lockScroll(locked: boolean) {
  if (lenis) (locked ? lenis.stop() : lenis.start());
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}

export { gsap, ScrollTrigger };
