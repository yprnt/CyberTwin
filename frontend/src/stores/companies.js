import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

// Entreprises de l'utilisateur (multi-entreprise). `list` = ses entreprises ;
// `current` = celle ouverte (chargée par CompanyLayout via fetchOne).
export const useCompaniesStore = defineStore('companies', () => {
  const list = ref([])
  const current = ref(null)
  const loading = ref(false)
  const error = ref('')

  async function fetchList() {
    loading.value = true
    error.value = ''
    try {
      list.value = await api.listCompanies()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // Lève en cas d'échec (ex. 404) pour que le layout redirige vers la liste.
  async function fetchOne(id) {
    loading.value = true
    error.value = ''
    // Évite d'afficher brièvement l'entreprise précédemment ouverte (état partagé).
    current.value = null
    try {
      current.value = await api.getCompany(id)
      return current.value
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function create(payload) {
    error.value = ''
    try {
      const company = await api.createCompany(payload)
      list.value.unshift(company)
      return company
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  async function update(id, payload) {
    error.value = ''
    try {
      const company = await api.updateCompany(id, payload)
      current.value = company
      const idx = list.value.findIndex((c) => c.id === company.id)
      if (idx !== -1) list.value[idx] = company
      return company
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  async function remove(id) {
    error.value = ''
    try {
      await api.deleteCompany(id)
      list.value = list.value.filter((c) => c.id !== Number(id))
      if (current.value && current.value.id === Number(id)) current.value = null
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  return { list, current, loading, error, fetchList, fetchOne, create, update, remove }
})
