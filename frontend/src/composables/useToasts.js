// Notifications éphémères. État au niveau module (singleton) comme useTheme :
// n'importe quelle vue/store peut pousser un toast, tous partagent la même pile.
import { ref } from 'vue'

const toasts = ref([])
let nextId = 1

const DUREE = 3500

function remove(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

// type : 'success' | 'error' | 'info'. Auto-disparition sauf durée nulle.
function push(message, type = 'success', duree = DUREE) {
  const id = nextId++
  toasts.value.push({ id, message, type })
  if (duree > 0) setTimeout(() => remove(id), duree)
  return id
}

export function useToasts() {
  return {
    toasts,
    remove,
    push,
    success: (msg) => push(msg, 'success'),
    error: (msg) => push(msg, 'error'),
    info: (msg) => push(msg, 'info'),
  }
}
