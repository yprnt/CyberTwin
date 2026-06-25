import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

// Actifs de l'entreprise courante : chaque action reçoit le companyId (lu dans
// l'URL par la vue) — pas d'état d'entreprise caché dans ce store.
export const useAssetsStore = defineStore('assets', () => {
  const list = ref([])
  const loading = ref(false)
  const error = ref('')

  async function fetchAll(companyId) {
    loading.value = true
    error.value = ''
    try {
      list.value = await api.getAssets(companyId)
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
      const asset = await api.createAsset(companyId, payload)
      list.value.push(asset)
      return asset
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  async function update(companyId, id, payload) {
    error.value = ''
    try {
      const asset = await api.updateAsset(companyId, id, payload)
      const idx = list.value.findIndex((a) => a.id === id)
      if (idx !== -1) list.value[idx] = asset
      return asset
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  // Supprime l'actif. La cascade sur ses vulns (R3) est gérée côté back/mock ;
  // la vue rechargera le store vulnerabilities après coup.
  async function remove(companyId, id) {
    error.value = ''
    try {
      await api.deleteAsset(companyId, id)
      list.value = list.value.filter((a) => a.id !== id)
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  return { list, loading, error, fetchAll, create, update, remove }
})
