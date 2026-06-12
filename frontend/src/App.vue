<script setup>
// Layout racine : barre de navigation commune + vue de la route active.
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
  <header class="topbar">
    <span class="brand">CyberTwin</span>
    <nav class="nav">
      <RouterLink
        v-for="lien in liens"
        :key="lien.to"
        :to="lien.to"
        class="nav-link"
      >
        {{ lien.label }}
      </RouterLink>
    </nav>
  </header>

  <main class="content">
    <RouterView />
  </main>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: #1f2937;
  color: #fff;
}
.brand {
  font-weight: 700;
  font-size: 1.15rem;
}
.nav {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.nav-link {
  color: #cbd5e1;
  text-decoration: none;
  padding: 0.35rem 0.7rem;
  border-radius: 0.375rem;
  font-size: 0.95rem;
}
.nav-link:hover {
  background: #374151;
  color: #fff;
}
.nav-link.router-link-active {
  background: #2563eb;
  color: #fff;
}
.content {
  padding: 1.5rem;
}
</style>
