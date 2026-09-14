<script setup>
import { computed, onMounted, ref } from 'vue'
import DomainCard from '../components/DomainCard.vue'
import InquiryDialog from '../components/InquiryDialog.vue'
import { fetchConfig, fetchDomains } from '../api.js'

const loading = ref(true)
const loadError = ref('')
const config = ref({ contact: {} })
const domains = ref([])

const keyword = ref('')
const status = ref('all')
const sort = ref('default')
const dialogVisible = ref(false)
const inquiryItem = ref(null)

function openInquiry(item) {
  inquiryItem.value = item
  dialogVisible.value = true
}

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'available', label: '可购买' },
  { key: 'reserved', label: '已预留' },
  { key: 'sold', label: '已售出' }
]

const countOf = (key) =>
  key === 'all' ? domains.value.length : domains.value.filter((d) => d.status === key).length

const filtered = computed(() => {
  let list = domains.value
  if (status.value !== 'all') list = list.filter((d) => d.status === status.value)

  const kw = keyword.value.trim().toLowerCase()
  if (kw) {
    list = list.filter((d) =>
      [d.domain, d.category, d.description, d.registrar, ...(d.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(kw)
    )
  }

  const sorted = [...list]
  if (sort.value === 'price-asc') {
    sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
  } else if (sort.value === 'price-desc') {
    sorted.sort((a, b) => (b.price ?? -1) - (a.price ?? -1))
  } else if (sort.value === 'newest') {
    sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }
  return sorted
})

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [cfg, list] = await Promise.all([fetchConfig(), fetchDomains()])
    config.value = cfg
    domains.value = list
  } catch (e) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
}

// 保留 onMounted 调用
onMounted(load)
</script>

<template>
  <div class="container">
    <!-- Hero -->
    <section class="hero">
      <h1>{{ config.siteName || '精品域名在售' }}</h1>
      <p v-if="config.notice" class="notice">{{ config.notice }}</p>
      <div class="search-wrap">
        <span class="search-icon">⌕</span>
        <input v-model="keyword" class="input search" placeholder="搜索域名、分类、标签，如 ai、支付、.com" />
      </div>
    </section>

    <!-- 工具栏 -->
    <section class="toolbar">
      <div class="tabs">
        <button
          v-for="tab in TABS"
          :key="tab.key"
          class="tab"
          :class="{ active: status === tab.key }"
          @click="status = tab.key"
        >
          {{ tab.label }}
          <span class="tab-count">{{ countOf(tab.key) }}</span>
        </button>
      </div>
      <select v-model="sort" class="input sort-select">
        <option value="default">默认排序</option>
        <option value="newest">最新上架</option>
        <option value="price-asc">价格从低到高</option>
        <option value="price-desc">价格从高到低</option>
      </select>
    </section>

    <!-- 内容 -->
    <section v-if="loading" class="state">加载中…</section>
    <section v-else-if="loadError" class="state error">
      加载失败：{{ loadError }}
      <button class="btn btn-sm" style="margin-left: 10px" @click="load">重试</button>
    </section>
    <section v-else-if="!filtered.length" class="state">没有找到匹配的域名</section>

    <section v-else class="grid">
      <DomainCard v-for="item in filtered" :key="item.domain" :item="item" @inquiry="openInquiry" />
    </section>
  </div>

  <InquiryDialog v-model="dialogVisible" :item="inquiryItem" :contact="config.contact" />
</template>

<style scoped>
.hero {
  padding: 72px 0 36px;
  text-align: center;
}

.hero h1 {
  margin: 0 0 14px;
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 800;
  letter-spacing: 1px;
  background: linear-gradient(135deg, #ffffff 20%, #aebfff 70%, var(--primary-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.notice {
  margin: 0 auto 30px;
  max-width: 620px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--muted);
}

.search-wrap {
  position: relative;
  max-width: 560px;
  margin: 0 auto;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: var(--muted);
  pointer-events: none;
}

.search {
  height: 52px;
  padding-left: 46px;
  font-size: 15px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin: 12px 0 26px;
}

.tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  font-size: 14px;
  transition: all 0.15s ease;
}

.tab:hover {
  color: var(--text);
}

.tab.active {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
}

.tab-count {
  font-size: 12px;
  opacity: 0.7;
}

.sort-select {
  width: auto;
  padding: 8px 14px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
}

.state {
  padding: 80px 0;
  text-align: center;
  color: var(--muted);
  font-size: 15px;
}

.state.error {
  color: var(--red);
}
</style>
