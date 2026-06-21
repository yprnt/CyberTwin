// démarrer de zéro ou charger la démo « Boréale » (règle R6)

const pool = require('../db/pool');
const { demoCompany, demoAssets, demoVulns } = require('../db/seed.demo');

// Tout sur UNE connexion : SET FOREIGN_KEY_CHECKS est propre à la session.
// TRUNCATE remet les AUTO_INCREMENT à zéro.
async function resetAll(conn) {
  // TRUNCATE est interdit sur une table référencée par une FK : on coupe la vérif le temps de vider.
  // Le finally garantit la réactivation même si un TRUNCATE échoue — sinon la connexion
  // repartirait au pool avec les FK désactivées (état de session qui fuiterait sur d'autres requêtes).
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');
  try {
    await conn.query('TRUNCATE TABLE vulnerabilities');
    await conn.query('TRUNCATE TABLE assets');
  } finally {
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  }
  await conn.query(
    'UPDATE company SET nom = ?, secteur = ?, nbEmployes = 0, nbServeurs = 0, nbPostes = 0, servicesExposes = ? WHERE id = 1',
    ['', '', '[]']
  );
}

async function resetDemo(req, res) {
  const conn = await pool.getConnection();
  try {
    await resetAll(conn);
    res.json({ message: 'Données réinitialisées.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors de la réinitialisation.' });
  } finally {
    conn.release();
  }
}

// vide puis charge la démo « Boréale Logistique »
async function loadDemo(req, res) {
  const conn = await pool.getConnection();
  try {
    await resetAll(conn);

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

    // on mémorise l'id généré pour chaque ref, pour rattacher les vulns ensuite
    const refToId = {};
    for (const a of demoAssets) {
      const [result] = await conn.query('INSERT INTO assets (nom, type, expose) VALUES (?, ?, ?)', [
        a.nom,
        a.type,
        a.expose ? 1 : 0,
      ]);
      refToId[a.ref] = result.insertId;
    }

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
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors du chargement de la démonstration.' });
  } finally {
    conn.release();
  }
}

module.exports = { resetDemo, loadDemo };
