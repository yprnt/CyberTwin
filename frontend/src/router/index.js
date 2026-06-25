import { createRouter, createWebHistory } from 'vue-router'
import { TOKEN_KEY } from '../config'

// Vues chargées en lazy (import dynamique) -> un chunk JS par page.
// Les pages d'une entreprise sont imbriquées sous /entreprises/:id (CompanyLayout
// charge l'entreprise et affiche la sous-navigation).
const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'accueil',
    component: () => import('../views/HomeView.vue'),
    meta: { public: true },
  },
  {
    path: '/entreprises',
    name: 'entreprises',
    component: () => import('../views/CompaniesView.vue'),
  },
  {
    // déclaré avant /entreprises/:id pour ne pas être capté comme un id
    path: '/entreprises/nouveau',
    name: 'entreprise-nouveau',
    component: () => import('../views/CompanyFormView.vue'),
  },
  {
    path: '/entreprises/:id',
    component: () => import('../layouts/CompanyLayout.vue'),
    children: [
      { path: '', name: 'entreprise', component: () => import('../views/DashboardView.vue') },
      { path: 'fiche', name: 'entreprise-fiche', component: () => import('../views/CompanyFormView.vue') },
      { path: 'actifs', name: 'entreprise-actifs', component: () => import('../views/AssetsView.vue') },
      {
        path: 'vulnerabilites',
        name: 'entreprise-vulnerabilites',
        component: () => import('../views/VulnerabilitiesView.vue'),
      },
      { path: 'historique', name: 'entreprise-historique', component: () => import('../views/HistoryView.vue') },
      { path: 'rapport', name: 'entreprise-rapport', component: () => import('../views/ReportView.vue') },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Garde d'accès : le jeton (localStorage) fait foi. Pas de jeton -> /login (en
// gardant la page demandée) ; déjà connecté sur /login -> accueil.
router.beforeEach((to) => {
  const connecte = !!localStorage.getItem(TOKEN_KEY)
  if (!connecte && !to.meta.public) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (connecte && to.name === 'login') {
    return { path: '/' }
  }
})

export default router
