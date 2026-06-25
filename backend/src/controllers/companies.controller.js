// Entreprises de l'utilisateur courant (multi-entreprise). Chaque entreprise est
// rattachée à req.user.id ; toutes les requêtes filtrent sur ce userId pour
// l'isolation entre comptes.

const pool = require('../db/pool');

// Un nombre est valide s'il est fourni et entier positif ou nul (0 accepté).
function nbValide(v) {
  return v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0;
}

// mysql2 parse déjà le JSON, mais on sécurise si la colonne revient en chaîne.
function normalizeCompany(row) {
  let services = row.servicesExposes;
  if (typeof services === 'string') {
    try {
      services = JSON.parse(services);
    } catch {
      services = [];
    }
  }
  if (!Array.isArray(services)) services = [];

  return {
    id: row.id,
    nom: row.nom,
    secteur: row.secteur,
    nbEmployes: row.nbEmployes,
    nbServeurs: row.nbServeurs,
    nbPostes: row.nbPostes,
    servicesExposes: services,
    createdAt: row.createdAt,
  };
}

const COLS = 'id, nom, secteur, nbEmployes, nbServeurs, nbPostes, servicesExposes, createdAt';

// id de route -> entier, ou null si invalide (ne pas dépendre du NaN->NULL de mysql2).
function idParam(req) {
  const id = Number(req.params.companyId);
  return Number.isInteger(id) ? id : null;
}

// Validation commune création/modification : renvoie { error } ou { values }.
// Mêmes règles que l'ancien formulaire entreprise (nom+secteur+effectifs+≥1 service).
function valider(body) {
  const b = body || {};
  const nom = typeof b.nom === 'string' ? b.nom.trim() : '';
  const secteur = typeof b.secteur === 'string' ? b.secteur.trim() : '';

  if (!nom || !secteur) {
    return { error: 'Les champs « nom » et « secteur » sont obligatoires.' };
  }
  if (!nbValide(b.nbEmployes) || !nbValide(b.nbServeurs) || !nbValide(b.nbPostes)) {
    return {
      error: "Le nombre d'employés, de serveurs et de postes est obligatoire (entier positif ou nul).",
    };
  }
  const servicesExposes = Array.isArray(b.servicesExposes) ? b.servicesExposes : [];
  if (servicesExposes.length === 0) {
    return { error: 'Indiquez au moins un service exposé sur Internet.' };
  }

  return {
    values: {
      nom,
      secteur,
      nbEmployes: Number(b.nbEmployes),
      nbServeurs: Number(b.nbServeurs),
      nbPostes: Number(b.nbPostes),
      servicesExposes,
    },
  };
}

async function list(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT ${COLS} FROM companies WHERE userId = ? ORDER BY createdAt DESC, id DESC`,
      [req.user.id]
    );
    res.json(rows.map(normalizeCompany));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur lors de la lecture des entreprises.' });
  }
}

async function getOne(req, res) {
  const id = idParam(req);
  if (id === null) return res.status(404).json({ message: 'Entreprise introuvable.' });
  try {
    const [rows] = await pool.query(`SELECT ${COLS} FROM companies WHERE id = ? AND userId = ?`, [
      id,
      req.user.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Entreprise introuvable.' });
    }
    res.json(normalizeCompany(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la lecture de l'entreprise." });
  }
}

async function create(req, res) {
  const { error, values } = valider(req.body);
  if (error) return res.status(400).json({ message: error });

  try {
    const [result] = await pool.query(
      'INSERT INTO companies (userId, nom, secteur, nbEmployes, nbServeurs, nbPostes, servicesExposes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        values.nom,
        values.secteur,
        values.nbEmployes,
        values.nbServeurs,
        values.nbPostes,
        JSON.stringify(values.servicesExposes),
      ]
    );
    const [rows] = await pool.query(`SELECT ${COLS} FROM companies WHERE id = ?`, [result.insertId]);
    res.status(201).json(normalizeCompany(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la création de l'entreprise." });
  }
}

async function update(req, res) {
  const { error, values } = valider(req.body);
  if (error) return res.status(400).json({ message: error });

  const companyId = idParam(req);
  if (companyId === null) return res.status(404).json({ message: 'Entreprise introuvable.' });
  try {
    const [result] = await pool.query(
      'UPDATE companies SET nom = ?, secteur = ?, nbEmployes = ?, nbServeurs = ?, nbPostes = ?, servicesExposes = ? WHERE id = ? AND userId = ?',
      [
        values.nom,
        values.secteur,
        values.nbEmployes,
        values.nbServeurs,
        values.nbPostes,
        JSON.stringify(values.servicesExposes),
        companyId,
        req.user.id,
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Entreprise introuvable.' });
    }
    const [rows] = await pool.query(`SELECT ${COLS} FROM companies WHERE id = ?`, [companyId]);
    res.json(normalizeCompany(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour de l'entreprise." });
  }
}

// Supprime l'entreprise et, en cascade SQL, ses actifs/vulns/historique (R3 étendue).
async function remove(req, res) {
  const id = idParam(req);
  if (id === null) return res.status(404).json({ message: 'Entreprise introuvable.' });
  try {
    const [result] = await pool.query('DELETE FROM companies WHERE id = ? AND userId = ?', [
      id,
      req.user.id,
    ]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Entreprise introuvable.' });
    }
    res.json({ message: 'Entreprise supprimée.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la suppression de l'entreprise." });
  }
}

module.exports = { list, getOne, create, update, remove };
