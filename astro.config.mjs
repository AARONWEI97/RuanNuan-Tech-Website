// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ranuan.netlify.app',
  // 输出 order.html 这类扁平文件，保持旧网址与外链不失效
  build: { format: 'file' },
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
});
