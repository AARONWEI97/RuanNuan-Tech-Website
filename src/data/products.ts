/**
 * 产品单一数据源：版本号、状态、截图、技术栈只在这里改，全站同步。
 * 文案取自旧版 index.html，不新增功能描述。
 */
export type ProductId = 'order' | 'music' | 'epos' | 'tv';

export interface Product {
  id: ProductId;
  name: string;
  en: string;
  href: string;
  icon: string;
  /** 主题色（CSS 颜色），用于章节高亮、卡片描边 */
  accent: string;
  version: string;
  /** 多端版本：显示在信号条等位置 */
  platforms?: { label: string; version: string }[];
  status: string;
  stable: boolean;
  tagline: string;
  desc: string;
  features: string[];
  tech: string[];
  shot: { src: string; width: number; height: number };
}

export const products: Product[] = [
  {
    id: 'order',
    name: '冉暖订货系统',
    en: 'RanNuan Order',
    href: 'order.html',
    icon: 'fa6-solid:clipboard-list',
    accent: '#D4943A',
    version: 'V 3.3.6',
    status: '稳定运营',
    stable: true,
    tagline: 'AI智能订货，批量分配，尺码占比',
    desc: '专为鞋服零售打造的AI智能订货管理工具，支持批量分配、尺码占比计算、数据报表分析，提升订货效率80%以上。',
    features: ['AI自动调整尺码比例', '批量分配与智能占比', '数据报表与同期对比', 'Excel导入导出', '多端协同（桌面+Web）'],
    tech: ['Vue 3', 'Element Plus', 'TailwindCSS', 'FastAPI'],
    shot: { src: 'assets/screenshot-order.png', width: 1910, height: 873 },
  },
  {
    id: 'music',
    name: '冉暖音乐播放器',
    en: 'RanNuan Music',
    href: 'music.html',
    icon: 'fa6-solid:headphones',
    accent: '#F06B5E',
    version: 'v3.9.6',
    platforms: [
      { label: '桌面端', version: 'v3.9.6' },
      { label: '移动端', version: 'v1.1.0' },
    ],
    status: '桌面版已发布',
    stable: true,
    tagline: '双平台音乐播放，独家3D宇宙相册，7音源聚合',
    desc: '桌面 + 移动双平台音乐播放器，7 大音源解析、桌面歌词、系统托盘控制。v3.9.6 重磅上线 3D 宇宙相册、电台功能、评论系统、下载管理、听歌热力图，照片化作行星，打造沉浸式音乐宇宙体验。',
    features: ['7 大音源自动降级切换', '桌面歌词 + 系统托盘', '全局快捷键控制', '下载管理 + 离线播放', '深色模式 + 启动动画'],
    tech: ['Tauri 2.x', 'React 19', 'React Native', 'TypeScript'],
    shot: { src: 'assets/music/universe.png', width: 1375, height: 1000 },
  },
  {
    id: 'epos',
    name: '冉暖收银系统',
    en: 'RanNuan ePOS',
    href: 'epos.html',
    icon: 'fa6-solid:cash-register',
    accent: '#7BAE7F',
    version: 'V 3.0.9',
    status: '快速迭代',
    stable: false,
    tagline: '专卖店收银，库存管理，CRM会员',
    desc: '运动品牌专卖店ePOS收银系统，前台收银+后台管理双系统架构，覆盖商品、库存、财务、CRM全链路。',
    features: ['紧凑型POS收银台', '商品运营与审核', '仓储物流与盘点', 'CRM会员与储值', '多标签页后台管理'],
    tech: ['React', 'Electron', 'NestJS', 'Prisma'],
    shot: { src: 'assets/screenshot-epos.png', width: 1920, height: 1020 },
  },
  {
    id: 'tv',
    name: '冉暖视频播放器',
    en: 'RanNuan TV',
    href: 'tv.html',
    icon: 'fa6-solid:tv',
    accent: '#E8B86D',
    version: 'v2.1.7',
    platforms: [
      { label: '桌面端', version: 'v2.2.0' },
      { label: '移动端', version: 'v2.1.7' },
      { label: '电视端', version: 'v1.0.0' },
    ],
    status: '已完成',
    stable: true,
    tagline: '桌面端 / 移动端 / 电视端三端视频聚合平台',
    desc: '覆盖桌面端、Android 移动端与电视端的三端视频平台，支持多源聚合、详情页直达、分类浏览与播放体验优化。',
    features: ['桌面 / 移动 / 电视三端同步', '多源聚合与详情页直达', '分类、搜索、播放链路优化', '选集动画与播放源显示', '持续迭代中'],
    tech: ['Kotlin', 'Compose', 'React', 'Node.js'],
    shot: { src: 'assets/video/home.png', width: 1920, height: 1020 },
  },
];

export const productById = (id: ProductId) => products.find((p) => p.id === id)!;

/** 全站技术栈去重（用于首页技术云） */
export const allTech = [...new Set(products.flatMap((p) => p.tech))];
