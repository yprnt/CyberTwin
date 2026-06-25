<script setup>
// Vue Entreprise. Singleton (R2) : le mode « Créer » / « Modifier » dépend de estCreee().
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useCompanyStore } from '../stores/company'
import BaseButton from '../components/BaseButton.vue'

const store = useCompanyStore()

// Services exposés courants proposés en un clic ; l'utilisateur peut en ajouter d'autres.
const SERVICES_COURANTS = [
  'Site web',
  'Webmail',
  'VPN',
  'Extranet client',
  'Espace client',
  'Accès distant',
]

// Nombres à '' : un champ vide reste vide (champ « obligatoire ») au lieu d'un 0 trompeur.
const form = reactive({
  nom: '',
  secteur: '',
  nbEmployes: '',
  nbServeurs: '',
  nbPostes: '',
  servicesExposes: [],
})

const serviceSaisi = ref('')
const confirmation = ref('')
const erreurLocale = ref('')

function hydrater() {
  const c = store.company
  if (!c) return
  form.nom = c.nom || ''
  form.secteur = c.secteur || ''
  form.nbEmployes = c.nbEmployes || ''
  form.nbServeurs = c.nbServeurs || ''
  form.nbPostes = c.nbPostes || ''
  form.servicesExposes = Array.isArray(c.servicesExposes) ? [...c.servicesExposes] : []
}

watch(() => store.company, hydrater, { immediate: true })
onMounted(() => store.fetch())

// Suggestions = services courants pas encore sélectionnés.
const suggestions = computed(() => SERVICES_COURANTS.filter((s) => !form.servicesExposes.includes(s)))
function ajouterService(service) {
  if (service && !form.servicesExposes.includes(service)) form.servicesExposes.push(service)
}
function ajouterSaisie() {
  ajouterService(serviceSaisi.value.trim())
  serviceSaisi.value = ''
}
function retirerService(service) {
  form.servicesExposes = form.servicesExposes.filter((s) => s !== service)
}

// Un nombre est « renseigné » s'il est saisi (0 reste une valeur valide).
function estRenseigne(valeur) {
  return valeur !== '' && valeur !== null && !Number.isNaN(Number(valeur))
}

async function soumettre() {
  confirmation.value = ''
  erreurLocale.value = ''
  if (serviceSaisi.value.trim()) ajouterServicePerso()

  if (!estRenseigne(form.nbEmployes) || !estRenseigne(form.nbServeurs) || !estRenseigne(form.nbPostes)) {
    erreurLocale.value = "Renseignez le nombre d'employés, de serveurs et de postes de travail."
    return
  }
  if (form.servicesExposes.length === 0) {
    erreurLocale.value = 'Sélectionnez au moins un service exposé sur Internet.'
    return
  }

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
      <p class="page__sub">Décrivez votre organisation : ces éléments déterminent votre niveau de risque.</p>
    </header>

    <form class="sheet" @submit.prevent="soumettre">
      <section class="sec">
        <span class="eyebrow">Profil</span>
        <p class="grp-help">L'identité et la taille de votre organisation.</p>
        <div class="grid grid--2">
          <label class="field">
            <span>Nom <i>*</i></span>
            <input v-model="form.nom" type="text" required />
          </label>
          <label class="field">
            <span>Secteur d'activité <i>*</i></span>
            <input v-model="form.secteur" type="text" required />
          </label>
        </div>
        <label class="field field--sm">
          <span>Nombre d'employés <i>*</i></span>
          <input v-model.number="form.nbEmployes" type="number" min="0" required />
        </label>
      </section>

      <section class="sec">
        <span class="eyebrow">Parc informatique</span>
        <p class="grp-help">Vos équipements informatiques. Indiquez 0 si vous n'en avez pas.</p>
        <div class="grid grid--2">
          <label class="field">
            <span>Serveurs <i>*</i></span>
            <input v-model.number="form.nbServeurs" type="number" min="0" required />
          </label>
          <label class="field">
            <span>Postes de travail <i>*</i></span>
            <input v-model.number="form.nbPostes" type="number" min="0" required />
          </label>
        </div>
      </section>

      <section class="sec">
        <span class="eyebrow">Exposition sur Internet</span>
        <p class="grp-help">Cochez les services accessibles depuis Internet : ce sont les points d'entrée potentiels d'une attaque.</p>
        <div v-if="form.servicesExposes.length" class="picked">
          <span v-for="service in form.servicesExposes" :key="service" class="pill">
            {{ service }}
            <button type="button" :aria-label="`Retirer ${service}`" @click="retirerService(service)">×</button>
          </span>
        </div>
        <input
          v-model="serviceSaisi"
          type="text"
          placeholder="Saisir un service puis Entrée"
          @keydown.enter.prevent="ajouterSaisie"
        />
        <div v-if="suggestions.length" class="sugg">
          <button v-for="service in suggestions" :key="service" type="button" @click="ajouterService(service)">
            + {{ service }}
          </button>
        </div>
        <p class="hint">Tapez puis Entrée, ou cliquez une suggestion. Au moins un service.</p>
      </section>

      <div class="foot">
        <p v-if="erreurLocale" class="msg msg--error">{{ erreurLocale }}</p>
        <p v-else-if="store.error" class="msg msg--error">{{ store.error }}</p>
        <p v-if="confirmation" class="msg msg--ok">{{ confirmation }}</p>
        <div class="actions">
          <BaseButton type="submit" :disabled="store.loading">
            {{ store.loading ? 'Enregistrement…' : store.estCreee() ? 'Enregistrer' : "Créer l'entreprise" }}
          </BaseButton>
          <BaseButton type="button" variant="ghost" :disabled="store.loading" @click="hydrater">
            Réinitialiser
          </BaseButton>
        </div>
      </div>
    </form>
  </section>
</template>

<style scoped>
/* Panneau unique, groupes séparés par des traits (Design 2). */
.sheet {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.sec {
  padding: 1.5rem 1.6rem;
  border-bottom: 1px solid var(--border);
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
.grid {
  display: grid;
  gap: 0.9rem;
}
.grid--2 {
  grid-template-columns: 1fr 1fr;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.field--sm {
  max-width: 220px;
}
.field > span {
  font-weight: 600;
  font-size: 0.85rem;
}
.field i {
  color: var(--danger);
  font-style: normal;
}
.hint {
  color: var(--text-muted);
  font-size: 0.78rem;
  margin-top: -0.4rem;
}
/* Services exposés : pastilles retirables + suggestions cliquables (méthode 3). */
.picked {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--accent-soft);
  color: var(--accent);
  padding: 0.25rem 0.65rem;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  font-weight: 500;
}
.pill button {
  width: auto;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
}
.sugg {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.sugg button {
  font: inherit;
  font-size: 0.82rem;
  color: var(--text-muted);
  background: none;
  border: 1px dashed var(--border);
  border-radius: var(--radius-pill);
  padding: 0.25rem 0.7rem;
  cursor: pointer;
}
.sugg button:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.foot {
  padding: 1.4rem 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.foot .msg {
  margin: 0;
}
.actions {
  display: flex;
  gap: 0.6rem;
}
@media (max-width: 600px) {
  .grid--2 {
    grid-template-columns: 1fr;
  }
}
</style>
