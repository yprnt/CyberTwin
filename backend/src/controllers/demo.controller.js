// demo.controller.js — routes /demo/load et /demo/reset.
// Permettent de démarrer "de zéro" ou de charger la démo « Boréale » (règle R6).

const pool = require('../db/pool');
const { demoCompany, demoAssets, demoVulns } = require('../db/seed.demo');

// Vide tout : actifs + vulns (TRUNCATE pour remettre les AUTO_INCREMENT à zéro)
// et remet l'entreprise singleton à vide. Tout sur UNE connexion car
// SET FOREIGN_KEY_CHECKS est propre à la session.
async function resetAll(conn) {
  // TRUNCATE sur une table référencée par une FK est interdit : on coupe la vérif le temps de vider.
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  await conn.query('TRUNCATE TABLE vulnerabilities');
  await conn.query('TRUNCATE TABLE assets');
  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  await conn.query(
    'UPDATE company SET nom = ?, secteur = ?, nbEmployes = 0, nbServeurs = 0, nbPostes = 0, servicesExposes = ? WHERE id = 1',
    ['', '', '[]']
  );
}

// POST /demo/reset — vide toutes les données.
async function resetDemo(req, res) {
  const conn = await pool.getConnection();
  try {
    await resetAll(conn);
    res.json({ message: 'Données réinitialisées.' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation.' });
  } finally {
    conn.release();
  }
}

// POST /demo/load — vide puis charge la démo « Boréale Logistique ».
async function loadDemo(req, res) {
  const conn = await pool.getConnection();
  try {
    await resetAll(conn);

    // Entreprise
    await conn.query(
      'UPDATE company SET nom = ?, secteur = ?, nbEmployes = ?, nbServeurs = ?, nbPostes = ?, servicesExposes = ? WHERE id = 1',
      [
        demoCompany.nom,
        demoCompany.secteur,
        demoCompany.nbEmployes,
        demoCompany.nbServeurs,
        demoCompany.nbPostes,
        JSON.stringify(demoCompany.servicesExposes),
      ]
    );

    // Actifs (on récupère l'id généré pour chaque ref)
    const refToId = {};
    for (const a of demoAssets) {
      const [result] = await conn.query('INSERT INTO assets (nom, type, expose) VALUES (?, ?, ?)', [
        a.nom,
        a.type,
        a.expose ? 1 : 0,
      ]);
      refToId[a.ref] = result.insertId;
    }

    // Vulnérabilités (rattachées au bon actif via la ref)
    for (const v of demoVulns) {
      await conn.query('INSERT INTO vulnerabilities (assetId, nom, criticite) VALUES (?, ?, ?)', [
        refToId[v.assetRef],
        v.nom,
        v.criticite,
      ]);
    }

    res.json({
      message: 'Données de démonstration chargées.',
      entreprise: demoCompany,
      nbActifs: demoAssets.length,
      nbVulnerabilites: demoVulns.length,
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors du chargement de la démonstration.' });
  } finally {
    conn.release();
  }
}

module.exports = { resetDemo, loadDemo };
