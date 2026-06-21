<script setup>
// Bouton générique tokenisé. variant : primary | ghost | danger.
defineProps({
  variant: { type: String, default: 'primary' },
})
</script>

<template>
  <button :class="['btn', 'btn--' + variant]">
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  font: inherit;
  font-weight: 600;
  font-size: 0.92rem;
  padding: 0.55rem 1.1rem;
  border-radius: var(--radius);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease,
    transform 0.05s ease, opacity 0.15s ease;
}
.btn:active {
  transform: translateY(1px);
}
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--accent);
  color: var(--accent-contrast);
}
.btn--primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn--ghost {
  background: transparent;
  color: var(--text);
  border-color: var(--border);
}
.btn--ghost:hover:not(:disabled) {
  background: var(--surface-2);
}

.btn--danger {
  background: transparent;
  color: var(--danger);
  border-color: var(--border);
}
.btn--danger:hover:not(:disabled) {
  background: var(--danger-soft);
  border-color: var(--danger);
}
</style>
