<script setup>
// Contexte d'une entreprise (/entreprises/:id/...). Charge l'entreprise (et vérifie
// l'appartenance via le back : 404 -> retour à la liste), affiche son nom + la
// sous-navigation, puis la page enfant.
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCompaniesStore } from '../stores/companies'
import { useToasts } from '../composables/useToasts'

const route = useRoute()
const router = useRouter()
const store = useCompaniesStore()
const toasts = useToasts()

const id = computed(() => route.params.id)
const company = computed(() => store.current)

async function charger(companyId) {
  try {
    await store.fetchOne(companyId)
  } catch {
    toasts.error('Entreprise introuvable.')
    router.replace({ name: 'entreprises' })
  }
}

// Recharge à l'ouverture et quand on passe d'une entreprise à une autre.
watch(id, (val) => val && charger(val), { immediate: true })

const liens = computed(() => [
  { name: 'entreprise-fiche', label: 'Fiche' },
  { name: 'entreprise-actifs', label: 'Actifs' },
  { name: 'entreprise-vulnerabilites', label: 'Vulnérabilités' },
  { name: 'entreprise', label: 'Tableau de bord' },
  { name: 'entreprise-rapport', label: 'Rapport' },
  { name: 'entreprise-historique', label: 'Historique' },
])
</script>

<template>
  <div class="company">
    <header class="ctx no-print">
      <RouterLink :to="{ name: 'entreprises' }" class="back">← Mes entreprises</RouterLink>
      <h2 class="ctx__name">{{ company ? company.nom : 'Chargement…' }}</h2>
      <nav class="subnav" aria-label="Navigation de l'entreprise">
        <RouterLink
          v-for="lien in liens"
          :key="lien.name"
          :to="{ name: lien.name, params: { id } }"
          class="subnav__link"
        >
          {{ lien.label }}
        </RouterLink>
      </nav>
    </header>

    <RouterView />
  </div>
</template>

<style scoped>
.ctx {
  margin-bottom: 1.5rem;
}
.back {
  display: inline-block;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}
.back:hover {
  color: var(--accent);
  text-decoration: none;
}
.ctx__name {
  font-family: var(--font-display);
  font-size: 1.4rem;
  margin-bottom: 0.85rem;
}
.subnav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  border-bottom: 1px solid var(--border);
  padding-bottom: 0.6rem;
}
.subnav__link {
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius);
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.subnav__link:hover {
  background: var(--surface-2);
  color: var(--text);
  text-decoration: none;
}
/* exact-active : sinon le lien « Tableau de bord » (route index) resterait actif
   sur toutes les sous-pages dont il est le préfixe. */
.subnav__link.router-link-exact-active {
  background: var(--accent-soft);
  color: var(--accent);
}
</style>
