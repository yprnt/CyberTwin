import { createRouter, createWebHistory } from 'vue-router'

// Vues chargées en lazy (import dynamique) -> un chunk JS par page.
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
