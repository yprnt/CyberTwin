<script setup>
// Boîte de dialogue de confirmation, montée une fois (dans App.vue). Remplace
// window.confirm() par une modale cohérente avec le design. Esc / clic sur le
// fond / Annuler -> false ; bouton de confirmation -> true.
import { watch } from 'vue'
import { useConfirm } from '../composables/useConfirm'
import BaseButton from './BaseButton.vue'

const { demande, repondre } = useConfirm()

function onKeydown(e) {
  if (e.key === 'Escape') repondre(false)
}

// À l'ouverture : bloque le défilement de fond et écoute Échap au niveau window
// (l'overlay n'est pas focalisé, un @keydown local ne se déclencherait pas).
watch(demande, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
  if (val) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Transition name="modal">
    <div
      v-if="demande"
      class="overlay no-print"
      role="dialog"
      aria-modal="true"
      @click.self="repondre(false)"
    >
      <div class="dialog">
        <h2 class="dialog__title">{{ demande.title }}</h2>
        <p v-if="demande.message" class="dialog__msg">{{ demande.message }}</p>
        <div class="dialog__actions">
          <BaseButton variant="ghost" @click="repondre(false)">{{ demande.cancelLabel }}</BaseButton>
          <BaseButton :variant="demande.danger ? 'danger' : 'primary'" @click="repondre(true)">
            {{ demande.confirmLabel }}
          </BaseButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: color-mix(in srgb, var(--text) 45%, transparent);
  backdrop-filter: blur(2px);
}
.dialog {
  width: min(420px, 100%);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 1.5rem;
}
.dialog__title {
  font-size: 1.2rem;
  margin-bottom: 0.6rem;
}
.dialog__msg {
  color: var(--text-muted);
  font-size: 0.92rem;
  line-height: 1.55;
  margin-bottom: 1.4rem;
}
.dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .dialog,
.modal-leave-active .dialog {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .dialog,
.modal-leave-to .dialog {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
}
</style>
