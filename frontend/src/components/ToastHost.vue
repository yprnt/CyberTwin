<script setup>
// Pile de notifications, montée une seule fois (dans App.vue). Lit la pile
// partagée par useToasts. role="status" : annoncé par les lecteurs d'écran.
import { useToasts } from '../composables/useToasts'

const { toasts, remove } = useToasts()
</script>

<template>
  <div class="toast-host no-print" role="status" aria-live="polite">
    <TransitionGroup name="toast">
      <div v-for="t in toasts" :key="t.id" :class="['toast', 'toast--' + t.type]">
        <span class="toast__msg">{{ t.message }}</span>
        <button class="toast__close" type="button" aria-label="Fermer" @click="remove(t.id)">
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-host {
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  width: min(360px, calc(100vw - 2rem));
}
.toast {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.7rem 0.85rem;
  border-radius: var(--radius);
  background: var(--surface);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
  /* Liseré de couleur selon le type, sans noyer le texte. */
  border-left: 3px solid var(--neutral);
}
.toast--success {
  border-left-color: var(--success);
}
.toast--error {
  border-left-color: var(--danger);
}
.toast--info {
  border-left-color: var(--accent);
}
.toast__msg {
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--text);
}
.toast__close {
  width: auto;
  flex-shrink: 0;
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}
.toast__close:hover {
  color: var(--text);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
