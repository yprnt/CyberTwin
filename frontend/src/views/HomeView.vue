<script setup>
// Vue d'accueil : 2 parcours de démarrage.
//  - « Créer de zéro »  -> POST /demo/reset  puis /entreprise
//  - « Charger la démo » -> POST /demo/load  puis /tableau-de-bord
// Les ops démo touchent toutes les données (cross-cutting) : on appelle
// directement `api`, le point d'entrée unique de la couche données. Les pages
// cibles rechargent leurs stores à leur montage.
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/api'

const router = useRouter()
const loading = ref('')
const error = ref('')

async function creerDeZero() {
  error.value = ''
  loading.value = 'reset'
  try {
    await api.demoReset()
    router.push('/entreprise')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = ''
  }
}

async function chargerDemo() {
  error.value = ''
  loading.value = 'load'
  try {
    await api.demoLoad()
    router.push('/tableau-de-bord')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = ''
  }
}
</script>

<template>
  <section class="home">
    <h1>CyberTwin</h1>
    <p class="intro">Simulateur de risque cyber pour PME. Choisissez un point de départ.</p>

    <div class="cards">
      <button class="card" :disabled="!!loading" @click="creerDeZero">
        <span class="card-title">Créer de zéro</span>
        <span class="card-desc">Repartir d'une base vide et configurer votre entreprise.</span>
        <span v-if="loading === 'reset'" class="card-state">Réinitialisation…</span>
      </button>

      <button class="card card-accent" :disabled="!!loading" @click="chargerDemo">
        <span class="card-title">Charger la démo</span>
        <span class="card-desc">Exemple « Boréale Logistique » : 6 actifs, 5 vulnérabilités.</span>
        <span v-if="loading === 'load'" class="card-state">Chargement…</span>
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
  </section>
</template>

<style scoped>
.home {
  max-width: 720px;
}
.intro {
  color: #6b7280;
}
.cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1.5rem;
}
.card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-align: left;
  padding: 1.25rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.5rem;
  background: #fff;
  cursor: pointer;
}
.card:hover:not(:disabled) {
  border-color: #2563eb;
  box-shadow: 0 1px 6px rgba(37, 99, 235, 0.15);
}
.card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.card-accent {
  border-color: #2563eb;
  background: #eff6ff;
}
.card-title {
  font-weight: 700;
  font-size: 1.05rem;
  color: #1f2937;
}
.card-desc {
  color: #6b7280;
  font-size: 0.9rem;
}
.card-state {
  font-size: 0.85rem;
  color: #2563eb;
}
.error {
  color: #b91c1c;
  background: #fee2e2;
  padding: 0.5rem 0.7rem;
  border-radius: 0.375rem;
}
@media (max-width: 560px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
