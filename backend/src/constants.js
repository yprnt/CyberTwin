// constants.js — valeurs autorisées partagées par l'API (figées par le contrat).

// Les 6 types d'actifs autorisés (chaînes EXACTES, accents inclus).
const ASSET_TYPES = [
  'Serveur Web',
  'Base de données',
  'Poste utilisateur',
  'Routeur',
  'Pare-feu',
  'Application métier',
];

// Les 3 niveaux de criticité d'une vulnérabilité (chaînes EXACTES, accents inclus).
const CRITICITES = ['faible', 'moyenne', 'élevée'];

module.exports = { ASSET_TYPES, CRITICITES };
