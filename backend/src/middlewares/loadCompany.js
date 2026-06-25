// Garde d'appartenance des sous-ressources (/companies/:companyId/...).
// Vérifie que l'entreprise existe ET appartient à l'utilisateur courant, puis
// pose req.companyId. Monté avec mergeParams pour voir :companyId.

const pool = require('../db/pool');

async function loadCompany(req, res, next) {
  const companyId = Number(req.params.companyId);
  if (!Number.isInteger(companyId)) {
    return res.status(404).json({ message: 'Entreprise introuvable.' });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM companies WHERE id = ? AND userId = ?', [
      companyId,
      req.user.id,
    ]);
    // 404 (pas 403) : ne pas révéler qu'une entreprise d'un autre compte existe.
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Entreprise introuvable.' });
    }
    req.companyId = companyId;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur lors de l'accès à l'entreprise." });
  }
}

module.exports = loadCompany;
