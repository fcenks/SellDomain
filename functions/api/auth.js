import { json, isAdmin } from '../_lib/store.js'

// 登录令牌校验：前端进入管理页面前必须用此接口验证 x-admin-token
export async function onRequestGet({ request, env }) {
  if (!isAdmin(request, env)) return json({ error: '管理令牌错误' }, 401)
  return json({ ok: true })
}
