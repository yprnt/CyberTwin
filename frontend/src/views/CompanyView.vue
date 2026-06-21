<script setup>
// Vue Entreprise. Singleton (R2) : le mode « Créer » / « Modifier » dépend de estCreee().
import { onMounted, reactive, ref, watch } from 'vue'
import { useCompanyStore } from '../stores/company'
import BaseCard from '../components/BaseCard.vue'
import BaseButton from '../components/BaseButton.vue'

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

const serviceSaisi = ref('')
const confirmation = ref('')

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

watch(() => store.company, hydrater, { immediate: true })
onMounted(() => store.fetch())

function ajouterService() {
  const valeur = serviceSaisi.value.trim()
  if (!valeur) return
  if (!form.servicesExposes.includes(valeur)) form.servicesExposes.push(valeur)
  serviceSaisi.value = ''
}
function retirerService(index) {
  form.servicesExposes.splice(index, 1)
}
// La virgule valide aussi un service (en plus de la touche Entrée).
function ajouterSurVirgule(e) {
  if (e.key !== ',') return
  e.preventDefault()
  ajouterService()
}

async function soumettre() {
  confirmation.value = ''
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
    // store.error déjà renseigné et affiché.
  }
}
</script>

<template>
  <section class="page">
    <header class="page__head">
      <h1>{{ store.estCreee() ? "Modifier l'entreprise" : "Créer l'entreprise" }}</h1>
      <p class="page__sub">Renseignez le profil de votre organisation.</p>
    </header>

    <BaseCard>
      <form class="form" @submit.prevent="soumettre">
        <div class="grid grid--2">
          <label class="field">
            <span>Nom <i>*</i></span>
            <input v-model="form.nom" type="text" required />
          </label>
          <label class="field">
            <span>Secteur <i>*</i></span>
            <input v-model="form.secteur" type="text" required />
          </label>
        </div>

        <div class="grid grid--3">
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
          <div v-if="form.servicesExposes.length" class="tags">
            <span v-for="(service, i) in form.servicesExposes" :key="service" class="tag">
              {{ service }}
              <button type="button" class="tag__x" @click="retirerService(i)">×</button>
            </span>
          </div>
          <input
            v-model="serviceSaisi"
            type="text"
            placeholder="Ajouter un service puis Entrée"
            @keydown.enter.prevent="ajouterService"
            @keydown="ajouterSurVirgule"
          />
        </div>

        <p v-if="store.error" class="msg msg--error">{{ store.error }}</p>
        <p v-if="confirmation" class="msg msg--ok">{{ confirmation }}</p>

        <div class="actions">
          <BaseButton type="submit" :disabled="store.loading">
            {{ store.loading ? 'Enregistrement…' : store.estCreee() ? 'Modifier' : 'Créer' }}
          </BaseButton>
          <BaseButton type="button" variant="ghost" :disabled="store.loading" @click="hydrater">
            Réinitialiser
          </BaseButton>
        </div>
      </form>
    </BaseCard>
  </section>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.grid {
  display: grid;
  gap: 0.9rem;
}
.grid--2 {
  grid-template-columns: 1fr 1fr;
}
.grid--3 {
  grid-template-columns: repeat(3, 1fr);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field > span {
  font-weight: 600;
  font-size: 0.85rem;
}
.field i {
  color: var(--danger);
  font-style: normal;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.5rem;
}
.tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: var(--accent-soft);
  color: var(--accent);
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  font-weight: 500;
}
.tag__x {
  width: auto;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
}
.actions {
  display: flex;
  gap: 0.6rem;
}
/* Dans le formulaire (flex + gap), pas de marge basse : le gap gère l'espacement. */
.msg {
  margin: 0;
}
@media (max-width: 600px) {
  .grid--2,
  .grid--3 {
    grid-template-columns: 1fr;
  }
}
</style>
