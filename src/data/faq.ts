/**
 * 常见问题：faq 页与 FAQPage JSON-LD 共用（问答逐字取自旧版 faq.html）。
 * 分组 id 是产品页「查看详情」的深链目标：faq.html#order / #music / #epos
 */
export interface FaqGroup {
  id: string;
  /** 对应 products.ts 的 id；非产品分组用 general */
  product: 'order' | 'music' | 'epos' | 'general';
  title: string;
  icon: string;
  items: { q: string; a: string }[];
}

export const faqGroups: FaqGroup[] = [
  {
    id: 'order', product: 'order', title: '冉暖订货系统', icon: 'fa6-solid:clipboard-list',
    items: [
      { q: '支持哪些Excel格式导入？', a: '支持 .xlsx 和 .xls 格式。建议使用系统提供的模板文件，确保列名和数据格式匹配。支持批量导入最多5000行数据。' },
      { q: 'AI尺码比例准确率如何？', a: 'AI模型基于历史销售数据和行业尺码分布规律训练，准确率通常在85%以上。你可以随时手动微调比例，系统会记录你的调整偏好。' },
      { q: '数据能否多端同步？', a: '支持。桌面端（Windows/Mac）和Web端数据实时同步，使用同一账号登录即可。' },
    ],
  },
  {
    id: 'music', product: 'music', title: '冉暖音乐播放器', icon: 'fa6-solid:headphones',
    items: [
      { q: '支持哪些音源平台？', a: '支持网易云、QQ音乐、酷狗、酷我、咪咕、波点、GD音乐共 7 大音源平台，支持多策略解析和自动降级切换。' },
      { q: '音源解析失效怎么办？', a: '内置多策略解析引擎和多音源自动降级切换，单个音源失效自动切换到备用音源。确保App保持最新版本，或在设置中手动切换音源。' },
      { q: '下载的歌曲可以导出吗？', a: '下载的歌曲保存在App私有目录中，支持打开下载文件夹。IndexedDB 持久化存储，刷新不丢失。下载管理页可查看所有已下载歌曲。' },
      { q: '桌面版支持哪些系统？', a: '目前支持 Windows 系统。基于 Tauri 2.x 框架，理论上可扩展支持 macOS 和 Linux，如需求大可考虑开发适配。' },
    ],
  },
  {
    id: 'epos', product: 'epos', title: '冉暖收银系统', icon: 'fa6-solid:cash-register',
    items: [
      { q: '小票打印机如何配置？', a: '支持USB和网口热敏打印机。在设置-外设管理中，选择对应端口类型，点击"测试打印"即可自动识别并完成配置。' },
      { q: '收银数据是否安全？', a: '数据采用本地SQLite加密存储+云端双备份机制。支持定期自动备份到本地NAS或私有服务器。' },
    ],
  },
  {
    id: 'purchase', product: 'general', title: '购买与授权', icon: 'fa6-solid:credit-card',
    items: [
      { q: '软件如何收费？', a: '冉暖订货系统提供免费试用14天，正式版按年订阅。音乐播放器完全免费。收银系统按门店数量授权，支持买断和订阅两种模式。' },
      { q: '能否定制开发？', a: '可以。如果你有特定的业务流程需求，欢迎通过微信或邮件联系我们，我们会评估可行性并给出方案。' },
    ],
  },
];
