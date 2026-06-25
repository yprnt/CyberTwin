// Thème clair / sombre. ref au niveau module = état partagé entre tous les
// appels useTheme(). Persisté dans localStorage, appliqué via data-theme sur <html>.
import { computed, ref } from 'vue'

const STORAGE_KEY = 'cybertwin-theme'

function themeInitial() {
  return localStorage.getItem(STORAGE_KEY) || 'light'
}

const theme = ref(themeInitial())

function appliquer(valeur) {
  document.documentElement.dataset.theme = valeur
  localStorage.setItem(STORAGE_KEY, valeur)
}

// Appliqué dès l'import, cohérent avec le script anti-flash de index.html.
appliquer(theme.value)

export function useTheme() {
  const isDark = computed(() => theme.value === 'dark')

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    appliquer(theme.value)
  }

  return { theme, isDark, toggle }
}
