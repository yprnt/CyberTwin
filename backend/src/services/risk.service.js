// Moteur de risque, matrice EBIOS Gravité × Vraisemblance.
// Chaque vuln = un scénario : risque = Gravité × Vraisemblance (1..25).
//   - Gravité       = dérivée de la criticite de la vuln
//   - Vraisemblance = dérivée de l'actif (exposé Internet ? + nb de vulns portées)
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

// criticités projetées sur l'échelle de gravité 1..5
const GRAVITE = {
  faible: 1,
  moyenne: 3,
  élevée: 5,
};

const SERIOUS_THRESHOLD = 12; // un risque > 12 est considéré "sérieux"

// Vraisemblance 1..5 : base exposition + bonus volume (plus de vulns = plus exploitable).
function vraisemblance(asset, vulnCountOnAsset) {
  const base = asset.expose ? 3 : 1;
  let volume = 0;
  if (vulnCountOnAsset >= 3) volume = 2;
  else if (vulnCountOnAsset === 2) volume = 1;
  return Math.min(5, Math.max(1, base + volume));
}

// seuils de niveau figés par le contrat
function niveauFromScore(score) {
  if (score < 30) return 'faible';
  if (score < 60) return 'moyen';
  return 'élevé';
}

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

  // message final toujours présent : garantit au moins 1 recommandation
  if (niveau === 'faible') {
    recs.push('Le niveau de risque est faible : maintenir les bonnes pratiques.');
  } else if (niveau === 'moyen') {
    recs.push('Le niveau de risque est moyen : continuer à corriger les vulnérabilités importantes.');
  } else {
    recs.push('Le niveau de risque est élevé : engager un plan de remédiation prioritaire.');
  }

  return recs;
}

function computeRisk(assets, vulns) {
  const nbActifs = assets.length;
  const nbVulnerabilites = vulns.length;

  // nb de vulns par actif, pour la vraisemblance
  const countByAsset = {};
  for (const v of vulns) {
    countByAsset[v.assetId] = (countByAsset[v.assetId] || 0) + 1;
  }
  const assetById = {};
  for (const a of assets) assetById[a.id] = a;

  const risques = [];
  for (const v of vulns) {
    const asset = assetById[v.assetId];
    if (!asset) continue; // vuln orpheline : ne devrait pas arriver (cascade R3)
    const g = GRAVITE[v.criticite] || 1;
    const p = vraisemblance(asset, countByAsset[v.assetId] || 1);
    risques.push(g * p);
  }

  // score piloté par le pire scénario (logique d'audit), majoré quand plusieurs
  // risques sérieux s'accumulent. Ajouter une vuln ne fait jamais baisser le score.
  let score = 0;
  if (risques.length > 0) {
    const maxRisk = Math.max(...risques);
    const nbSerieux = risques.filter((r) => r >= SERIOUS_THRESHOLD).length;
    const base = (maxRisk / 25) * 100;
    const bonus = Math.min(20, Math.max(0, nbSerieux - 1) * 5); // +5 par risque sérieux en plus
    score = Math.min(100, Math.round(base + bonus));
  }

  const niveau = niveauFromScore(score);
  const recommandations = buildRecommandations(assets, vulns, niveau);

  return { score, niveau, nbActifs, nbVulnerabilites, recommandations };
}

module.exports = { computeRisk };
