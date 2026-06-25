// Vulnérabilités d'une entreprise. Pas de PUT (règle R7) : pour modifier, le front
// supprime + ré-ajoute. Scoping via l'actif : une vuln appartient à l'entreprise de
// son actif (req.companyId posé par loadCompany).

const pool = require('../db/pool');
const { CRITICITES } = require('../constants');

async function getVulnerabilities(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT v.id, v.assetId, v.nom, v.criticite
         FROM vulnerabilities v
         JOIN assets a ON a.id = v.assetId
        WHERE a.companyId = ?
        ORDER BY v.id`,
      [req.companyId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors de la lecture des vulnérabilités.' });
  }
}

async function createVulnerability(req, res) {
  const body = req.body || {};

  const assetId = Number(body.assetId);
  const nom = typeof body.nom === 'string' ? body.nom.trim() : '';
  const criticite = typeof body.criticite === 'string' ? body.criticite.trim() : '';

  if (!Number.isInteger(assetId) || !nom || !criticite) {
    return res.status(400).json({
      message: 'Les champs « assetId », « nom » et « criticite » sont obligatoires.',
    });
  }
  if (!CRITICITES.includes(criticite)) {
    return res.status(400).json({
      message: `Criticité invalide. Valeurs autorisées : ${CRITICITES.join(', ')}.`,
    });
  }

  try {
    // L'actif doit exister ET appartenir à cette entreprise, sinon 404.
    const [assets] = await pool.query('SELECT id FROM assets WHERE id = ? AND companyId = ?', [
      assetId,
      req.companyId,
    ]);
    if (assets.length === 0) {
      return res.status(404).json({ message: "L'actif (assetId) n'existe pas dans cette entreprise." });
    }

    const [result] = await pool.query(
      'INSERT INTO vulnerabilities (assetId, nom, criticite) VALUES (?, ?, ?)',
      [assetId, nom, criticite]
    );
    res.status(201).json({ id: result.insertId, assetId, nom, criticite });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors de la création de la vulnérabilité.' });
  }
}

async function deleteVulnerability(req, res) {
  const id = Number(req.params.vulnId);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ message: 'Vulnérabilité introuvable.' });
  }

  try {
    // Jointure sur l'actif : on ne supprime que si la vuln relève bien de cette entreprise.
    const [result] = await pool.query(
      `DELETE v FROM vulnerabilities v
         JOIN assets a ON a.id = v.assetId
        WHERE v.id = ? AND a.companyId = ?`,
      [id, req.companyId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Vulnérabilité introuvable.' });
    }
    res.json({ message: 'Vulnérabilité supprimée.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors de la suppression de la vulnérabilité.' });
  }
}

module.exports = { getVulnerabilities, createVulnerability, deleteVulnerability };
