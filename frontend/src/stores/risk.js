import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

export const useRiskStore = defineStore('risk', () => {
  // Résultat de POST /risk/calculate : { score, niveau, nbActifs,
  // nbVulnerabilites, recommandations }. Non stocké côté back (R5) :
  // on recalcule à chaque ouverture dashboard/rapport.
  const result = ref(null)
  const loading = ref(false)
  const error = ref('')

  async function calculate() {
    loading.value = true
    error.value = ''
    try {
      result.value = await api.calculateRisk()
      return result.value
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  return { result, loading, error, calculate }
})
