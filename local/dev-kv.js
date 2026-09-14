// 本地开发时用 JSON 文件模拟 EdgeOne KV，线上由 functions/ 边缘函数读写真实 KV
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { DEFAULT_CONFIG, DEFAULT_DOMAINS } from '../functions/_lib/defaults.js'
import { normalizeConfig, normalizeDomain, DOMAIN_RE } from '../functions/_lib/store.js'

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'dev-admin-token'

export function createKvMiddleware(dataFile) {
  function load() {
    if (!existsSync(dataFile)) {
      mkdirSync(dirname(dataFile), { recursive: true })
      const seed = { config: DEFAULT_CONFIG, domains: DEFAULT_DOMAINS }
      writeFileSync(dataFile, JSON.stringify(seed, null, 2))
      return seed
    }
    return JSON.parse(readFileSync(dataFile, 'utf8'))
  }

  function persist(data) {
    writeFileSync(dataFile, JSON.stringify(data, null, 2))
  }

  const send = (res, status, body) => {
    res.statusCode = status
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.setHeader('cache-control', 'no-store')
    res.end(JSON.stringify(body))
  }

  const readBody = (req) =>
    new Promise((resolve) => {
      let buf = ''
      req.on('data', (c) => (buf += c))
      req.on('end', () => {
        try {
          resolve(buf ? JSON.parse(buf) : {})
        } catch {
          resolve({})
        }
      })
    })

  const isAdmin = (req) => (req.headers['x-admin-token'] || '') === ADMIN_TOKEN

  return async function kvMiddleware(req, res, next) {
    const url = new URL(req.url, 'http://local.dev')
    const { pathname } = url
    if (!pathname.startsWith('/api/')) return next()

    try {
      // ---- 管理令牌校验 ----
      if (pathname === '/api/auth' && req.method === 'GET') {
        if (!isAdmin(req)) return send(res, 401, { error: '管理令牌错误' })
        return send(res, 200, { ok: true })
      }

      // ---- 站点配置 ----
      if (pathname === '/api/config' && req.method === 'GET') {
        return send(res, 200, load().config)
      }
      if (pathname === '/api/config' && req.method === 'PUT') {
        if (!isAdmin(req)) return send(res, 401, { error: '未授权：管理令牌无效（本地默认令牌 dev-admin-token）' })
        const data = load()
        data.config = normalizeConfig(await readBody(req))
        persist(data)
        return send(res, 200, data.config)
      }

      // ---- 域名列表 ----
      if (pathname === '/api/domains' && req.method === 'GET') {
        let domains = load().domains
        const q = url.searchParams.get('q')?.trim().toLowerCase()
        if (q) {
          domains = domains.filter((d) =>
            [d.domain, d.category, d.description, d.registrar, ...(d.tags || [])]
              .join(' ')
              .toLowerCase()
              .includes(q)
          )
        }
        return send(res, 200, { domains })
      }
      if (pathname === '/api/domains' && req.method === 'POST') {
        if (!isAdmin(req)) return send(res, 401, { error: '未授权：管理令牌无效（本地默认令牌 dev-admin-token）' })
        const item = normalizeDomain(await readBody(req))
        if (!DOMAIN_RE.test(item.domain)) return send(res, 400, { error: '域名格式不正确' })
        const data = load()
        if (data.domains.some((d) => d.domain === item.domain)) {
          return send(res, 409, { error: '该域名已存在' })
        }
        data.domains.unshift(item)
        persist(data)
        return send(res, 201, item)
      }

      // ---- 单个域名 ----
      const itemMatch = pathname.match(/^\/api\/domains\/([^/]+)$/)
      if (itemMatch) {
        const name = decodeURIComponent(itemMatch[1]).toLowerCase()
        const data = load()
        if (req.method === 'PUT') {
          if (!isAdmin(req)) return send(res, 401, { error: '未授权' })
          if (!DOMAIN_RE.test(name)) return send(res, 400, { error: '域名格式不正确' })
          const idx = data.domains.findIndex((d) => d.domain === name)
          if (idx === -1) return send(res, 404, { error: '域名不存在' })
          const patch = normalizeDomain({ ...(await readBody(req)), domain: name })
          data.domains[idx] = { ...patch, createdAt: data.domains[idx].createdAt || patch.createdAt }
          persist(data)
          return send(res, 200, data.domains[idx])
        }
        if (req.method === 'DELETE') {
          if (!isAdmin(req)) return send(res, 401, { error: '未授权' })
          const next2 = data.domains.filter((d) => d.domain !== name)
          if (next2.length === data.domains.length) return send(res, 404, { error: '域名不存在' })
          data.domains = next2
          persist(data)
          return send(res, 200, { ok: true })
        }
      }

      return send(res, 404, { error: '接口不存在' })
    } catch (err) {
      return send(res, 500, { error: err.message || String(err) })
    }
  }
}
