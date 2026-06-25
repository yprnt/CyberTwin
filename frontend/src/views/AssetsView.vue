<script setup>
// Vue Actifs. Les 6 types sont les valeurs exactes attendues par l'API.
// Après suppression, recharger les vulns (cascade R3) ; pas d'id en POST (R1).
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAssetsStore } from '../stores/assets'
import { useVulnerabilitiesStore } from '../stores/vulnerabilities'
import { useConfirm } from '../composables/useConfirm'
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
const { confirm } = useConfirm()
const route = useRoute()

const companyId = computed(() => route.params.id)
const editId = ref(null)
const form = reactive({ nom: '', type: TYPES[0], expose: false })

onMounted(() => store.fetchAll(companyId.value))

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
  const modification = editId.value !== null
  try {
    if (modification) await store.update(companyId.value, editId.value, payload)
    else await store.create(companyId.value, payload)
    reinit()
  } catch {
    // Pas de toast (éviter le flood) : l'erreur s'affiche en ligne via store.error.
  }
}

async function supprimer(asset) {
  const ok = await confirm({
    title: "Supprimer l'actif",
    message: `« ${asset.nom} » et ses vulnérabilités associées seront supprimés.`,
    confirmLabel: 'Supprimer',
    danger: true,
  })
  if (!ok) return
  try {
    await store.remove(companyId.value, asset.id)
    // Cascade R3 : les vulns de cet actif ont disparu côté back → resync.
    await vulnsStore.fetchAll(companyId.value)
    if (editId.value === asset.id) reinit()
  } catch {
    // store.error affiché en ligne.
  }
}
</script>

<template>
  <section class="page">
    <header class="page__head">
      <h1>Actifs</h1>
      <p class="page__sub">Recensez les équipements informatiques de votre organisation.</p>
    </header>

    <form class="sheet mb" @submit.prevent="soumettre">
      <section class="sec">
        <div class="sec__head">
          <span class="eyebrow">{{ editId !== null ? "Modifier l'actif" : 'Ajouter un actif' }}</span>
          <BaseBadge v-if="editId !== null" ton="accent">Édition</BaseBadge>
        </div>
        <p class="grp-help">Un actif = un équipement informatique. Cochez « Exposé à Internet » s'il est accessible depuis l'extérieur.</p>
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
          <label class="toggle">
            <input v-model="form.expose" type="checkbox" />
            <span class="toggle__track"><span class="toggle__thumb"></span></span>
            <span class="toggle__label">Exposé à Internet</span>
          </label>
        </div>
      </section>
      <div class="foot">
        <BaseButton type="submit" :disabled="store.loading">{{ editId !== null ? 'Enregistrer' : 'Ajouter' }}</BaseButton>
        <BaseButton v-if="editId !== null" type="button" variant="ghost" @click="reinit">
          Annuler
        </BaseButton>
      </div>
    </form>

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
.sec__head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
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
/* Interrupteur « Exposé à Internet ». */
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  cursor: pointer;
  padding-bottom: 0.55rem;
  user-select: none;
}
.toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.toggle__track {
  position: relative;
  width: 42px;
  height: 24px;
  flex-shrink: 0;
  border-radius: var(--radius-pill);
  background: var(--surface-2);
  border: 1px solid var(--border);
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.toggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: transform 0.18s ease;
}
.toggle input:checked + .toggle__track {
  background: var(--accent);
  border-color: var(--accent);
}
.toggle input:checked + .toggle__track .toggle__thumb {
  transform: translateX(18px);
}
.toggle input:focus-visible + .toggle__track {
  box-shadow: 0 0 0 3px var(--accent-soft);
}
.toggle__label {
  font-weight: 600;
  font-size: 0.85rem;
}
.foot {
  padding: 1.1rem 1.6rem;
  border-top: 1px solid var(--border);
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
