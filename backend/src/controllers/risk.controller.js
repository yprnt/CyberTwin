// Risque d'une entreprise (req.companyId posé par loadCompany).
// /risk/calculate : pas de body. /risk/snapshot & /risk/history : analyses archivées.

const pool = require('../db/pool');
const { computeRisk } = require('../services/risk.service');

// Lit l'état courant de l'entreprise et renvoie le résultat du moteur de risque.
async function computeCurrent(companyId) {
  const [assetsRows] = await pool.query(
    'SELECT id, nom, type, expose FROM assets WHERE companyId = ?',
    [companyId]
  );
  const [vulns] = await pool.query(
    `SELECT v.id, v.assetId, v.nom, v.criticite
       FROM vulnerabilities v
       JOIN assets a ON a.id = v.assetId
      WHERE a.companyId = ?`,
    [companyId]
  );

  // expose stocké en 0/1 : repassé en booléen pour le moteur
  const assets = assetsRows.map((a) => ({ ...a, expose: Boolean(a.expose) }));
  return computeRisk(assets, vulns);
}

async function calculateRisk(req, res) {
  try {
    res.json(await computeCurrent(req.companyId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors du calcul du risque.' });
  }
}

// Archive le risque courant. Snapshot explicite (pas à chaque calcul) : sinon
// l'historique se remplirait des recalculs systématiques du dashboard/rapport (R5).
async function saveSnapshot(req, res) {
  try {
    const risk = await computeCurrent(req.companyId);
    const [result] = await pool.query(
      'INSERT INTO risk_history (companyId, score, niveau, nbActifs, nbVulnerabilites) VALUES (?, ?, ?, ?, ?)',
      [req.companyId, risk.score, risk.niveau, risk.nbActifs, risk.nbVulnerabilites]
    );

    const [rows] = await pool.query(
      'SELECT id, score, niveau, nbActifs, nbVulnerabilites, createdAt FROM risk_history WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de l'enregistrement de l'analyse." });
  }
}

// Du plus ancien au plus récent : la courbe d'évolution se lit dans le sens du temps.
async function getHistory(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, score, niveau, nbActifs, nbVulnerabilites, createdAt FROM risk_history WHERE companyId = ? ORDER BY createdAt ASC, id ASC',
      [req.companyId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la lecture de l'historique." });
  }
}

async function clearHistory(req, res) {
  try {
    await pool.query('DELETE FROM risk_history WHERE companyId = ?', [req.companyId]);
    res.json({ message: 'Historique vidé.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression de l'historique." });
  }
}

module.exports = { calculateRisk, saveSnapshot, getHistory, clearHistory };
