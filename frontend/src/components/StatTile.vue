<script setup>
// Tuile de statistique (dashboard) : icône colorée + libellé + grande valeur
// (ou contenu libre via le slot par défaut, ex. un badge).
// ton : accent | success | warning | danger | neutral (couleur de l'icône).
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: null },
  ton: { type: String, default: 'accent' },
  // Affiche la valeur avec le dégradé signature (réservé aux chiffres phares).
  gradient: { type: Boolean, default: false },
})
</script>

<template>
  <div class="tile">
    <span v-if="$slots.icon" :class="['tile__icon', 'tile__icon--' + ton]">
      <slot name="icon" />
    </span>
    <div class="tile__body">
      <span class="tile__label">{{ label }}</span>
      <span v-if="value !== null" :class="['tile__value', { 'tile__value--grad': gradient }]">{{ value }}</span>
      <div v-else class="tile__slot"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.tile {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  padding: 1.1rem 1.25rem;
}
.tile__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  border-radius: 12px;
}
.tile__icon--accent {
  color: var(--accent);
  background: var(--accent-soft);
}
.tile__icon--success {
  color: var(--success);
  background: var(--success-soft);
}
.tile__icon--warning {
  color: var(--warning);
  background: var(--warning-soft);
}
.tile__icon--danger {
  color: var(--danger);
  background: var(--danger-soft);
}
.tile__icon--neutral {
  color: var(--neutral);
  background: var(--neutral-soft);
}
.tile__body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.tile__label {
  color: var(--text-muted);
  font-size: 0.82rem;
  font-weight: 500;
}
.tile__value {
  font-family: var(--font-display);
  font-size: 1.7rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.tile__value--grad {
  background: var(--gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
