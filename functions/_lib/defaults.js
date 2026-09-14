// KV 中没有数据时返回的内置默认值，保证页面开箱即用
export const DEFAULT_CONFIG = {
  siteName: '精品域名在售',
  notice: '以下域名均为本人持有，一口价 / 议价均可，域名带价咨询，非诚勿扰。',
  contact: {
    wechat: 'your-wechat',
    email: 'owner@example.com',
    telegram: ''
  }
}

export const DEFAULT_DOMAINS = [
  {
    domain: 'primeai.com',
    price: 68000,
    status: 'available',
    category: '人工智能',
    registrar: '腾讯云',
    tags: ['AI', '英文', '.com'],
    description: 'Prime AI，顶级人工智能方向品牌域名，简短易记，适合 AI 大模型、Agent 创业公司。',
    expireAt: '2028-03-12',
    createdAt: '2025-03-12'
  },
  {
    domain: 'cloudpeak.cn',
    price: 12800,
    status: 'available',
    category: '云计算',
    registrar: '阿里云',
    tags: ['云服务', '双拼', '.cn'],
    description: 'CloudPeak 云巅，适合云计算、云服务器、CDN 等基础设施类产品。',
    expireAt: null,
    createdAt: '2025-05-08'
  },
  {
    domain: 'payhawk.cn',
    price: null,
    status: 'reserved',
    category: '金融科技',
    registrar: '腾讯云',
    tags: ['支付', '金融'],
    description: 'Pay + Hawk，支付风控方向精品域名，已预留，可咨询出价。',
    expireAt: '2026-10-20',
    createdAt: '2025-06-01'
  },
  {
    domain: 'metawork.net',
    price: 9800,
    status: 'available',
    category: '协同办公',
    registrar: 'GoDaddy',
    tags: ['元宇宙', 'SaaS'],
    description: 'MetaWork，元宇宙办公 / 远程协作 SaaS 品牌域名。',
    expireAt: '2027-01-22',
    createdAt: '2025-01-22'
  },
  {
    domain: '9k.tv',
    price: 5600,
    status: 'sold',
    category: '直播短视频',
    registrar: 'Namecheap',
    tags: ['数字', '短域名', '.tv'],
    description: '两位字符超短 .tv 域名，已成交，仅作展示。',
    expireAt: null,
    createdAt: '2024-11-30'
  },
  {
    domain: 'haohuo.shop',
    price: 3200,
    status: 'available',
    category: '电商',
    registrar: '阿里云',
    tags: ['拼音', '电商', '.shop'],
    description: '“好货”拼音，电商导购、好物分享类项目首选。',
    expireAt: '2029-07-15',
    createdAt: '2025-07-15'
  }
]
