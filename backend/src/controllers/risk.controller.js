// POST /risk/calculate : pas de body, on calcule à partir de l'état courant en base.

const pool = require('../db/pool');
const { computeRisk } = require('../services/risk.service');

async function calculateRisk(req, res) {
  try {
    const [assetsRows] = await pool.query('SELECT id, nom, type, expose FROM assets');
    const [vulns] = await pool.query('SELECT id, assetId, nom, criticite FROM vulnerabilities');

    // expose stocké en 0/1 : repassé en booléen pour le moteur
    const assets = assetsRows.map((a) => ({ ...a, expose: Boolean(a.expose) }));

    res.json(computeRisk(assets, vulns));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors du calcul du risque.' });
  }
}

module.exports = { calculateRisk };
