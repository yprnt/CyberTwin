<script setup>
// Vue Tableau de bord : recalcule le risque (R5) à chaque ouverture puis
// affiche stats + badge niveau coloré + jauge 0–100 + graphique (répartition
// des actifs par type) + recommandations.
import { computed, onMounted } from 'vue'
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { useAssetsStore } from '../stores/assets'
import { useRiskStore } from '../stores/risk'
import { niveauBadge, niveauCouleur } from '../utils/niveau'

ChartJS.register(ArcElement, Tooltip, Legend)

const assetsStore = useAssetsStore()
const riskStore = useRiskStore()

onMounted(async () => {
  // Les actifs alimentent le graphique ; le risque est recalculé (non stocké).
  await Promise.all([assetsStore.fetchAll(), riskStore.calculate()])
})

const resultat = computed(() => riskStore.result)

// Répartition des actifs par type pour le camembert.
const chartData = computed(() => {
  const compteParType = {}
  for (const a of assetsStore.list) {
    compteParType[a.type] = (compteParType[a.type] || 0) + 1
  }
  const labels = Object.keys(compteParType)
  return {
    labels,
    datasets: [
      {
        data: labels.map((t) => compteParType[t]),
        backgroundColor: [
          '#2563eb',
          '#16a34a',
          '#d97706',
          '#dc2626',
          '#7c3aed',
          '#0891b2',
        ],
      },
    ],
  }
})
const aDesActifs = computed(() => assetsStore.list.length > 0)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
}
</script>

<template>
  <section class="dashboard">
    <h1>Tableau de bord</h1>

    <p v-if="riskStore.loading" class="info">Calcul du risque…</p>
    <p v-if="riskStore.error" class="error">{{ riskStore.error }}</p>

    <template v-if="resultat">
      <div class="cards">
        <div class="stat">
          <span class="stat-val">{{ resultat.nbActifs }}</span>
          <span class="stat-label">Actifs</span>
        </div>
        <div class="stat">
          <span class="stat-val">{{ resultat.nbVulnerabilites }}</span>
          <span class="stat-label">Vulnérabilités</span>
        </div>
        <div class="stat">
          <span class="stat-val">{{ resultat.score }}<small>/100</small></span>
          <span class="stat-label">Score de risque</span>
        </div>
        <div class="stat">
          <span class="badge" :style="niveauBadge(resultat.niveau)">
            {{ resultat.niveau }}
          </span>
          <span class="stat-label">Niveau</span>
        </div>
      </div>

      <div class="gauge">
        <div
          class="gauge-fill"
          :style="{ width: resultat.score + '%', background: niveauCouleur(resultat.niveau) }"
        ></div>
      </div>

      <div class="grid">
        <div class="panel">
          <h2>Répartition des actifs par type</h2>
          <div v-if="aDesActifs" class="chart">
            <Pie :data="chartData" :options="chartOptions" />
          </div>
          <p v-else class="info">Aucun actif à représenter.</p>
        </div>

        <div class="panel">
          <h2>Recommandations</h2>
          <ul class="recos">
            <li v-for="(reco, i) in resultat.recommandations" :key="i">{{ reco }}</li>
          </ul>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.dashboard {
  max-width: 960px;
}
.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin: 1rem 0;
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  align-items: flex-start;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}
.stat-val {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1f2937;
}
.stat-val small {
  font-size: 0.9rem;
  color: #9ca3af;
  font-weight: 400;
}
.stat-label {
  color: #6b7280;
  font-size: 0.85rem;
}
.badge {
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  font-size: 1rem;
  font-weight: 600;
  text-transform: capitalize;
}
.gauge {
  height: 14px;
  background: #e5e7eb;
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}
.gauge-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.4s ease;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.panel {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
}
.panel h2 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
}
.chart {
  height: 280px;
}
.recos {
  margin: 0;
  padding-left: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.recos li {
  font-size: 0.92rem;
  color: #374151;
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
@media (max-width: 720px) {
  .cards {
    grid-template-columns: repeat(2, 1fr);
  }
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
