// risk.controller.js — logique de POST /risk/calculate.
// Body vide : on calcule à partir de l'état courant en base.

const pool = require('../db/pool');
const { computeRisk } = require('../services/risk.service');

async function calculateRisk(req, res) {
  try {
    const [assetsRows] = await pool.query('SELECT id, nom, type, expose FROM assets');
    const [vulns] = await pool.query('SELECT id, assetId, nom, criticite FROM vulnerabilities');

    // expose est stocké en 0/1 : on le repasse en booléen pour le moteur.
    const assets = assetsRows.map((a) => ({ ...a, expose: Boolean(a.expose) }));

    res.json(computeRisk(assets, vulns));
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors du calcul du risque.' });
  }
}

module.exports = { calculateRisk };
