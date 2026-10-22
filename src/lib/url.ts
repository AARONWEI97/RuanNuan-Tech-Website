const RAW_BASE = import.meta.env.BASE_URL;
const BASE = RAW_BASE.endsWith('/') ? RAW_BASE : `${RAW_BASE}/`;

/**
 * 站内链接 / 资源路径：自动拼接 base，并把 index.html 规范化为站点根。
 * 外链、mailto、纯锚点原样返回。
 */
export function url(path: string): string {
  if (/^(https?:|mailto:|tel:|tencent:|#)/.test(path)) return path;
  const clean = path.replace(/^\//, '').replace(/^index\.html/, '');
  return BASE + clean;
}
