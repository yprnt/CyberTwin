import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

// Vulnérabilités de l'entreprise courante : chaque action reçoit le companyId.
export const useVulnerabilitiesStore = defineStore('vulnerabilities', () => {
  const list = ref([])
  const loading = ref(false)
  const error = ref('')

  async function fetchAll(companyId) {
    loading.value = true
    error.value = ''
    try {
      list.value = await api.getVulnerabilities(companyId)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // Ne jamais envoyer d'id en POST (R1).
  async function create(companyId, payload) {
    error.value = ''
    try {
      const vuln = await api.createVulnerability(companyId, payload)
      list.value.push(vuln)
      return vuln
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  // Pas de PUT vuln (R7) : pour « modifier », la vue supprime puis ré-ajoute.
  async function remove(companyId, id) {
    error.value = ''
    try {
      await api.deleteVulnerability(companyId, id)
      list.value = list.value.filter((v) => v.id !== id)
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  return { list, loading, error, fetchAll, create, remove }
})
