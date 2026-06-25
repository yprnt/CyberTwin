<script setup>
// ton : success | warning | danger | neutral | accent.
defineProps({
  ton: { type: String, default: 'neutral' },
})
</script>

<template>
  <span :class="['badge', 'badge--' + ton]">
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-pill);
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1.4;
  text-transform: capitalize;
}
.badge--success {
  background: var(--success-soft);
  color: var(--success);
}
.badge--warning {
  background: var(--warning-soft);
  color: var(--warning);
}
.badge--danger {
  background: var(--danger-soft);
  color: var(--danger);
}
.badge--neutral {
  background: var(--neutral-soft);
  color: var(--neutral);
}
.badge--accent {
  background: var(--accent-soft);
  color: var(--accent);
}
</style>
