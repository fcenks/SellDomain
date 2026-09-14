import { getConfig, saveConfig, normalizeConfig, json, isAdmin } from '../_lib/store.js'

export async function onRequestGet({ env }) {
  return json(await getConfig(env))
}

export async function onRequestPut(context) {
  const { request, env } = context
  if (!isAdmin(request, env)) return json({ error: '未授权：管理密码无效' }, 401)
  const body = await request.json().catch(() => ({}))
  const config = normalizeConfig(body)
  await saveConfig(env, config)
  return json(config)
}
