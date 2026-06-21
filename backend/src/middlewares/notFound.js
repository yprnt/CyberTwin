// notFound.js — attrape toute route non définie et renvoie un 404 au format JSON
// (sinon Express renverrait une page HTML "Cannot GET /xxx").

function notFound(req, res) {
  res.status(404).json({ message: `Route introuvable : ${req.method} ${req.originalUrl}` });
}

module.exports = notFound;
