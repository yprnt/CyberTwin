// Mappe les échelles métier vers un « ton » sémantique du design system,
// consommé par BaseBadge (et la jauge). Couleurs réelles = tokens CSS
// (s'adaptent automatiquement au thème clair/sombre).
//
// Deux échelles distinctes (R4) :
//   - niveau de risque global : faible | moyen | élevé
//   - criticité d'une vuln    : faible | moyenne | élevée

// Niveau de risque -> ton.
export function tonNiveau(niveau) {
  switch (niveau) {
    case 'faible':
      return 'success'
    case 'moyen':
      return 'warning'
    case 'élevé':
      return 'danger'
    default:
      return 'neutral'
  }
}

// Criticité de vulnérabilité -> ton.
export function tonCriticite(criticite) {
  switch (criticite) {
    case 'faible':
      return 'success'
    case 'moyenne':
      return 'warning'
    case 'élevée':
      return 'danger'
    default:
      return 'neutral'
  }
}
