<script setup>
// Vue Vulnérabilités : choisir un actif puis ajouter / supprimer ses vulns.
//  - criticite = select faible | moyenne | élevée (accents exacts, sinon 400).
//  - Pas de modification de vuln (R7) : pour « modifier », supprimer + ré-ajouter.
//  - Chaque vuln affiche le nom de son actif (vuln.assetId -> asset.nom).
import { computed, onMounted, reactive } from 'vue'
import { useAssetsStore } from '../stores/assets'
import { useVulnerabilitiesStore } from '../stores/vulnerabilities'

const CRITICITES = ['faible', 'moyenne', 'élevée']

const assetsStore = useAssetsStore()
const store = useVulnerabilitiesStore()

const form = reactive({ assetId: '', nom: '', criticite: CRITICITES[0] })

onMounted(async () => {
  await Promise.all([assetsStore.fetchAll(), store.fetchAll()])
})

// Nom de l'actif associé à une vuln (ou libellé de repli).
function nomActif(assetId) {
  const a = assetsStore.list.find((x) => x.id === assetId)
  return a ? a.nom : '— actif inconnu —'
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
  <section class="vulns">
    <h1>Vulnérabilités</h1>

    <p v-if="!aDesActifs && !assetsStore.loading" class="info">
      Ajoutez d'abord des actifs pour pouvoir y rattacher des vulnérabilités.
    </p>

    <form v-else class="form" @submit.prevent="ajouter">
      <h2>Ajouter une vulnérabilité</h2>
      <div class="row">
        <label class="field">
          <span>Actif concerné</span>
          <select v-model="form.assetId" required>
            <option value="" disabled>— choisir un actif —</option>
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
        <button type="submit" class="btn-primary">Ajouter</button>
      </div>
    </form>

    <p v-if="store.error" class="error">{{ store.error }}</p>

    <p v-if="store.loading" class="info">Chargement…</p>
    <p v-else-if="store.list.length === 0" class="info">Aucune vulnérabilité enregistrée.</p>

    <table v-else class="table">
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
          <td>{{ v.nom }}</td>
          <td>{{ nomActif(v.assetId) }}</td>
          <td><span :class="['crit', 'crit-' + v.criticite]">{{ v.criticite }}</span></td>
          <td>
            <button class="link link-danger" @click="supprimer(v)">Supprimer</button>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.vulns {
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
  flex: 1 1 220px;
}
.field > span {
  font-weight: 600;
  font-size: 0.85rem;
  color: #374151;
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
}
.btn-primary {
  background: #2563eb;
  color: #fff;
  border: none;
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
.crit {
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.8rem;
  text-transform: capitalize;
}
.crit-faible {
  background: #dcfce7;
  color: #166534;
}
.crit-moyenne {
  background: #fef3c7;
  color: #92400e;
}
.crit-élevée {
  background: #fee2e2;
  color: #b91c1c;
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
