<script setup>
// Vue Vulnérabilités : choisir un actif puis ajouter / supprimer ses vulns.
//  - criticite = select faible | moyenne | élevée (accents exacts, sinon 400).
//  - Pas de modification de vuln (R7) : pour « modifier », supprimer + ré-ajouter.
//  - Chaque vuln affiche le nom de son actif (vuln.assetId -> asset.nom).
import { computed, onMounted, reactive } from 'vue'
import { useAssetsStore } from '../stores/assets'
import { useVulnerabilitiesStore } from '../stores/vulnerabilities'
import { tonCriticite } from '../utils/niveau'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseBadge from '../components/BaseBadge.vue'

const CRITICITES = ['faible', 'moyenne', 'élevée']

const assetsStore = useAssetsStore()
const store = useVulnerabilitiesStore()

const form = reactive({ assetId: '', nom: '', criticite: CRITICITES[0] })

onMounted(async () => {
  await Promise.all([assetsStore.fetchAll(), store.fetchAll()])
})

function nomActif(assetId) {
  const a = assetsStore.list.find((x) => x.id === assetId)
  return a ? a.nom : 'Actif inconnu'
}

const aDesActifs = computed(() => assetsStore.list.length > 0)

async function ajouter() {
  try {
    await store.create({
      assetId: Number(form.assetId),
      nom: form.nom,
      criticite: form.criticite,
    })
    form.nom = ''
    form.criticite = CRITICITES[0]
  } catch {
    // store.error déjà renseigné et affiché.
  }
}

async function supprimer(vuln) {
  if (!confirm(`Supprimer la vulnérabilité « ${vuln.nom} » ?`)) return
  try {
    await store.remove(vuln.id)
  } catch {
    // store.error déjà renseigné et affiché.
  }
}
</script>

<template>
  <section class="page">
    <header class="page__head">
      <h1>Vulnérabilités</h1>
      <p class="page__sub">Recensez les failles rattachées à chaque actif.</p>
    </header>

    <BaseCard v-if="!aDesActifs && !assetsStore.loading" class="mb">
      <p class="muted center">
        Ajoutez d'abord des actifs pour pouvoir y rattacher des vulnérabilités.
      </p>
    </BaseCard>

    <BaseCard v-else class="mb">
      <template #header><h2>Ajouter une vulnérabilité</h2></template>
      <form class="form" @submit.prevent="ajouter">
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
              <option v-for="c in CRITICITES" :key="c" :value="c">{{ c }}</option>
            </select>
          </label>
        </div>
        <div class="actions">
          <BaseButton type="submit">Ajouter</BaseButton>
        </div>
      </form>
    </BaseCard>

    <p v-if="store.error" class="msg msg--error">{{ store.error }}</p>

    <p v-if="store.loading" class="muted">Chargement…</p>
    <BaseCard v-else-if="store.list.length === 0">
      <p class="muted center">Aucune vulnérabilité enregistrée.</p>
    </BaseCard>

    <BaseCard v-else>
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
    </BaseCard>
  </section>
</template>

<style scoped>
.page__head {
  margin-bottom: 1.25rem;
}
.page__sub {
  color: var(--text-muted);
  margin-top: 0.25rem;
}
.mb {
  margin-bottom: 1rem;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
.actions {
  display: flex;
  gap: 0.6rem;
}
.td-actions {
  text-align: right;
}
.strong {
  font-weight: 600;
}
.link {
  width: auto;
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  padding: 0;
  font: inherit;
  font-size: 0.9rem;
}
.link:hover {
  text-decoration: underline;
}
.link--danger {
  color: var(--danger);
}
.muted {
  color: var(--text-muted);
}
.center {
  text-align: center;
}
.msg {
  padding: 0.6rem 0.8rem;
  border-radius: var(--radius);
  margin: 0 0 1rem;
  font-size: 0.92rem;
}
.msg--error {
  color: var(--danger);
  background: var(--danger-soft);
}
@media (max-width: 600px) {
  .field.grow {
    flex-basis: 100%;
  }
}
</style>
