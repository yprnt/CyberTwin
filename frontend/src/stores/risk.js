import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

// Risque de l'entreprise courante : chaque action reçoit le companyId.
export const useRiskStore = defineStore('risk', () => {
  // Résultat de /risk/calculate : { score, niveau, nbActifs, nbVulnerabilites,
  // recommandations }. Non stocké côté back (R5) : recalcul à chaque ouverture.
  const result = ref(null)
  const loading = ref(false)
  const error = ref('')

  // Snapshots archivés volontairement (/risk/snapshot), du plus ancien au plus récent.
  const history = ref([])
  const historyLoading = ref(false)

  async function calculate(companyId) {
    loading.value = true
    error.value = ''
    try {
      result.value = await api.calculateRisk(companyId)
      return result.value
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // Lève en cas d'erreur pour que la vue puisse réagir (toast).
  async function saveSnapshot(companyId) {
    const snapshot = await api.saveSnapshot(companyId)
    history.value.push(snapshot)
    return snapshot
  }

  async function fetchHistory(companyId) {
    historyLoading.value = true
    error.value = ''
    try {
      history.value = await api.getHistory(companyId)
    } catch (e) {
      error.value = e.message
    } finally {
      historyLoading.value = false
    }
  }

  async function clearHistory(companyId) {
    await api.clearHistory(companyId)
    history.value = []
  }

  return {
    result,
    loading,
    error,
    history,
    historyLoading,
    calculate,
    saveSnapshot,
    fetchHistory,
    clearHistory,
  }
})
