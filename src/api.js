// 前端只与 /api 通信：本地由 Vite mock 处理，线上由 EdgeOne Functions + KV 处理
async function request(path, options = {}) {
  const res = await fetch('/api' + path, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {})
    }
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `请求失败（${res.status}）`)
  return data
}

export const fetchConfig = () => request('/config')
export const fetchDomains = () => request('/domains').then((r) => r.domains || [])

const TOKEN_KEY = 'admin_token'
export const getToken = () => localStorage.getItem(TOKEN_KEY) || ''
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

const authHeaders = () => ({ 'x-admin-token': getToken() })

// 用指定令牌（不传则用当前令牌）请求服务端校验，成功返回 true，401 返回 false
export async function verifyToken(token) {
  try {
    const res = await fetch('/api/auth', {
      headers: { 'x-admin-token': token ?? getToken() }
    })
    return res.ok
  } catch {
    return false
  }
}

export const createDomain = (data) =>
  request('/domains', { method: 'POST', headers: authHeaders(), body: JSON.stringify(data) })

export const updateDomain = (domain, data) =>
  request(`/domains/${encodeURIComponent(domain)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data)
  })

export const removeDomain = (domain) =>
  request(`/domains/${encodeURIComponent(domain)}`, { method: 'DELETE', headers: authHeaders() })

export const saveConfig = (config) =>
  request('/config', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(config) })
