/** 宠物挂件：呼吸 → 睡觉 → 靠近醒来 → 点击菜单 */
import { $, finePointer, reducedMotion } from '../lib/env';
import { scrollToTarget } from '../lib/scroll';

const SLEEP_AFTER = 20_000;
const WAKE_RADIUS = 180;

export function initPet() {
  const pet = $('#pet');
  const btn = $<HTMLButtonElement>('.pet-btn', pet ?? document);
  const say = $('[data-pet-say]', pet ?? document);
  if (!pet || !btn || !say) return;

  let sleepTimer = 0;
  let talkTimer = 0;
  const asleep = () => pet.classList.contains('is-asleep');

  const talk = (text: string, ms = 3200) => {
    if (pet.classList.contains('is-open')) return;
    say.textContent = text;
    pet.classList.add('is-talking');
    window.clearTimeout(talkTimer);
    talkTimer = window.setTimeout(() => pet.classList.remove('is-talking'), ms);
  };
  const scheduleSleep = () => {
    window.clearTimeout(sleepTimer);
    if (reducedMotion) return;
    sleepTimer = window.setTimeout(() => {
      if (pet.classList.contains('is-open')) return scheduleSleep();
      pet.classList.add('is-asleep');
      pet.classList.remove('is-talking');
    }, SLEEP_AFTER);
  };
  const wake = (greet = true) => {
    if (asleep()) {
      pet.classList.remove('is-asleep');
      pet.classList.add('is-waking');
      window.setTimeout(() => pet.classList.remove('is-waking'), 650);
      if (greet) talk('汪！我醒啦～');
    }
    scheduleSleep();
  };
  const setOpen = (open: boolean) => {
    pet.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    if (open) pet.classList.remove('is-talking');
  };

  btn.addEventListener('click', () => { wake(false); setOpen(!pet.classList.contains('is-open')); });
  btn.addEventListener('focus', () => wake(false));
  pet.querySelector('[data-pet-top]')?.addEventListener('click', () => { setOpen(false); scrollToTarget(0); });
  pet.addEventListener('click', (e) => { if ((e.target as Element).closest('[data-modal-open]')) setOpen(false); });
  document.addEventListener('click', (e) => { if (!pet.contains(e.target as Node)) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && pet.classList.contains('is-open')) { setOpen(false); btn.focus(); }
  });

  // 靠近唤醒（仅鼠标）；任何活动都重置睡眠计时
  let raf = 0;
  if (finePointer) {
    document.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!asleep()) return scheduleSleep();
        const r = btn.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        if (d < WAKE_RADIUS) wake();
      });
    }, { passive: true });
  }
  window.addEventListener('scroll', () => {
    pet.classList.toggle('is-scrolled', window.scrollY > 600);
    if (!asleep()) scheduleSleep();
  }, { passive: true });
  document.addEventListener('keydown', () => { if (!asleep()) scheduleSleep(); });

  // 每个会话只主动打一次招呼
  if (!sessionStorage.getItem('pet-greeted')) {
    window.setTimeout(() => {
      talk('汪～需要试用名额吗？点我联系开发者', 4600);
      sessionStorage.setItem('pet-greeted', '1');
    }, 5000);
  }
  scheduleSleep();
}
