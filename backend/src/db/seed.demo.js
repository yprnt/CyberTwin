// Données de démo « Boréale Logistique ».
// Les noms de vulns sont choisis pour déclencher les recommandations du moteur
// (obsolète, mot de passe, port, sauvegarde).

const demoCompany = {
  nom: 'Boréale Logistique',
  secteur: 'Transport et logistique',
  nbEmployes: 48,
  nbServeurs: 6,
  nbPostes: 35,
  servicesExposes: ['Site web', 'Webmail', 'Extranet client', 'VPN'],
};

// `ref` : clé locale pour relier les vulns aux actifs (les vrais id sont générés à l'insert).
const demoAssets = [
  { ref: 'vitrine', nom: 'Serveur du site vitrine', type: 'Serveur Web', expose: true },
  { ref: 'webmail', nom: 'Serveur de messagerie', type: 'Serveur Web', expose: true },
  { ref: 'bdd', nom: 'Base de données clients', type: 'Base de données', expose: false },
  { ref: 'compta', nom: 'Poste comptabilité', type: 'Poste utilisateur', expose: false },
  { ref: 'firewall', nom: 'Pare-feu périmétrique', type: 'Pare-feu', expose: true },
  { ref: 'routeur', nom: 'Routeur agence', type: 'Routeur', expose: false },
];

const demoVulns = [
  { assetRef: 'vitrine', nom: 'Logiciel obsolète', criticite: 'élevée' },
  { assetRef: 'vitrine', nom: 'Port exposé', criticite: 'moyenne' },
  { assetRef: 'webmail', nom: 'Mot de passe faible', criticite: 'élevée' },
  { assetRef: 'bdd', nom: 'Absence de sauvegarde', criticite: 'moyenne' },
  { assetRef: 'compta', nom: 'Logiciel obsolète', criticite: 'faible' },
];

module.exports = { demoCompany, demoAssets, demoVulns };
