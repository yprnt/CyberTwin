// Pas de PUT (règle R7) : pour modifier une vuln, le front supprime + ré-ajoute.

const pool = require('../db/pool');
const { CRITICITES } = require('../constants');

async function getVulnerabilities(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, assetId, nom, criticite FROM vulnerabilities ORDER BY id'
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
    // l'actif doit exister, sinon 404
    const [assets] = await pool.query('SELECT id FROM assets WHERE id = ?', [assetId]);
    if (assets.length === 0) {
      return res.status(404).json({ message: "L'actif (assetId) n'existe pas." });
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
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ message: 'Vulnérabilité introuvable.' });
  }

  try {
    const [result] = await pool.query('DELETE FROM vulnerabilities WHERE id = ?', [id]);
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
