import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

export const useAssetsStore = defineStore('assets', () => {
  const list = ref([])
  const loading = ref(false)
  const error = ref('')

  async function fetchAll() {
    loading.value = true
    error.value = ''
    try {
      list.value = await api.getAssets()
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
      const asset = await api.createAsset(payload)
      list.value.push(asset)
      return asset
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  async function update(id, payload) {
    error.value = ''
    try {
      const asset = await api.updateAsset(id, payload)
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
  async function remove(id) {
    error.value = ''
    try {
      await api.deleteAsset(id)
      list.value = list.value.filter((a) => a.id !== id)
    } catch (e) {
      error.value = e.message
      throw e
    }
  }

  return { list, loading, error, fetchAll, create, update, remove }
})
