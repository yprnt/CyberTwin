// Configuration globale du front.

// Base URL de l'API backend (Express, port 3000).
export const API_BASE = 'http://localhost:3000'

// Bascule mock <-> vraie API.
//   true  -> les données viennent de services/mock.js (back pas encore branché)
//   false -> vrais appels fetch vers API_BASE
// À l'intégration (Phase 5) : passer à false, puis supprimer mock.js + sa ligne
// dans services/api.js.
export const USE_MOCK = true
