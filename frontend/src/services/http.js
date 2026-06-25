// Implémentation HTTP réelle de l'API. Même interface que mock.js.
import { API_BASE, TOKEN_KEY } from '../config'

// Lève une Error dont le message est celui du back ({ message }), affichable tel quel.
async function request(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...options,
    })
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifiez que l'API est démarrée.")
  }

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    // « Session expirée » uniquement si un jeton avait été envoyé (session en cours)
    // et hors routes d'auth : un 401 sur /auth/login = mauvais identifiants, pas une
    // session expirée. App.vue écoute l'événement (évite d'importer le routeur ici).
    if (res.status === 401 && token && !path.startsWith('/auth/')) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
    throw new Error((data && data.message) || `Erreur ${res.status}.`)
  }
  return data
}

export const httpApi = {
  health: () => request('/'),

  register: (credentials) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(credentials) }),
  login: (credentials) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  me: () => request('/auth/me'),

  listCompanies: () => request('/companies'),
  createCompany: (company) =>
    request('/companies', { method: 'POST', body: JSON.stringify(company) }),
  getCompany: (id) => request(`/companies/${id}`),
  updateCompany: (id, company) =>
    request(`/companies/${id}`, { method: 'PUT', body: JSON.stringify(company) }),
  deleteCompany: (id) => request(`/companies/${id}`, { method: 'DELETE' }),

  getAssets: (cid) => request(`/companies/${cid}/assets`),
  createAsset: (cid, asset) =>
    request(`/companies/${cid}/assets`, { method: 'POST', body: JSON.stringify(asset) }),
  updateAsset: (cid, id, asset) =>
    request(`/companies/${cid}/assets/${id}`, { method: 'PUT', body: JSON.stringify(asset) }),
  deleteAsset: (cid, id) => request(`/companies/${cid}/assets/${id}`, { method: 'DELETE' }),

  getVulnerabilities: (cid) => request(`/companies/${cid}/vulnerabilities`),
  createVulnerability: (cid, vuln) =>
    request(`/companies/${cid}/vulnerabilities`, { method: 'POST', body: JSON.stringify(vuln) }),
  deleteVulnerability: (cid, id) =>
    request(`/companies/${cid}/vulnerabilities/${id}`, { method: 'DELETE' }),

  calculateRisk: (cid) => request(`/companies/${cid}/risk/calculate`, { method: 'POST' }),
  saveSnapshot: (cid) => request(`/companies/${cid}/risk/snapshot`, { method: 'POST' }),
  getHistory: (cid) => request(`/companies/${cid}/risk/history`),
  clearHistory: (cid) => request(`/companies/${cid}/risk/history`, { method: 'DELETE' }),

  demoLoad: () => request('/demo/load', { method: 'POST' }),
}
