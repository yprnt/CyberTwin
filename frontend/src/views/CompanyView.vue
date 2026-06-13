<script setup>
// Vue Entreprise : lit l'entreprise (GET /company) au montage, puis permet de
// la créer ou la modifier (PUT /company via le store). L'entreprise est un
// singleton (R2) : le mode « Créer » / « Modifier » dépend de estCreee().
import { onMounted, reactive, ref, watch } from 'vue'
import { useCompanyStore } from '../stores/company'

const store = useCompanyStore()

// État local du formulaire, distinct du store (on ne mute jamais store.company).
const form = reactive({
  nom: '',
  secteur: '',
  nbEmployes: 0,
  nbServeurs: 0,
  nbPostes: 0,
  servicesExposes: [],
})

// Saisie en cours pour le champ « services exposés » (tags).
const serviceSaisi = ref('')
// Message de confirmation transitoire après un enregistrement réussi.
const confirmation = ref('')

// Recopie les données du store dans le formulaire local (pré-remplissage en
// mode modification, ou réinitialisation).
function hydrater() {
  const c = store.company
  if (!c) return
  form.nom = c.nom || ''
  form.secteur = c.secteur || ''
  form.nbEmployes = c.nbEmployes || 0
  form.nbServeurs = c.nbServeurs || 0
  form.nbPostes = c.nbPostes || 0
  form.servicesExposes = Array.isArray(c.servicesExposes) ? [...c.servicesExposes] : []
}

// Quand les données arrivent (ou changent), on ré-hydrate le formulaire.
watch(() => store.company, hydrater, { immediate: true })

onMounted(() => store.fetch())

// --- Tags « services exposés » --------------------------------------------
function ajouterService() {
  const valeur = serviceSaisi.value.trim()
  if (!valeur) return
  if (!form.servicesExposes.includes(valeur)) form.servicesExposes.push(valeur)
  serviceSaisi.value = ''
}
function retirerService(index) {
  form.servicesExposes.splice(index, 1)
}

// --- Soumission ------------------------------------------------------------
async function soumettre() {
  confirmation.value = ''
  // Au cas où un service serait resté tapé sans validation.
  if (serviceSaisi.value.trim()) ajouterService()
  try {
    await store.save({
      nom: form.nom,
      secteur: form.secteur,
      nbEmployes: Number(form.nbEmployes) || 0,
      nbServeurs: Number(form.nbServeurs) || 0,
      nbPostes: Number(form.nbPostes) || 0,
      servicesExposes: [...form.servicesExposes],
    })
    confirmation.value = 'Entreprise enregistrée.'
  } catch {
    // store.error est déjà renseigné par le store et affiché dans le template.
  }
}
</script>

<template>
  <section class="company">
    <h1>{{ store.estCreee() ? "Modifier l'entreprise" : "Créer l'entreprise" }}</h1>

    <p v-if="store.loading && !store.company" class="info">Chargement…</p>

    <form class="form" @submit.prevent="soumettre">
      <label class="field">
        <span>Nom <abbr title="Requis">*</abbr></span>
        <input v-model="form.nom" type="text" required />
      </label>

      <label class="field">
        <span>Secteur <abbr title="Requis">*</abbr></span>
        <input v-model="form.secteur" type="text" required />
      </label>

      <div class="grid">
        <label class="field">
          <span>Nb employés</span>
          <input v-model.number="form.nbEmployes" type="number" min="0" />
        </label>
        <label class="field">
          <span>Nb serveurs</span>
          <input v-model.number="form.nbServeurs" type="number" min="0" />
        </label>
        <label class="field">
          <span>Nb postes</span>
          <input v-model.number="form.nbPostes" type="number" min="0" />
        </label>
      </div>

      <div class="field">
        <span>Services exposés</span>
        <div class="tags">
          <span v-for="(service, i) in form.servicesExposes" :key="service" class="tag">
            {{ service }}
            <button type="button" class="tag-x" @click="retirerService(i)">×</button>
          </span>
        </div>
        <input
          v-model="serviceSaisi"
          type="text"
          placeholder="Ajouter un service puis Entrée"
          @keydown.enter.prevent="ajouterService"
          @keydown="(e) => e.key === ',' && (e.preventDefault(), ajouterService())"
        />
      </div>

      <p v-if="store.error" class="error">{{ store.error }}</p>
      <p v-if="confirmation" class="success">{{ confirmation }}</p>

      <div class="actions">
        <button type="submit" class="btn-primary" :disabled="store.loading">
          {{ store.loading ? 'Enregistrement…' : store.estCreee() ? 'Modifier' : 'Créer' }}
        </button>
        <button type="button" class="btn-ghost" @click="hydrater" :disabled="store.loading">
          Réinitialiser
        </button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.company {
  max-width: 640px;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field > span {
  font-weight: 600;
  font-size: 0.9rem;
  color: #374151;
}
.field abbr {
  color: #dc2626;
  text-decoration: none;
}
input {
  padding: 0.5rem 0.6rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.375rem;
  font-size: 0.95rem;
}
input:focus {
  outline: 2px solid #2563eb;
  outline-offset: 0;
  border-color: #2563eb;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: #e0e7ff;
  color: #1e3a8a;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  font-size: 0.85rem;
}
.tag-x {
  border: none;
  background: transparent;
  color: #1e3a8a;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
}
.actions {
  display: flex;
  gap: 0.75rem;
}
.btn-primary {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 0.55rem 1.1rem;
  border-radius: 0.375rem;
  font-size: 0.95rem;
  cursor: pointer;
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn-ghost {
  background: transparent;
  color: #374151;
  border: 1px solid #cbd5e1;
  padding: 0.55rem 1.1rem;
  border-radius: 0.375rem;
  font-size: 0.95rem;
  cursor: pointer;
}
.info {
  color: #6b7280;
}
.error {
  color: #b91c1c;
  background: #fee2e2;
  padding: 0.5rem 0.7rem;
  border-radius: 0.375rem;
  margin: 0;
}
.success {
  color: #166534;
  background: #dcfce7;
  padding: 0.5rem 0.7rem;
  border-radius: 0.375rem;
  margin: 0;
}
</style>
