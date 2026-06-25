// Entreprise singleton : une seule ligne (id = 1), insérée vide par schema.sql.
// PUT sert donc à la fois à créer et à modifier.

const pool = require('../db/pool');

const COMPANY_ID = 1;

// Un nombre est valide s'il est fourni et entier positif ou nul (0 accepté).
function nbValide(v) {
  return v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0;
}

// pas de `id` dans le SELECT : non exposé au front (contrat)
const SELECT_COMPANY =
  'SELECT nom, secteur, nbEmployes, nbServeurs, nbPostes, servicesExposes FROM company WHERE id = ?';

// mysql2 parse déjà les colonnes JSON, mais on sécurise si c'est une chaîne.
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
    nom: row.nom,
    secteur: row.secteur,
    nbEmployes: row.nbEmployes,
    nbServeurs: row.nbServeurs,
    nbPostes: row.nbPostes,
    servicesExposes: services,
  };
}

async function getCompany(req, res) {
  try {
    const [rows] = await pool.query(SELECT_COMPANY, [COMPANY_ID]);
    res.json(normalizeCompany(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la lecture de l'entreprise." });
  }
}

async function updateCompany(req, res) {
  const body = req.body || {};

  const nom = typeof body.nom === 'string' ? body.nom.trim() : '';
  const secteur = typeof body.secteur === 'string' ? body.secteur.trim() : '';

  if (!nom || !secteur) {
    return res
      .status(400)
      .json({ message: 'Les champs « nom » et « secteur » sont obligatoires.' });
  }
  if (!nbValide(body.nbEmployes) || !nbValide(body.nbServeurs) || !nbValide(body.nbPostes)) {
    return res.status(400).json({
      message: "Le nombre d'employés, de serveurs et de postes est obligatoire (entier positif ou nul).",
    });
  }

  const servicesExposes = Array.isArray(body.servicesExposes) ? body.servicesExposes : [];
  if (servicesExposes.length === 0) {
    return res
      .status(400)
      .json({ message: 'Indiquez au moins un service exposé sur Internet.' });
  }

  const nbEmployes = Number(body.nbEmployes);
  const nbServeurs = Number(body.nbServeurs);
  const nbPostes = Number(body.nbPostes);

  try {
    await pool.query(
      'UPDATE company SET nom = ?, secteur = ?, nbEmployes = ?, nbServeurs = ?, nbPostes = ?, servicesExposes = ? WHERE id = ?',
      [nom, secteur, nbEmployes, nbServeurs, nbPostes, JSON.stringify(servicesExposes), COMPANY_ID]
    );

    const [rows] = await pool.query(SELECT_COMPANY, [COMPANY_ID]);
    res.json(normalizeCompany(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour de l'entreprise." });
  }
}

module.exports = { getCompany, updateCompany };
