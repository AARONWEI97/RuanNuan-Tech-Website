/** 全站运行时入口（每页加载） */
import { ScrollTrigger } from './lib/scroll';
import { initAnchors } from './modules/anchors';
import { initNav } from './modules/nav';
import { initModals, initCopy } from './modules/modals';
import { initReveal, initScramble, initCounters } from './modules/reveal';
import { initPointerFx } from './modules/pointer';
import { initForms } from './modules/forms';
import { initPet } from './modules/pet';

initAnchors();
initNav();
initModals();
initCopy();
initForms();
initReveal();
initScramble();
initCounters();
initPointerFx();
initPet();

// 字体与图片就绪后重算滚动触发点
window.addEventListener('load', () => ScrollTrigger.refresh());
document.fonts?.ready.then(() => ScrollTrigger.refresh());
