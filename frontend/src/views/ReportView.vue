<script setup>
// Vue Rapport : synthèse imprimable. Recalcule le risque (R5).
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useCompaniesStore } from '../stores/companies'
import { useAssetsStore } from '../stores/assets'
import { useVulnerabilitiesStore } from '../stores/vulnerabilities'
import { useRiskStore } from '../stores/risk'
import { tonNiveau, tonCriticite } from '../utils/niveau'
import BaseButton from '../components/BaseButton.vue'

const route = useRoute()
const companiesStore = useCompaniesStore()
const assetsStore = useAssetsStore()
const vulnsStore = useVulnerabilitiesStore()
const riskStore = useRiskStore()

const companyId = computed(() => route.params.id)

onMounted(async () => {
  // l'entreprise est déjà chargée par CompanyLayout (companiesStore.current)
  await Promise.all([
    assetsStore.fetchAll(companyId.value),
    vulnsStore.fetchAll(companyId.value),
    riskStore.calculate(companyId.value),
  ])
})

const company = computed(() => companiesStore.current)
const resultat = computed(() => riskStore.result)

function nomActif(assetId) {
  const a = assetsStore.list.find((x) => x.id === assetId)
  return a ? a.nom : 'Actif inconnu'
}
const dot = (ton) => `var(--${ton})`

function imprimer() {
  window.print()
}

const dateDuJour = new Date().toLocaleDateString('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
</script>

<template>
  <section class="page">
    <header class="bar no-print">
      <div>
        <h1>Rapport</h1>
        <p class="page__sub">Synthèse complète, prête à imprimer ou exporter en PDF.</p>
      </div>
      <BaseButton @click="imprimer">Imprimer / PDF</BaseButton>
    </header>

    <p v-if="riskStore.error" class="msg msg--error no-print">{{ riskStore.error }}</p>

    <article class="sheet">
      <header class="sheet__head">
        <div>
          <p class="sheet__kicker">Évaluation du risque cyber</p>
          <h2 class="sheet__title">{{ company && company.nom ? company.nom : 'Rapport CyberTwin' }}</h2>
        </div>
        <p class="sheet__date">{{ dateDuJour }}</p>
      </header>

      <div v-if="resultat" class="summary">
        <div class="summary__score">
          <span class="summary__num">{{ resultat.score }}</span>
          <span class="summary__den">/ 100</span>
        </div>
        <div class="summary__meta">
          <span class="summary__level">
            <span class="dot" :style="{ background: dot(tonNiveau(resultat.niveau)) }"></span>
            Niveau {{ resultat.niveau }}
          </span>
          <span class="summary__counts">
            {{ resultat.nbActifs }} actifs · {{ resultat.nbVulnerabilites }} vulnérabilités
          </span>
        </div>
      </div>

      <section class="block">
        <p class="block__label">Entreprise</p>
        <template v-if="company && company.nom">
          <p class="block__lead">{{ company.secteur }}</p>
          <dl class="facts">
            <div><dt>Employés</dt><dd>{{ company.nbEmployes }}</dd></div>
            <div><dt>Serveurs</dt><dd>{{ company.nbServeurs }}</dd></div>
            <div><dt>Postes</dt><dd>{{ company.nbPostes }}</dd></div>
            <div class="facts__wide">
              <dt>Services exposés</dt>
              <dd>{{ (company.servicesExposes || []).join(', ') || 'Aucun' }}</dd>
            </div>
          </dl>
        </template>
        <p v-else class="muted">Aucune entreprise configurée.</p>
      </section>

      <section class="block">
        <p class="block__label">Inventaire des actifs</p>
        <table v-if="assetsStore.list.length" class="doc-table">
          <thead><tr><th>Nom</th><th>Type</th><th>Exposé</th></tr></thead>
          <tbody>
            <tr v-for="a in assetsStore.list" :key="a.id">
              <td>{{ a.nom }}</td>
              <td class="muted">{{ a.type }}</td>
              <td>{{ a.expose ? 'Oui' : 'Non' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="muted">Aucun actif.</p>
      </section>

      <section class="block">
        <p class="block__label">Vulnérabilités</p>
        <table v-if="vulnsStore.list.length" class="doc-table">
          <thead><tr><th>Vulnérabilité</th><th>Actif</th><th>Criticité</th></tr></thead>
          <tbody>
            <tr v-for="v in vulnsStore.list" :key="v.id">
              <td>{{ v.nom }}</td>
              <td class="muted">{{ nomActif(v.assetId) }}</td>
              <td>
                <span class="dot" :style="{ background: dot(tonCriticite(v.criticite)) }"></span>
                {{ v.criticite }}
              </td>
            </tr>
          </tbody>
        </table>
        <p v-else class="muted">Aucune vulnérabilité.</p>
      </section>

      <section v-if="resultat" class="block">
        <p class="block__label">Recommandations</p>
        <ol class="recos">
          <li v-for="(reco, i) in resultat.recommandations" :key="i">{{ reco }}</li>
        </ol>
      </section>
    </article>
  </section>
</template>

<style scoped>
.bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.sheet {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: 2.5rem;
  max-width: 760px;
  margin: 0 auto;
}
.sheet__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border);
}
.sheet__kicker {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  margin-bottom: 0.3rem;
}
.sheet__title {
  font-size: 1.5rem;
}
.sheet__date {
  color: var(--text-muted);
  font-size: 0.85rem;
  white-space: nowrap;
}

/* Bandeau synthèse */
.summary {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.4rem 0;
  border-bottom: 1px solid var(--border);
}
.summary__score {
  display: flex;
  align-items: baseline;
  gap: 0.3rem;
}
.summary__num {
  font-size: 2.6rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.summary__den {
  color: var(--text-muted);
  font-size: 1rem;
}
.summary__meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.summary__level {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  text-transform: capitalize;
}
.summary__counts {
  color: var(--text-muted);
  font-size: 0.9rem;
}
.dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Sections */
.block {
  margin-top: 1.75rem;
}
.block__label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  margin-bottom: 0.7rem;
}
.block__lead {
  font-weight: 600;
  margin-bottom: 0.6rem;
}
.facts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.8rem 1.5rem;
  margin: 0;
}
.facts__wide {
  grid-column: 1 / -1;
}
.facts dt {
  font-size: 0.78rem;
  color: var(--text-muted);
}
.facts dd {
  margin: 0.1rem 0 0;
  font-weight: 500;
}

/* Tables document : lignes légères, pas de fond coloré */
.doc-table th {
  font-size: 0.72rem;
}
.doc-table td {
  font-size: 0.92rem;
}
.doc-table td:last-child {
  text-transform: capitalize;
  white-space: nowrap;
}

.recos {
  margin: 0;
  padding-left: 1.2rem;
}
.recos li {
  margin-bottom: 0.5rem;
  line-height: 1.55;
}
@media print {
  .sheet {
    border: none;
    box-shadow: none;
    padding: 0;
    max-width: none;
    background: #fff;
  }
}
@media (max-width: 600px) {
  .sheet {
    padding: 1.5rem;
  }
  .facts {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
