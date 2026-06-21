// risk.service.js — moteur de calcul du risque (matrice EBIOS Gravité × Vraisemblance).
//
// 100 % backend, à partir des données existantes (aucun changement de modèle / de front) :
//   - Gravité       = dérivée de la `criticite` de la vulnérabilité
//   - Vraisemblance = dérivée de l'actif (exposé Internet ? + nb de vulns qu'il porte)
//
// Chaque vulnérabilité = un scénario de risque. risque = Gravité × Vraisemblance (1..25).
//
//        MATRICE 5×5 (valeur = Gravité × Vraisemblance)
//                         GRAVITÉ →
//                    1    2    3    4    5
//   VRAIS. 5        5   10   15   20   25
//          4        4    8   12   16   20
//          3        3    6    9   12   15
//          2        2    4    6    8   10
//          1        1    2    3    4    5
//
//   Bandes de risque par vuln :  ≤4 faible · 5–12 moyen · >12 élevé
//
// Sortie (contrat FIGÉ, identique à avant) :
//   { score, niveau, nbActifs, nbVulnerabilites, recommandations }

// Gravité (axe Impact) : les 3 criticités projetées sur l'échelle 1..5.
const GRAVITE = {
  faible: 1,
  moyenne: 3,
  élevée: 5,
};

const SERIOUS_THRESHOLD = 12; // un risque > 12 est considéré "sérieux"

// Vraisemblance (axe Probabilité) sur 1..5, déduite de l'actif.
// Base : exposé Internet = 3, interne = 1.
// Bonus volume : plus l'actif porte de vulns, plus l'exploitation est probable.
function vraisemblance(asset, vulnCountOnAsset) {
  const base = asset.expose ? 3 : 1;
  let volume = 0;
  if (vulnCountOnAsset >= 3) volume = 2;
  else if (vulnCountOnAsset === 2) volume = 1;
  return Math.min(5, Math.max(1, base + volume));
}

// Bande de niveau à partir d'un score 0..100 (mêmes seuils que le contrat).
function niveauFromScore(score) {
  if (score < 30) return 'faible';
  if (score < 60) return 'moyen';
  return 'élevé';
}

// Construit la liste des recommandations selon ce qui est détecté.
function buildRecommandations(assets, vulns, niveau) {
  const recs = [];
  const noms = vulns.map((v) => (v.nom || '').toLowerCase());

  if (noms.some((n) => n.includes('obsol') || n.includes('logiciel'))) {
    recs.push('Mettre à jour les logiciels obsolètes et appliquer les correctifs de sécurité.');
  }
  if (noms.some((n) => n.includes('mot de passe'))) {
    recs.push('Renforcer la politique de mots de passe (longueur, complexité, rotation).');
  }
  if (noms.some((n) => n.includes('sauvegarde'))) {
    recs.push('Mettre en place des sauvegardes régulières et tester leur restauration.');
  }
  if (noms.some((n) => n.includes('port'))) {
    recs.push('Fermer ou filtrer les ports exposés inutiles.');
  }

  const nbExposes = assets.filter((a) => a.expose).length;
  if (nbExposes >= 3) {
    recs.push("Réduire l'exposition Internet des actifs non essentiels.");
  }

  const nbElevees = vulns.filter((v) => v.criticite === 'élevée').length;
  if (nbElevees > 0) {
    recs.push(`Traiter en priorité les ${nbElevees} vulnérabilité(s) de criticité élevée.`);
  }

  // Message final, toujours présent (garantit au moins 1 ligne).
  if (niveau === 'faible') {
    recs.push('Le niveau de risque est faible : maintenir les bonnes pratiques.');
  } else if (niveau === 'moyen') {
    recs.push('Le niveau de risque est moyen : continuer à corriger les vulnérabilités importantes.');
  } else {
    recs.push('Le niveau de risque est élevé : engager un plan de remédiation prioritaire.');
  }

  return recs;
}

// Calcule le risque global à partir des actifs et des vulnérabilités.
function computeRisk(assets, vulns) {
  const nbActifs = assets.length;
  const nbVulnerabilites = vulns.length;

  // Nb de vulns par actif (pour la vraisemblance).
  const countByAsset = {};
  for (const v of vulns) {
    countByAsset[v.assetId] = (countByAsset[v.assetId] || 0) + 1;
  }
  const assetById = {};
  for (const a of assets) assetById[a.id] = a;

  // Risque de chaque vulnérabilité via la matrice.
  const risques = [];
  for (const v of vulns) {
    const asset = assetById[v.assetId];
    if (!asset) continue; // sécurité : vuln orpheline (ne devrait pas arriver, cascade R3)
    const g = GRAVITE[v.criticite] || 1;
    const p = vraisemblance(asset, countByAsset[v.assetId] || 1);
    risques.push(g * p);
  }

  // Score 0..100 : piloté par le PIRE scénario (logique d'audit), majoré si plusieurs
  // risques sérieux s'accumulent. Ajouter une vuln ne fait jamais BAISSER le score.
  let score = 0;
  if (risques.length > 0) {
    const maxRisk = Math.max(...risques);
    const nbSerieux = risques.filter((r) => r >= SERIOUS_THRESHOLD).length;
    const base = (maxRisk / 25) * 100; // le pire scénario ramené sur 100
    const bonus = Math.min(20, Math.max(0, nbSerieux - 1) * 5); // +5 par risque sérieux additionnel
    score = Math.min(100, Math.round(base + bonus));
  }

  const niveau = niveauFromScore(score);
  const recommandations = buildRecommandations(assets, vulns, niveau);

  return { score, niveau, nbActifs, nbVulnerabilites, recommandations };
}

module.exports = { computeRisk, GRAVITE };
