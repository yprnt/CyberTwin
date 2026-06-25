// Mock de l'API en mémoire (multi-entreprise). Même interface que http.js,
// sélectionné par api.js quand USE_MOCK=true. Repli hors-ligne : la logique
// serveur (validation, scoping par entreprise, cascade, calcul du risque) est
// reproduite pour rester réaliste.

const TYPES_ACTIFS = [
  'Serveur Web',
  'Base de données',
  'Poste utilisateur',
  'Routeur',
  'Pare-feu',
  'Application métier',
]
const CRITICITES = ['faible', 'moyenne', 'élevée']
const PASSWORD_MIN = 6

// Chaque entreprise porte ses propres assets / vulnerabilities / history.
// Ids globaux (comme les AUTO_INCREMENT du back) via des compteurs partagés.
let companies = []
let nextCompanyId = 1
let nextAssetId = 1
let nextVulnId = 1
let nextHistoryId = 1

// Comptes en mémoire, indépendants des données métier.
// Repli hors-ligne : un jeton non vide = connecté (pas de vraie vérification de JWT ici).
const users = new Map()
let dernierUtilisateur = null

const clone = (v) => JSON.parse(JSON.stringify(v))

// Latence + clone pour mimer le réseau (pas de mutation directe de l'état).
function reply(value) {
  return new Promise((resolve) => setTimeout(() => resolve(clone(value)), 120))
}
function fail(message) {
  return Promise.reject(new Error(message))
}

function trouverEntreprise(cid) {
  return companies.find((c) => c.id === Number(cid))
}

// Champs publics d'une entreprise (sans les tableaux internes assets/vulns/history).
function champsEntreprise(c) {
  return {
    id: c.id,
    nom: c.nom,
    secteur: c.secteur,
    nbEmployes: c.nbEmployes,
    nbServeurs: c.nbServeurs,
    nbPostes: c.nbPostes,
    servicesExposes: c.servicesExposes,
    createdAt: c.createdAt,
  }
}

const nbValide = (v) =>
  v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0

// Validation commune création/modification, mêmes messages que le back.
function validerEntreprise(payload) {
  const p = payload || {}
  if (!p.nom || !p.secteur)
    return { error: 'Les champs « nom » et « secteur » sont obligatoires.' }
  if (!nbValide(p.nbEmployes) || !nbValide(p.nbServeurs) || !nbValide(p.nbPostes))
    return {
      error:
        "Le nombre d'employés, de serveurs et de postes est obligatoire (entier positif ou nul).",
    }
  if (!Array.isArray(p.servicesExposes) || p.servicesExposes.length === 0)
    return { error: 'Indiquez au moins un service exposé sur Internet.' }
  return {
    values: {
      nom: p.nom,
      secteur: p.secteur,
      nbEmployes: Number(p.nbEmployes),
      nbServeurs: Number(p.nbServeurs),
      nbPostes: Number(p.nbPostes),
      servicesExposes: [...p.servicesExposes],
    },
  }
}

// Calcul du risque — matrice EBIOS, identique au backend (risk.service.js).
// Chaque vuln = un scénario : risque = Gravité(criticité) × Vraisemblance(actif).
function calculerRisque(assets, vulnerabilities) {
  const nbActifs = assets.length
  const nbVulnerabilites = vulnerabilities.length

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

// Démo « Boréale » : 6 actifs (3 exposés), 5 vulns -> score 90 / niveau « élevé ».
function construireDemo() {
  const c = {
    id: nextCompanyId++,
    nom: 'Boréale Logistique',
    secteur: 'Transport et logistique',
    nbEmployes: 48,
    nbServeurs: 6,
    nbPostes: 35,
    servicesExposes: ['Site web', 'Webmail', 'Extranet client', 'VPN'],
    createdAt: new Date().toISOString(),
    assets: [],
    vulnerabilities: [],
    history: [],
  }
  const defs = [
    { ref: 'vitrine', nom: 'Serveur du site vitrine', type: 'Serveur Web', expose: true },
    { ref: 'webmail', nom: 'Serveur de messagerie', type: 'Serveur Web', expose: true },
    { ref: 'bdd', nom: 'Base de données clients', type: 'Base de données', expose: false },
    { ref: 'compta', nom: 'Poste comptabilité', type: 'Poste utilisateur', expose: false },
    { ref: 'firewall', nom: 'Pare-feu périmétrique', type: 'Pare-feu', expose: true },
    { ref: 'routeur', nom: 'Routeur agence', type: 'Routeur', expose: false },
  ]
  const refToId = {}
  for (const d of defs) {
    const id = nextAssetId++
    refToId[d.ref] = id
    c.assets.push({ id, nom: d.nom, type: d.type, expose: d.expose })
  }
  const vulns = [
    { assetRef: 'vitrine', nom: 'Logiciel obsolète', criticite: 'élevée' },
    { assetRef: 'vitrine', nom: 'Port exposé', criticite: 'moyenne' },
    { assetRef: 'webmail', nom: 'Mot de passe faible', criticite: 'élevée' },
    { assetRef: 'bdd', nom: 'Absence de sauvegarde', criticite: 'moyenne' },
    { assetRef: 'compta', nom: 'Logiciel obsolète', criticite: 'faible' },
  ]
  for (const v of vulns) {
    c.vulnerabilities.push({
      id: nextVulnId++,
      assetId: refToId[v.assetRef],
      nom: v.nom,
      criticite: v.criticite,
    })
  }
  return c
}

export const mockApi = {
  health: () => reply({ status: 'ok', service: 'CyberTwin API' }),

  register: (creds) => {
    const username = (creds && creds.username ? creds.username : '').trim()
    const password = creds && creds.password ? creds.password : ''
    if (!username || !password)
      return fail("Nom d'utilisateur et mot de passe sont obligatoires.")
    if (password.length < PASSWORD_MIN)
      return fail(`Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`)
    if (users.has(username)) return fail('Ce nom d’utilisateur est déjà pris.')
    users.set(username, password)
    dernierUtilisateur = username
    return reply({ token: `mock-${username}`, user: { username } })
  },
  login: (creds) => {
    const username = (creds && creds.username ? creds.username : '').trim()
    const password = creds && creds.password ? creds.password : ''
    if (!username || !password)
      return fail("Nom d'utilisateur et mot de passe sont obligatoires.")
    if (users.has(username) && users.get(username) !== password)
      return fail('Identifiants incorrects.')
    users.set(username, password)
    dernierUtilisateur = username
    return reply({ token: `mock-${username}`, user: { username } })
  },
  // Jeton présent = connecté (le mock ne valide pas de vrai JWT).
  me: () => reply({ user: { username: dernierUtilisateur || 'utilisateur' } }),

  listCompanies: () => reply(companies.map(champsEntreprise)),
  createCompany: (payload) => {
    const { error, values } = validerEntreprise(payload)
    if (error) return fail(error)
    const c = { id: nextCompanyId++, ...values, createdAt: new Date().toISOString(), assets: [], vulnerabilities: [], history: [] }
    companies.unshift(c)
    return reply(champsEntreprise(c))
  },
  getCompany: (cid) => {
    const c = trouverEntreprise(cid)
    if (!c) return fail('Entreprise introuvable.')
    return reply(champsEntreprise(c))
  },
  updateCompany: (cid, payload) => {
    const c = trouverEntreprise(cid)
    if (!c) return fail('Entreprise introuvable.')
    const { error, values } = validerEntreprise(payload)
    if (error) return fail(error)
    Object.assign(c, values)
    return reply(champsEntreprise(c))
  },
  deleteCompany: (cid) => {
    const idx = companies.findIndex((c) => c.id === Number(cid))
    if (idx === -1) return fail('Entreprise introuvable.')
    companies.splice(idx, 1)
    return reply({ message: 'Entreprise supprimée.' })
  },

  getAssets: (cid) => {
    const c = trouverEntreprise(cid)
    if (!c) return fail('Entreprise introuvable.')
    return reply(c.assets)
  },
  createAsset: (cid, payload) => {
    const c = trouverEntreprise(cid)
    if (!c) return fail('Entreprise introuvable.')
    const nom = payload && payload.nom ? String(payload.nom).trim() : ''
    const type = payload && payload.type ? String(payload.type).trim() : ''
    if (!nom || !type) return fail('Les champs « nom » et « type » sont obligatoires.')
    if (!TYPES_ACTIFS.includes(type))
      return fail(`Type d'actif invalide. Valeurs autorisées : ${TYPES_ACTIFS.join(', ')}.`)
    const asset = { id: nextAssetId++, nom, type, expose: payload.expose === true }
    c.assets.push(asset)
    return reply(asset)
  },
  updateAsset: (cid, id, payload) => {
    const c = trouverEntreprise(cid)
    if (!c) return fail('Entreprise introuvable.')
    const asset = c.assets.find((a) => a.id === Number(id))
    if (!asset) return fail('Actif introuvable.')
    if (!payload.nom) return fail('Le champ « nom » ne peut pas être vide.')
    if (!TYPES_ACTIFS.includes(payload.type))
      return fail(`Type d'actif invalide. Valeurs autorisées : ${TYPES_ACTIFS.join(', ')}.`)
    asset.nom = payload.nom
    asset.type = payload.type
    asset.expose = payload.expose === true
    return reply(asset)
  },
  deleteAsset: (cid, id) => {
    const c = trouverEntreprise(cid)
    if (!c) return fail('Entreprise introuvable.')
    const idx = c.assets.findIndex((a) => a.id === Number(id))
    if (idx === -1) return fail('Actif introuvable.')
    c.assets.splice(idx, 1)
    // Cascade (R3) : supprimer les vulns de cet actif.
    c.vulnerabilities = c.vulnerabilities.filter((v) => v.assetId !== Number(id))
    return reply({ message: 'Actif supprimé.' })
  },

  getVulnerabilities: (cid) => {
    const c = trouverEntreprise(cid)
    if (!c) return fail('Entreprise introuvable.')
    return reply(c.vulnerabilities)
  },
  createVulnerability: (cid, payload) => {
    const c = trouverEntreprise(cid)
    if (!c) return fail('Entreprise introuvable.')
    const assetId = Number(payload && payload.assetId)
    const nom = payload && payload.nom ? String(payload.nom).trim() : ''
    const criticite = payload && payload.criticite ? String(payload.criticite).trim() : ''
    if (!Number.isInteger(assetId) || !nom || !criticite)
      return fail('Les champs « assetId », « nom » et « criticite » sont obligatoires.')
    if (!CRITICITES.includes(criticite))
      return fail(`Criticité invalide. Valeurs autorisées : ${CRITICITES.join(', ')}.`)
    if (!c.assets.some((a) => a.id === assetId))
      return fail("L'actif (assetId) n'existe pas dans cette entreprise.")
    const vuln = { id: nextVulnId++, assetId, nom, criticite }
    c.vulnerabilities.push(vuln)
    return reply(vuln)
  },
  deleteVulnerability: (cid, id) => {
    const c = trouverEntreprise(cid)
    if (!c) return fail('Entreprise introuvable.')
    const idx = c.vulnerabilities.findIndex((v) => v.id === Number(id))
    if (idx === -1) return fail('Vulnérabilité introuvable.')
    c.vulnerabilities.splice(idx, 1)
    return reply({ message: 'Vulnérabilité supprimée.' })
  },

  calculateRisk: (cid) => {
    const c = trouverEntreprise(cid)
    if (!c) return fail('Entreprise introuvable.')
    return reply(calculerRisque(c.assets, c.vulnerabilities))
  },
  saveSnapshot: (cid) => {
    const c = trouverEntreprise(cid)
    if (!c) return fail('Entreprise introuvable.')
    const r = calculerRisque(c.assets, c.vulnerabilities)
    const snapshot = {
      id: nextHistoryId++,
      score: r.score,
      niveau: r.niveau,
      nbActifs: r.nbActifs,
      nbVulnerabilites: r.nbVulnerabilites,
      createdAt: new Date().toISOString(),
    }
    c.history.push(snapshot)
    return reply(snapshot)
  },
  getHistory: (cid) => {
    const c = trouverEntreprise(cid)
    if (!c) return fail('Entreprise introuvable.')
    return reply(c.history)
  },
  clearHistory: (cid) => {
    const c = trouverEntreprise(cid)
    if (!c) return fail('Entreprise introuvable.')
    c.history = []
    return reply({ message: 'Historique vidé.' })
  },

  demoLoad: () => {
    const c = construireDemo()
    companies.unshift(c)
    return reply({
      ...champsEntreprise(c),
      nbActifs: c.assets.length,
      nbVulnerabilites: c.vulnerabilities.length,
    })
  },
}
