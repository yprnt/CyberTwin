// Implémentation MOCK de l'API (données en mémoire, aucun réseau).
// Même interface que http.js. Sert tant que le back n'est pas branché.
//
// ⚠️ ISOLÉ ET JETABLE : à l'intégration (Phase 5), passer USE_MOCK=false dans
// config.js puis supprimer ce fichier + sa ligne dans services/api.js.
// Toute la logique « serveur » (validation, cascade, calcul du risque) vit ici
// uniquement pour rendre le mock réaliste ; elle disparaît avec le fichier.

const TYPES_ACTIFS = [
  'Serveur Web',
  'Base de données',
  'Poste utilisateur',
  'Routeur',
  'Pare-feu',
  'Application métier',
]
const CRITICITES = ['faible', 'moyenne', 'élevée']

// --- État en mémoire -------------------------------------------------------
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

// Données de démo « Boréale Logistique » : 6 actifs, 5 vulns.
// Calibré pour donner exactement score 48 / niveau « moyen ».
function chargerDemo() {
  company = {
    nom: 'Boréale Logistique',
    secteur: 'Transport et logistique',
    nbEmployes: 120,
    nbServeurs: 8,
    nbPostes: 90,
    servicesExposes: ['Site web public', 'VPN', 'Messagerie', 'Extranet partenaires'],
  }
  assets = [
    { id: 1, nom: 'Serveur Web principal', type: 'Serveur Web', expose: true },
    { id: 2, nom: 'Base clients', type: 'Base de données', expose: false },
    { id: 3, nom: 'Poste comptabilité', type: 'Poste utilisateur', expose: false },
    { id: 4, nom: 'Routeur agence', type: 'Routeur', expose: true },
    { id: 5, nom: 'Pare-feu périmètre', type: 'Pare-feu', expose: false },
    { id: 6, nom: 'ERP logistique', type: 'Application métier', expose: true },
  ]
  vulnerabilities = [
    { id: 1, assetId: 1, nom: 'Logiciel serveur web obsolète', criticite: 'élevée' },
    { id: 2, assetId: 4, nom: "Ports d'administration exposés", criticite: 'élevée' },
    { id: 3, assetId: 2, nom: 'Politique de mot de passe faible', criticite: 'moyenne' },
    { id: 4, assetId: 6, nom: 'Absence de sauvegarde régulière', criticite: 'moyenne' },
    { id: 5, assetId: 3, nom: 'Antivirus non à jour', criticite: 'faible' },
  ]
  nextAssetId = 7
  nextVulnId = 6
}

// --- Helpers ---------------------------------------------------------------
const clone = (v) => JSON.parse(JSON.stringify(v))

// Latence simulée + clone pour mimer un échange réseau (pas de mutation directe).
function reply(value) {
  return new Promise((resolve) => setTimeout(() => resolve(clone(value)), 120))
}
function fail(message) {
  return Promise.reject(new Error(message))
}

// Normalisation insensible casse/accents (comme le back pour les recos).
const norm = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

// --- Calcul du risque (formule figée, identique au back) -------------------
function calculerRisque() {
  const nbActifs = assets.length
  const nbVulnerabilites = vulnerabilities.length
  const faible = vulnerabilities.filter((v) => v.criticite === 'faible').length
  const moyenne = vulnerabilities.filter((v) => v.criticite === 'moyenne').length
  const elevee = vulnerabilities.filter((v) => v.criticite === 'élevée').length
  const nbExposes = assets.filter((a) => a.expose === true).length
  const nbServices = (company.servicesExposes || []).length

  let score =
    2 * nbActifs +
    1 * faible +
    3 * moyenne +
    6 * elevee +
    3 * nbExposes +
    2 * nbServices
  score = Math.min(100, score)
  const niveau = score <= 29 ? 'faible' : score <= 59 ? 'moyen' : 'élevé'

  const recommandations = []
  const noms = vulnerabilities.map((v) => norm(v.nom))
  const contient = (mot) => noms.some((n) => n.includes(mot))

  if (contient('obsolete') || contient('logiciel'))
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
  if (nbExposes >= 3)
    recommandations.push("Réduire l'exposition Internet des actifs non essentiels.")
  if (elevee > 0)
    recommandations.push(
      `Traiter en priorité les ${elevee} vulnérabilité(s) de criticité élevée.`,
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

// --- Interface (miroir de http.js) -----------------------------------------
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
