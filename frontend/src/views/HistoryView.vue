<script setup>
// Historique des analyses : courbe d'évolution du score + tableau des snapshots.
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { useRiskStore } from '../stores/risk'
import { useThemedColor } from '../composables/useThemedColor'
import { useToasts } from '../composables/useToasts'
import { useConfirm } from '../composables/useConfirm'
import { tonNiveau } from '../utils/niveau'
import BaseCard from '../components/BaseCard.vue'
import BaseBadge from '../components/BaseBadge.vue'
import BaseButton from '../components/BaseButton.vue'

ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Tooltip)

const riskStore = useRiskStore()
const themed = useThemedColor()
const toasts = useToasts()
const { confirm } = useConfirm()
const route = useRoute()

const companyId = computed(() => route.params.id)

onMounted(() => riskStore.fetchHistory(companyId.value))

const history = computed(() => riskStore.history)
const aDesSnapshots = computed(() => history.value.length > 0)

const accent = themed('--accent')
const accentSoft = themed('--accent-soft')
const txtColor = themed('--text')
const mutedColor = themed('--text-muted')
const gridColor = themed('--border')

function formatDate(iso) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const scoreData = computed(() => ({
  labels: history.value.map((h) => formatDate(h.createdAt)),
  datasets: [
    {
      label: 'Score',
      data: history.value.map((h) => h.score),
      borderColor: accent.value,
      backgroundColor: accentSoft.value,
      pointBackgroundColor: accent.value,
      borderWidth: 2,
      tension: 0.3,
      fill: true,
    },
  ],
}))

const lineOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color: mutedColor.value }, grid: { display: false } },
    y: {
      beginAtZero: true,
      max: 100,
      ticks: { color: mutedColor.value, precision: 0 },
      grid: { color: gridColor.value },
    },
  },
}))

async function vider() {
  const ok = await confirm({
    title: "Vider l'historique",
    message: 'Toutes les analyses archivées de cette entreprise seront supprimées.',
    confirmLabel: 'Vider',
    danger: true,
  })
  if (!ok) return
  try {
    await riskStore.clearHistory(companyId.value)
    toasts.success('Historique vidé.')
  } catch (e) {
    toasts.error(e.message)
  }
}
</script>

<template>
  <section class="page">
    <header class="page__head">
      <h1>Historique des analyses</h1>
      <p class="page__sub">
        Évolution du score de risque au fil des analyses enregistrées depuis le tableau de bord.
      </p>
    </header>

    <p v-if="riskStore.historyLoading" class="muted">Chargement…</p>
    <p v-else-if="riskStore.error" class="msg msg--error">{{ riskStore.error }}</p>

    <template v-if="!riskStore.historyLoading">
      <BaseCard v-if="!aDesSnapshots" class="empty">
        <p class="muted center">
          Aucune analyse enregistrée. Ouvrez le tableau de bord puis cliquez sur
          « Enregistrer l'analyse » pour archiver un point de mesure.
        </p>
      </BaseCard>

      <template v-else>
        <BaseCard class="chart-card">
          <template #header><h2>Évolution du score</h2></template>
          <div class="chart"><Line :data="scoreData" :options="lineOptions" /></div>
        </BaseCard>

        <BaseCard class="table-card">
          <template #header>
            <h2>Analyses enregistrées</h2>
            <BaseButton variant="danger" @click="vider">Vider l'historique</BaseButton>
          </template>
          <div class="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Niveau</th>
                  <th>Actifs</th>
                  <th>Vulnérabilités</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="h in [...history].reverse()" :key="h.id">
                  <td>{{ formatDate(h.createdAt) }}</td>
                  <td class="strong">{{ h.score }} / 100</td>
                  <td><BaseBadge :ton="tonNiveau(h.niveau)">{{ h.niveau }}</BaseBadge></td>
                  <td>{{ h.nbActifs }}</td>
                  <td>{{ h.nbVulnerabilites }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </BaseCard>
      </template>
    </template>
  </section>
</template>

<style scoped>
.chart-card {
  margin-bottom: 1.25rem;
}
.chart {
  height: 300px;
}
.empty {
  margin-top: 0.5rem;
}
</style>
