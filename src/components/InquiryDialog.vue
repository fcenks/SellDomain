<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  item: { type: Object, default: null },
  contact: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['update:modelValue'])

const copied = ref('')

const channels = computed(() => {
  const c = props.contact || {}
  return [
    { key: 'wechat', label: '微信', value: c.wechat, icon: '微' },
    { key: 'email', label: '邮箱', value: c.email, icon: '@' },
    { key: 'telegram', label: 'Telegram', value: c.telegram, icon: 't' }
  ].filter((ch) => ch.value)
})

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
  copied.value = text
  setTimeout(() => (copied.value = ''), 1500)
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) copied.value = ''
  }
)

const close = () => emit('update:modelValue', false)
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue && item" class="mask" @click.self="close">
      <div class="dialog">
        <button class="close" @click="close">×</button>

        <div class="dialog-head">
          <div class="label">咨询域名</div>
          <h3>{{ item.domain }}</h3>
          <p class="tip">
            <template v-if="typeof item.price === 'number' && item.price > 0">
              报价：<b>¥{{ item.price.toLocaleString('zh-CN') }}</b>（价格可谈）
            </template>
            <template v-else>该域名价格面议，欢迎联系报价</template>
          </p>
          <p class="tip expire-tip">
            到期时间：<b :class="{ perm: !item.expireAt }">{{ item.expireAt || '永久持有' }}</b>
          </p>
        </div>

        <div v-if="channels.length" class="channels">
          <div v-for="ch in channels" :key="ch.key" class="channel">
            <div class="ch-icon">{{ ch.icon }}</div>
            <div class="ch-info">
              <div class="ch-label">{{ ch.label }}</div>
              <div class="ch-value">{{ ch.value }}</div>
            </div>
            <button class="btn btn-sm" @click="copy(ch.value)">
              {{ copied === ch.value ? '已复制 ✓' : '复制' }}
            </button>
          </div>
        </div>
        <p v-else class="empty">卖家暂未留下联系方式，请稍后再来。</p>

        <p class="note">添加联系时请备注域名名称，非诚勿扰。</p>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
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

.dialog {
  position: relative;
  width: min(460px, 100%);
  padding: 28px;
  border-radius: 18px;
  background: #131a2e;
  border: 1px solid var(--border);
  box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.7);
}

.close {
  position: absolute;
  top: 14px;
  right: 16px;
  border: none;
  background: none;
  color: var(--muted);
  font-size: 24px;
  line-height: 1;
}

.close:hover {
  color: var(--text);
}

.label {
  font-size: 12px;
  color: var(--muted);
  letter-spacing: 1px;
}

.dialog-head h3 {
  margin: 6px 0 8px;
  font-size: 26px;
  font-family: 'SF Mono', Consolas, monospace;
  word-break: break-all;
}

.tip {
  margin: 0;
  font-size: 14px;
  color: var(--muted);
}

.tip b {
  color: var(--primary);
}

.expire-tip {
  margin-top: 4px;
}

.tip b.perm {
  color: var(--green);
}

.channels {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.channel {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
}

.ch-icon {
  width: 38px;
  height: 38px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
}

.ch-info {
  flex: 1;
  min-width: 0;
}

.ch-label {
  font-size: 12px;
  color: var(--muted);
}

.ch-value {
  font-size: 15px;
  font-weight: 600;
  word-break: break-all;
}

.empty {
  margin-top: 18px;
  color: var(--muted);
  font-size: 14px;
}

.note {
  margin: 18px 0 0;
  font-size: 12.5px;
  color: var(--muted);
}
</style>
