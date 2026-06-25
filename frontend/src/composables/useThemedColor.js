// Chart.js veut des couleurs concrètes, pas des var(--…). Ce helper lit un token
// CSS et le recalcule à chaque bascule de thème (via la dépendance à isDark).
// Partagé par les vues à graphiques (Dashboard, Historique).
import { computed } from 'vue'
import { useTheme } from './useTheme'

export function useThemedColor() {
  const { isDark } = useTheme()

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  }

  return (name) =>
    computed(() => {
      void isDark.value
      return cssVar(name)
    })
}
