import {
  getDomains,
  saveDomains,
  normalizeDomain,
  json,
  isAdmin,
  DOMAIN_RE
} from '../_lib/store.js'

export async function onRequestGet({ request, env }) {
  const list = await getDomains(env)
  const q = new URL(request.url).searchParams.get('q')?.trim().toLowerCase()
  const domains = q
    ? list.filter((d) =>
        [d.domain, d.category, d.description, d.registrar, ...(d.tags || [])]
          .join(' ')
          .toLowerCase()
          .includes(q)
      )
    : list
  return json({ domains })
}

export async function onRequestPost(context) {
  const { request, env } = context
  if (!isAdmin(request, env)) return json({ error: '未授权：管理密码无效' }, 401)

  const body = await request.json().catch(() => ({}))
  const item = normalizeDomain(body)
  if (!DOMAIN_RE.test(item.domain)) return json({ error: '域名格式不正确' }, 400)

  const list = await getDomains(env)
  if (list.some((d) => d.domain === item.domain)) {
    return json({ error: '该域名已存在' }, 409)
  }
  list.unshift(item)
  await saveDomains(env, list)
  return json(item, 201)
}
