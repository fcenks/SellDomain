<script setup>
import { onMounted, reactive, ref } from 'vue'
import {
  fetchConfig,
  fetchDomains,
  createDomain,
  updateDomain,
  removeDomain,
  saveConfig,
  getToken,
  setToken,
  clearToken,
  verifyToken
} from '../api.js'

// 初始不认定已登录，必须通过服务端令牌校验
const authed = ref(false)
const checking = ref(Boolean(getToken()))
const loggingIn = ref(false)
const tokenInput = ref('')
const authError = ref('')

const loading = ref(false)
const error = ref('')
const message = ref('')
const domains = ref([])
const saving = ref(false)

const configForm = reactive({
  siteName: '',
  notice: '',
  wechat: '',
  email: '',
  telegram: ''
})

// ---- 登录：先向服务端验证密码，验证通过才保存令牌并进入 ----
async function login() {
  authError.value = ''
  const token = tokenInput.value.trim()
  if (!token) {
    authError.value = '请输入管理密码'
    return
  }
  loggingIn.value = true
  try {
    const ok = await verifyToken(token)
    if (!ok) {
      authError.value = '管理密码错误，请重新输入'
      return
    }
    setToken(token)
    authed.value = true
    await loadAll()
  } finally {
    loggingIn.value = false
  }
}

function logout() {
  clearToken()
  authed.value = false
  tokenInput.value = ''
  domains.value = []
}

// ---- 数据加载 ----
async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [cfg, list] = await Promise.all([fetchConfig(), fetchDomains()])
    configForm.siteName = cfg.siteName || ''
    configForm.notice = cfg.notice || ''
    configForm.wechat = cfg.contact?.wechat || ''
    configForm.email = cfg.contact?.email || ''
    configForm.telegram = cfg.contact?.telegram || ''
    domains.value = list
  } catch (e) {
    if (/401|未授权|令牌/.test(e.message)) {
      authed.value = false
      clearToken()
      tokenInput.value = ''
      authError.value = '登录已失效，请重新输入密码'
    } else {
      error.value = e.message
    }
  } finally {
    loading.value = false
  }
}

async function submitConfig() {
  saving.value = true
  error.value = ''
  try {
    await saveConfig({
      siteName: configForm.siteName,
      notice: configForm.notice,
      contact: {
        wechat: configForm.wechat,
        email: configForm.email,
        telegram: configForm.telegram
      }
    })
    flash('站点配置已保存')
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

function flash(msg) {
  message.value = msg
  setTimeout(() => (message.value = ''), 2000)
}

// ---- 域名新增 / 编辑 ----
const showForm = ref(false)
const editing = ref(null)
const formSaving = ref(false)
const formError = ref('')

const emptyForm = () => ({
  domain: '',
  price: '',
  status: 'available',
  category: '',
  registrar: '',
  tags: '',
  description: '',
  permanent: true,
  expireAt: '',
  createdAt: new Date().toISOString().slice(0, 10)
})
const form = reactive(emptyForm())

function openCreate() {
  editing.value = null
  formError.value = ''
  Object.assign(form, emptyForm())
  showForm.value = true
}

function openEdit(item) {
  editing.value = item
  formError.value = ''
  Object.assign(form, {
    domain: item.domain,
    price: item.price ?? '',
    status: item.status,
    category: item.category || '',
    registrar: item.registrar || '',
    tags: (item.tags || []).join(', '),
    description: item.description || '',
    permanent: !item.expireAt,
    expireAt: item.expireAt || '',
    createdAt: item.createdAt || ''
  })
  showForm.value = true
}

// 到期时间二选一互斥：勾选永久则清空日期；选择日期则取消永久
function onPermanentChange(e) {
  if (e.target.checked) form.expireAt = ''
}
function onExpireDateChange() {
  if (form.expireAt) form.permanent = false
}

async function submitDomain() {
  formError.value = ''
  if (!form.domain.trim()) {
    formError.value = '请填写域名'
    return
  }
  if (!form.permanent && !form.expireAt) {
    formError.value = '请选择到期日期，或勾选“永久持有”'
    return
  }
  formSaving.value = true
  const { permanent, ...rest } = form
  const payload = { ...rest, expireAt: permanent ? null : form.expireAt }
  try {
    if (editing.value) {
      await updateDomain(editing.value.domain, payload)
    } else {
      await createDomain(payload)
    }
    showForm.value = false
    await refreshDomains()
    flash(editing.value ? '域名已更新' : '域名已添加')
  } catch (e) {
    formError.value = e.message
  } finally {
    formSaving.value = false
  }
}

async function del(item) {
  if (!window.confirm(`确定删除域名 ${item.domain} 吗？`)) return
  try {
    await removeDomain(item.domain)
    await refreshDomains()
    flash('域名已删除')
  } catch (e) {
    error.value = e.message
  }
}

async function refreshDomains() {
  domains.value = await fetchDomains()
}

const STATUS_TEXT = { available: '可购买', reserved: '已预留', sold: '已售出' }
const priceText = (p) => (typeof p === 'number' && p > 0 ? '¥' + p.toLocaleString('zh-CN') : '面议')
const expireText = (d) => (d ? d + ' 到期' : '永久')

// 页面加载时：本地有令牌也必须重新向服务端验证，防止错误/过期令牌直接进入
onMounted(async () => {
  const token = getToken()
  if (!token) {
    checking.value = false
    return
  }
  const ok = await verifyToken(token)
  checking.value = false
  if (ok) {
    authed.value = true
    loadAll()
  } else {
    clearToken()
    authError.value = '保存的密码已失效，请重新输入'
  }
})
</script>

<template>
  <div class="container admin">
    <h2 class="page-title">站点管理</h2>

    <!-- 校验本地已保存的密码中 -->
    <div v-if="checking" class="loading">正在验证登录状态…</div>

    <!-- 登录 -->
    <div v-else-if="!authed" class="login-card">
      <p class="login-desc">请输入管理密码</p>
      <div class="login-row">
        <input
          v-model="tokenInput"
          class="input"
          type="password"
          placeholder="管理密码"
          :disabled="loggingIn"
          @keyup.enter="login"
        />
        <button class="btn btn-primary" :disabled="loggingIn" @click="login">
          {{ loggingIn ? '验证中…' : '登录' }}
        </button>
      </div>
      <p v-if="authError" class="err">{{ authError }}</p>
    </div>

    <template v-else>
      <div class="head-row">
        <span class="hint">已登录</span>
        <div class="head-actions">
          <button class="btn btn-sm" @click="loadAll">刷新</button>
          <button class="btn btn-sm" @click="logout">退出</button>
        </div>
      </div>

      <p v-if="error" class="err">{{ error }}</p>
      <p v-if="message" class="ok">{{ message }}</p>

      <div v-if="loading" class="loading">加载中…</div>

      <template v-else>
        <!-- 站点配置 -->
        <section class="panel">
          <h3>站点配置</h3>
          <div class="form-grid">
            <div class="field">
              <label>站点名称</label>
              <input v-model="configForm.siteName" class="input" placeholder="精品域名在售" />
            </div>
            <div class="field">
              <label>公告 / 说明</label>
              <input v-model="configForm.notice" class="input" placeholder="首页展示的说明文字" />
            </div>
            <div class="field">
              <label>微信号</label>
              <input v-model="configForm.wechat" class="input" placeholder="your-wechat" />
            </div>
            <div class="field">
              <label>邮箱</label>
              <input v-model="configForm.email" class="input" placeholder="owner@example.com" />
            </div>
            <div class="field">
              <label>Telegram</label>
              <input v-model="configForm.telegram" class="input" placeholder="@yourname" />
            </div>
          </div>
          <div class="panel-foot">
            <button class="btn btn-primary" :disabled="saving" @click="submitConfig">保存配置</button>
          </div>
        </section>

        <!-- 域名管理 -->
        <section class="panel">
          <div class="panel-head">
            <h3>域名列表（{{ domains.length }}）</h3>
            <button class="btn btn-primary btn-sm" @click="openCreate">+ 新增域名</button>
          </div>

          <div v-if="!domains.length" class="empty">还没有域名，点击右上角新增。</div>

          <div v-else class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>域名</th>
                  <th>价格</th>
                  <th>状态</th>
                  <th>到期时间</th>
                  <th>分类</th>
                  <th>注册商</th>
                  <th class="col-actions">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="d in domains" :key="d.domain">
                  <td class="mono">{{ d.domain }}</td>
                  <td>{{ priceText(d.price) }}</td>
                  <td>
                    <span class="badge" :class="'badge-' + d.status">{{ STATUS_TEXT[d.status] }}</span>
                  </td>
                  <td>
                    <span :class="{ 'expire-perm': !d.expireAt }">{{ expireText(d.expireAt) }}</span>
                  </td>
                  <td>{{ d.category || '—' }}</td>
                  <td>{{ d.registrar || '—' }}</td>
                  <td class="col-actions">
                    <button class="btn btn-sm" @click="openEdit(d)">编辑</button>
                    <button class="btn btn-sm btn-danger" @click="del(d)">删除</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </template>

    <!-- 域名表单弹窗 -->
    <Teleport to="body">
      <div v-if="showForm" class="mask" @click.self="showForm = false">
        <div class="modal">
          <h3>{{ editing ? '编辑域名' : '新增域名' }}</h3>
          <div class="form-grid">
            <div class="field">
              <label>域名 *</label>
              <input v-model="form.domain" class="input" :disabled="!!editing" placeholder="example.com" />
            </div>
            <div class="field">
              <label>价格（元，留空表示面议）</label>
              <input v-model="form.price" class="input" type="number" min="0" placeholder="如 8800" />
            </div>
            <div class="field">
              <label>状态</label>
              <select v-model="form.status" class="input">
                <option value="available">可购买</option>
                <option value="reserved">已预留</option>
                <option value="sold">已售出</option>
              </select>
            </div>
            <div class="field">
              <label>分类</label>
              <input v-model="form.category" class="input" placeholder="如 人工智能" />
            </div>
            <div class="field">
              <label>注册商</label>
              <input v-model="form.registrar" class="input" placeholder="如 阿里云" />
            </div>
            <div class="field">
              <label>到期时间</label>
              <div class="expire-row">
                <input
                  v-model="form.expireAt"
                  class="input"
                  type="date"
                  :disabled="form.permanent"
                  @change="onExpireDateChange"
                />
                <label class="checkbox">
                  <input type="checkbox" v-model="form.permanent" @change="onPermanentChange" />
                  永久
                </label>
              </div>
            </div>
            <div class="field">
              <label>上架日期</label>
              <input v-model="form.createdAt" class="input" type="date" />
            </div>
            <div class="field field-full">
              <label>标签（逗号分隔）</label>
              <input v-model="form.tags" class="input" placeholder="AI, 短域名, .com" />
            </div>
            <div class="field field-full">
              <label>描述</label>
              <textarea v-model="form.description" class="input" placeholder="域名亮点、适用方向等"></textarea>
            </div>
          </div>
          <p v-if="formError" class="err">{{ formError }}</p>
          <div class="modal-foot">
            <button class="btn" @click="showForm = false">取消</button>
            <button class="btn btn-primary" :disabled="formSaving" @click="submitDomain">
              {{ formSaving ? '保存中…' : '保存' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.admin {
  padding-top: 36px;
  max-width: 900px;
}

.page-title {
  margin: 0 0 24px;
  font-size: 26px;
}

.login-card {
  max-width: 460px;
  margin: 40px auto;
  padding: 30px;
  border-radius: var(--radius);
  background: var(--card);
  border: 1px solid var(--border);
}

.login-desc {
  margin: 0 0 18px;
  font-size: 13.5px;
  line-height: 1.8;
  color: var(--muted);
}

code {
  padding: 2px 6px;
  border-radius: 6px;
  background: rgba(109, 141, 255, 0.15);
  color: #b9c6ff;
  font-size: 12.5px;
}

.login-row {
  display: flex;
  gap: 10px;
}

.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.hint {
  font-size: 13px;
  color: var(--green);
}

.head-actions {
  display: flex;
  gap: 8px;
}

.err {
  color: var(--red);
  font-size: 13.5px;
}

.ok {
  color: var(--green);
  font-size: 13.5px;
}

.loading,
.empty {
  padding: 40px;
  text-align: center;
  color: var(--muted);
  font-size: 14px;
}

.panel {
  margin-bottom: 22px;
  padding: 24px;
  border-radius: var(--radius);
  background: var(--card);
  border: 1px solid var(--border);
}

.panel h3 {
  margin: 0 0 18px;
  font-size: 17px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.panel-head h3 {
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.field-full {
  grid-column: 1 / -1;
}

.expire-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.expire-row .input {
  flex: 1;
}

.expire-row .input:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: none;
  font-size: 13.5px;
  color: var(--muted);
  cursor: pointer;
  white-space: nowrap;
}

.expire-perm {
  color: var(--green);
}

.panel-foot {
  margin-top: 18px;
}

.table-wrap {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}

.table th,
.table td {
  padding: 11px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.table th {
  color: var(--muted);
  font-weight: 500;
  font-size: 12.5px;
}

.mono {
  font-family: 'SF Mono', Consolas, monospace;
  font-weight: 600;
}

.col-actions {
  display: flex;
  gap: 8px;
}

/* modal */
.mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(5, 8, 16, 0.7);
  backdrop-filter: blur(6px);
}

.modal {
  width: min(620px, 100%);
  max-height: 90vh;
  overflow-y: auto;
  padding: 26px;
  border-radius: 18px;
  background: #131a2e;
  border: 1px solid var(--border);
}

.modal h3 {
  margin: 0 0 20px;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

@media (max-width: 560px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
