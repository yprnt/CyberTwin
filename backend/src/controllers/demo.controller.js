// Démo : crée une entreprise « Boréale » pré-remplie pour l'utilisateur courant
// (règle R6). En multi-entreprise, charger la démo = ajouter une entreprise de plus,
// pas de reset global.

const pool = require('../db/pool');
const { demoCompany, demoAssets, demoVulns } = require('../db/seed.demo');

async function loadDemo(req, res) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [company] = await conn.query(
      'INSERT INTO companies (userId, nom, secteur, nbEmployes, nbServeurs, nbPostes, servicesExposes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        demoCompany.nom,
        demoCompany.secteur,
        demoCompany.nbEmployes,
        demoCompany.nbServeurs,
        demoCompany.nbPostes,
        JSON.stringify(demoCompany.servicesExposes),
      ]
    );
    const companyId = company.insertId;

    // on mémorise l'id généré pour chaque ref, pour rattacher les vulns ensuite
    const refToId = {};
    for (const a of demoAssets) {
      const [result] = await conn.query(
        'INSERT INTO assets (companyId, nom, type, expose) VALUES (?, ?, ?, ?)',
        [companyId, a.nom, a.type, a.expose ? 1 : 0]
      );
      refToId[a.ref] = result.insertId;
    }

    for (const v of demoVulns) {
      await conn.query('INSERT INTO vulnerabilities (assetId, nom, criticite) VALUES (?, ?, ?)', [
        refToId[v.assetRef],
        v.nom,
        v.criticite,
      ]);
    }

    await conn.commit();

    // On renvoie l'entreprise créée (avec son id) : le front y navigue directement.
    res.status(201).json({
      id: companyId,
      nom: demoCompany.nom,
      secteur: demoCompany.secteur,
      nbEmployes: demoCompany.nbEmployes,
      nbServeurs: demoCompany.nbServeurs,
      nbPostes: demoCompany.nbPostes,
      servicesExposes: demoCompany.servicesExposes,
      nbActifs: demoAssets.length,
      nbVulnerabilites: demoVulns.length,
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors du chargement de la démonstration.' });
  } finally {
    conn.release();
  }
}

module.exports = { loadDemo };
