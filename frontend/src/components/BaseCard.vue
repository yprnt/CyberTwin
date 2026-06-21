<script setup>
// Conteneur « surface » : padding, arrondi, ombre douce, bordure.
// Slot par défaut = contenu ; slot #header = en-tête optionnel (titre, actions).
</script>

<template>
  <section class="card">
    <header v-if="$slots.header" class="card__header">
      <slot name="header" />
    </header>
    <div class="card__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.card__header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.card__body {
  padding: 1.25rem;
}
</style>
