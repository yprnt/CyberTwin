// Helpers d'affichage du niveau de risque, partagés par Dashboard et Rapport.
// Niveaux possibles renvoyés par l'API (accents exacts) : faible | moyen | élevé.

// Style du badge (texte + fond) selon le niveau.
export function niveauBadge(niveau) {
  switch (niveau) {
    case 'faible':
      return { color: '#166534', background: '#dcfce7' }
    case 'moyen':
      return { color: '#92400e', background: '#fef3c7' }
    case 'élevé':
      return { color: '#b91c1c', background: '#fee2e2' }
    default:
      return { color: '#374151', background: '#e5e7eb' }
  }
}

// Couleur pleine (jauge, accents) selon le niveau.
export function niveauCouleur(niveau) {
  switch (niveau) {
    case 'faible':
      return '#16a34a'
    case 'moyen':
      return '#d97706'
    case 'élevé':
      return '#dc2626'
    default:
      return '#9ca3af'
  }
}
