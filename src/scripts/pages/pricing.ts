/** 价格页：费用计算器（总费用 = 套餐价 + 附加费 × 额外设备数，与原页面示例口径一致） */
import { $, $$ } from '../lib/env';

const root = $('[data-pr-calc]');
if (root) {
  const fee = Number(root.dataset.fee) || 0;
  const form = $<HTMLFormElement>('form', root)!;
  const input = $<HTMLInputElement>('#prDevices', root)!;
  const formula = $('[data-formula]', root)!;
  const total = $('[data-total]', root)!;
  const unit = $('[data-unit]', root)!;
  const yen = (n: number) => `¥${n.toLocaleString('en-US')}`;

  const clamp = () => {
    const n = Math.round(Number(input.value));
    input.value = String(Number.isFinite(n) ? Math.min(99, Math.max(0, n)) : 0);
  };
  const render = () => {
    clamp();
    const plan = $<HTMLInputElement>('input[name="plan"]:checked', root)!;
    const price = Number(plan.value);
    const devices = Number(input.value);
    formula.textContent = `${plan.dataset.label} ${price} + ${fee} × ${devices}`;
    total.textContent = yen(price + fee * devices);
    unit.textContent = `/${plan.dataset.unit}`;
  };

  form.addEventListener('submit', (e) => e.preventDefault());
  form.addEventListener('change', render);
  input.addEventListener('input', render);
  $$<HTMLButtonElement>('[data-step]', root).forEach((b) => b.addEventListener('click', () => {
    input.value = String(Number(input.value) + Number(b.dataset.step));
    render();
  }));
  render();
}
