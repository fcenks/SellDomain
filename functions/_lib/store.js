import { DEFAULT_CONFIG, DEFAULT_DOMAINS } from './defaults.js'

const KEYS = { config: 'config', domains: 'domains' }
const clone = (v) => JSON.parse(JSON.stringify(v))

// EdgeOne Pages 的 KV 绑定在线上注入为全局变量（globalThis.DOMAIN_KV），
// 本地 mock / 部分调试环境挂在 env.DOMAIN_KV，两种都兼容
const getKv = (env) => (env && env.DOMAIN_KV) || globalThis.DOMAIN_KV

async function readKV(env, key, fallback) {
  try {
    const raw = await getKv(env).get(key)
    return raw ? JSON.parse(raw) : clone(fallback)
  } catch {
    return clone(fallback)
  }
}

export const getConfig = (env) => readKV(env, KEYS.config, DEFAULT_CONFIG)
export const getDomains = (env) => readKV(env, KEYS.domains, DEFAULT_DOMAINS)

export async function saveConfig(env, config) {
  await getKv(env).put(KEYS.config, JSON.stringify(config))
  return config
}

export async function saveDomains(env, domains) {
  await getKv(env).put(KEYS.domains, JSON.stringify(domains))
  return domains
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store'
    }
  })
}

// 管理接口鉴权：请求头 x-admin-token 需与 EdgeOne 环境变量 ADMIN_TOKEN 一致
export function isAdmin(request, env) {
  const token = request.headers.get('x-admin-token') || ''
  const expected = (env && env.ADMIN_TOKEN) || globalThis.ADMIN_TOKEN
  return Boolean(expected) && token === expected
}

export function normalizeConfig(input = {}) {
  const c = input || {}
  return {
    siteName: String(c.siteName || '').trim() || '精品域名在售',
    notice: String(c.notice || '').trim(),
    contact: {
      wechat: String(c.contact?.wechat || '').trim(),
      email: String(c.contact?.email || '').trim(),
      telegram: String(c.contact?.telegram || '').trim()
    }
  }
}

// 到期时间：null / '' / 'permanent' 表示永久持有；否则统一为 YYYY-MM-DD
function normalizeExpireAt(value) {
  if (value === '' || value == null || value === 'permanent') return null
  const str = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return Number.isNaN(new Date(str + 'T00:00:00').getTime()) ? null : str
  }
  const d = new Date(str)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

export function normalizeDomain(input = {}) {
  const domain = String(input.domain || '').trim().toLowerCase()
  const numPrice = Number(input.price)
  return {
    domain,
    price: input.price === '' || input.price == null || !Number.isFinite(numPrice) || numPrice <= 0
      ? null
      : numPrice,
    status: ['available', 'reserved', 'sold'].includes(input.status) ? input.status : 'available',
    category: String(input.category || '').trim(),
    registrar: String(input.registrar || '').trim(),
    tags: Array.isArray(input.tags)
      ? input.tags.map((t) => String(t).trim()).filter(Boolean)
      : String(input.tags || '').split(/[,，\s]+/).map((t) => t.trim()).filter(Boolean),
    description: String(input.description || '').trim(),
    expireAt: normalizeExpireAt(input.expireAt),
    createdAt: input.createdAt || new Date().toISOString().slice(0, 10)
  }
}

export const DOMAIN_RE = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/
