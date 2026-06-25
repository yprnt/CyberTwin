// valeurs autorisées figées par le contrat (chaînes exactes, accents inclus).

const ASSET_TYPES = [
  'Serveur Web',
  'Base de données',
  'Poste utilisateur',
  'Routeur',
  'Pare-feu',
  'Application métier',
];

const CRITICITES = ['faible', 'moyenne', 'élevée'];

module.exports = { ASSET_TYPES, CRITICITES };
