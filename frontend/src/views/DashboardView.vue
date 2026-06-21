<script setup>
// Vue Tableau de bord : recalcule le risque (R5) à chaque ouverture puis
// affiche stats + jauge + 3 graphiques complémentaires + recommandations.
//   1. Actifs par type           (où se concentre le parc)
//   2. Vulnérabilités par criticité (gravité des failles)
//   3. Exposition des actifs      (surface d'attaque Internet)
import { computed, onMounted } from 'vue'
import { Doughnut, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { useAssetsStore } from '../stores/assets'
import { useVulnerabilitiesStore } from '../stores/vulnerabilities'
import { useRiskStore } from '../stores/risk'
import { useTheme } from '../composables/useTheme'
import { tonNiveau } from '../utils/niveau'
import BaseCard from '../components/BaseCard.vue'
import BaseBadge from '../components/BaseBadge.vue'
import StatTile from '../components/StatTile.vue'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const assetsStore = useAssetsStore()
const vulnsStore = useVulnerabilitiesStore()
const riskStore = useRiskStore()
const { isDark } = useTheme()

onMounted(async () => {
  await Promise.all([
    assetsStore.fetchAll(),
    vulnsStore.fetchAll(),
    riskStore.calculate(),
  ])
})

const resultat = computed(() => riskStore.result)
const aDesActifs = computed(() => assetsStore.list.length > 0)
const aDesVulns = computed(() => vulnsStore.list.length > 0)

// Couleurs dépendantes du thème (textes/grilles des axes et légendes).
const txtColor = computed(() => (isDark.value ? '#e7ecf3' : '#1c2333'))
const mutedColor = computed(() => (isDark.value ? '#94a3b8' : '#6b7280'))
const gridColor = computed(() =>
  isDark.value ? 'rgba(148,163,184,0.16)' : 'rgba(16,24,40,0.08)',
)
const segBorder = computed(() => (isDark.value ? '#1e293b' : '#ffffff'))

const PALETTE = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4']

// 1. Actifs par type ------------------------------------------------------
const typeData = computed(() => {
  const par = {}
  for (const a of assetsStore.list) par[a.type] = (par[a.type] || 0) + 1
  const labels = Object.keys(par)
  return {
    labels,
    datasets: [
      {
        data: labels.map((t) => par[t]),
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderColor: segBorder.value,
        borderWidth: 2,
      },
    ],
  }
})

// 2. Vulnérabilités par criticité ----------------------------------------
const critData = computed(() => {
  const ordre = ['faible', 'moyenne', 'élevée']
  const par = { faible: 0, moyenne: 0, élevée: 0 }
  for (const v of vulnsStore.list) if (par[v.criticite] !== undefined) par[v.criticite]++
  return {
    labels: ['Faible', 'Moyenne', 'Élevée'],
    datasets: [
      {
        data: ordre.map((c) => par[c]),
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderRadius: 6,
        maxBarThickness: 56,
      },
    ],
  }
})

// 3. Exposition des actifs ------------------------------------------------
const exposData = computed(() => {
  const exposes = assetsStore.list.filter((a) => a.expose === true).length
  const proteges = assetsStore.list.length - exposes
  return {
    labels: ['Exposés', 'Non exposés'],
    datasets: [
      {
        data: [exposes, proteges],
        backgroundColor: ['#f59e0b', '#94a3b8'],
        borderColor: segBorder.value,
        borderWidth: 2,
      },
    ],
  }
})

const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '62%',
  plugins: {
    legend: { position: 'bottom', labels: { color: txtColor.value, padding: 14, boxWidth: 12 } },
  },
}))

const barOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: mutedColor.value }, grid: { display: false } },
    y: {
      beginAtZero: true,
      ticks: { color: mutedColor.value, precision: 0 },
      grid: { color: gridColor.value },
    },
  },
}))
</script>

<template>
  <section class="page">
    <header class="page__head">
      <h1>Tableau de bord</h1>
      <p class="page__sub">Synthèse du risque, recalculée à l'ouverture.</p>
    </header>

    <p v-if="riskStore.loading" class="muted">Calcul du risque…</p>
    <p v-if="riskStore.error" class="msg msg--error">{{ riskStore.error }}</p>

    <template v-if="resultat">
      <div class="tiles">
        <StatTile label="Actifs" :value="resultat.nbActifs" ton="accent">
          <template #icon>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9">
              <rect x="3" y="4" width="18" height="6" rx="1.5" /><rect x="3" y="14" width="18" height="6" rx="1.5" /><line x1="7" y1="7" x2="7" y2="7" /><line x1="7" y1="17" x2="7" y2="17" />
            </svg>
          </template>
        </StatTile>
        <StatTile label="Vulnérabilités" :value="resultat.nbVulnerabilites" ton="warning">
          <template #icon>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9">
              <path d="M12 3l8 3v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-3z" /><line x1="12" y1="9" x2="12" y2="13" /><circle cx="12" cy="16.5" r="0.6" fill="currentColor" />
            </svg>
          </template>
        </StatTile>
        <StatTile label="Score de risque" :value="resultat.score + ' / 100'" ton="accent" gradient>
          <template #icon>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9">
              <path d="M4 14a8 8 0 0 1 16 0" /><line x1="12" y1="14" x2="16" y2="10" />
            </svg>
          </template>
        </StatTile>
        <StatTile label="Niveau" :ton="tonNiveau(resultat.niveau)">
          <template #icon>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9">
              <line x1="6" y1="20" x2="6" y2="14" /><line x1="12" y1="20" x2="12" y2="9" /><line x1="18" y1="20" x2="18" y2="4" />
            </svg>
          </template>
          <BaseBadge :ton="tonNiveau(resultat.niveau)" class="lvl">{{ resultat.niveau }}</BaseBadge>
        </StatTile>
      </div>

      <div class="gauge-wrap">
        <div class="gauge-top">
          <span class="muted">Score global</span>
          <span class="gauge-val"><span class="grad">{{ resultat.score }}</span><small> / 100</small></span>
        </div>
        <div class="gauge">
          <div
            class="gauge__fill"
            :style="{ width: resultat.score + '%', background: 'var(--' + tonNiveau(resultat.niveau) + ')' }"
          ></div>
        </div>
      </div>

      <div class="charts">
        <BaseCard>
          <template #header><h2>Actifs par type</h2></template>
          <div v-if="aDesActifs" class="chart"><Doughnut :data="typeData" :options="doughnutOptions" /></div>
          <p v-else class="muted center">Aucun actif.</p>
        </BaseCard>

        <BaseCard>
          <template #header><h2>Vulnérabilités par criticité</h2></template>
          <div v-if="aDesVulns" class="chart"><Bar :data="critData" :options="barOptions" /></div>
          <p v-else class="muted center">Aucune vulnérabilité.</p>
        </BaseCard>

        <BaseCard>
          <template #header><h2>Exposition des actifs</h2></template>
          <div v-if="aDesActifs" class="chart"><Doughnut :data="exposData" :options="doughnutOptions" /></div>
          <p v-else class="muted center">Aucun actif.</p>
        </BaseCard>
      </div>

      <BaseCard class="recos-card">
        <template #header>
          <h2>Recommandations</h2>
          <BaseBadge ton="accent">{{ resultat.recommandations.length }}</BaseBadge>
        </template>
        <ol class="recos">
          <li v-for="(reco, i) in resultat.recommandations" :key="i" class="reco">
            <span class="reco__num">{{ i + 1 }}</span>
            <span class="reco__text">{{ reco }}</span>
          </li>
        </ol>
      </BaseCard>
    </template>
  </section>
</template>

<style scoped>
.page__head {
  margin-bottom: 1.25rem;
}
.page__sub {
  color: var(--text-muted);
  margin-top: 0.25rem;
}
.tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.lvl {
  font-size: 1.05rem;
  padding: 0.25rem 0.7rem;
}
.gauge-wrap {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: 1.1rem 1.25rem;
  margin-bottom: 1.25rem;
}
.gauge-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.6rem;
}
.gauge-val {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.3rem;
}
.grad {
  background: var(--gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.gauge-val small {
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.85rem;
}
.gauge {
  height: 12px;
  background: var(--surface-2);
  border-radius: var(--radius-pill);
  overflow: hidden;
}
.gauge__fill {
  height: 100%;
  border-radius: var(--radius-pill);
  transition: width 0.5s ease;
}
.charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.chart {
  height: 260px;
}
.recos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.reco {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--border);
}
.reco:last-child {
  border-bottom: none;
}
.reco__num {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-pill);
  background: var(--accent-soft);
  color: var(--accent);
  font-size: 0.82rem;
  font-weight: 700;
}
.reco__text {
  font-size: 0.94rem;
  line-height: 1.5;
  padding-top: 0.1rem;
}
.muted {
  color: var(--text-muted);
}
.center {
  text-align: center;
}
.msg {
  padding: 0.6rem 0.8rem;
  border-radius: var(--radius);
  margin: 0 0 1rem;
}
.msg--error {
  color: var(--danger);
  background: var(--danger-soft);
}
@media (max-width: 760px) {
  .tiles {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
