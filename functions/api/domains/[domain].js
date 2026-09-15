import {
  getDomains,
  saveDomains,
  normalizeDomain,
  json,
  isAdmin,
  DOMAIN_RE
} from '../../_lib/store.js'

export async function onRequestPut(context) {
  const { request, env, params } = context
  if (!isAdmin(request, env)) return json({ error: '未授权：管理密码无效' }, 401)

  const name = decodeURIComponent(params.domain || '').toLowerCase()
  if (!DOMAIN_RE.test(name)) return json({ error: '域名格式不正确' }, 400)

  const body = await request.json().catch(() => ({}))
  const patch = normalizeDomain({ ...body, domain: name })
  const list = await getDomains(env)
  const idx = list.findIndex((d) => d.domain === name)
  if (idx === -1) return json({ error: '域名不存在' }, 404)

  list[idx] = { ...patch, createdAt: list[idx].createdAt || patch.createdAt }
  await saveDomains(env, list)
  return json(list[idx])
}

export async function onRequestDelete(context) {
  const { request, env, params } = context
  if (!isAdmin(request, env)) return json({ error: '未授权：管理密码无效' }, 401)

  const name = decodeURIComponent(params.domain || '').toLowerCase()
  const list = await getDomains(env)
  const next = list.filter((d) => d.domain !== name)
  if (next.length === list.length) return json({ error: '域名不存在' }, 404)

  await saveDomains(env, next)
  return json({ ok: true })
}
