import { createRouter, createWebHistory } from 'vue-router'

// Squelette de navigation (Phase 1). Le contenu réel de chaque vue arrive
// dans les phases suivantes (CRUD, dashboard, rapport).
const routes = [
  {
    path: '/',
    name: 'accueil',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/entreprise',
    name: 'entreprise',
    component: () => import('../views/CompanyView.vue'),
  },
  {
    path: '/actifs',
    name: 'actifs',
    component: () => import('../views/AssetsView.vue'),
  },
  {
    path: '/vulnerabilites',
    name: 'vulnerabilites',
    component: () => import('../views/VulnerabilitiesView.vue'),
  },
  {
    path: '/tableau-de-bord',
    name: 'tableau-de-bord',
    component: () => import('../views/DashboardView.vue'),
  },
  {
    path: '/rapport',
    name: 'rapport',
    component: () => import('../views/ReportView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
