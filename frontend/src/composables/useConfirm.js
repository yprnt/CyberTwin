// Confirmation modale, promesse-based (remplace window.confirm). État au niveau
// module (singleton) : ConfirmDialog (monté dans App.vue) l'affiche, n'importe
// quelle vue appelle `await confirm({...})`.
import { ref } from 'vue'

const demande = ref(null)
let resolveCourant = null

// Renvoie une promesse résolue à true (confirmé) ou false (annulé/fermé).
function confirm(options = {}) {
  return new Promise((resolve) => {
    resolveCourant = resolve
    demande.value = {
      title: options.title || 'Confirmer',
      message: options.message || '',
      confirmLabel: options.confirmLabel || 'Confirmer',
      cancelLabel: options.cancelLabel || 'Annuler',
      danger: options.danger || false,
    }
  })
}

function repondre(valeur) {
  if (resolveCourant) resolveCourant(valeur)
  resolveCourant = null
  demande.value = null
}

export function useConfirm() {
  return { demande, confirm, repondre }
}
