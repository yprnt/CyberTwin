import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

export const useCompanyStore = defineStore('company', () => {
  const company = ref(null)
  const loading = ref(false)
  const error = ref('')

  // L'entreprise est créée si elle a un nom non vide (singleton, R2).
  function estCreee() {
    return !!(company.value && company.value.nom)
  }

  async function fetch() {
    loading.value = true
    error.value = ''
    try {
      company.value = await api.getCompany()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // Crée OU modifie (PUT /company). Lève en cas d'erreur pour que la vue
  // puisse réagir (ex. garder le formulaire ouvert).
  async function save(payload) {
    loading.value = true
    error.value = ''
    try {
      company.value = await api.putCompany(payload)
      return company.value
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return { company, loading, error, estCreee, fetch, save }
})
