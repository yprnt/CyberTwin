<script setup>
// Vue Actifs. Les 6 types sont les valeurs exactes attendues par l'API.
// Après suppression, recharger les vulns (cascade R3) ; pas d'id en POST (R1).
import { onMounted, reactive, ref } from 'vue'
import { useAssetsStore } from '../stores/assets'
import { useVulnerabilitiesStore } from '../stores/vulnerabilities'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'
import BaseBadge from '../components/BaseBadge.vue'

const TYPES = [
  'Serveur Web',
  'Base de données',
  'Poste utilisateur',
  'Routeur',
  'Pare-feu',
  'Application métier',
]

const store = useAssetsStore()
const vulnsStore = useVulnerabilitiesStore()

const editId = ref(null)
const form = reactive({ nom: '', type: TYPES[0], expose: false })

onMounted(() => store.fetchAll())

function reinit() {
  editId.value = null
  form.nom = ''
  form.type = TYPES[0]
  form.expose = false
}

function editer(asset) {
  editId.value = asset.id
  form.nom = asset.nom
  form.type = asset.type
  form.expose = asset.expose === true
}

async function soumettre() {
  const payload = { nom: form.nom, type: form.type, expose: form.expose }
  try {
    if (editId.value !== null) await store.update(editId.value, payload)
    else await store.create(payload)
    reinit()
  } catch {
    // store.error déjà renseigné et affiché.
  }
}

async function supprimer(asset) {
  if (!confirm(`Supprimer l'actif « ${asset.nom} » et ses vulnérabilités ?`)) return
  try {
    await store.remove(asset.id)
    // Cascade R3 : les vulns de cet actif ont disparu côté back → resync.
    await vulnsStore.fetchAll()
    if (editId.value === asset.id) reinit()
  } catch {
    // store.error déjà renseigné et affiché.
  }
}
</script>

<template>
  <section class="page">
    <header class="page__head">
      <h1>Actifs</h1>
      <p class="page__sub">Inventaire du parc à protéger.</p>
    </header>

    <BaseCard class="mb">
      <template #header>
        <h2>{{ editId !== null ? "Modifier l'actif" : 'Ajouter un actif' }}</h2>
        <BaseBadge v-if="editId !== null" ton="accent">Édition</BaseBadge>
      </template>

      <form class="form" @submit.prevent="soumettre">
        <div class="row">
          <label class="field grow">
            <span>Nom</span>
            <input v-model="form.nom" type="text" required />
          </label>
          <label class="field">
            <span>Type</span>
            <select v-model="form.type">
              <option v-for="t in TYPES" :key="t" :value="t">{{ t }}</option>
            </select>
          </label>
          <label class="field check">
            <input v-model="form.expose" type="checkbox" />
            <span>Exposé à Internet</span>
          </label>
        </div>
        <div class="actions">
          <BaseButton type="submit" :disabled="store.loading">{{ editId !== null ? 'Enregistrer' : 'Ajouter' }}</BaseButton>
          <BaseButton v-if="editId !== null" type="button" variant="ghost" @click="reinit">
            Annuler
          </BaseButton>
        </div>
      </form>
    </BaseCard>

    <p v-if="store.error" class="msg msg--error">{{ store.error }}</p>

    <p v-if="store.loading" class="muted">Chargement…</p>
    <BaseCard v-else-if="store.list.length === 0">
      <p class="muted center">Aucun actif pour le moment. Ajoutez-en un ci-dessus.</p>
    </BaseCard>

    <BaseCard v-else>
      <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Type</th>
            <th>Exposé</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in store.list" :key="a.id">
            <td class="strong">{{ a.nom }}</td>
            <td>{{ a.type }}</td>
            <td>
              <BaseBadge :ton="a.expose ? 'danger' : 'neutral'">
                {{ a.expose ? 'Oui' : 'Non' }}
              </BaseBadge>
            </td>
            <td class="td-actions">
              <button class="link" @click="editer(a)">Modifier</button>
              <button class="link link--danger" @click="supprimer(a)">Supprimer</button>
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
.field.check {
  flex-direction: row;
  align-items: center;
  gap: 0.45rem;
  padding-bottom: 0.6rem;
}
.actions {
  display: flex;
  gap: 0.6rem;
}
/* Cellule d'actions : rester un vrai td (pas de display:flex, sinon la cellule
   sort du layout de tableau et déborde de la carte). */
.td-actions {
  text-align: right;
  white-space: nowrap;
}
.td-actions .link + .link {
  margin-left: 0.9rem;
}
@media (max-width: 600px) {
  .field.grow {
    flex-basis: 100%;
  }
}
</style>
