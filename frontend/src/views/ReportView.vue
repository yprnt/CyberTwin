<script setup>
// Vue Rapport : synthèse imprimable. Charge entreprise + actifs + vulns et
// recalcule le risque (R5), puis propose une impression (window.print()).
import { computed, onMounted } from 'vue'
import { useCompanyStore } from '../stores/company'
import { useAssetsStore } from '../stores/assets'
import { useVulnerabilitiesStore } from '../stores/vulnerabilities'
import { useRiskStore } from '../stores/risk'
import { niveauBadge } from '../utils/niveau'

const companyStore = useCompanyStore()
const assetsStore = useAssetsStore()
const vulnsStore = useVulnerabilitiesStore()
const riskStore = useRiskStore()

onMounted(async () => {
  await Promise.all([
    companyStore.fetch(),
    assetsStore.fetchAll(),
    vulnsStore.fetchAll(),
    riskStore.calculate(),
  ])
})

const company = computed(() => companyStore.company)
const resultat = computed(() => riskStore.result)

function nomActif(assetId) {
  const a = assetsStore.list.find((x) => x.id === assetId)
  return a ? a.nom : '—'
}

function imprimer() {
  window.print()
}

const dateDuJour = new Date().toLocaleDateString('fr-FR')
</script>

<template>
  <section class="report">
    <div class="head no-print">
      <h1>Rapport</h1>
      <button class="btn-primary" @click="imprimer">Imprimer / PDF</button>
    </div>

    <p v-if="riskStore.error" class="error no-print">{{ riskStore.error }}</p>

    <article class="sheet">
      <header class="sheet-head">
        <h2>Rapport d'évaluation du risque cyber</h2>
        <p class="date">Édité le {{ dateDuJour }}</p>
      </header>

      <section>
        <h3>Entreprise</h3>
        <template v-if="company && company.nom">
          <p><strong>{{ company.nom }}</strong> — {{ company.secteur }}</p>
          <ul class="meta">
            <li>Employés : {{ company.nbEmployes }}</li>
            <li>Serveurs : {{ company.nbServeurs }}</li>
            <li>Postes : {{ company.nbPostes }}</li>
            <li>
              Services exposés :
              {{ (company.servicesExposes || []).join(', ') || '—' }}
            </li>
          </ul>
        </template>
        <p v-else class="info">Aucune entreprise configurée.</p>
      </section>

      <section v-if="resultat" class="synthese">
        <h3>Synthèse du risque</h3>
        <p>
          Score : <strong>{{ resultat.score }}/100</strong> — Niveau :
          <span class="badge" :style="niveauBadge(resultat.niveau)">{{ resultat.niveau }}</span>
        </p>
        <p>{{ resultat.nbActifs }} actif(s), {{ resultat.nbVulnerabilites }} vulnérabilité(s).</p>
      </section>

      <section>
        <h3>Inventaire des actifs</h3>
        <table v-if="assetsStore.list.length" class="table">
          <thead>
            <tr><th>Nom</th><th>Type</th><th>Exposé</th></tr>
          </thead>
          <tbody>
            <tr v-for="a in assetsStore.list" :key="a.id">
              <td>{{ a.nom }}</td>
              <td>{{ a.type }}</td>
              <td>{{ a.expose ? 'Oui' : 'Non' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="info">Aucun actif.</p>
      </section>

      <section>
        <h3>Vulnérabilités</h3>
        <table v-if="vulnsStore.list.length" class="table">
          <thead>
            <tr><th>Vulnérabilité</th><th>Actif</th><th>Criticité</th></tr>
          </thead>
          <tbody>
            <tr v-for="v in vulnsStore.list" :key="v.id">
              <td>{{ v.nom }}</td>
              <td>{{ nomActif(v.assetId) }}</td>
              <td>{{ v.criticite }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="info">Aucune vulnérabilité.</p>
      </section>

      <section v-if="resultat">
        <h3>Recommandations</h3>
        <ul class="recos">
          <li v-for="(reco, i) in resultat.recommandations" :key="i">{{ reco }}</li>
        </ul>
      </section>
    </article>
  </section>
</template>

<style scoped>
.report {
  max-width: 800px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.btn-primary {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
}
.sheet {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-top: 1rem;
}
.sheet-head {
  border-bottom: 2px solid #1f2937;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
}
.sheet-head h2 {
  margin: 0;
}
.date {
  color: #6b7280;
  font-size: 0.85rem;
  margin: 0.25rem 0 0;
}
.sheet h3 {
  font-size: 1rem;
  margin: 1.25rem 0 0.5rem;
}
.meta {
  margin: 0;
  padding-left: 1.1rem;
  color: #374151;
}
.badge {
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;
}
.table {
  width: 100%;
  border-collapse: collapse;
}
.table th,
.table td {
  text-align: left;
  padding: 0.4rem 0.5rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.9rem;
}
.table th {
  color: #6b7280;
  font-size: 0.78rem;
  text-transform: uppercase;
}
.recos {
  padding-left: 1.1rem;
  color: #374151;
}
.recos li {
  margin-bottom: 0.4rem;
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

/* Impression : masquer la nav globale et les commandes, garder la feuille. */
@media print {
  .no-print {
    display: none !important;
  }
  .sheet {
    border: none;
    padding: 0;
  }
}
</style>
