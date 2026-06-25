<script setup>
// Vue Vulnérabilités. Criticité : accents exacts (faible|moyenne|élevée) sinon 400.
// Pas de PUT vuln (R7) : pour « modifier », supprimer puis ré-ajouter.
import { computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useAssetsStore } from '../stores/assets'
import { useVulnerabilitiesStore } from '../stores/vulnerabilities'
import { useConfirm } from '../composables/useConfirm'
import { tonCriticite } from '../utils/niveau'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseBadge from '../components/BaseBadge.vue'

const CRITICITES = ['faible', 'moyenne', 'élevée']
// Affichage avec majuscule ; la valeur envoyée à l'API reste en minuscules (sinon 400).
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

const assetsStore = useAssetsStore()
const store = useVulnerabilitiesStore()
const { confirm } = useConfirm()
const route = useRoute()

const companyId = computed(() => route.params.id)
const form = reactive({ assetId: '', nom: '', criticite: CRITICITES[0] })

onMounted(async () => {
  await Promise.all([assetsStore.fetchAll(companyId.value), store.fetchAll(companyId.value)])
})

function nomActif(assetId) {
  const a = assetsStore.list.find((x) => x.id === assetId)
  return a ? a.nom : 'Actif inconnu'
}

const aDesActifs = computed(() => assetsStore.list.length > 0)

async function ajouter() {
  try {
    await store.create(companyId.value, {
      assetId: Number(form.assetId),
      nom: form.nom,
      criticite: form.criticite,
    })
    form.nom = ''
    form.criticite = CRITICITES[0]
  } catch {
    // Pas de toast (éviter le flood) : l'erreur s'affiche en ligne via store.error.
  }
}

async function supprimer(vuln) {
  const ok = await confirm({
    title: 'Supprimer la vulnérabilité',
    message: `« ${vuln.nom} » sera supprimée de cet actif.`,
    confirmLabel: 'Supprimer',
    danger: true,
  })
  if (!ok) return
  try {
    await store.remove(companyId.value, vuln.id)
  } catch {
    // store.error affiché en ligne.
  }
}
</script>

<template>
  <section class="page">
    <header class="page__head">
      <h1>Vulnérabilités</h1>
      <p class="page__sub">Listez les failles ou faiblesses connues de chaque équipement.</p>
    </header>

    <BaseCard v-if="!aDesActifs && !assetsStore.loading" class="mb">
      <p class="muted center">
        Ajoutez d'abord des actifs pour pouvoir y rattacher des vulnérabilités.
      </p>
    </BaseCard>

    <form v-else class="sheet mb" @submit.prevent="ajouter">
      <section class="sec">
        <span class="eyebrow">Ajouter une vulnérabilité</span>
        <p class="grp-help">Rattachez chaque faille à un équipement, nommez-la, puis indiquez sa gravité (criticité).</p>
        <div class="row">
          <label class="field">
            <span>Actif concerné</span>
            <select v-model="form.assetId" required>
              <option value="" disabled>Choisir un actif</option>
              <option v-for="a in assetsStore.list" :key="a.id" :value="a.id">
                {{ a.nom }}
              </option>
            </select>
          </label>
          <label class="field grow">
            <span>Nom</span>
            <input v-model="form.nom" type="text" required />
          </label>
          <label class="field">
            <span>Criticité</span>
            <select v-model="form.criticite">
              <option v-for="c in CRITICITES" :key="c" :value="c">{{ cap(c) }}</option>
            </select>
          </label>
        </div>
      </section>
      <div class="foot">
        <BaseButton type="submit" :disabled="store.loading">Ajouter</BaseButton>
      </div>
    </form>

    <p v-if="store.error" class="msg msg--error">{{ store.error }}</p>

    <p v-if="store.loading" class="muted">Chargement…</p>
    <BaseCard v-else-if="store.list.length === 0">
      <p class="muted center">Aucune vulnérabilité enregistrée.</p>
    </BaseCard>

    <BaseCard v-else>
      <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Vulnérabilité</th>
            <th>Actif</th>
            <th>Criticité</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in store.list" :key="v.id">
            <td class="strong">{{ v.nom }}</td>
            <td>{{ nomActif(v.assetId) }}</td>
            <td><BaseBadge :ton="tonCriticite(v.criticite)">{{ v.criticite }}</BaseBadge></td>
            <td class="td-actions">
              <button class="link link--danger" @click="supprimer(v)">Supprimer</button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
    </BaseCard>
  </section>
</template>

<style scoped>
.mb {
  margin-bottom: 1rem;
}
/* Panneau de formulaire cohérent avec la page Entreprise (Design 2). */
.sheet {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.sec {
  padding: 1.5rem 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.eyebrow {
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--text);
}
.grp-help {
  color: var(--text-muted);
  font-size: 0.86rem;
  line-height: 1.5;
  margin-top: -0.65rem;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  align-items: flex-end;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field.grow {
  flex: 1 1 220px;
}
.field > span {
  font-weight: 600;
  font-size: 0.85rem;
}
.foot {
  padding: 1.1rem 1.6rem;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 0.6rem;
}
.td-actions {
  text-align: right;
}
@media (max-width: 600px) {
  .field.grow {
    flex-basis: 100%;
  }
}
</style>
