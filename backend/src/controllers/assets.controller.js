// assets.controller.js — logique des routes /assets (CRUD complet).

const pool = require('../db/pool');
const { ASSET_TYPES } = require('../constants');

// MySQL renvoie `expose` en 0/1 (tinyint) : on le repasse en vrai booléen pour le front.
function normalizeAsset(row) {
  return {
    id: row.id,
    nom: row.nom,
    type: row.type,
    expose: Boolean(row.expose),
  };
}

// Interprète une valeur `expose` venant du body en booléen.
function parseExpose(value) {
  return value === true || value === 'true' || value === 1;
}

// GET /assets — liste tous les actifs ([] si aucun).
async function getAssets(req, res) {
  try {
    const [rows] = await pool.query('SELECT id, nom, type, expose FROM assets ORDER BY id');
    res.json(rows.map(normalizeAsset));
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur lors de la lecture des actifs.' });
  }
}

// POST /assets — crée un actif (id généré par la base).
async function createAsset(req, res) {
  const body = req.body || {};
  const nom = typeof body.nom === 'string' ? body.nom.trim() : '';
  const type = typeof body.type === 'string' ? body.type.trim() : '';

  if (!nom || !type) {
    return res.status(400).json({ message: 'Les champs « nom » et « type » sont obligatoires.' });
  }
  if (!ASSET_TYPES.includes(type)) {
    return res.status(400).json({
      message: `Type d'actif invalide. Valeurs autorisées : ${ASSET_TYPES.join(', ')}.`,
    });
  }

  const expose = parseExpose(body.expose); // false si non fourni

  try {
    const [result] = await pool.query(
      'INSERT INTO assets (nom, type, expose) VALUES (?, ?, ?)',
      [nom, type, expose ? 1 : 0]
    );
    res.status(201).json({ id: result.insertId, nom, type, expose });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur lors de la création de l'actif." });
  }
}

// PUT /assets/:id — modifie un actif (champs partiels).
async function updateAsset(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ message: 'Actif introuvable.' });
  }

  try {
    const [rows] = await pool.query('SELECT id, nom, type, expose FROM assets WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Actif introuvable.' });
    }
    const current = rows[0];
    const body = req.body || {};

    // On part des valeurs actuelles, puis on remplace celles fournies.
    let nom = current.nom;
    if (body.nom !== undefined) {
      nom = typeof body.nom === 'string' ? body.nom.trim() : '';
      if (!nom) {
        return res.status(400).json({ message: 'Le champ « nom » ne peut pas être vide.' });
      }
    }

    let type = current.type;
    if (body.type !== undefined) {
      type = typeof body.type === 'string' ? body.type.trim() : '';
      if (!ASSET_TYPES.includes(type)) {
        return res.status(400).json({
          message: `Type d'actif invalide. Valeurs autorisées : ${ASSET_TYPES.join(', ')}.`,
        });
      }
    }

    let expose = Boolean(current.expose);
    if (body.expose !== undefined) {
      expose = parseExpose(body.expose);
    }

    await pool.query('UPDATE assets SET nom = ?, type = ?, expose = ? WHERE id = ?', [
      nom,
      type,
      expose ? 1 : 0,
      id,
    ]);
    res.json({ id, nom, type, expose });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour de l'actif." });
  }
}

// DELETE /assets/:id — supprime un actif ET ses vulnérabilités (cascade SQL, règle R3).
async function deleteAsset(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(404).json({ message: 'Actif introuvable.' });
  }

  try {
    const [result] = await pool.query('DELETE FROM assets WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Actif introuvable.' });
    }
    res.json({ message: 'Actif supprimé.' });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur lors de la suppression de l'actif." });
  }
}

module.exports = { getAssets, createAsset, updateAsset, deleteAsset };
