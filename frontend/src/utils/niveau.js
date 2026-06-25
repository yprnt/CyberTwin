// Mappe les échelles métier vers un « ton » du design system (BaseBadge, jauge).
// Deux échelles distinctes aux accents différents (R4) :
//   - niveau de risque global : faible | moyen | élevé
//   - criticité d'une vuln    : faible | moyenne | élevée

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
