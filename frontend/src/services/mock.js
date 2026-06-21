// Mock de l'API en mémoire. Même interface que http.js, sélectionné par api.js
// quand USE_MOCK=true. Repli hors-ligne : la logique serveur (validation,
// cascade, calcul du risque) est reproduite à l'identique pour rester réaliste.

const TYPES_ACTIFS = [
  'Serveur Web',
  'Base de données',
  'Poste utilisateur',
  'Routeur',
  'Pare-feu',
  'Application métier',
]
const CRITICITES = ['faible', 'moyenne', 'élevée']

// État en mémoire
let company
let assets
let vulnerabilities
let nextAssetId
let nextVulnId

function etatVide() {
  company = {
    nom: '',
    secteur: '',
    nbEmployes: 0,
    nbServeurs: 0,
    nbPostes: 0,
    servicesExposes: [],
  }
  assets = []
  vulnerabilities = []
  nextAssetId = 1
  nextVulnId = 1
}
etatVide()

// Démo identique au seed backend (seed.demo.js) pour donner le même résultat
// hors-ligne : 6 actifs (3 exposés), 5 vulns -> score 90 / niveau « élevé ».
function chargerDemo() {
  company = {
    nom: 'Boréale Logistique',
    secteur: 'Transport et logistique',
    nbEmployes: 48,
    nbServeurs: 6,
    nbPostes: 35,
    servicesExposes: ['Site web', 'Webmail', 'Extranet client', 'VPN'],
  }
  assets = [
    { id: 1, nom: 'Serveur du site vitrine', type: 'Serveur Web', expose: true },
    { id: 2, nom: 'Serveur de messagerie', type: 'Serveur Web', expose: true },
    { id: 3, nom: 'Base de données clients', type: 'Base de données', expose: false },
    { id: 4, nom: 'Poste comptabilité', type: 'Poste utilisateur', expose: false },
    { id: 5, nom: 'Pare-feu périmétrique', type: 'Pare-feu', expose: true },
    { id: 6, nom: 'Routeur agence', type: 'Routeur', expose: false },
  ]
  vulnerabilities = [
    { id: 1, assetId: 1, nom: 'Logiciel obsolète', criticite: 'élevée' },
    { id: 2, assetId: 1, nom: 'Port exposé', criticite: 'moyenne' },
    { id: 3, assetId: 2, nom: 'Mot de passe faible', criticite: 'élevée' },
    { id: 4, assetId: 3, nom: 'Absence de sauvegarde', criticite: 'moyenne' },
    { id: 5, assetId: 4, nom: 'Logiciel obsolète', criticite: 'faible' },
  ]
  nextAssetId = 7
  nextVulnId = 6
}

const clone = (v) => JSON.parse(JSON.stringify(v))

// Latence + clone pour mimer le réseau (pas de mutation directe de l'état).
function reply(value) {
  return new Promise((resolve) => setTimeout(() => resolve(clone(value)), 120))
}
function fail(message) {
  return Promise.reject(new Error(message))
}

// Calcul du risque — matrice EBIOS, identique au backend (risk.service.js),
// reproduite ici pour donner le même score hors-ligne.
// Chaque vuln = un scénario : risque = Gravité(criticité) × Vraisemblance(actif).
function calculerRisque() {
  const nbActifs = assets.length
  const nbVulnerabilites = vulnerabilities.length

  // Gravité 1..5 (criticité) ; vraisemblance 1..5 (exposition + nb de vulns de l'actif).
  const GRAVITE = { faible: 1, moyenne: 3, élevée: 5 }
  const SERIOUS_THRESHOLD = 12
  const vraisemblance = (asset, n) => {
    const base = asset.expose ? 3 : 1
    const volume = n >= 3 ? 2 : n === 2 ? 1 : 0
    return Math.min(5, Math.max(1, base + volume))
  }

  const countByAsset = {}
  for (const v of vulnerabilities) {
    countByAsset[v.assetId] = (countByAsset[v.assetId] || 0) + 1
  }
  const assetById = {}
  for (const a of assets) assetById[a.id] = a

  const risques = []
  for (const v of vulnerabilities) {
    const asset = assetById[v.assetId]
    if (!asset) continue
    const g = GRAVITE[v.criticite] || 1
    risques.push(g * vraisemblance(asset, countByAsset[v.assetId] || 1))
  }

  // Score piloté par le pire scénario, majoré si plusieurs risques sérieux s'accumulent.
  let score = 0
  if (risques.length > 0) {
    const maxRisk = Math.max(...risques)
    const nbSerieux = risques.filter((r) => r >= SERIOUS_THRESHOLD).length
    const bonus = Math.min(20, Math.max(0, nbSerieux - 1) * 5)
    score = Math.min(100, Math.round((maxRisk / 25) * 100 + bonus))
  }
  const niveau = score < 30 ? 'faible' : score < 60 ? 'moyen' : 'élevé'

  const recommandations = []
  const noms = vulnerabilities.map((v) => (v.nom || '').toLowerCase())
  const contient = (mot) => noms.some((n) => n.includes(mot))

  if (contient('obsol') || contient('logiciel'))
    recommandations.push(
      'Mettre à jour les logiciels obsolètes et appliquer les correctifs de sécurité.',
    )
  if (contient('mot de passe'))
    recommandations.push(
      'Renforcer la politique de mots de passe (longueur, complexité, rotation).',
    )
  if (contient('sauvegarde'))
    recommandations.push(
      'Mettre en place des sauvegardes régulières et tester leur restauration.',
    )
  if (contient('port'))
    recommandations.push('Fermer ou filtrer les ports exposés inutiles.')

  const nbExposes = assets.filter((a) => a.expose).length
  if (nbExposes >= 3)
    recommandations.push("Réduire l'exposition Internet des actifs non essentiels.")

  const nbElevees = vulnerabilities.filter((v) => v.criticite === 'élevée').length
  if (nbElevees > 0)
    recommandations.push(
      `Traiter en priorité les ${nbElevees} vulnérabilité(s) de criticité élevée.`,
    )

  if (niveau === 'faible')
    recommandations.push('Le niveau de risque est faible : maintenir les bonnes pratiques.')
  else if (niveau === 'moyen')
    recommandations.push(
      'Le niveau de risque est moyen : continuer à corriger les vulnérabilités importantes.',
    )
  else
    recommandations.push(
      'Le niveau de risque est élevé : engager un plan de remédiation prioritaire.',
    )

  return { score, niveau, nbActifs, nbVulnerabilites, recommandations }
}

export const mockApi = {
  health: () => reply({ status: 'ok', service: 'CyberTwin API' }),

  getCompany: () => reply(company),
  putCompany: (payload) => {
    if (!payload || !payload.nom || !payload.secteur)
      return fail("Le nom et le secteur de l'entreprise sont requis.")
    company = {
      nom: payload.nom,
      secteur: payload.secteur,
      nbEmployes: Number(payload.nbEmployes) || 0,
      nbServeurs: Number(payload.nbServeurs) || 0,
      nbPostes: Number(payload.nbPostes) || 0,
      servicesExposes: Array.isArray(payload.servicesExposes)
        ? [...payload.servicesExposes]
        : [],
    }
    return reply(company)
  },

  getAssets: () => reply(assets),
  createAsset: (payload) => {
    if (!payload || !payload.nom) return fail("Le nom de l'actif est requis.")
    if (!TYPES_ACTIFS.includes(payload.type))
      return fail("Le type d'actif est invalide.")
    const asset = {
      id: nextAssetId++,
      nom: payload.nom,
      type: payload.type,
      expose: payload.expose === true,
    }
    assets.push(asset)
    return reply(asset)
  },
  updateAsset: (id, payload) => {
    const asset = assets.find((a) => a.id === Number(id))
    if (!asset) return fail('Actif introuvable.')
    if (!payload.nom) return fail("Le nom de l'actif est requis.")
    if (!TYPES_ACTIFS.includes(payload.type))
      return fail("Le type d'actif est invalide.")
    asset.nom = payload.nom
    asset.type = payload.type
    asset.expose = payload.expose === true
    return reply(asset)
  },
  deleteAsset: (id) => {
    const idx = assets.findIndex((a) => a.id === Number(id))
    if (idx === -1) return fail('Actif introuvable.')
    assets.splice(idx, 1)
    // Cascade (R3) : supprimer les vulns de cet actif.
    vulnerabilities = vulnerabilities.filter((v) => v.assetId !== Number(id))
    return reply({ message: 'Actif supprimé.' })
  },

  getVulnerabilities: () => reply(vulnerabilities),
  createVulnerability: (payload) => {
    if (!payload || !payload.nom) return fail('Le nom de la vulnérabilité est requis.')
    if (!CRITICITES.includes(payload.criticite))
      return fail('La criticité est invalide (faible, moyenne ou élevée).')
    if (!assets.some((a) => a.id === Number(payload.assetId)))
      return fail('Actif associé introuvable.')
    const vuln = {
      id: nextVulnId++,
      assetId: Number(payload.assetId),
      nom: payload.nom,
      criticite: payload.criticite,
    }
    vulnerabilities.push(vuln)
    return reply(vuln)
  },
  deleteVulnerability: (id) => {
    const idx = vulnerabilities.findIndex((v) => v.id === Number(id))
    if (idx === -1) return fail('Vulnérabilité introuvable.')
    vulnerabilities.splice(idx, 1)
    return reply({ message: 'Vulnérabilité supprimée.' })
  },

  calculateRisk: () => reply(calculerRisque()),

  demoLoad: () => {
    chargerDemo()
    return reply({
      message: 'Données de démonstration chargées.',
      entreprise: company.nom,
      nbActifs: assets.length,
      nbVulnerabilites: vulnerabilities.length,
    })
  },
  demoReset: () => {
    etatVide()
    return reply({ message: 'Données réinitialisées.' })
  },
}
