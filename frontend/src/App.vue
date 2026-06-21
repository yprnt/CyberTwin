<script setup>
import ThemeToggle from './components/ThemeToggle.vue'

const liens = [
  { to: '/', label: 'Accueil' },
  { to: '/entreprise', label: 'Entreprise' },
  { to: '/actifs', label: 'Actifs' },
  { to: '/vulnerabilites', label: 'Vulnérabilités' },
  { to: '/tableau-de-bord', label: 'Tableau de bord' },
  { to: '/rapport', label: 'Rapport' },
]
</script>

<template>
  <header class="topbar no-print">
    <div class="topbar__inner">
      <RouterLink to="/" class="brand">
        <span class="brand__glyph" aria-hidden="true">◈</span>
        <span class="brand__name">CyberTwin</span>
      </RouterLink>

      <nav class="nav" aria-label="Navigation principale">
        <RouterLink
          v-for="lien in liens"
          :key="lien.to"
          :to="lien.to"
          class="nav-link"
        >
          {{ lien.label }}
        </RouterLink>
      </nav>

      <ThemeToggle />
    </div>
  </header>

  <main class="content">
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </main>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--border);
}
.topbar__inner {
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 0.7rem 1.25rem;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
  color: var(--text);
  text-decoration: none;
}
.brand:hover {
  text-decoration: none;
}
.brand__glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: var(--gradient);
  color: #fff;
  font-size: 0.95rem;
}
.nav {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
  margin-right: auto;
}
.nav-link {
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius);
  font-size: 0.9rem;
  font-weight: 500;
  transition: background-color 0.15s ease, color 0.15s ease;
}
.nav-link:hover {
  background: var(--surface-2);
  color: var(--text);
  text-decoration: none;
}
.nav-link.router-link-active {
  background: var(--accent-soft);
  color: var(--accent);
}
.content {
  max-width: 1080px;
  margin: 0 auto;
  padding: 1.75rem 1.25rem 3rem;
}

@media (max-width: 680px) {
  .topbar__inner {
    flex-wrap: wrap;
  }
  .nav {
    order: 3;
    width: 100%;
    margin-right: 0;
  }
}

@media print {
  .content {
    max-width: none;
    padding: 0;
  }
}
</style>
