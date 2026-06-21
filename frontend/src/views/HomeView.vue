<script setup>
// Accueil. « Créer de zéro » -> /demo/reset puis /entreprise ;
// « Charger la démo » -> /demo/load puis /tableau-de-bord.
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

const etapes = [
  {
    n: '1',
    titre: 'Configurez votre entreprise',
    desc: 'Secteur, effectifs et services exposés sur Internet.',
  },
  {
    n: '2',
    titre: 'Recensez actifs & vulnérabilités',
    desc: 'Constituez votre inventaire en quelques clics.',
  },
  {
    n: '3',
    titre: 'Obtenez score & recommandations',
    desc: 'Un niveau de risque clair et des actions prioritaires.',
  },
]
</script>

<template>
  <section class="home">
    <header class="hero rise">
      <span class="kicker">Simulateur de risque cyber · PME</span>
      <h1 class="hero__title">
        Évaluez le <span class="grad">risque cyber</span> de votre entreprise.
      </h1>
      <p class="hero__lead">
        CyberTwin transforme votre inventaire IT en un score de risque clair,
        accompagné de recommandations concrètes. Aucune expertise requise.
      </p>
    </header>

    <div class="actions">
      <button class="action rise" style="animation-delay: 90ms" :disabled="!!loading" @click="creerDeZero">
        <span class="action__title">Créer de zéro</span>
        <span class="action__desc">
          Partez d'une base vide et configurez votre entreprise pas à pas.
        </span>
        <span class="action__cta">{{ loading === 'reset' ? 'Réinitialisation…' : 'Commencer →' }}</span>
      </button>

      <button class="action action--primary rise" style="animation-delay: 150ms" :disabled="!!loading" @click="chargerDemo">
        <span class="action__badge">Recommandé pour découvrir</span>
        <span class="action__title">Charger la démo</span>
        <span class="action__desc">
          Explorez un cas complet : « Boréale Logistique », 6 actifs et 5 vulnérabilités.
        </span>
        <span class="action__cta">{{ loading === 'load' ? 'Chargement…' : 'Voir la démo →' }}</span>
      </button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="how rise" style="animation-delay: 220ms">
      <h2 class="how__title">Comment ça marche</h2>
      <ol class="steps">
        <li v-for="e in etapes" :key="e.n" class="step">
          <span class="step__n">{{ e.n }}</span>
          <span class="step__titre">{{ e.titre }}</span>
          <span class="step__desc">{{ e.desc }}</span>
        </li>
      </ol>
    </div>
  </section>
</template>

<style scoped>
.home {
  max-width: 880px;
  margin: 0 auto;
}

/* Héro */
.hero {
  text-align: center;
  padding: 2.5rem 0 2.25rem;
}
.kicker {
  display: inline-block;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 0.32rem 0.85rem;
  border-radius: var(--radius-pill);
}
.hero__title {
  font-size: 2.6rem;
  line-height: 1.08;
  margin: 1.1rem auto 0.9rem;
  max-width: 18ch;
}
.grad {
  background: var(--gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero__lead {
  color: var(--text-muted);
  font-size: 1.05rem;
  max-width: 54ch;
  margin: 0 auto;
}

/* Actions */
.actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.action {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
  padding: 1.6rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform 0.14s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}
.action:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: var(--shadow-lg);
  border-color: var(--accent);
}
.action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.action--primary {
  border-color: var(--accent);
  background:
    linear-gradient(var(--surface), var(--surface)) padding-box,
    var(--gradient-soft);
}
.action__badge {
  align-self: flex-start;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-pill);
  margin-bottom: 0.2rem;
}
.action__title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 1.25rem;
}
.action__desc {
  color: var(--text-muted);
  font-size: 0.93rem;
}
.action__cta {
  margin-top: 0.4rem;
  color: var(--accent);
  font-weight: 600;
  font-size: 0.93rem;
}

/* Comment ça marche */
.how {
  margin-top: 2.5rem;
}
.how__title {
  text-align: center;
  font-size: 1.2rem;
  margin-bottom: 1.25rem;
}
.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.step {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1.25rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.step__n {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-pill);
  background: var(--gradient);
  color: #fff;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
}
.step__titre {
  font-weight: 600;
}
.step__desc {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.error {
  margin-top: 1rem;
  color: var(--danger);
  background: var(--danger-soft);
  padding: 0.6rem 0.8rem;
  border-radius: var(--radius);
}

@media (max-width: 680px) {
  .hero__title {
    font-size: 2rem;
  }
  .actions,
  .steps {
    grid-template-columns: 1fr;
  }
}
</style>
