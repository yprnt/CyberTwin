<script setup>
// « Mes entreprises » : liste des entreprises du compte, création et démo.
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCompaniesStore } from '../stores/companies'
import { api } from '../services/api'
import { useToasts } from '../composables/useToasts'
import { useConfirm } from '../composables/useConfirm'
import BaseButton from '../components/BaseButton.vue'
import BaseCard from '../components/BaseCard.vue'

const router = useRouter()
const store = useCompaniesStore()
const toasts = useToasts()
const { confirm } = useConfirm()

const demoEnCours = ref(false)

onMounted(() => store.fetchList())

// Ouvrir une entreprise -> onglet Fiche (point d'entrée naturel).
function ouvrir(company) {
  router.push({ name: 'entreprise-fiche', params: { id: company.id } })
}

async function supprimer(company) {
  const ok = await confirm({
    title: "Supprimer l'entreprise",
    message: `« ${company.nom || 'Cette entreprise'} » et toutes ses données (actifs, vulnérabilités, historique) seront définitivement supprimées.`,
    confirmLabel: 'Supprimer',
    danger: true,
  })
  if (!ok) return
  try {
    await store.remove(company.id)
    toasts.success('Entreprise supprimée.')
  } catch (e) {
    toasts.error(e.message)
  }
}

// La démo crée une entreprise Boréale pré-remplie puis on l'ouvre sur sa fiche.
async function chargerDemo() {
  demoEnCours.value = true
  try {
    const company = await api.demoLoad()
    toasts.success('Démo « Boréale Logistique » chargée.')
    router.push({ name: 'entreprise-fiche', params: { id: company.id } })
  } catch (e) {
    toasts.error(e.message)
  } finally {
    demoEnCours.value = false
  }
}

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('fr-FR') : ''
}
</script>

<template>
  <section class="page">
    <header class="page__head head">
      <div>
        <h1>Mes entreprises</h1>
        <p class="page__sub">Gérez plusieurs entreprises, chacune avec ses actifs, vulnérabilités et analyses.</p>
      </div>
      <div class="head__actions">
        <BaseButton variant="ghost" :disabled="demoEnCours" @click="chargerDemo">
          {{ demoEnCours ? 'Chargement…' : 'Charger la démo' }}
        </BaseButton>
        <BaseButton @click="router.push({ name: 'entreprise-nouveau' })">Créer une entreprise</BaseButton>
      </div>
    </header>

    <p v-if="store.loading" class="muted">Chargement…</p>
    <p v-else-if="store.error" class="msg msg--error">{{ store.error }}</p>

    <template v-else>
      <BaseCard v-if="store.list.length === 0" class="empty">
        <p class="muted center">
          Aucune entreprise pour le moment. Créez-en une ou chargez la démo pour explorer un cas complet.
        </p>
      </BaseCard>

      <div v-else class="grid">
        <article v-for="c in store.list" :key="c.id" class="company-card">
          <button class="company-card__open" type="button" @click="ouvrir(c)">
            <h2 class="company-card__name">{{ c.nom || 'Entreprise sans nom' }}</h2>
            <p class="company-card__sector">{{ c.secteur }}</p>
            <p class="company-card__meta">
              {{ c.nbEmployes }} employés · créée le {{ formatDate(c.createdAt) }}
            </p>
          </button>
          <div class="company-card__foot">
            <button class="link" @click="ouvrir(c)">Ouvrir →</button>
            <button class="link link--danger" @click="supprimer(c)">Supprimer</button>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.head__actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.empty {
  margin-top: 0.5rem;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}
.company-card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
  transition: transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.company-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent);
}
.company-card__open {
  flex: 1;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
  padding: 1.25rem 1.25rem 1rem;
}
.company-card__name {
  font-family: var(--font-display);
  font-size: 1.15rem;
  margin-bottom: 0.2rem;
}
.company-card__sector {
  color: var(--text);
  font-size: 0.92rem;
}
.company-card__meta {
  color: var(--text-muted);
  font-size: 0.82rem;
  margin-top: 0.4rem;
}
.company-card__foot {
  display: flex;
  justify-content: space-between;
  padding: 0.85rem 1.25rem;
  border-top: 1px solid var(--border);
}
</style>
