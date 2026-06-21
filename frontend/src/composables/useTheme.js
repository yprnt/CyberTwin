// Gestion du thème clair / sombre.
// État partagé (ref au niveau module = singleton) : tous les composants qui
// appellent useTheme() lisent/écrivent le même thème.
// Clair par défaut, choix persisté dans localStorage, appliqué via l'attribut
// data-theme sur <html> (les tokens CSS font le reste).
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

// Applique dès le chargement du module (cohérent avec le script anti-flash de index.html).
appliquer(theme.value)

export function useTheme() {
  const isDark = computed(() => theme.value === 'dark')

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    appliquer(theme.value)
  }

  return { theme, isDark, toggle }
}
