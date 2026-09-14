import { getDomains, saveDomains, json, isAdmin } from '../../_lib/store.js'

// 批量保存域名展示顺序：body { domains: ['a.com', 'b.com', ...] }，需与当前域名集合完全一致
export async function onRequestPut(context) {
  const { request, env } = context
  if (!isAdmin(request, env)) return json({ error: '未授权：管理令牌无效' }, 401)

  const body = await request.json().catch(() => ({}))
  const order = Array.isArray(body.domains)
    ? body.domains.map((d) => String(d || '').trim().toLowerCase()).filter(Boolean)
    : null
  if (!order) return json({ error: '参数错误：需要 domains 数组' }, 400)

  const list = await getDomains(env)
  if (order.length !== list.length) {
    return json({ error: '排序列表与当前域名数量不一致' }, 400)
  }
  const map = new Map(list.map((d) => [d.domain, d]))
  if (order.some((name) => !map.has(name))) {
    return json({ error: '排序列表包含不存在的域名' }, 400)
  }
  if (new Set(order).size !== order.length) {
    return json({ error: '排序列表存在重复域名' }, 400)
  }

  const next = order.map((name) => map.get(name))
  await saveDomains(env, next)
  return json({ ok: true })
}
