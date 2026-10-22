export const site = {
  name: '冉暖科技',
  nameEn: 'RanNuan Tech',
  url: 'https://ranuan.netlify.app',
  slogan: '用技术创造温暖',
  description: '用技术创造温暖。专注鞋服零售、视频娱乐平台与音乐领域的软件开发团队。',
  ogImage: 'https://ranuan.netlify.app/assets/music/universe.png',
  email: 'aaronwei97@qq.com',
  wechat: 'AaronWei24',
  qq: '249861749',
  formAction: 'https://formsubmit.co/249861749@qq.com',
};

/** 主导航（产品项由大菜单单独渲染） */
export const navLinks = [
  { href: 'pricing.html', label: '价格方案', page: 'pricing' },
  { href: 'tutorials.html', label: '使用教程', page: 'tutorials' },
  { href: 'changelog.html', label: '更新日志', page: 'changelog' },
  { href: 'index.html#about', label: '关于', page: 'about' },
];

export const footerColumns = [
  {
    title: '产品',
    links: [
      { href: 'order.html', label: '冉暖订货系统' },
      { href: 'music.html', label: '冉暖音乐播放器' },
      { href: 'epos.html', label: '冉暖收银系统' },
      { href: 'tv.html', label: '冉暖视频播放器' },
    ],
  },
  {
    title: '帮助支持',
    links: [
      { href: 'index.html#contact', label: '联系我们' },
      { href: 'pricing.html', label: '价格方案' },
      { href: 'tutorials.html', label: '使用教程' },
      { href: 'faq.html', label: '常见问题' },
    ],
  },
  {
    title: '了解更多',
    links: [
      { href: 'index.html#about', label: '关于我们' },
      { href: 'changelog.html', label: '更新日志' },
      { href: 'roadmap.html', label: '功能路线图' },
    ],
  },
];
