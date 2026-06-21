// errorHandler.js — gestionnaire d'erreurs GLOBAL (signature à 4 arguments).
// Garantit que toute erreur non gérée ressort au format { "message": ... }.
// Doit être monté EN DERNIER dans app.js.

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Corps de requête JSON malformé (levé par express.json()).
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ message: 'Corps de requête JSON invalide.' });
  }

  // Tout le reste : on logge côté serveur, on renvoie un message générique côté client.
  console.error('Erreur non gérée :', err);
  res.status(500).json({ message: 'Erreur serveur interne.' });
}

module.exports = errorHandler;
