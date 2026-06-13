import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

export const useVulnerabilitiesStore = defineStore('vulnerabilities', () => {
  const list = ref([])
  const loading = ref(false)
  const error = ref('')

  async function fetchAll() {
    loading.value = true
    error.value = ''
    try {
      list.value = await api.getVulnerabilities()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // Ne jamais envoyer d'id en POST (R1).
  async function create(payload) {
    error.value = ''
    try {
      const vuln = await api.createVulnerability(payload)
      list.value.push(vuln)
      return vuln
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  // Pas de PUT vuln (R7) : pour « modifier », la vue supprime puis ré-ajoute.
  async function remove(id) {
    error.value = ''
    try {
      await api.deleteVulnerability(id)
      list.value = list.value.filter((v) => v.id !== id)
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  return { list, loading, error, fetchAll, create, remove }
})
