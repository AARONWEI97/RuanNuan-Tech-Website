/**
 * 留言表单：有 JS 时异步提交 + 状态播报；失败降级为原生 POST（不丢留言）。
 * no-cors：静态站读不到第三方表单服务的响应，但请求会送达。
 */
import { $$, announce } from '../lib/env';

export function initForms() {
  $$<HTMLFormElement>('form[data-async]').forEach((form) => {
    const status = form.querySelector<HTMLElement>('[data-form-status]');
    const btn = form.querySelector<HTMLButtonElement>('[type="submit"]');
    const set = (msg: string, kind: 'pending' | 'ok' | 'error') => {
      if (!status) return;
      status.textContent = msg;
      status.dataset.kind = kind;
      announce(msg);
    };

    form.addEventListener('submit', (e) => {
      if (form.dataset.native === 'true') return;
      e.preventDefault();
      if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
      set('正在提交，请稍候…', 'pending');
      fetch(form.action, { method: 'POST', body: new FormData(form), mode: 'no-cors' })
        .then(() => {
          set('提交成功，感谢您的留言！我们会尽快与您联系。', 'ok');
          form.reset();
        })
        .catch(() => {
          set('网络异常，正在改用普通方式提交…', 'pending');
          form.dataset.native = 'true';
          form.submit();
        })
        .finally(() => {
          if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
        });
    });
  });
}
