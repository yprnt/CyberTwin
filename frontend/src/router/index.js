import { createRouter, createWebHistory } from 'vue-router'

// Routes minimales (Phase 0). Les vraies routes arrivent en Phase 1.
const routes = [
  {
    path: '/',
    name: 'accueil',
    component: () => import('../views/HomeView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
