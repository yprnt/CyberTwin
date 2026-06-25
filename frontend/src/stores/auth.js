import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'
import { TOKEN_KEY } from '../config'

// Le jeton est la source de vérité de la connexion : persisté pour survivre au
// rechargement, lu par http.js pour l'en-tête Authorization, et par la garde de route.
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref(null)
  const loading = ref(false)
  const error = ref('')

  function estConnecte() {
    return !!token.value
  }

  function appliquerToken(valeur) {
    token.value = valeur
    if (valeur) localStorage.setItem(TOKEN_KEY, valeur)
    else localStorage.removeItem(TOKEN_KEY)
  }

  async function login(credentials) {
    loading.value = true
    error.value = ''
    try {
      const { token: jeton, user: u } = await api.login(credentials)
      appliquerToken(jeton)
      user.value = u
      return u
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function register(credentials) {
    loading.value = true
    error.value = ''
    try {
      const { token: jeton, user: u } = await api.register(credentials)
      appliquerToken(jeton)
      user.value = u
      return u
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Valide le jeton stocké au démarrage : s'il est expiré/invalide, on déconnecte.
  async function restore() {
    if (!token.value) return
    try {
      const { user: u } = await api.me()
      user.value = u
    } catch {
      logout()
    }
  }

  function logout() {
    appliquerToken('')
    user.value = null
  }

  return { token, user, loading, error, estConnecte, login, register, restore, logout }
})
