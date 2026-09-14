<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: { type: Object, required: true }
})
const emit = defineEmits(['inquiry'])

const STATUS_MAP = {
  available: { text: '可购买', cls: 'badge-available' },
  reserved: { text: '已预留', cls: 'badge-reserved' },
  sold: { text: '已售出', cls: 'badge-sold' }
}

const status = computed(() => STATUS_MAP[props.item.status] || STATUS_MAP.available)
const priceText = computed(() =>
  typeof props.item.price === 'number' && props.item.price > 0
    ? '¥' + props.item.price.toLocaleString('zh-CN')
    : '价格面议'
)
const isSold = computed(() => props.item.status === 'sold')

// 到期时间：null 表示永久；其余按距今天数给出提示
const expire = computed(() => {
  const v = props.item.expireAt
  if (!v) return { text: '永久持有', cls: 'expire-permanent' }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(v + 'T00:00:00')
  const days = Math.ceil((target - today) / 86400000)
  if (days < 0) return { text: `已于 ${v} 到期`, cls: 'expire-overdue' }
  if (days <= 60) return { text: `${v} 到期（剩 ${days} 天）`, cls: 'expire-soon' }
  return { text: `${v} 到期`, cls: 'expire-normal' }
})
</script>

<template>
  <div class="card" :class="{ sold: isSold }">
    <div class="card-top">
      <span class="badge" :class="status.cls">{{ status.text }}</span>
      <span v-if="item.category" class="category">{{ item.category }}</span>
    </div>

    <h3 class="domain" :title="item.domain">{{ item.domain }}</h3>

    <div class="price-row">
      <span class="price">{{ priceText }}</span>
      <span class="expire" :class="expire.cls">
        <span class="expire-dot"></span>{{ expire.text }}
      </span>
    </div>

    <p v-if="item.description" class="desc">{{ item.description }}</p>

    <div v-if="item.tags?.length" class="tags">
      <span v-for="tag in item.tags" :key="tag" class="tag">#{{ tag }}</span>
    </div>

    <div class="card-bottom">
      <span v-if="item.registrar" class="registrar">注册商：{{ item.registrar }}</span>
      <button class="btn btn-primary btn-sm" :disabled="isSold" @click="emit('inquiry', item)">
        {{ isSold ? '已成交' : item.status === 'reserved' ? '咨询出价' : '立即咨询' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px;
  border-radius: var(--radius);
  background: var(--card);
  border: 1px solid var(--border);
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.card:hover {
  transform: translateY(-4px);
  background: var(--card-hover);
  border-color: rgba(109, 141, 255, 0.45);
}

.card.sold {
  opacity: 0.55;
}

.card.sold:hover {
  transform: none;
  border-color: var(--border);
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.category {
  font-size: 12px;
  color: var(--muted);
}

.domain {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  word-break: break-all;
  line-height: 1.25;
  font-family: 'SF Mono', 'Cascadia Code', Consolas, monospace;
  background: linear-gradient(135deg, #fff 30%, #b9c6ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.price {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}

.expire {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
}

.expire-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.expire-permanent {
  color: var(--green);
}

.expire-soon {
  color: var(--yellow);
}

.expire-overdue {
  color: var(--red);
}

.desc {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  font-size: 12px;
  color: var(--muted);
  padding: 2px 8px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.05);
}

.card-bottom {
  margin-top: auto;
  padding-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-top: 1px dashed var(--border);
}

.registrar {
  font-size: 12px;
  color: var(--muted);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  box-shadow: none;
}
</style>
