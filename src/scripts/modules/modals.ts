/** 联系弹窗（原生 dialog）+ 复制按钮 */
import { $$, announce } from '../lib/env';
import { lockScroll } from '../lib/scroll';

export function initModals() {
  document.addEventListener('click', (e) => {
    const opener = (e.target as Element).closest<HTMLElement>('[data-modal-open]');
    if (opener) {
      const dialog = document.getElementById(`modal-${opener.dataset.modalOpen}`) as HTMLDialogElement | null;
      if (!dialog) return;
      e.preventDefault();
      // 从移动菜单 / 宠物菜单里打开时，先收起它们
      const mmenu = document.getElementById('mobileMenu') as HTMLDialogElement | null;
      if (mmenu?.open) mmenu.close();
      $$<HTMLDialogElement>('dialog.modal[open]').forEach((d) => d.close());
      dialog.showModal();
      lockScroll(true);
      return;
    }
    if ((e.target as Element).closest('[data-modal-close]')) {
      (e.target as Element).closest<HTMLDialogElement>('dialog')?.close();
    }
  });

  $$<HTMLDialogElement>('dialog.modal').forEach((dialog) => {
    // 点遮罩（dialog 自身而非卡片）关闭
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', () => lockScroll(false));
  });
}

export function initCopy() {
  document.addEventListener('click', async (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('[data-copy]');
    if (!btn) return;
    const text = document.querySelector(btn.dataset.copy!)?.textContent?.trim() ?? '';
    const ok = await copyText(text);
    const label = btn.textContent;
    btn.textContent = ok ? '已复制' : '复制失败';
    btn.classList.toggle('is-done', ok);
    announce(ok ? `已复制到剪贴板：${text}` : '复制失败，请手动选择文本后复制');
    window.setTimeout(() => { btn.textContent = label; btn.classList.remove('is-done'); }, 1800);
  });
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}
