<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ThemeToggle from './components/ThemeToggle.vue'
import ToastHost from './components/ToastHost.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import { useAuthStore } from './stores/auth'
import { useToasts } from './composables/useToasts'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toasts = useToasts()

// Nav primaire : les pages d'une entreprise vivent dans la sous-nav de CompanyLayout.
const liens = [
  { to: '/', label: 'Accueil' },
  { to: '/entreprises', label: 'Entreprises' },
]

// Accueil public : la barre est masquée seulement sur la page de connexion.
const afficherBarre = computed(() => route.name !== 'login')
const connecte = computed(() => !!auth.token)

function deconnexion() {
  auth.logout()
  toasts.info('Vous êtes déconnecté.')
  router.push('/')
}

// Jeton expiré détecté par http.js en cours de session : on nettoie et on renvoie au login.
function surExpiration() {
  auth.logout()
  toasts.error('Session expirée, reconnectez-vous.')
  router.push({ name: 'login' })
}

onMounted(() => {
  auth.restore()
  window.addEventListener('auth:expired', surExpiration)
})
onUnmounted(() => window.removeEventListener('auth:expired', surExpiration))
</script>

<template>
  <header v-if="afficherBarre" class="topbar no-print">
    <div class="topbar__inner">
      <RouterLink to="/" class="brand">
        <span class="brand__glyph" aria-hidden="true">◈</span>
        <span class="brand__name">CyberTwin</span>
      </RouterLink>

      <nav class="nav" aria-label="Navigation principale">
        <RouterLink
          v-for="lien in liens"
          :key="lien.to"
          :to="lien.to"
          class="nav-link"
        >
          {{ lien.label }}
        </RouterLink>
      </nav>

      <div class="topbar__actions">
        <ThemeToggle />
        <template v-if="connecte">
          <button
            class="logout"
            type="button"
            title="Se déconnecter"
            aria-label="Se déconnecter"
            @click="deconnexion"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true">
              <path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" stroke-linecap="round" />
              <path d="M10 8l-4 4 4 4M6 12h11" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </template>
        <template v-else>
          <RouterLink :to="{ name: 'login' }" class="auth-link">Connexion</RouterLink>
          <RouterLink :to="{ name: 'login', query: { mode: 'register' } }" class="auth-cta">
            Créer un compte
          </RouterLink>
        </template>
      </div>
    </div>
  </header>

  <main class="content">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>

  <ToastHost />
  <ConfirmDialog />
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}
.topbar__inner {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 0.7rem 1.25rem;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
  color: var(--text);
  text-decoration: none;
}
.brand:hover {
  text-decoration: none;
}
.brand__glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--gradient);
  color: #fff;
  font-size: 0.95rem;
}
.nav {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  margin-right: auto;
}
.topbar__actions {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}
/* Boutons d'auth à l'échelle de la barre (cohérents avec .nav-link). */
.auth-link,
.auth-cta {
  font-size: 0.88rem;
  font-weight: 600;
  padding: 0.42rem 0.85rem;
  border-radius: var(--radius);
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.auth-link {
  color: var(--text-muted);
}
.auth-link:hover {
  background: var(--surface-2);
  color: var(--text);
  text-decoration: none;
}
.auth-cta {
  background: var(--accent);
  color: var(--accent-contrast);
}
.auth-cta:hover {
  background: var(--accent-hover);
  text-decoration: none;
}
.logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.logout:hover {
  background: var(--danger-soft);
  color: var(--danger);
}
.nav-link {
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius);
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.nav-link:hover {
  background: var(--surface-2);
  color: var(--text);
  text-decoration: none;
}
.nav-link.router-link-active {
  background: var(--accent-soft);
  color: var(--accent);
}
.content {
  max-width: 1080px;
  margin: 0 auto;
  padding: 1.75rem 1.25rem 3rem;
}

@media (max-width: 680px) {
  .topbar__inner {
    flex-wrap: wrap;
  }
  .nav {
    order: 3;
    width: 100%;
    margin-right: 0;
  }
}

@media print {
  .content {
    max-width: none;
    padding: 0;
  }
}
</style>
