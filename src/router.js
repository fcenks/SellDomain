import { createRouter, createWebHashHistory } from 'vue-router'

export default createRouter({
  // hash 模式：部署到任意静态托管都不会出现子路由刷新 404
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('./views/Home.vue') },
    { path: '/admin', name: 'admin', component: () => import('./views/Admin.vue') }
  ],
  scrollBehavior: () => ({ top: 0 })
})
