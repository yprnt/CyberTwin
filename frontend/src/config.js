export const API_BASE = 'http://localhost:3000'

// false -> vrai backend (mode normal) ; true -> mock en mémoire (mock.js),
// repli hors-ligne sans backend.
export const USE_MOCK = false

// Clé localStorage du jeton d'auth. Partagée entre le store auth (écriture) et
// http.js (lecture pour l'en-tête Authorization) -> une seule source de vérité.
export const TOKEN_KEY = 'cybertwin-token'
