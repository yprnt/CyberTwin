<script setup>
// Connexion / inscription. Un seul écran, bascule entre les deux modes.
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useToasts } from '../composables/useToasts'
import BaseButton from '../components/BaseButton.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const toasts = useToasts()

// Mode initial selon le bouton cliqué dans la barre (?mode=register).
const mode = ref(route.query.mode === 'register' ? 'register' : 'login')
const form = reactive({ username: '', password: '' })

const estInscription = computed(() => mode.value === 'register')
const titre = computed(() => (estInscription.value ? 'Créer un compte' : 'Connexion'))
const cta = computed(() => (estInscription.value ? "S'inscrire" : 'Se connecter'))

function basculer() {
  mode.value = estInscription.value ? 'login' : 'register'
  auth.error = ''
}

async function soumettre() {
  const credentials = { username: form.username.trim(), password: form.password }
  try {
    if (estInscription.value) {
      await auth.register(credentials)
      toasts.success('Compte créé. Bienvenue !')
    } else {
      await auth.login(credentials)
      toasts.success('Connexion réussie.')
    }
    // Reprend la page demandée avant la redirection vers /login, sinon l'accueil.
    const cible = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(cible)
  } catch {
    // L'erreur est déjà dans auth.error, affichée sous le champ mot de passe.
    // Pas de toast ici : éviter le doublon avec le message inline.
  }
}
</script>

<template>
  <section class="auth">
    <div class="auth__card rise">
      <p class="eyebrow">CyberTwin</p>
      <h1>{{ titre }}</h1>
      <p class="page__sub">
        {{ estInscription
          ? 'Choisissez un identifiant et un mot de passe pour accéder au simulateur.'
          : 'Connectez-vous pour accéder au simulateur de risque cyber.' }}
      </p>

      <form class="form" @submit.prevent="soumettre">
        <label class="field">
          <span class="field__label">Nom d'utilisateur</span>
          <input
            v-model="form.username"
            type="text"
            autocomplete="username"
            placeholder="ex. analyste"
            required
          />
        </label>

        <label class="field">
          <span class="field__label">Mot de passe</span>
          <input
            v-model="form.password"
            type="password"
            :autocomplete="estInscription ? 'new-password' : 'current-password'"
            placeholder="••••••"
            :aria-invalid="!!auth.error"
            required
          />
          <p v-if="auth.error" class="field-error" role="alert">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="13" /><circle cx="12" cy="16.5" r="0.5" fill="currentColor" />
            </svg>
            {{ auth.error }}
          </p>
        </label>

        <BaseButton type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Veuillez patienter…' : cta }}
        </BaseButton>
      </form>

      <p class="switch">
        {{ estInscription ? 'Déjà un compte ?' : 'Pas encore de compte ?' }}
        <button type="button" class="link" @click="basculer">
          {{ estInscription ? 'Se connecter' : 'Créer un compte' }}
        </button>
      </p>
    </div>
  </section>
</template>

<style scoped>
.auth {
  min-height: calc(100vh - 6rem);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 0;
}
.auth__card {
  width: min(420px, 100%);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 2rem 1.75rem;
}
.eyebrow {
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 0.4rem;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.field__label {
  font-size: 0.85rem;
  font-weight: 600;
}
.field-error {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--danger);
  font-size: 0.82rem;
  margin-top: 0.1rem;
}
.field-error svg {
  flex-shrink: 0;
}
/* Champ en erreur : liseré rouge discret. */
.field input[aria-invalid='true'] {
  border-color: var(--danger);
}
.switch {
  margin-top: 1.25rem;
  font-size: 0.9rem;
  color: var(--text-muted);
  text-align: center;
}
</style>
