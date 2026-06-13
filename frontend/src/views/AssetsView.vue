<script setup>
// Vue Actifs : liste + ajout / édition / suppression.
//  - type = select des 6 valeurs exactes attendues par l'API.
//  - expose = checkbox.
//  - Après suppression d'un actif, recharger les vulnérabilités (cascade R3).
//  - Jamais d'id en POST (R1) : create n'envoie que nom/type/expose.
import { onMounted, reactive, ref } from 'vue'
import { useAssetsStore } from '../stores/assets'
import { useVulnerabilitiesStore } from '../stores/vulnerabilities'

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

// id de l'actif en cours d'édition (null = mode ajout).
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
  <section class="assets">
    <h1>Actifs</h1>

    <form class="form" @submit.prevent="soumettre">
      <h2>{{ editId !== null ? "Modifier l'actif" : 'Ajouter un actif' }}</h2>
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
        <button type="submit" class="btn-primary">
          {{ editId !== null ? 'Enregistrer' : 'Ajouter' }}
        </button>
        <button v-if="editId !== null" type="button" class="btn-ghost" @click="reinit">
          Annuler
        </button>
      </div>
    </form>

    <p v-if="store.error" class="error">{{ store.error }}</p>

    <p v-if="store.loading" class="info">Chargement…</p>
    <p v-else-if="store.list.length === 0" class="info">Aucun actif pour le moment.</p>

    <table v-else class="table">
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
          <td>{{ a.nom }}</td>
          <td>{{ a.type }}</td>
          <td>
            <span :class="['badge', a.expose ? 'badge-on' : 'badge-off']">
              {{ a.expose ? 'Oui' : 'Non' }}
            </span>
          </td>
          <td class="td-actions">
            <button class="link" @click="editer(a)">Modifier</button>
            <button class="link link-danger" @click="supprimer(a)">Supprimer</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.assets {
  max-width: 820px;
}
.form {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin: 1rem 0;
}
.form h2 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field.grow {
  flex: 1 1 200px;
}
.field > span {
  font-weight: 600;
  font-size: 0.85rem;
  color: #374151;
}
.field.check {
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
  padding-bottom: 0.5rem;
}
input[type='text'],
select {
  padding: 0.5rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  font-size: 0.95rem;
}
.actions {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
}
.btn-primary {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
}
.btn-ghost {
  background: transparent;
  border: 1px solid #cbd5e1;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th,
.table td {
  text-align: left;
  padding: 0.55rem 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.92rem;
}
.table th {
  color: #6b7280;
  font-size: 0.8rem;
  text-transform: uppercase;
}
.badge {
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.8rem;
}
.badge-on {
  background: #fee2e2;
  color: #b91c1c;
}
.badge-off {
  background: #f3f4f6;
  color: #6b7280;
}
.td-actions {
  display: flex;
  gap: 0.75rem;
}
.link {
  background: none;
  border: none;
  color: #2563eb;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
}
.link-danger {
  color: #b91c1c;
}
.info {
  color: #6b7280;
}
.error {
  color: #b91c1c;
  background: #fee2e2;
  padding: 0.5rem 0.7rem;
  border-radius: 0.375rem;
}
</style>
