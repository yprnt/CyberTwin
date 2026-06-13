// Implémentation HTTP réelle de l'API (vrais appels fetch).
// Même interface que mock.js -> voir services/api.js pour la bascule.
import { API_BASE } from '../config'

// Appel générique. Renvoie le JSON parsé, ou lève une Error dont le message
// est celui fourni par le back ({ message: "..." }), à afficher tel quel.
async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
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
    throw new Error((data && data.message) || `Erreur ${res.status}.`)
  }
  return data
}

export const httpApi = {
  health: () => request('/'),

  getCompany: () => request('/company'),
  putCompany: (company) =>
    request('/company', { method: 'PUT', body: JSON.stringify(company) }),

  getAssets: () => request('/assets'),
  createAsset: (asset) =>
    request('/assets', { method: 'POST', body: JSON.stringify(asset) }),
  updateAsset: (id, asset) =>
    request(`/assets/${id}`, { method: 'PUT', body: JSON.stringify(asset) }),
  deleteAsset: (id) => request(`/assets/${id}`, { method: 'DELETE' }),

  getVulnerabilities: () => request('/vulnerabilities'),
  createVulnerability: (vuln) =>
    request('/vulnerabilities', { method: 'POST', body: JSON.stringify(vuln) }),
  deleteVulnerability: (id) =>
    request(`/vulnerabilities/${id}`, { method: 'DELETE' }),

  calculateRisk: () => request('/risk/calculate', { method: 'POST' }),

  demoLoad: () => request('/demo/load', { method: 'POST' }),
  demoReset: () => request('/demo/reset', { method: 'POST' }),
}
