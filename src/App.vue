<script setup>
import { RouterLink, RouterView } from 'vue-router'

const year = new Date().getFullYear()
</script>

<template>
  <div class="layout">
    <header class="topbar">
      <div class="container topbar-inner">
        <RouterLink to="/" class="brand">
          <span class="brand-mark">◆</span> Domain<span>Sale</span>
        </RouterLink>
        <nav class="nav">
          <RouterLink to="/">首页</RouterLink>
          <RouterLink to="/admin">管理</RouterLink>
        </nav>
      </div>
    </header>

    <main class="main">
      <RouterView />
    </main>

    <footer class="footer">
      <div class="container">
        © {{ year }} ThinkAct
      </div>
    </footer>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: blur(14px);
  background: rgba(10, 14, 26, 0.72);
  border-bottom: 1px solid var(--border);
}

.topbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 62px;
}

.brand {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.brand-mark {
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.brand span:last-child {
  background: linear-gradient(135deg, var(--primary), var(--primary-2));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.nav {
  display: flex;
  gap: 4px;
}

.nav a {
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 14px;
  color: var(--muted);
  transition: all 0.15s ease;
}

.nav a:hover {
  color: var(--text);
}

.nav a.router-link-exact-active {
  color: var(--text);
  background: rgba(255, 255, 255, 0.07);
}

.main {
  flex: 1;
}

.footer {
  padding: 28px 0;
  text-align: center;
  color: var(--muted);
  font-size: 13px;
  border-top: 1px solid var(--border);
  margin-top: 48px;
}
</style>
