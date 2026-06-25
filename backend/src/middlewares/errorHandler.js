// Toute erreur non gérée ressort au format { message }.

// les 4 arguments (next inclus) sont obligatoires pour qu'Express reconnaisse un error-handler
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // JSON malformé levé par express.json() (ne pas attraper les autres SyntaxError applicatives)
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Corps de requête JSON invalide.' });
  }

  console.error('Erreur non gérée :', err);
  res.status(500).json({ message: 'Erreur serveur interne.' });
}

module.exports = errorHandler;
